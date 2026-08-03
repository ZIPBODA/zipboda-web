"use client";

import { useState } from "react";
import { SIGNUP_TERMS } from "../config/constants";

/**
 * figma 135:9243 약관 동의.
 * 체크박스가 디자인시스템(24px)에 없는 20/18px이라 화면 전용으로 구현한다(디자인시스템 등록 대상).
 */
export function TermsAgreement() {
  const [agreed, setAgreed] = useState<string[]>([]);
  const allAgreed = agreed.length === SIGNUP_TERMS.length;

  const toggleAll = () => setAgreed(allAgreed ? [] : SIGNUP_TERMS.map((term) => term.id));
  const toggle = (id: string) =>
    setAgreed((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center gap-2 border-b border-line pb-3">
        <input type="checkbox" checked={allAgreed} onChange={toggleAll} className="sr-only" />
        <span
          aria-hidden
          className={`flex size-5 shrink-0 items-center justify-center rounded-sm text-xs ${
            allAgreed ? "bg-brand text-fg-strong" : "border-[1.5px] border-line-strong bg-surface"
          }`}
        >
          {allAgreed ? "✓" : ""}
        </span>
        <span className="text-sm font-bold text-fg-heading">전체 동의 (선택 정보 포함)</span>
      </label>

      {SIGNUP_TERMS.map((term) => {
        const checked = agreed.includes(term.id);
        return (
          <label key={term.id} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name={term.id}
              checked={checked}
              onChange={() => toggle(term.id)}
              required={term.required}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`flex size-[18px] shrink-0 items-center justify-center rounded-sm text-[11px] ${
                checked ? "bg-brand text-fg-strong" : "border-[1.5px] border-line-strong bg-surface"
              }`}
            >
              {checked ? "✓" : ""}
            </span>
            <span className="text-compact text-fg-body">{term.label}</span>
          </label>
        );
      })}
    </div>
  );
}
