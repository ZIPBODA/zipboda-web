import { MAP_FIT_MARGIN, MAP_OVERLAY_SELECTORS } from "../config/constants";

export type CoveredInsets = readonly [top: number, right: number, bottom: number, left: number];

/**
 * 지도 캔버스 가장자리를 패널·툴바·버튼이 얼마나 덮었는지(px).
 * 공고 전체에 맞출 때와 고른 집으로 날아갈 때 가려진 곳을 비켜 가는 데 쓴다.
 * PC 왼쪽 패널은 흐름 안에 서 있고(relative), 모바일 시트·툴바·버튼은 지도 위에 떠 있다(absolute).
 * 탐색 메뉴는 PC에서는 패널 옆 열, 모바일에서는 왼쪽 세로 버튼 열이라 어느 쪽이든 왼쪽을 가린다.
 * 모바일 상세처럼 지도 전체를 덮는 페이지는 셈하지 않는다 — 닫고 나면 그 아래 지도 그대로 보이기 때문이다.
 */
export function measureCoveredInsets(root: HTMLElement): CoveredInsets {
  const canvas = root.querySelector(MAP_OVERLAY_SELECTORS.canvas)?.getBoundingClientRect();
  if (!canvas) return [0, 0, 0, 0];
  const shown = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector)).flatMap((node) => {
    const box = node.getBoundingClientRect();
    return box.width > 0 && box.height > 0 ? [{ box, floating: getComputedStyle(node).position === "absolute" }] : [];
  });
  let [top, right, bottom, left] = [0, 0, 0, 0];
  for (const { box } of shown(MAP_OVERLAY_SELECTORS.toolbar)) top = Math.max(top, box.bottom - canvas.top);
  for (const { box } of shown(MAP_OVERLAY_SELECTORS.rail)) left = Math.max(left, box.right - canvas.left);
  for (const { box } of shown(MAP_OVERLAY_SELECTORS.zoom)) right = Math.max(right, canvas.right - box.left);
  for (const { box, floating } of shown(MAP_OVERLAY_SELECTORS.panels)) {
    const coversMap = box.top <= canvas.top && canvas.bottom <= box.bottom;
    if (coversMap) continue;
    if (floating) bottom = Math.max(bottom, canvas.bottom - box.top);
    else left = Math.max(left, box.right - canvas.left);
  }
  for (const { box } of shown(MAP_OVERLAY_SELECTORS.bottomBar)) bottom = Math.max(bottom, canvas.bottom - box.top);
  const floor = (value: number) => Math.max(0, value);
  return [floor(top), floor(right), floor(bottom), floor(left)];
}

/** 공고 전체에 맞출 때 쓰는 여백 — 가려진 폭에 배지 하나만큼 더 띄운다 */
export function measureFitPadding(root: HTMLElement | null): CoveredInsets | undefined {
  if (!root) return undefined;
  const [top, right, bottom, left] = measureCoveredInsets(root);
  return [top + MAP_FIT_MARGIN, right + MAP_FIT_MARGIN, bottom + MAP_FIT_MARGIN, left + MAP_FIT_MARGIN];
}
