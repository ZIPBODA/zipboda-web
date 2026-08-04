import type { ScoreFactor } from "../model/types";

// figma 135:2590 슬라이더 트랙 2톤(brand 채움 / surface-tertiary 트랙) — 채움%가 동적이라 인라인 그라디언트
const FILL = "#FFBA17";
const TRACK = "#F3F4F6";

const THUMB =
  "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-brand";

interface Props {
  factor: ScoreFactor;
  stepIndex: number;
  onChange: (stepIndex: number) => void;
}

export function SliderCard({ factor, stepIndex, onChange }: Props) {
  const lastIndex = factor.steps.length - 1;
  const step = factor.steps[stepIndex];
  const pct = (stepIndex / lastIndex) * 100;

  return (
    <div className="rounded-xl border border-line-subtle bg-surface p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl" aria-hidden>
          {factor.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-fg-heading">{factor.title}</h3>
          <p className="mt-0.5 text-xs text-fg-disabled">{factor.subtitle}</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="text-h1 font-bold text-fg-heading">{step.points}</span>
          <span className="ml-1 text-xs text-fg-disabled">점 / {factor.max}</span>
        </p>
      </div>

      <input
        type="range"
        min={0}
        max={lastIndex}
        value={stepIndex}
        onChange={(ev) => onChange(Number(ev.target.value))}
        aria-label={`${factor.title}: ${step.label}`}
        style={{ background: `linear-gradient(90deg, ${FILL} ${pct}%, ${TRACK} ${pct}%)` }}
        className={`mt-5 h-2 w-full cursor-pointer appearance-none rounded-full outline-none ${THUMB}`}
      />

      <div className="mt-3 flex justify-between text-xs">
        <span className="text-fg-disabled">{factor.steps[0].label}</span>
        <span className="font-semibold text-gray-700">{step.label}</span>
        <span className="text-fg-disabled">{factor.steps[lastIndex].label}</span>
      </div>
    </div>
  );
}
