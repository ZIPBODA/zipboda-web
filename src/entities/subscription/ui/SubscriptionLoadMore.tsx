import { Button } from "@/shared/ui";

/** 목록 끝의 '더 보기'. 실패하면 같은 버튼으로 다시 시도한다 */
export function SubscriptionLoadMore({ loading, failed, onLoadMore }: { loading: boolean; failed: boolean; onLoadMore: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      {failed && <p role="alert" className="text-sm text-fg-muted">공고를 더 불러오지 못했습니다. 다시 시도해 주세요.</p>}
      <Button variant="secondary" onClick={onLoadMore} disabled={loading} aria-busy={loading}>
        {loading ? "불러오는 중…" : "더 보기"}
      </Button>
    </div>
  );
}
