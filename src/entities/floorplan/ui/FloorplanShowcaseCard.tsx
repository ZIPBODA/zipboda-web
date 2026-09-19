import Image from "next/image";
import Link from "next/link";
import type { FloorplanShowcase } from "../model/types";

// figma 135:7298 대표 평면도 카드 — 미리보기 + 2D/3D 지원 표시
export function FloorplanShowcaseCard({ item }: { item: FloorplanShowcase }) {
  const href = item.href ?? "/subscriptions";
  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface">
      <Link href={item.href ? `${href}&view=${item.has3d ? "3d" : "2d"}` : href} aria-label={`${item.title ?? item.type} 평면도 탐색`} className="absolute inset-0 z-10 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" />
      <div className="relative h-[190px] bg-surface-tertiary">
        <Image src={item.image} alt={`${item.title ?? "주택"} 원본 평면도`} fill sizes="(min-width: 1280px) 400px, 33vw" className="object-contain p-3" />
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
          {item.title ?? `${item.size}㎡ ${item.type}타입`}
        </h3>
        <p className="mt-1 text-sm text-fg-muted">{item.summary}</p>
        <div className="mt-3 flex items-center justify-between border-t border-surface-secondary pt-3">
          <Link href={item.href ? `${href}&view=2d` : href} className="relative z-20 rounded-lg border border-line px-3 py-2 text-xs font-semibold">2D 도면 보기</Link>
          {item.has3d && <Link href={item.href ? `${href}&view=3d` : href} className="relative z-20 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-on">3D 탐색 →</Link>}
        </div>
      </div>
    </article>
  );
}

