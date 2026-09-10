import { CommunityCard, CommunityCardMobile, type CommunityPost } from "@/entities/community";

// figma PC 135:2354(세로 카드 그리드) / Mobile 419:11420(가로 카드 리스트) — 이중 렌더
export function CommunityGrid({ posts }: { posts: CommunityPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line-subtle bg-surface-secondary py-20 text-center">
        <p className="text-base font-semibold text-fg-body">아직 게시글이 없습니다</p>
        <p className="text-sm text-fg-muted">첫 글을 작성해 보세요.</p>
      </div>
    );
  }
  return (
    <>
      {/* PC(≥768) 세로 카드 그리드 */}
      <div className="hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <CommunityCard key={post.id} post={post} />
        ))}
      </div>
      {/* 모바일(≤767) 가로 카드 리스트 */}
      <div className="md:hidden">
        <h2 className="mb-4 text-sm font-bold text-fg-heading">최신 피드</h2>
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <CommunityCardMobile key={post.id} post={post} />
          ))}
        </div>
      </div>
    </>
  );
}
