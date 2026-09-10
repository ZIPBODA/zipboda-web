// figma 353:4089 WebGL 미지원 — 3D 뷰어 로드 실패 시 안내 + 2D 폴백
const TROUBLESHOOT_STEPS = [
  "브라우저를 최신 버전으로 업데이트해 주세요.",
  "설정에서 하드웨어 가속(그래픽 가속)을 켜 주세요.",
  "다른 브라우저(Chrome, Edge 등)로 접속해 보세요."
];

export function FloorplanUnsupported({ onView2D }: { onView2D: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-[28px] bg-brand/15 text-2xl" aria-hidden>
        ⚠️
      </span>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-lg font-bold text-fg-heading">3D 뷰어를 불러올 수 없습니다</h2>
        <p className="text-compact leading-relaxed text-fg-muted">
          사용 중인 브라우저 또는 기기가 WebGL 3D 그래픽 기술을 지원하지 않거나 활성화되어 있지 않습니다.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-4 text-left">
        <h3 className="text-compact font-bold text-fg-body">해결 방법 안내</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {TROUBLESHOOT_STEPS.map((step) => (
            <li key={step} className="flex gap-2 text-2xsmall text-fg-muted">
              <span aria-hidden className="text-brand">
                →
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <button type="button" onClick={onView2D} className="rounded-[10px] bg-brand py-3 text-sm font-bold text-brand-on">
          2D 평면도로 보기
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-[10px] border border-line-strong py-3 text-sm font-medium text-fg-body"
        >
          새로고침
        </button>
      </div>
    </div>
  );
}
