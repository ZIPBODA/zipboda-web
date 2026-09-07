import { ProductCard, type Product } from "@/entities/product";

// figma 135:3430 가구 쇼핑 상품 그리드
export function ShopGrid({ items }: { items: Product[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line-subtle bg-surface-secondary py-20 text-center">
        <p className="text-base font-semibold text-fg-body">조건에 맞는 상품이 없습니다</p>
        <p className="text-sm text-fg-muted">필터를 변경해 다시 검색해 보세요.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} href={`/shop/${item.id}`} />
      ))}
    </div>
  );
}
