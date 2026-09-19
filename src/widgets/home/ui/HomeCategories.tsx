import { HOME_CATEGORIES } from "../config/constants";
import { PENDING_CLASS, PENDING_TITLE } from "@/shared/config/pending";

// figma 135:7032 카테고리 바 — 6개 타일
export function HomeCategories() {
  return (
    <nav aria-label="바로가기" className="mx-auto w-full max-w-7xl border-b border-surface-secondary px-6 py-10">
      <ul className="flex justify-between">
        {HOME_CATEGORIES.map((category) => (
          <li key={category.label} className="flex-1">
            <button type="button" disabled title={PENDING_TITLE} className={`flex w-full flex-col items-center gap-2.5 rounded-xl px-2 py-5 ${PENDING_CLASS}`}>
              <span className="flex size-14 items-center justify-center rounded-xl bg-surface-secondary text-2xl shadow-sm" aria-hidden="true">
                {category.icon}
              </span>
              <span className="text-xs font-semibold text-gray-700">{category.label}</span>
              <span className="text-caption text-fg-disabled">{category.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
