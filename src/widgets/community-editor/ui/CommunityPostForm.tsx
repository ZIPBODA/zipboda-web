"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMUNITY_CATEGORIES } from "@/entities/community";

interface Props {
  mode: "create" | "edit";
  initial?: { category?: string; title?: string; body?: string; imageCount?: number };
}

// figma 199:60(글쓰기) / 208:30(글 수정) 공유 폼 — 수정은 프리필 + 삭제 버튼
export function CommunityPostForm({ mode, initial }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.category ?? "전체");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const isEdit = mode === "edit";
  const imageCount = initial?.imageCount ?? 0;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    // TODO(COMMUNITY): 글 등록/수정 API 연동
    router.push("/community");
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl rounded-3xl bg-surface p-10 shadow-sm">
      <nav aria-label="위치" className="flex items-center gap-1.5 text-[13px]">
        <span className="text-fg-muted">커뮤니티</span>
        <span className="text-fg-disabled">/</span>
        <span className="font-semibold text-fg-heading">{isEdit ? "글 수정" : "새 글 작성"}</span>
      </nav>
      <h1 className="mt-3 text-h1 font-bold text-fg-heading">{isEdit ? "글 수정" : "새 글 작성"}</h1>

      <div className="mt-6 flex flex-col gap-6">
        <Field label="카테고리 선택">
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_CATEGORIES.map((c) => {
              const on = category === c;
              return (
                <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={on} className={`rounded-full px-4 py-1.5 text-sm ${on ? "bg-brand font-bold text-brand-on" : "bg-surface-tertiary font-medium text-fg-muted"}`}>
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="제목">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full rounded-xl border border-line px-4 py-3 text-sm text-fg-heading outline-none focus:border-brand" />
        </Field>

        <Field label="내용">
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="flex items-center gap-4 border-b border-line bg-surface-secondary px-4 py-2.5 text-sm text-fg-body" aria-hidden>
              <span className="font-bold">B</span>
              <span className="italic">I</span>
              <span className="underline">U</span>
              <span className="h-4 w-px bg-line-strong" />
              <span>🖼️</span>
              <span>🔗</span>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="내용을 입력하세요..." className="w-full resize-none p-5 text-sm leading-relaxed text-fg-heading outline-none placeholder:text-fg-disabled" />
          </div>
        </Field>

        <Field label={`이미지 첨부 ${isEdit ? `(${imageCount}/10)` : "(최대 10장)"}`}>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="flex h-[90px] w-[120px] flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line-strong bg-surface-secondary text-[11px] font-semibold text-fg-muted">
              <span aria-hidden className="text-lg">＋</span>
              이미지 추가
            </button>
            {Array.from({ length: imageCount }).map((_, i) => (
              <div key={i} className="h-[90px] w-[120px] rounded-lg bg-surface-tertiary" aria-hidden />
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-8 flex items-center justify-between pt-4">
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push("/community")} className="rounded-xl border border-fg-disabled px-6 py-3 text-sm font-semibold text-fg-body">
            취소
          </button>
          {isEdit && (
            // TODO(COMMUNITY): 글 삭제 API 연동
            <button type="button" onClick={() => router.push("/community")} className="rounded-xl border border-status-error px-6 py-3 text-sm font-semibold text-status-error">
              삭제하기
            </button>
          )}
        </div>
        <button type="submit" className="rounded-xl bg-brand px-8 py-3 text-sm font-bold text-brand-on">
          {isEdit ? "수정완료" : "등록하기"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}
