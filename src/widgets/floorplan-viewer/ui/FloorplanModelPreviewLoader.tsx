"use client";

import dynamic from "next/dynamic";
import type { FloorplanModel2D } from "@/entities/floorplan";

// three/R3F 번들을 CSR로 분할 — 검수 화면 초기 로드에 3D 의존성을 싣지 않는다
const FloorplanModelPreview = dynamic(() => import("./FloorplanModelPreview").then((m) => m.FloorplanModelPreview), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-fg-muted">3D 미리보기를 불러오는 중…</div>
});

export function FloorplanModelPreviewLoader({ model }: { model: FloorplanModel2D }) {
  return <FloorplanModelPreview model={model} />;
}
