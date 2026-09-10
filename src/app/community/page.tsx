import type { Metadata } from "next";
import { getCommunityPosts, getCommunityHero } from "@/entities/community";
import { PageContainer, PageHeader } from "@/shared/ui";
import { CommunityFilters, CommunityHero, CommunityGrid } from "@/widgets/community-list";
import { CommunityWriteLauncher } from "@/widgets/community-editor";

export const metadata: Metadata = {
  title: "커뮤니티 | 집보다",
  description: "실제 입주민과 인테리어 애호가들의 생생한 이야기."
};

interface PageProps {
  searchParams: { category?: string };
}

// figma 135:2305 커뮤니티 목록(ZB-U-COMM-01, PC)
export default async function CommunityPage({ searchParams }: PageProps) {
  const category = searchParams.category ?? "전체";
  const [posts, hero] = await Promise.all([getCommunityPosts(category), getCommunityHero()]);
  const showHero = category === "전체";

  return (
    <PageContainer>
      <PageHeader
        title="커뮤니티"
        description="실제 입주민과 인테리어 애호가들의 생생한 이야기"
        actions={<CommunityWriteLauncher />}
      />

      <div className="mt-6 md:mt-8">
        <CommunityFilters />
      </div>

      {showHero && (
        <div className="mt-4 md:mt-6">
          <CommunityHero hero={hero} />
        </div>
      )}

      <div className="mt-6 md:mt-8">
        <CommunityGrid posts={posts} />
      </div>
    </PageContainer>
  );
}
