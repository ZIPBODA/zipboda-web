"use client";

import { useEffect } from "react";

// web 로컬 폼 모달 — 오버레이 + 넓은 카드(lg 640). PC 폼(프로필수정·글쓰기·글수정)용.
// DS Modal(size=lg) 배포 후 교체 가능. 모바일은 전체화면 라우트 페이지를 사용한다.
export function FormModal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)]"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold text-fg-heading">{title}</h2>
          <button type="button" aria-label="닫기" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md text-base text-fg-disabled transition-colors hover:bg-surface-secondary">
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
