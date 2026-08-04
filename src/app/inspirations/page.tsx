import type { Metadata } from "next";
import { getInspirations } from "@/entities/inspiration";
import { InspirationFilters, InspirationGrid } from "@/widgets/inspiration-gallery";

export const metadata: Metadata = {
  title: "집구경 | 집보다",
  description: "커뮤니티가 꾸민 실제 집을 둘러보고 인테리어 영감을 얻으세요."
};

interface PageProps {
  searchParams: { category?: string };
}

// figma 135:2921 집구경(인테리어 영감) 갤러리(ZB-U-TOUR-01, PC)
export default async function InspirationsPage({ searchParams }: PageProps) {
  const category = searchParams.category ?? "전체";
  const items = await getInspirations(category);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">집구경</h1>
          <p className="mt-1 text-sm text-fg-muted">커뮤니티가 꾸민 실제 집</p>
        </div>
        <InspirationFilters />
      </header>

      <div className="mt-6">
        <InspirationGrid items={items} />
      </div>
    </main>
  );
}
