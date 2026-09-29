import { useCallback, useRef, useState } from "react";
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
  const saveViewport = useCallback((viewport: MapViewport) => {
    const current = new URLSearchParams(window.location.search);
    const next = writeMapViewport(current, viewport).toString();
    if (initialViewport && restored.current === null) restored.current = next;
    if (next === restored.current || next === current.toString()) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${next}`);
  }, [initialViewport]);
  return { initialViewport, saveViewport };
}
