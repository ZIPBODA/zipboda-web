import Image from "next/image";
import icon from "@/shared/assets/brand/icon.png";

// figma 250:76 Footer (ZB-U-COM-03)
const COLUMNS: { title: string; items: string[] }[] = [
  { title: "주택", items: ["LH 청약", "SH 공고", "자격 안내", "신청 팁", "가점 계산기"] },
  { title: "쇼핑", items: ["전체 가구", "거실", "침실", "주방", "조명"] }
];

const POLICIES = ["개인정보처리방침", "이용약관", "쿠키 설정"];

export function Footer() {
  return (
    // 화면설계서 COM-03 — 푸터는 PC 전용(Mobile ✕)
    <footer className="hidden bg-surface-dark md:block">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* figma 250:78 상단 — 브랜드 · 주택 · 쇼핑 (좌·중·우) */}
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* figma 250:79 브랜드 */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                <Image src={icon} alt="" fill sizes="32px" className="object-contain" />
              </span>
              <span className="text-lg font-bold text-fg-ondark">집보다</span>
            </div>
            <p className="mt-4 text-sm text-fg-disabled">
              공공주택 청약, 인터랙티브 평면도, 엄선된 가구 쇼핑을 한곳에서 — 대한민국 대표 주거 플랫폼
            </p>
          </div>

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

        {/* figma 250:134 하단 — 저작권 · 정책 · 언어 */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-fg-body">© 2025 집보다 Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-fg-body">
            {POLICIES.map((p) => (
              <span key={p} className="cursor-pointer transition-colors hover:text-fg-disabled">
                {p}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-fg-body">🇰🇷 한국어</span>
            <span className="text-gray-700">·</span>
            <span className="text-fg-disabled">🌐 영어</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
