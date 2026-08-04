import type { Metadata } from "next";
import { getShopProducts, type ShopSort } from "@/entities/product";
import { ShopFilters, ShopGrid } from "@/widgets/shop-list";

export const metadata: Metadata = {
  title: "가구 쇼핑 | 집보다",
  description: "엄선된 가구를 카테고리·할인율·정렬로 살펴보고 장바구니에 담으세요."
};

interface PageProps {
  searchParams: { category?: string; discount?: string; sort?: string };
}

// figma 135:3372 가구 쇼핑 목록(ZB-U-SHOP-01, PC)
export default async function ShopPage({ searchParams }: PageProps) {
  const products = await getShopProducts({
    category: searchParams.category,
    discount: searchParams.discount ? Number(searchParams.discount) : undefined,
    sort: searchParams.sort as ShopSort | undefined
  });

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
      <div className="flex gap-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <ShopFilters />
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between">
            <h1 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">가구 쇼핑</h1>
            <p className="text-sm text-fg-disabled">{products.length}개 상품</p>
          </header>
          <div className="mt-6">
            <ShopGrid items={products} />
          </div>
        </div>
      </div>
    </main>
  );
}
