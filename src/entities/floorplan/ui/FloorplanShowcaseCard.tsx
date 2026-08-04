import Image from "next/image";
import type { FloorplanShowcase } from "../model/types";

// figma 135:7298 대표 평면도 카드 — 미리보기 + 2D/3D 지원 표시
export function FloorplanShowcaseCard({ item }: { item: FloorplanShowcase }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface">
      <div className="relative h-[190px] bg-surface-tertiary">
        <Image src={item.image} alt="" fill sizes="(min-width: 1280px) 400px, 33vw" className="object-cover" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.has2d && (
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-fg-ondark">2D</span>
          )}
          {item.has3d && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-brand-on">3D</span>
          )}
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
          {item.size}㎡
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-fg-heading">
          {item.size}㎡ {item.type}타입
        </h3>
        <p className="mt-1 text-sm text-fg-muted">{item.summary}</p>
        <div className="mt-3 flex items-center justify-between border-t border-surface-secondary pt-3">
          <span className="text-xs text-fg-disabled">탭하여 3D로 탐색</span>
          <ChevronRightIcon />
        </div>
      </div>
    </article>
  );
}

function ChevronRightIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.33} strokeLinecap="round" strokeLinejoin="round" className="text-fg-disabled" aria-hidden="true">
      <path d="m6 4 4 4-4 4" />
    </svg>
  );
}
