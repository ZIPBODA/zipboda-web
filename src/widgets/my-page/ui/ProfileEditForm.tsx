"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { INTEREST_OPTIONS } from "../config/constants";
import type { ProfileEditData } from "../model/types";
import { PENDING_CLASS, PENDING_TITLE } from "@/shared/config/pending";

const INPUT_CLASS = "w-full rounded-xl border border-line px-4 py-3 text-sm text-fg-heading outline-none transition-colors focus:border-brand";

// figma 208:205(PC) / 419:9384(Mobile) 프로필 수정 폼.
// onDone 지정 시 모달 컨텍스트(PC): 카드/브레드크럼 없이 본문만, 취소·저장은 onDone. 미지정 시 라우트 페이지(모바일 전체화면).
export function ProfileEditForm({ data, onDone }: { data: ProfileEditData; onDone?: () => void }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(data.nickname);
  const [phone, setPhone] = useState(data.phone);
  const [bio, setBio] = useState(data.bio);
  const [interests, setInterests] = useState<string[]>(data.interests);
  const isModal = !!onDone;

  const toggleInterest = (value: string) =>
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const finish = () => (onDone ? onDone() : router.push("/my"));
  const save = (ev: React.FormEvent) => {
    ev.preventDefault();
    // TODO(API): 프로필 저장(닉네임·전화·자기소개·관심분야) 연동
    finish();
  };

  return (
    <form
      onSubmit={save}
      className={isModal ? "flex flex-col p-6" : "mx-auto flex max-w-3xl flex-col bg-surface p-4 md:rounded-3xl md:p-10 md:shadow-sm"}
    >
      {!isModal && (
        <>
          <nav aria-label="위치" className="hidden items-center gap-1 text-[13px] md:flex">
            <span className="text-fg-muted">마이페이지</span>
            <span className="text-fg-disabled">&gt;</span>
            <span className="font-semibold text-fg-heading">프로필 수정</span>
          </nav>
          <h1 className="text-h2 font-bold text-fg-heading md:mt-3 md:text-h1">프로필 수정</h1>
        </>
      )}

      <div className="mt-6 flex flex-col items-center gap-3 md:mt-7">
        <div className="relative">
          <div className="relative size-24 overflow-hidden rounded-2xl bg-surface-tertiary md:size-[120px]">
            {data.avatar && <Image src={data.avatar} alt="" fill sizes="120px" className="object-cover" />}
          </div>
          <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-surface text-sm shadow-md" aria-hidden>
            📷
          </span>
        </div>
        <button type="button" disabled title={PENDING_TITLE} className={`text-sm font-semibold text-blue-600 ${PENDING_CLASS}`}>
          프로필 사진 변경
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-5 md:mt-7">
        <Field label="닉네임">
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="이메일 주소">
          <input value={data.email} readOnly aria-readonly className={`${INPUT_CLASS} bg-surface-tertiary text-fg-disabled`} />
        </Field>
        <Field label="전화번호">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="자기소개">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${INPUT_CLASS} resize-none`} />
        </Field>
        <Field label="관심 분야">
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((option) => {
              const on = interests.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleInterest(option)}
                  aria-pressed={on}
                  className={`rounded-full px-4 py-1.5 text-sm ${on ? "bg-brand font-bold text-brand-on" : "bg-surface-tertiary font-medium text-fg-muted"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between pt-2 md:mt-4 md:pt-4">
        <button type="button" onClick={finish} className="rounded-xl border border-fg-disabled px-6 py-3 text-sm font-semibold text-fg-body">
          취소
        </button>
        <button type="submit" className="rounded-xl bg-brand px-8 py-3 text-sm font-bold text-brand-on">
          저장하기
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
