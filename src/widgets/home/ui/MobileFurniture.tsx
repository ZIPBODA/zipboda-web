import Image from "next/image";
import type { Product } from "@/entities/product";
import { MobileHomeSection } from "./MobileHomeSection";

// figma 419:10866 모바일 인기 가구 추천 — 가로 스크롤 레일(카드=이미지+할인+브랜드+이름+가격, 평점·정가·담기 없음)
export function MobileFurniture({ items }: { items: Product[] }) {
  return (
    <MobileHomeSection title="인기 가구 추천" actionLabel="전체 쇼핑" actionHref="/shop">
      <ul className="flex gap-3 overflow-x-auto px-3 pb-1">
        {items.map((item) => (
          <li key={item.id} className="w-36 shrink-0">
            <article className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
              <div className="relative h-[140px] bg-surface-secondary">
                {item.image && <Image src={item.image} alt="" fill sizes="144px" className="object-cover" />}
                {item.discountRate !== undefined && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-caption font-bold text-brand-on">-{item.discountRate}%</span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-caption text-fg-disabled">{item.brand}</p>
                <p className="truncate text-2xsmall font-semibold text-fg-heading">{item.name}</p>
                <p className="mt-0.5 text-2xsmall font-bold text-fg-heading">{item.price.toLocaleString()}원</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </MobileHomeSection>
  );
}
