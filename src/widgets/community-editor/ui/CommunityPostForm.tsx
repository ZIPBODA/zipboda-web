"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMUNITY_CATEGORIES } from "@/entities/community";
import { PENDING_CLASS, PENDING_TITLE } from "@/shared/config/pending";

interface Props {
  mode: "create" | "edit";
  initial?: { category?: string; title?: string; body?: string; imageCount?: number };
  /** 지정 시 모달 컨텍스트(PC): 카드/브레드크럼 없이 본문만, 완료·취소는 onDone. 미지정 시 라우트 페이지(모바일) */
  onDone?: () => void;
}

// figma PC 199:60(글쓰기)·208:30(글 수정) / Mobile 419:11488·419:11681 공유 폼
export function CommunityPostForm({ mode, initial, onDone }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.category ?? "전체");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const isEdit = mode === "edit";
  const isModal = !!onDone;
  const imageCount = initial?.imageCount ?? 0;

  const finish = () => (onDone ? onDone() : router.push("/community"));
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    // TODO(COMMUNITY): 글 등록/수정 API 연동
    finish();
  };

  return (
    <form
      onSubmit={submit}
      className={isModal ? "flex flex-col p-6" : "mx-auto flex max-w-4xl flex-col bg-surface p-4 md:rounded-3xl md:p-10 md:shadow-sm"}
    >
      {!isModal && (
        <>
          <nav aria-label="위치" className="hidden items-center gap-1.5 text-[13px] md:flex">
            <span className="text-fg-muted">커뮤니티</span>
            <span className="text-fg-disabled">/</span>
            <span className="font-semibold text-fg-heading">{isEdit ? "글 수정" : "새 글 작성"}</span>
          </nav>
          <h1 className="text-h2 font-bold text-fg-heading md:mt-3 md:text-h1">{isEdit ? "글 수정" : "새 글 작성"}</h1>
        </>
      )}

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
            <button type="button" disabled title={PENDING_TITLE} className={`flex h-[90px] w-[120px] flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line-strong bg-surface-secondary text-[11px] font-semibold text-fg-muted ${PENDING_CLASS}`}>
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
          <button type="button" onClick={finish} className="rounded-xl border border-fg-disabled px-6 py-3 text-sm font-semibold text-fg-body">
            취소
          </button>
          {isEdit && (
            // TODO(COMMUNITY): 글 삭제 API 연동
            <button type="button" onClick={finish} className="rounded-xl border border-status-error px-6 py-3 text-sm font-semibold text-status-error">
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
