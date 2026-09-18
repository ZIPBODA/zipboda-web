import { Suspense } from "react";
import { ReviewWithPreview } from "./ReviewWithPreview";

// 개발용 — 도면 자동 추출 결과를 검수·3D 미리보기·저장하는 화면. 배포 내비게이션에 노출하지 않는다
export default function FloorplanReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewWithPreview />
    </Suspense>
  );
}
