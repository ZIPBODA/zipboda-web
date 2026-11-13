import type { Metadata } from "next";
import { ProductCard } from "@/entities/product";
import { searchSubscriptions } from "@/entities/subscription";
import { SearchHousingResults, cleanQuery, searchAll } from "@/features/search";
import { PageContainer, PageHeader } from "@/shared/ui";
import { loadSearchHousingPage } from "../searchActions";
import { getProductSearchData } from "../searchData";

export const metadata: Metadata = { title: "통합 검색 | 집보다" };

export default async function SearchPage({ searchParams }: { searchParams: { q?: string | string[] } }) {
  const query = cleanQuery(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q);
  if (!query) {
    return <PageContainer><PageHeader title="통합 검색" description="검색창에 주택이나 가구 이름을 입력해보세요." /></PageContainer>;
  }

  const [housing, { index, products }] = await Promise.all([searchSubscriptions(query), getProductSearchData()]);
  const furniture = searchAll(index, query).flatMap((result) => products.find((item) => item.id === result.id) ?? []);
  const totalCount = housing.totalCount + furniture.length;

  return (
    <PageContainer>
      <PageHeader title={<span className="break-all">‘{query}’ 검색 결과</span>} description={`총 ${totalCount}건`} />
      {totalCount === 0 ? (
        <div className="mt-8 rounded-xl border border-line-subtle bg-surface-secondary p-6 text-center">
          <p className="break-all text-sm font-semibold text-fg-heading">‘{query}’에 대한 검색 결과가 없습니다.</p>
          <p className="mt-2 text-sm text-fg-muted">다른 검색어로 검색해보세요.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <section aria-labelledby="housing-results">
            <h2 id="housing-results" className="mb-4 text-lg font-bold text-fg-heading">공공주택 <span className="text-fg-muted">{housing.totalCount}건</span></h2>
            <SearchHousingResults key={query} initialPage={housing} loadPage={loadSearchHousingPage.bind(null, query)} />
          </section>
          <section aria-labelledby="product-results">
            <h2 id="product-results" className="mb-4 text-lg font-bold text-fg-heading">가구 <span className="text-fg-muted">{furniture.length}건</span></h2>
            {furniture.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{furniture.map((item) => <ProductCard key={item.id} item={item} href={`/shop/${item.id}`} />)}</div>
              : <p className="rounded-xl bg-surface-secondary p-6 text-sm text-fg-muted">검색된 가구가 없습니다.</p>}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
