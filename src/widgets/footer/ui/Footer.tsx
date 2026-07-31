// figma 135:7899 공통 푸터 (ZB-U-COM-03) — 평면도 컬럼은 청약으로 통합되어 제외
const COLUMNS: { title: string; items: string[] }[] = [
  { title: "주택", items: ["LH 청약", "SH 공고", "자격 안내", "신청 팁", "가점 계산기"] },
  { title: "쇼핑", items: ["전체 가구", "거실", "침실", "주방", "조명"] }
];

const POLICIES = ["개인정보처리방침", "이용약관", "쿠키 설정"];

export function Footer() {
  return (
    <footer className="bg-surface-dark">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-[320px]">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-on">집</span>
              <span className="text-lg font-bold text-fg-ondark">집보다</span>
            </div>
            <p className="mt-4 text-sm text-fg-disabled">
              공공주택 청약, 인터랙티브 평면도, 엄선된 가구 쇼핑을 한곳에서 — 대한민국 대표 주거 플랫폼
            </p>
          </div>

          <div className="flex gap-16">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-xs font-bold text-fg-muted">{col.title}</h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.items.map((it) => (
                    <li key={it}>
                      <span className="cursor-pointer text-sm text-fg-disabled transition-colors hover:text-fg-ondark">{it}</span>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-fg-body">© 2025 집보다 Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-fg-body">
            {POLICIES.map((p) => (
              <span key={p} className="cursor-pointer transition-colors hover:text-fg-disabled">
                {p}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-fg-body">
            <span>🇰🇷 한국어</span>
            <span>·</span>
            <span className="text-fg-disabled">🌐 영어</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
