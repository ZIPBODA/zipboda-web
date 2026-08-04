import { CommunityCard, type CommunityPost } from "@/entities/community";

// figma 135:2354 게시글 그리드
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <CommunityCard key={post.id} post={post} />
      ))}
    </div>
  );
}
