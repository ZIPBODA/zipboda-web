import { useEffect, useRef, useState, type RefObject } from "react";
import type { MapMyLocation } from "@/shared/ui/map";
import { MAP_GEOLOCATION_OPTIONS, MAP_LOCATION_NOTICE_MS } from "../config/constants";
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
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), MAP_LOCATION_NOTICE_MS[notice.tone]);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const locate = () => {
    if (!navigator.geolocation) { setNotice({ text: "현재 브라우저에서 위치 확인을 지원하지 않습니다.", tone: "error" }); return; }
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition((position) => {
      if (!mounted.current) return;
      const root = rootRef.current;
      setMyLocation({
        point: { lat: position.coords.latitude, lng: position.coords.longitude },
        accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        padding: root ? measureCoveredInsets(root) : [0, 0, 0, 0]
      });
      setLocating(false);
      setNotice({ text: "현재 위치로 이동했습니다.", tone: "success" });
    }, (error) => {
      if (!mounted.current) return;
      setLocating(false);
      setNotice({ text: error.code === error.PERMISSION_DENIED ? "위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 확인해 주세요." : "현재 위치를 확인하지 못했습니다. 다시 시도해 주세요.", tone: "error" });
    }, MAP_GEOLOCATION_OPTIONS);
  };

  return { locating, myLocation, notice, locate, dismissNotice: () => setNotice(null) };
}
