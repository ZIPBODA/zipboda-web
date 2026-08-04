import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "../model/types";

// figma 135:2355 커뮤니티 게시글 카드 — 카드 전체가 글 상세 진입
export function CommunityCard({ post }: { post: CommunityPost }) {
  return (
    <Link href={`/community/${post.id}`} className="flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface transition-shadow hover:shadow-md">
      <div className="relative h-[190px] bg-surface-tertiary">
        <Image src={post.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 z-10 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-brand-on">{post.category}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 shrink-0 rounded-full bg-surface-tertiary" aria-hidden />
          <span className="text-xs text-fg-disabled">{post.handle}</span>
          <span className="ml-auto text-xs text-line-strong">{post.date}</span>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-fg-heading">{post.title}</h3>
        <div className="mt-3 flex items-center gap-3 text-xs text-fg-disabled">
          <span>❤️ {post.likes.toLocaleString()}</span>
          <span>💬 {post.comments.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
