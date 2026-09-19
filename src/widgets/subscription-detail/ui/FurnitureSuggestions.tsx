import type { Product } from "@/entities/product";
import { PENDING_CLASS, PENDING_TITLE } from "@/shared/config/pending";

// figma 135:5199 '이 공간 꾸미기' — 상세 하단 추천 가구
export function FurnitureSuggestions({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-line-subtle pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-fg-heading">이 공간 꾸미기</h2>
        <span className="flex items-center gap-0.5 text-xs font-medium text-fg-disabled">
          전체 보기
          <ChevronRightIcon />
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3">
            {/* 상품 이미지는 커머스(2차) 연동 전까지 플레이스홀더 */}
            <div className="size-14 shrink-0 rounded-md bg-surface-tertiary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-fg-disabled">{product.brand}</p>
              <p className="truncate text-sm font-semibold text-fg-heading">{product.name}</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">{product.price.toLocaleString()}원</p>
            </div>
            <button
              type="button"
              disabled
              title={PENDING_TITLE}
              className={`shrink-0 rounded-md bg-brand px-3 py-2 text-xs font-bold text-brand-on ${PENDING_CLASS}`}
            >
              구매
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChevronRightIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.33} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 4 4 4-4 4" />
    </svg>
  );
}
