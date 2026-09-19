import type { PanOffset } from "./zoomAtPoint";

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * 확대된 도면이 컨테이너 밖으로 완전히 빠져나가지 못하게 이동량을 가둔다.
 * 맞춤 배율에서는 남는 여백이 없으므로 이동량이 0이다.
 */
/** 한계가 0일 때 Math.max(-0, …)가 -0을 돌려주므로 비교가 어긋나지 않게 0으로 맞춘다 */
const clamp = (value: number, limit: number) => {
  const result = Math.max(-limit, Math.min(limit, value));
  return result === 0 ? 0 : result;
};

export function clampOffset(offset: PanOffset, size: ViewportSize, scale: number): PanOffset {
  const limitX = Math.max(0, (size.width * (scale - 1)) / 2);
  const limitY = Math.max(0, (size.height * (scale - 1)) / 2);
  return { x: clamp(offset.x, limitX), y: clamp(offset.y, limitY) };
}
