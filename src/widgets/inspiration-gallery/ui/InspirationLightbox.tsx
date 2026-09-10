"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { InspirationItem } from "@/entities/inspiration";

// figma 135:3352(PC)·419:9815(모바일) 라이트박스 — 모바일은 전체 이미지(contain)+하단 액션 바, PC는 카드+캡션 오버레이
export function InspirationLightbox({ item, onClose }: { item: InspirationItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="집구경 상세"
      className="fixed inset-0 z-50 flex flex-col bg-black/90 md:items-center md:justify-center md:bg-black/85 md:p-6"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative flex h-full w-full flex-col md:h-auto md:max-w-3xl">
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
          ✕
        </button>

        {/* figma 419:9825 모바일=object-contain(전체 노출) / PC=object-cover(카드 크롭) */}
        <div className="relative w-full flex-1 overflow-hidden bg-black md:aspect-[9/4] md:flex-none md:rounded-3xl md:bg-surface-tertiary md:shadow-2xl">
          <Image src={item.image} alt={`${item.category} 집구경`} fill sizes="(min-width: 768px) 768px, 100vw" className="object-contain md:object-cover" />
        </div>

        {/* figma 419:9826 모바일=이미지 아래 고정 바 / PC=이미지 하단 그라디언트 오버레이 */}
        <div className="flex items-end justify-between gap-4 bg-black p-5 md:absolute md:inset-x-0 md:bottom-0 md:rounded-b-3xl md:bg-gradient-to-t md:from-black/70 md:to-transparent md:p-6">
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
  );
}
