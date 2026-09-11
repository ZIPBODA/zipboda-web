"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FloorplanModel2D } from "@/entities/floorplan";
import { FloorplanReviewEditor } from "@/widgets/floorplan-review";
import { FloorplanModelPreviewLoader } from "@/widgets/floorplan-viewer";

// 검수 에디터(추출·오버레이) + 뷰어(3D 미리보기)를 app 레이어에서 조합 — 위젯 간 직접 import 금지
export function ReviewWithPreview() {
  const [model, setModel] = useState<FloorplanModel2D | null>(null);
  // ?auto=1 — 페이지 진입만으로 추출을 실행해 브라우저 자동 검증이 가능하게 한다(dev 전용 라우트)
  const autoRun = useSearchParams().get("auto") === "1";
  return (
    <FloorplanReviewEditor
      autoRun={autoRun}
      onModelChange={setModel}
      preview={model ? <FloorplanModelPreviewLoader model={model} /> : null}
    />
  );
}
