import { useEffect, useRef, useState, type RefObject } from "react";
import type { MapMyLocation } from "@/shared/ui/map";
import { MAP_GEOLOCATION_OPTIONS, MAP_LOCATE_GIVE_UP_MS, MAP_LOCATION_NOTICE_MS } from "../config/constants";
import { measureCoveredInsets } from "../lib/measureCoveredInsets";

interface LocationNotice {
  text: string;
  tone: keyof typeof MAP_LOCATION_NOTICE_MS;
}

export function useMyLocation(rootRef: RefObject<HTMLElement>) {
  const [locating, setLocating] = useState(false);
  const [myLocation, setMyLocation] = useState<MapMyLocation>();
  const [notice, setNotice] = useState<LocationNotice | null>(null);
  const mounted = useRef(true);
  const latestRequest = useRef(0);
  const giveUpTimer = useRef<number>();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; window.clearTimeout(giveUpTimer.current); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), MAP_LOCATION_NOTICE_MS[notice.tone]);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const locate = () => {
    if (!navigator.geolocation) { setNotice({ text: "현재 브라우저에서 위치 확인을 지원하지 않습니다.", tone: "error" }); return; }
    // 포기한 뒤 다시 누르면 앞선 요청의 결과가 늦게 올 수 있다 — 마지막 요청의 결과만 받는다
    const request = ++latestRequest.current;
    const isLatest = () => mounted.current && request === latestRequest.current;
    let settled = false;
    const startGiveUpTimer = () => {
      window.clearTimeout(giveUpTimer.current);
      giveUpTimer.current = window.setTimeout(() => {
        if (!isLatest()) return;
        settled = true;
        setLocating(false);
        setNotice({ text: "위치 확인이 끝나지 않았습니다. 브라우저의 위치 권한 요청을 확인한 뒤 다시 시도해 주세요.", tone: "error" });
      }, MAP_LOCATE_GIVE_UP_MS);
    };
    setLocating(true);
    setNotice(null);
    startGiveUpTimer();
    // 권한 창에 답한 순간부터 다시 센다 — 창에 오래 머문 뒤 허용하면 누른 때부터 센 시간이 위치를 찾는 도중에 끝난다
    navigator.permissions?.query({ name: "geolocation" }).then((status) => {
      if (status.state !== "prompt") return;
      status.addEventListener("change", () => { if (isLatest() && !settled) startGiveUpTimer(); }, { once: true });
    }).catch(() => undefined);
    navigator.geolocation.getCurrentPosition((position) => {
      if (!isLatest()) return;
      settled = true;
      window.clearTimeout(giveUpTimer.current);
      const root = rootRef.current;
      setMyLocation({
        point: { lat: position.coords.latitude, lng: position.coords.longitude },
        accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        padding: root ? measureCoveredInsets(root) : [0, 0, 0, 0]
      });
      setLocating(false);
      setNotice({ text: "현재 위치로 이동했습니다.", tone: "success" });
    }, (error) => {
      if (!isLatest()) return;
      settled = true;
      window.clearTimeout(giveUpTimer.current);
      setLocating(false);
      setNotice({ text: error.code === error.PERMISSION_DENIED ? "위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 확인해 주세요." : "현재 위치를 확인하지 못했습니다. 다시 시도해 주세요.", tone: "error" });
    }, MAP_GEOLOCATION_OPTIONS);
  };

  return { locating, myLocation, notice, locate, dismissNotice: () => setNotice(null) };
}
