import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MapViewport } from "@/shared/ui/map";
import { readMapViewport, writeMapViewport } from "../lib/mapViewportQuery";

/**
 * 지도 자리를 주소에 담아 뒤로가기·새로고침·공유 링크에서 같은 지도를 연다.
 * 라우터 대신 history.replaceState로 바꾼다 — 지도를 끌 때마다 서버에서 공고를 다시 받을 이유가 없고, 뒤로가기 기록도 쌓지 않는다.
 */
export function useMapViewportQuery() {
  const params = useSearchParams();
  const [initialViewport] = useState(() => readMapViewport(new URLSearchParams(params.toString())) ?? undefined);
  // 지도는 중심을 화면 픽셀에 맞춰 반올림한다. 되살린 직후 돌려받은 자리를 그대로 적으면 새로고침할 때마다 조금씩 밀리므로,
  // 사용자가 움직이기 전까지는 주소를 건드리지 않는다
  const restored = useRef<string | null>(null);
  // 지금 보이는 자리. 되살린 뒤 움직이지 않았다면 반올림된 값이 아니라 되살린 값 그대로다
  const latest = useRef<MapViewport | null>(initialViewport ?? null);
  const saveViewport = useCallback((viewport: MapViewport) => {
    const current = new URLSearchParams(window.location.search);
    const next = writeMapViewport(current, viewport).toString();
    if (initialViewport && restored.current === null) restored.current = next;
    if (next === restored.current) return;
    latest.current = viewport;
    if (next === current.toString()) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${next}`);
  }, [initialViewport]);

  /**
   * 같은 지도 페이지 안에서 뒤로가기를 하면(모바일 상세 닫기, 필터 되돌리기) 주소는 그 기록을 남길 때의 자리로 돌아가지만
   * 지도는 그대로다. 새로고침·공유 때 보던 자리가 열리도록 지금 자리를 다시 적는다. 다른 페이지로 돌아간 경우는 건드리지 않는다.
   */
  useEffect(() => {
    const page = window.location.pathname;
    const onPop = () => {
      if (!latest.current || window.location.pathname !== page) return;
      const next = writeMapViewport(new URLSearchParams(window.location.search), latest.current);
      window.history.replaceState(null, "", `${page}?${next}`);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return { initialViewport, saveViewport };
}
