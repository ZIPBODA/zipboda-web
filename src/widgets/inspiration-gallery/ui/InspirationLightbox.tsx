"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { InspirationItem } from "@/entities/inspiration";

// figma 135:3352 라이트박스 — 이미지 + 하단 캡션 오버레이(카테고리·핸들·좋아요) + 저장/쇼핑하기
export function InspirationLightbox({ item, onClose }: { item: InspirationItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} role="dialog" aria-modal aria-label="집구경 상세" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl">
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
          ✕
        </button>
        <div className="relative aspect-[9/4] w-full overflow-hidden rounded-3xl bg-surface-tertiary shadow-2xl">
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="min-w-0">
              <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-on">{item.category}</span>
              <p className="mt-2 text-base font-bold text-white">{item.handle}</p>
              <p className="text-sm text-white/70">❤️ {item.likes.toLocaleString()} 좋아요</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {/* TODO(INSPIRATION): 저장 API 연동 */}
              <button type="button" className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white">❤️ 저장</button>
              <Link href="/shop" onClick={onClose} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-on">
                이 스타일 쇼핑하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
