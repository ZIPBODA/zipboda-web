import Image from "next/image";
import Link from "next/link";
import type { FloorplanShowcase } from "@/entities/floorplan";
import { MobileHomeSection } from "./MobileHomeSection";

// figma 419:10810 모바일 인터랙티브 평면도 — 3-up 카드(이미지 위 2D/3D·면적 배지)
export function MobileFloorplans({ items }: { items: FloorplanShowcase[] }) {
  return (
    <MobileHomeSection title="인터랙티브 평면도" actionLabel="전체 보기" actionHref="/subscriptions">
      <div className="grid grid-cols-3 gap-3 px-3">
        {items.map((item) => (
          <Link key={item.id} href={item.href ? `${item.href}&view=${item.has3d ? "3d" : "2d"}` : "/subscriptions"} aria-label={`${item.title ?? item.type} 평면도 탐색`} className="overflow-hidden rounded-xl border border-line-subtle bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            <div className="relative h-[110px] bg-surface-tertiary">
              <Image src={item.image} alt="" fill sizes="(max-width: 767px) 33vw, 110px" className="object-contain p-1" />
              <span className="absolute left-2 top-2 flex gap-1">
                {item.has2d && <span className="rounded-sm bg-black/40 px-1.5 py-0.5 text-caption font-semibold text-fg-ondark">2D</span>}
                {item.has3d && <span className="rounded-sm bg-brand px-1.5 py-0.5 text-caption font-bold text-brand-on">3D</span>}
              </span>
              <span className="absolute bottom-2 right-2 rounded-full bg-surface px-2 py-0.5 text-caption font-bold text-gray-800">{item.size}㎡</span>
            </div>
            <div className="p-3">
              <h3 className="text-xs font-semibold text-fg-heading">
                {item.title ?? item.type}
              </h3>
              <p className="mt-0.5 text-caption text-fg-disabled">{item.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </MobileHomeSection>
  );
}
