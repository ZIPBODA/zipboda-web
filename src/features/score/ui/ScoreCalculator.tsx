"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DDAY_URGENT_THRESHOLD, type Subscription } from "@/entities/subscription";
import { SCORE_FACTORS, MAX_TOTAL_SCORE, SCORE_TIPS } from "../config/constants";
import { gradeFor } from "../lib/score";
import type { GradeBand } from "../model/types";
import { SliderCard } from "./SliderCard";
import { ScoreGauge } from "./ScoreGauge";

// figma 135:2577(PC)·419:9457(모바일) 청약가점 계산기 — 모바일은 결과 카드가 상단(게이지+등급+점수)
export function ScoreCalculator({ eligible }: { eligible: Subscription[] }) {
  const [steps, setSteps] = useState<number[]>(SCORE_FACTORS.map((f) => f.defaultStep));

  const points = SCORE_FACTORS.map((f, i) => f.steps[steps[i]].points);
  const total = points.reduce((a, b) => a + b, 0);
  const grade = gradeFor(total);
  const setStep = (index: number, value: number) => setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));

  const sliderCards = SCORE_FACTORS.map((factor, i) => (
    <SliderCard key={factor.key} factor={factor} stepIndex={steps[i]} onChange={(v) => setStep(i, v)} />
  ));

  return (
    <>
      {/* 모바일(≤767) — figma 419:9457: 결과 카드 → 슬라이더 → 팁 → 저장/공유 */}
      <div className="flex flex-col gap-3 md:hidden">
        <MobileResultCard total={total} points={points} grade={grade} />
        {sliderCards}
        <TipsCard />
        <ScoreActions total={total} grade={grade} />
        <EligibleListings items={eligible} />
      </div>

      {/* PC(≥768) — 기존 2단 레이아웃 유지 */}
      <div className="hidden md:flex md:flex-col md:gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          {sliderCards}
          <EligibleListings items={eligible} />
        </div>
        <div className="flex flex-col gap-4 lg:w-[340px]">
          <ScoreCard total={total} points={points} grade={grade} />
          <TipsCard />
        </div>
      </div>
    </>
  );
}

// figma 419:9458 모바일 결과 카드 — 반원 게이지(좌) + 등급·점수 분해(우) 가로 배치
function MobileResultCard({ total, points, grade }: { total: number; points: number[]; grade: GradeBand }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line-subtle bg-surface p-4">
      <div className="mx-auto shrink-0">
        <ScoreGauge total={total} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-center">
          <p className={`text-lg font-bold ${grade.tone}`}>{grade.label}</p>
          <p className="mt-0.5 whitespace-pre-line text-xs text-fg-disabled">{grade.desc}</p>
        </div>
        <FactorBreakdown points={points} />
      </div>
    </div>
  );
}

function ScoreCard({ total, points, grade }: { total: number; points: number[]; grade: GradeBand }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-line-subtle bg-surface p-7 shadow-sm">
      <p className="pb-3 text-xs font-bold text-fg-disabled">내 점수</p>
      <ScoreGauge total={total} />

      <p className={`text-lg font-bold ${grade.tone}`}>{grade.label}</p>
      <p className="mt-1 text-center text-xs text-fg-disabled">{grade.desc}</p>

      <div className="mt-6 w-full border-t border-line-subtle pt-6">
        <FactorBreakdown points={points} />
      </div>

      <div className="mt-6 w-full">
        <ScoreActions total={total} grade={grade} />
      </div>
    </div>
  );
}

// figma 135:2660·419:9470 요인별 점수 분해(3열)
function FactorBreakdown({ points }: { points: number[] }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {SCORE_FACTORS.map((factor, i) => (
        <div key={factor.key} className="flex flex-col items-center rounded-xl bg-surface-secondary p-2">
          <span className="text-caption text-fg-disabled">{factor.shortLabel}</span>
          <span className="text-base font-bold text-fg-heading">{points[i]}</span>
          <span className="text-[9px] text-line-strong">/{factor.max}</span>
        </div>
      ))}
    </div>
  );
}

// figma 419:9560 저장/공유 액션
function ScoreActions({ total, grade }: { total: number; grade: GradeBand }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const summary = `내 청약가점 ${total}점 / ${MAX_TOTAL_SCORE}점 (${grade.label}) — 집보다`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* TODO(SCORE): 로그인 사용자 가점 기록 저장 API 연동 — 현재는 로그인 유도 */}
      <button type="button" onClick={() => router.push("/login")} className="h-12 rounded-xl bg-brand text-sm font-bold text-brand-on">
        내 점수 저장
      </button>
      <button type="button" onClick={share} className="h-[46px] rounded-xl border border-line text-sm font-medium text-fg-body">
        {copied ? "복사됨!" : "결과 공유"}
      </button>
    </div>
  );
}

function TipsCard() {
  return (
    <div className="rounded-xl border border-brand/30 bg-amber-50 p-5">
      <h3 className="text-sm font-bold text-fg-heading">💡 가점 올리는 팁</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {SCORE_TIPS.map((tip) => (
          <li key={tip} className="flex gap-2 text-xs text-fg-body">
            <span aria-hidden className="text-brand">
              →
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EligibleListings({ items }: { items: Subscription[] }) {
  return (
    <div className="rounded-xl border border-line-subtle bg-surface p-6">
      <h3 className="text-base font-bold text-fg-heading">내 점수로 신청 가능한 공고</h3>
      <p className="mt-1 text-xs text-fg-disabled">내 가점 기준 · 예상 경쟁률</p>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-4 rounded-lg bg-surface-secondary p-4">
            <div className="h-14 w-14 shrink-0 rounded-lg bg-surface-tertiary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg-heading">{s.title}</p>
              <p className="mt-0.5 text-xs text-fg-disabled">{s.location}</p>
              <p className="mt-1 text-xs text-fg-muted">경쟁률: {s.competition}</p>
            </div>
            <span
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold ${
                s.dday <= DDAY_URGENT_THRESHOLD ? "bg-brand text-brand-on" : "bg-surface-tertiary text-fg-disabled"
              }`}
            >
              D-{s.dday}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
