import { formatAreaValue } from "@/entities/subscription";

/** 평형이 여럿이면 가장 작은 것부터 큰 것까지 한 줄로 줄인다 */
export function formatAreaRange(sizes: readonly number[]): string | null {
  if (sizes.length === 0) return null;
  const first = formatAreaValue(sizes[0]);
  const last = formatAreaValue(sizes[sizes.length - 1]);
  return first === last ? `전용 ${first}㎡` : `전용 ${first}~${last}㎡`;
}
