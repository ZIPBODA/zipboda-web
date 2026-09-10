import type { MutableRefObject } from "react";

/** 1인칭 카메라 포즈(씬 좌표·라디안) — 프레임마다 갱신, 미니맵이 참조 */
export interface RigPose {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
}

/** 조이스틱 입력 벡터(-1..1) */
export interface Axis {
  x: number;
  y: number;
}

export type RigRef = MutableRefObject<RigPose>;
export type AxisRef = MutableRefObject<Axis>;
