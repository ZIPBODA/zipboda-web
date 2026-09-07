import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "../model/types";

// figma 419:11422 모바일 커뮤니티 카드 — 가로형(썸네일 100 좌 + 메타/제목/반응 우)
export function CommunityCardMobile({ post }: { post: CommunityPost }) {
  return (
    <Link href={`/community/${post.id}`} className="flex items-center gap-3 border-b border-line-subtle pb-4">
      <span className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-tertiary">
        <Image src={post.image} alt="" fill sizes="96px" className="object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-2xsmall">
          <span aria-hidden className="size-4 shrink-0 rounded-full bg-surface-tertiary" />
          <span className="truncate font-medium text-fg-body">{post.handle}</span>
          <span className="text-fg-muted">·</span>
          <span className="shrink-0 text-fg-disabled">{post.date}</span>
        </span>
        <span className="line-clamp-2 text-sm font-semibold text-fg-heading">{post.title}</span>
        <span className="flex items-center gap-2 text-2xsmall text-fg-disabled">
          <span>❤️ {post.likes.toLocaleString()}</span>
          <span>💬 {post.comments.toLocaleString()}</span>
        </span>
      </span>
    </Link>
  );
}
