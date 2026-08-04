import Link from "next/link";
import { PROFILE_MENU } from "../config/notifications";

// figma 170:70 내 정보 패널 — 헤더 프로필 아이콘 드롭다운
export function ProfilePanel({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="w-[280px] overflow-hidden rounded-3xl border border-line-subtle bg-surface shadow-xl">
      <div className="flex items-center gap-3 p-5">
        <span className="h-11 w-11 shrink-0 rounded-full bg-surface-tertiary" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-fg-heading">김민지</p>
          <p className="truncate text-xs text-fg-muted">minji@email.com</p>
        </div>
      </div>

      <nav className="border-t border-line-subtle py-2" aria-label="내 정보">
        {PROFILE_MENU.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${m.active ? "bg-amber-50 font-bold text-fg-heading" : "font-medium text-gray-700 hover:bg-surface-secondary"}`}
          >
            <span aria-hidden className="text-lg">
              {m.emoji}
            </span>
            {m.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-line-subtle py-2">
        {/* TODO(AUTH): 로그아웃 API 연동 */}
        <button type="button" className="flex w-full items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-surface-secondary">
          <span aria-hidden className="text-lg">
            🚪
          </span>
          로그아웃
        </button>
      </div>
    </div>
  );
}
