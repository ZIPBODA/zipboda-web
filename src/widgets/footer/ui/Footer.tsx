import { Fragment } from "react";
import Image from "next/image";
import icon from "@/shared/assets/brand/icon-logo.png";

// figma 250:76 Footer (ZB-U-COM-03)
const COLUMNS: { title: string; items: string[] }[] = [
  { title: "주택", items: ["LH 청약", "SH 공고", "자격 안내", "신청 팁", "가점 계산기"] },
  { title: "쇼핑", items: ["전체 가구", "거실", "침실", "주방", "조명"] }
];

const POLICIES = ["개인정보처리방침", "이용약관", "쿠키 설정"];

export function Footer() {
  return (
    // figma 353:2974(모바일) / 250:76(PC)
    <footer className="bg-surface-dark">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-16">
        {/* figma 353:2975 브랜드 — 모바일은 링크 컬럼 없이 브랜드+태그라인만 */}
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:gap-10">
          <div className="md:max-w-xs">
            <div className="flex items-center gap-2">
              <span className="relative size-9 shrink-0 overflow-hidden rounded-lg md:size-8">
                <Image src={icon} alt="" fill sizes="36px" className="object-contain" />
              </span>
              <span className="text-h2 font-bold tracking-[-0.015em] text-fg-ondark md:text-lg md:tracking-normal">집보다</span>
            </div>
            <p className="mt-3 text-sm text-fg-disabled md:mt-4">
              공공주택 청약, 인터랙티브 평면도, 엄선된 가구 쇼핑을 한곳에서 — 대한민국 대표 주거 플랫폼
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="hidden md:block">
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

        {/* figma 353:2981 하단 — 저작권 · 정책 · 언어. 모바일은 세로 스택(gap 16) */}
        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-4 md:mt-14 md:flex-row md:items-center md:justify-between md:pt-8">
          <p className="text-xs text-fg-body">© 2025 집보다 Inc. All rights reserved.</p>
          {/* figma 353:2983 모바일은 항목 사이에 구분점(·), PC는 간격만 */}
          <div className="flex items-center gap-2 text-xs text-fg-body md:gap-6">
            {POLICIES.map((p, i) => (
              <Fragment key={p}>
                {i > 0 && (
                  <span aria-hidden className="text-gray-700 md:hidden">
                    ·
                  </span>
                )}
                <span className="cursor-pointer transition-colors hover:text-fg-disabled">{p}</span>
              </Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-fg-body">🇰🇷 한국어</span>
            <span aria-hidden className="hidden text-gray-700 md:inline">
              ·
            </span>
            <span className="hidden text-fg-disabled md:inline">🌐 영어</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
