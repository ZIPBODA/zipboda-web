import type { Metadata } from "next";
import Link from "next/link";
import { getCommunityPosts, getCommunityHero } from "@/entities/community";
import { CommunityFilters, CommunityHero, CommunityGrid } from "@/widgets/community-list";

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
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">커뮤니티</h1>
          <p className="mt-1 text-sm text-fg-muted">실제 입주민과 인테리어 애호가들의 생생한 이야기</p>
        </div>
        <Link href="/community/write" className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-on">
          + 글쓰기
        </Link>
      </header>

      <div className="mt-6">
        <CommunityFilters />
      </div>

      {showHero && (
        <div className="mt-7">
          <CommunityHero hero={hero} />
        </div>
      )}

      <div className="mt-7">
        <CommunityGrid posts={posts} />
      </div>
    </main>
  );
}
