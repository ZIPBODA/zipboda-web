/** 평형이 여럿이면 가장 작은 것부터 큰 것까지 한 줄로 줄인다 */
export function formatAreaRange(sizes: readonly number[]): string | null {
  if (sizes.length === 0) return null;
  const last = sizes[sizes.length - 1];
  return sizes.length > 1 ? `전용 ${sizes[0]}~${last}㎡` : `전용 ${sizes[0]}㎡`;
}
