import Link from "next/link";
import { HOME_QUICK_MENU } from "../config/constants";

// figma 419:10687 모바일 퀵메뉴 — 5개 아이콘 타일(PC 카테고리 6종과 별개). 탭 시 앱 라우트로 이동
export function MobileQuickMenu() {
  return (
    <nav aria-label="바로가기" className="bg-surface p-3">
      <ul className="flex">
        {HOME_QUICK_MENU.map((item) => (
          <li key={item.label} className="flex-1">
            <Link href={item.href} className="flex w-full flex-col items-center gap-1.5 py-2.5">
              <span className="flex size-12 items-center justify-center rounded-xl bg-surface-secondary text-xl shadow-sm" aria-hidden>
                {item.icon}
              </span>
              <span className="text-center text-caption font-medium text-fg-body">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
