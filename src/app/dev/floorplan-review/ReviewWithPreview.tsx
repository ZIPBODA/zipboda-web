"use client";

import { useState } from "react";
import type { FloorplanModel2D } from "@/entities/floorplan";
import { FloorplanReviewEditor } from "@/widgets/floorplan-review";
import { FloorplanModelPreviewLoader } from "@/widgets/floorplan-viewer";

// 검수 에디터(추출·오버레이) + 뷰어(3D 미리보기)를 app 레이어에서 조합 — 위젯 간 직접 import 금지
export function ReviewWithPreview() {
  const [model, setModel] = useState<FloorplanModel2D | null>(null);
  return <FloorplanReviewEditor onModelChange={setModel} preview={model ? <FloorplanModelPreviewLoader model={model} /> : null} />;
}
