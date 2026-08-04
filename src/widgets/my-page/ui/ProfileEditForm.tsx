"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTEREST_OPTIONS } from "../config/constants";
import type { ProfileEditData } from "../model/types";

const INPUT_CLASS = "w-full rounded-xl border border-line px-4 py-3 text-sm text-fg-heading outline-none transition-colors focus:border-brand";

// figma 208:205 프로필 수정 폼 — 비밀번호·알림 섹션은 Figma에 없어 미구현(D2)
export function ProfileEditForm({ data }: { data: ProfileEditData }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(data.nickname);
  const [phone, setPhone] = useState(data.phone);
  const [bio, setBio] = useState(data.bio);
  const [interests, setInterests] = useState<string[]>(data.interests);

  const toggleInterest = (value: string) =>
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const save = (ev: React.FormEvent) => {
    ev.preventDefault();
    // TODO(API): 프로필 저장(닉네임·전화·자기소개·관심분야) 연동
    router.push("/my");
  };

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl rounded-3xl bg-surface p-10 shadow-sm">
      <nav aria-label="위치" className="flex items-center gap-1 text-[13px]">
        <span className="text-fg-muted">마이페이지</span>
        <span className="text-fg-disabled">&gt;</span>
        <span className="font-semibold text-fg-heading">프로필 수정</span>
      </nav>
      <h1 className="mt-3 text-h1 font-bold text-fg-heading">프로필 수정</h1>

      <div className="mt-7 flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-[120px] w-[120px] rounded-2xl bg-surface-tertiary" />
          <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm shadow-md" aria-hidden>
            📷
          </span>
        </div>
        <button type="button" className="text-sm font-semibold text-blue-600">
          프로필 사진 변경
        </button>
      </div>

      <div className="mt-7 flex flex-col gap-5">
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

      <div className="mt-4 flex items-center justify-between pt-4">
        <button type="button" onClick={() => router.push("/my")} className="rounded-xl border border-fg-disabled px-6 py-3 text-sm font-semibold text-fg-body">
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
