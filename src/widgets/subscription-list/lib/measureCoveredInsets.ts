import { MAP_FIT_MARGIN, MAP_OVERLAY_SELECTORS } from "../config/constants";

export type CoveredInsets = readonly [top: number, right: number, bottom: number, left: number];


/**
 * 지도 캔버스 가장자리를 패널·툴바·버튼이 얼마나 덮었는지(px).
 * 공고 전체에 맞출 때와 고른 집으로 날아갈 때 가려진 곳을 비켜 가는 데 쓴다.
 * PC 왼쪽 패널은 흐름 안에 서 있고(relative), 모바일 시트·툴바·버튼은 지도 위에 떠 있다(absolute).
 */
export function measureCoveredInsets(root: HTMLElement): CoveredInsets {
  const canvas = root.querySelector(MAP_OVERLAY_SELECTORS.canvas)?.getBoundingClientRect();
  if (!canvas) return [0, 0, 0, 0];
  const shown = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector)).flatMap((node) => {
    const box = node.getBoundingClientRect();
    return box.width > 0 && box.height > 0 ? [{ box, floating: getComputedStyle(node).position === "absolute" }] : [];
  });
  let [top, right, bottom, left] = [0, 0, 0, 0];
  for (const { box, floating } of shown(MAP_OVERLAY_SELECTORS.controls)) {
    if (floating) top = Math.max(top, box.bottom - canvas.top);
    else left = Math.max(left, box.right - canvas.left);
  }
  for (const { box } of shown(MAP_OVERLAY_SELECTORS.zoom)) right = Math.max(right, canvas.right - box.left);
  for (const { box, floating } of shown(MAP_OVERLAY_SELECTORS.panels)) {
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
