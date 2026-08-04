import { MAX_TOTAL_SCORE } from "../config/constants";

// figma 135:2702 점수 게이지 — 하단 개방 270° 아크(0 좌하단 → 84 우하단, 상단 경유)
const CX = 90;
const CY = 80;
const RADIUS = 64;
const STROKE = 14;
const START_DEG = 135;
const SWEEP_DEG = 270;

const polar = (deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + RADIUS * Math.cos(rad), y: CY + RADIUS * Math.sin(rad) };
};
const s = polar(START_DEG);
const e = polar(START_DEG + SWEEP_DEG);
const ARC = `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 1 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;

export function ScoreGauge({ total }: { total: number }) {
  const ratio = Math.max(0, Math.min(1, total / MAX_TOTAL_SCORE));
  return (
    <svg viewBox="0 0 180 160" className="h-40 w-[180px]" role="img" aria-label={`총 ${total}점 / ${MAX_TOTAL_SCORE}점`}>
      <path d={ARC} className="fill-none stroke-surface-tertiary" strokeWidth={STROKE} strokeLinecap="round" pathLength={100} />
      <path
        d={ARC}
        className="fill-none stroke-brand"
        strokeWidth={STROKE}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${ratio * 100} 100`}
      />
      <text x={CX} y="88" textAnchor="middle" className="fill-fg-strong text-display-sm font-bold">
        {total}
      </text>
      <text x={CX} y="104" textAnchor="middle" className="fill-fg-disabled text-[11px]">
        / {MAX_TOTAL_SCORE}점
      </text>
      <text x="15" y="150" textAnchor="middle" className="fill-gray-300 text-caption">
        0
      </text>
      <text x="165" y="150" textAnchor="middle" className="fill-gray-300 text-caption">
        {MAX_TOTAL_SCORE}
      </text>
    </svg>
  );
}
