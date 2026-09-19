import { MOCK_NOTIFICATIONS } from "../config/notifications";
import { PENDING_CLASS, PENDING_TITLE } from "@/shared/config/pending";

// figma 135:6954 알림 패널 — 헤더 알림 아이콘 드롭다운
export function NotificationPanel() {
  const unread = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-line-subtle bg-surface shadow-xl md:w-[360px]">
      <header className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-fg-heading">알림</h2>
          {unread > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-brand-on">{unread}</span>}
        </div>
        <button type="button" disabled title={PENDING_TITLE} className={`text-xs text-fg-disabled ${PENDING_CLASS}`}>모두 읽음 처리</button>
      </header>

      <ul className="max-h-96 overflow-y-auto">
        {MOCK_NOTIFICATIONS.map((n) => (
          <li key={n.id}>
            <button type="button" disabled title={PENDING_TITLE} className={`flex w-full cursor-default gap-3 border-b border-line-subtle px-5 py-4 text-left ${n.unread ? "bg-amber-50" : "bg-surface"}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-tertiary text-lg" aria-hidden>
                {n.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-fg-heading">{n.title}</p>
                  {n.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="읽지 않음" />}
                </div>
                <p className="mt-0.5 text-xs text-fg-muted">{n.body}</p>
                <p className="mt-1 text-xs text-fg-disabled">{n.time}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <footer className="py-3 text-center">
        <button type="button" disabled title={PENDING_TITLE} className={`text-xs font-medium text-fg-disabled ${PENDING_CLASS}`}>모든 알림 보기</button>
      </footer>
    </div>
  );
}
