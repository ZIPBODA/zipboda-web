import Link from "next/link";
import { MY_TABS } from "../config/constants";

// figma 135:1556 마이페이지 탭 — 활성 탭 brand 밑줄
export function MyPageTabs({ active }: { active: string }) {
  return (
    <div className="mt-10 flex gap-1 border-b border-line-subtle">
      {MY_TABS.map((tab) => {
        const isActive = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              isActive ? "border-brand text-fg-heading" : "border-transparent text-fg-disabled hover:text-fg-body"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
