"use client";

import { Button, PageContainer } from "@/shared/ui";

/** API가 멈추거나 늦어 화면을 그리지 못했을 때. 지도 상세의 실패 안내와 같은 문구·다시 시도로 맞춘다 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p role="alert" className="text-base font-semibold text-fg-heading">정보를 불러오지 못했습니다.</p>
        <p className="text-sm text-fg-muted">잠시 후 다시 시도해 주세요.</p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </PageContainer>
  );
}
