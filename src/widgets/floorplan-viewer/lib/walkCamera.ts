import { MathUtils } from "three";
import { WALK_CAMERA } from "../config/constants";

export function walkVerticalFov(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return WALK_CAMERA.shortAxisFov;
  const verticalFromHorizontal = (degrees: number) =>
    MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(degrees) / 2) / aspect));

  // 세로 화면의 시야가 좁아지거나 와이드 화면 가장자리가 과하게 늘어나지 않도록 제한한다.
  if (aspect < 1) return Math.min(WALK_CAMERA.maxVerticalFov, verticalFromHorizontal(WALK_CAMERA.shortAxisFov));
  return Math.min(WALK_CAMERA.shortAxisFov, verticalFromHorizontal(WALK_CAMERA.maxHorizontalFov));
}
