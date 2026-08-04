"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPostDetail } from "@/entities/community";

// figma 199:216 커뮤니티 글 상세 — 좋아요 토글·댓글 입력은 클라이언트 상태
export function CommunityDetailView({ post }: { post: CommunityPostDetail }) {
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <article className="mx-auto max-w-3xl rounded-3xl bg-surface p-10 shadow-sm">
      <nav aria-label="위치" className="flex items-center gap-1.5 text-[13px]">
        <Link href="/community" className="text-fg-muted hover:text-fg-body">
          커뮤니티
        </Link>
        <span className="text-fg-disabled">/</span>
        <span className="text-fg-muted">{post.category}</span>
        <span className="text-fg-disabled">/</span>
        <span className="font-semibold text-fg-heading">글 상세</span>
      </nav>

      <h1 className="mt-4 text-[28px] font-bold leading-snug text-fg-heading">{post.title}</h1>

      <div className="mt-4 flex items-center gap-3">
        <span className="h-10 w-10 shrink-0 rounded-full bg-surface-tertiary" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-gray-700">{post.handle}</p>
          <p className="text-[13px] text-fg-disabled">
            {post.date} · 조회 {post.views.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-6">
        {post.body.map((para, i) => (
          <div key={i} className="flex flex-col gap-6">
            <p className="text-base leading-[1.75] text-fg-heading">{para}</p>
            {post.bodyImages[i] && (
              <div className="relative h-[360px] overflow-hidden rounded-2xl bg-surface-tertiary">
                <Image src={post.bodyImages[i]} alt="" fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-center gap-5">
        <button type="button" onClick={() => setLiked((v) => !v)} aria-pressed={liked} className="flex items-center gap-1.5 rounded-lg bg-surface-tertiary px-3 py-2 text-sm font-semibold text-status-error">
          ❤️ {likeCount.toLocaleString()}
        </button>
        <span className="flex items-center gap-1.5 rounded-lg bg-surface-tertiary px-3 py-2 text-sm font-semibold text-gray-700">💬 {post.commentCount.toLocaleString()}</span>
        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary">🔖 저장</button>
        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary">🔗 공유</button>
      </div>

      <section className="mt-8 flex flex-col gap-5">
        <h2 className="text-lg font-bold text-fg-heading">댓글 {post.commentCount.toLocaleString()}개</h2>

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
  );
}
