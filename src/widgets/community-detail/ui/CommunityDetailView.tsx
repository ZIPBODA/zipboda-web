"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShareButton } from "@/shared/ui/ShareButton";
import type { CommunityPostDetail } from "@/entities/community";

// figma PC 199:216 / Mobile 419:11567 커뮤니티 글 상세 — 좋아요 토글·댓글 입력은 클라이언트 상태
// editSlot: 글 수정 진입(app에서 CommunityEditLauncher 주입 — PC 모달/모바일 페이지)
export function CommunityDetailView({ post, editSlot }: { post: CommunityPostDetail; editSlot?: React.ReactNode }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <>
      {/* 모바일 상단바(←/글 상세) — figma 419:11569 */}
      <div className="flex items-center justify-between border-b border-line-subtle bg-surface px-4 py-3 md:hidden">
        <button type="button" onClick={() => router.back()} aria-label="뒤로" className="flex size-5 items-center justify-center text-base text-fg-strong">
          ←
        </button>
        <span className="text-base font-bold text-fg-strong">글 상세</span>
        <span aria-hidden className="size-5" />
      </div>

      <article className="mx-auto w-full bg-surface p-4 md:max-w-3xl md:rounded-3xl md:p-10 md:shadow-sm">
        {/* PC 브레드크럼 */}
        <nav aria-label="위치" className="hidden items-center gap-1.5 text-[13px] md:flex">
          <Link href="/community" className="text-fg-muted hover:text-fg-body">
            커뮤니티
          </Link>
          <span className="text-fg-disabled">/</span>
          <span className="text-fg-muted">{post.category}</span>
          <span className="text-fg-disabled">/</span>
          <span className="font-semibold text-fg-heading">글 상세</span>
        </nav>

        {/* 모바일 카테고리 pill */}
        <span className="inline-flex rounded-md bg-amber-100 px-2 py-1 text-caption font-bold text-fg-heading md:hidden">{post.category}</span>

        <h1 className="mt-3 text-h2 font-bold leading-snug text-fg-heading md:mt-4 md:text-[28px]">{post.title}</h1>

        <div className="mt-4 flex items-center gap-3">
          <span className="h-8 w-8 shrink-0 rounded-full bg-surface-tertiary md:h-10 md:w-10" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold text-gray-700 md:text-sm">{post.handle}</p>
            <p className="text-[11px] text-fg-disabled md:text-[13px]">
              {post.date} · 조회 {post.views.toLocaleString()}
            </p>
          </div>
          {editSlot && <div className="ml-auto">{editSlot}</div>}
        </div>

        <div className="mt-6 flex flex-col gap-5 md:mt-7 md:gap-6">
          {post.body.map((para, i) => (
            <div key={i} className="flex flex-col gap-5 md:gap-6">
              <p className="text-sm leading-[1.7] text-fg-heading md:text-base md:leading-[1.75]">{para}</p>
              {post.bodyImages[i] && (
                <div className="relative h-[200px] overflow-hidden rounded-2xl bg-surface-tertiary md:h-[360px]">
                  <Image src={post.bodyImages[i]} alt="" fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3 border-y border-line-subtle py-3 md:mt-7 md:justify-start md:gap-5 md:border-0 md:py-0">
          <button type="button" onClick={() => setLiked((v) => !v)} aria-pressed={liked} className="flex items-center gap-1.5 rounded-lg bg-surface-tertiary px-3 py-2 text-sm font-semibold text-status-error">
            ❤️ {likeCount.toLocaleString()}
          </button>
          <span className="flex items-center gap-1.5 rounded-lg bg-surface-tertiary px-3 py-2 text-sm font-semibold text-gray-700">💬 {post.commentCount.toLocaleString()}</span>
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary">🔖 저장</button>
          <ShareButton title={post.title} className="flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary">🔗 공유</ShareButton>
        </div>

        <section className="mt-8 flex flex-col gap-5">
          <h2 className="text-base font-bold text-fg-heading md:text-lg">댓글 {post.commentCount.toLocaleString()}개</h2>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-secondary p-1 pl-4">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-label="댓글 입력"
              placeholder="댓글을 입력하세요..."
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-fg-heading outline-none placeholder:text-fg-disabled"
            />
            {/* TODO(COMMUNITY): 댓글 등록 API 연동 */}
            <button type="button" className="shrink-0 rounded-lg bg-brand px-4 py-1.5 text-[13px] font-bold text-brand-on">
              등록
            </button>
          </div>

          <ul className="flex flex-col">
            {post.comments.map((c) => (
              <li key={c.id} className="flex flex-col gap-2.5 border-b border-line-subtle pb-4 pt-4 first:pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 shrink-0 rounded-full bg-surface-tertiary" aria-hidden />
                    <div>
                      <p className="text-[13px] font-semibold text-fg-heading">{c.handle}</p>
                      <p className="text-[11px] text-fg-disabled">{c.time}</p>
                    </div>
                  </div>
                  <span className="text-xs text-fg-muted">❤️ {c.likes}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
