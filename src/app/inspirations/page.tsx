import type { Metadata } from "next";
import { getInspirations } from "@/entities/inspiration";
import { PageContainer, PageHeader } from "@/shared/ui";
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
    <PageContainer>
      <PageHeader title="집구경" description="커뮤니티가 꾸민 실제 집" actions={<InspirationFilters />} />

      <div className="mt-6 md:mt-8">
        <InspirationGrid items={items} />
      </div>
    </PageContainer>
  );
}
