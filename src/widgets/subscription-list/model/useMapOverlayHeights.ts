import { useLayoutEffect, type RefObject } from "react";
import { MAP_OVERLAY_HEIGHT_VARS } from "../config/constants";

/**
 * 검색 툴바는 남은 폭에 따라 한 줄도 되고 두 줄도 된다. 그 아래에 붙는 배율 버튼·탐색 메뉴·위치 안내가
 * 늘 한 간격만큼 떨어지도록 실제 높이를 CSS 변수로 넘긴다. 배율 버튼은 툴바의 컨테이너 쿼리 밖에 있어 CSS만으로는 알 수 없다.
 */
export function useMapOverlayHeights(rootRef: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = MAP_OVERLAY_HEIGHT_VARS.flatMap(({ selector, name }) => {
      const node = root.querySelector<HTMLElement>(selector);
      return node ? [{ node, name }] : [];
    });
    const write = () => targets.forEach(({ node, name }) => root.style.setProperty(name, `${node.offsetHeight}px`));
    write();
    const observer = new ResizeObserver(write);
    targets.forEach(({ node }) => observer.observe(node));
    return () => observer.disconnect();
  }, [rootRef]);
}
