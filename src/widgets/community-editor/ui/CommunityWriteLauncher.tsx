"use client";

import { useState } from "react";
import Link from "next/link";
import { FormModal } from "@/shared/ui";
import { CommunityPostForm } from "./CommunityPostForm";

const BTN = "shrink-0 rounded-lg bg-brand px-3.5 py-2 text-xs font-bold text-brand-on md:rounded-xl md:px-5 md:py-2.5 md:text-sm";

// 글쓰기 진입 — PC(≥md)는 로컬 모달, 모바일은 /community/write 전체화면 페이지
export function CommunityWriteLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`hidden md:inline-flex ${BTN}`}>
        + 글쓰기
      </button>
      <Link href="/community/write" className={`md:hidden ${BTN}`}>
        + 글쓰기
      </Link>
      <FormModal open={open} title="새 글 작성" onClose={() => setOpen(false)}>
        <CommunityPostForm mode="create" onDone={() => setOpen(false)} />
      </FormModal>
    </>
  );
}
