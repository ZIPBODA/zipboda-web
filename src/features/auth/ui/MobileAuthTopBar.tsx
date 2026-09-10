"use client";

import { useRouter } from "next/navigation";

// figma 419:11131 모바일 인증 상단바 — 뒤로가기(←) + 가운데 제목. PC(≥md)는 숨김
export function MobileAuthTopBar({ title }: { title: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 border-b border-line-subtle bg-surface px-4 pb-3 pt-12 md:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로"
        className="flex size-4 items-center justify-center text-base text-fg-heading"
      >
        ←
      </button>
      <span className="flex-1 text-center text-[13px] font-semibold text-fg-heading">{title}</span>
      <span aria-hidden className="size-4" />
    </div>
  );
}
