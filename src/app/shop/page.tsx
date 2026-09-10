import type { Metadata } from "next";
import { getShopProducts, type ShopSort } from "@/entities/product";
import { PageContainer, PageHeader } from "@/shared/ui";
import { ShopFilters, MobileShopSort, MobileShopCategories, ShopGrid } from "@/widgets/shop-list";

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
    <PageContainer>
      <div className="md:flex md:gap-8">
        {/* PC 사이드바 필터 */}
        <aside className="hidden w-52 shrink-0 md:block">
          <ShopFilters />
        </aside>
        <div className="min-w-0 flex-1">
          <PageHeader
            title="가구 쇼핑"
            actions={
              <>
                {/* 모바일: 정렬 드롭다운 / PC: 상품 수 */}
                <MobileShopSort />
                <p className="hidden text-sm text-fg-disabled md:block">{products.length}개 상품</p>
              </>
            }
          />
          {/* 모바일: 카테고리 칩레일 */}
          <div className="mt-6 md:hidden">
            <MobileShopCategories />
          </div>
          <div className="mt-4 md:mt-8">
            <ShopGrid items={products} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
