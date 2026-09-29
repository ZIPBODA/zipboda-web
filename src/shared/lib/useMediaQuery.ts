import { useEffect, useState } from "react";

/** 서버와 첫 렌더에서는 false다 — 화면 폭을 모르는 동안 무거운 요소(지도 등)를 미리 그리지 않는다 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}
