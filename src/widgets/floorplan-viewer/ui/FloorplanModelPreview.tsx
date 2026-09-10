"use client";

import { useMemo, useRef } from "react";
import type { FloorplanModel2D } from "@/entities/floorplan";
import type { Axis, RigPose } from "../lib/types";
import { buildScene } from "../lib/buildScene";
import { Scene3D } from "./Scene3D";

/** 검수 화면용 3인칭 미리보기 — 추출·편집 중인 2D 모델을 즉시 3D로 확인 */
export function FloorplanModelPreview({ model }: { model: FloorplanModel2D }) {
  const scene = useMemo(() => buildScene(model), [model]);
  const rigRef = useRef<RigPose>({ x: 0, z: 0, yaw: 0, pitch: 0 });
  const moveRef = useRef<Axis>({ x: 0, y: 0 });
  const lookRef = useRef<Axis>({ x: 0, y: 0 });
  return (
    <div className="relative h-full w-full">
      <Scene3D scene={scene} mode="orbit" rigRef={rigRef} moveRef={moveRef} lookRef={lookRef} />
    </div>
  );
}
