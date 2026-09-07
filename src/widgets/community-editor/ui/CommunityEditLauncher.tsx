"use client";

import { useState } from "react";
import Link from "next/link";
import { FormModal } from "@/shared/ui";
import { CommunityPostForm } from "./CommunityPostForm";

interface Props {
  postId: string;
  initial: { category?: string; title?: string; body?: string; imageCount?: number };
}

// 글 수정 진입 — PC(≥md)는 로컬 모달, 모바일은 /community/[id]/edit 전체화면 페이지
export function CommunityEditLauncher({ postId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const cls = "text-sm font-medium text-fg-muted transition-colors hover:text-fg-body";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`hidden md:inline ${cls}`}>
        수정
      </button>
      <Link href={`/community/${postId}/edit`} className={`md:hidden ${cls}`}>
        수정
      </Link>
      <FormModal open={open} title="글 수정" onClose={() => setOpen(false)}>
        <CommunityPostForm mode="edit" initial={initial} onDone={() => setOpen(false)} />
      </FormModal>
    </>
  );
}
