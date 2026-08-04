import type { ScoreFactor, GradeBand } from "../model/types";

// 청약 가점표(공공주택) — 슬라이더 스텝 → 가점. 기본 스텝은 figma 135:2577 스냅샷(16·15·9=40)과 일치.
const housingSteps = Array.from({ length: 16 }, (_, i) => ({
  label: i === 0 ? "1년 미만" : i === 15 ? "15년 이상" : `${i}년`,
  points: Math.min(32, (i + 1) * 2)
}));
const dependentsSteps = Array.from({ length: 7 }, (_, i) => ({
  label: i === 0 ? "0명 (없음)" : i === 6 ? "6명 이상" : `${i}명`,
  points: Math.min(35, 5 + i * 5)
}));
const accountSteps = Array.from({ length: 16 }, (_, i) => ({
  label: i === 0 ? "6개월" : i === 15 ? "15년 이상" : `${i}년`,
  points: i === 15 ? 17 : i + 1
}));

// figma 135:2590·135:2616·135:2642 슬라이더 카드
export const SCORE_FACTORS: ScoreFactor[] = [
  { key: "housing", icon: "🏠", title: "무주택 기간", subtitle: "주택 미소유 기간 — 최대 32점", shortLabel: "무주택", max: 32, defaultStep: 7, steps: housingSteps },
  { key: "dependents", icon: "👨‍👩‍👧‍👦", title: "부양가족 수", subtitle: "세대 내 부양가족 수 — 최대 35점", shortLabel: "부양가족", max: 35, defaultStep: 2, steps: dependentsSteps },
  { key: "account", icon: "🏦", title: "청약통장 가입기간", subtitle: "청약통장 가입 유지 기간 — 최대 17점", shortLabel: "통장기간", max: 17, defaultStep: 8, steps: accountSteps }
];

export const MAX_TOTAL_SCORE = 84;

// figma 135:2709 등급 — '보통'(#F59E0B, 40점)만 Figma 확정. 나머지 밴드는 계산기 기능상 확장(D6, 잠정)
export const GRADE_BANDS: GradeBand[] = [
  { min: 0, label: "낮음", tone: "text-fg-muted", desc: "가점을 더 쌓아 보세요" },
  { min: 30, label: "보통", tone: "text-status-warning", desc: "중간 수준 — 경쟁률에 따라 다름" },
  { min: 55, label: "높음", tone: "text-status-success", desc: "경쟁력 있는 점수예요" },
  { min: 70, label: "매우 높음", tone: "text-brand-dark", desc: "상위권 가점이에요" }
];

// figma 135:2742 팁(verbatim)
export const SCORE_TIPS = [
  "청약통장 가입 기간을 늘리세요",
  "부양가족을 추가로 등록하세요",
  "무주택 기간 1년마다 2점 추가"
];
