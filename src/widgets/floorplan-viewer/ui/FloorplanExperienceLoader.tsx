"use client";

import dynamic from "next/dynamic";
import type { FloorplanExperienceProps } from "./FloorplanExperience";

// 3D 번들(three/R3F)을 CSR로 코드 분할 — 상세 SSR·LCP 영향 0 (frontend-rule P5)
const FloorplanExperience = dynamic(() => import("./FloorplanExperience"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-fg-muted">3D 뷰어를 불러오는 중…</div>
  )
});

export function FloorplanExperienceLoader(props: FloorplanExperienceProps) {
  return <FloorplanExperience {...props} />;
}
