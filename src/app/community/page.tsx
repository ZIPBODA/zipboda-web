import type { Metadata } from "next";
import { getCommunityPosts, getCommunityHero } from "@/entities/community";
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
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-6 md:pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4 md:items-end">
        <div>
          <h1 className="text-h2 font-bold tracking-[-0.0125em] text-fg-heading md:text-h1">커뮤니티</h1>
          <p className="mt-1 text-xs text-fg-muted md:text-sm">실제 입주민과 인테리어 애호가들의 생생한 이야기</p>
        </div>
        <CommunityWriteLauncher />
      </header>

      <div className="mt-4 md:mt-6">
        <CommunityFilters />
      </div>

      {showHero && (
        <div className="mt-4 md:mt-7">
          <CommunityHero hero={hero} />
        </div>
      )}

      <div className="mt-6 md:mt-7">
        <CommunityGrid posts={posts} />
      </div>
    </main>
  );
}
