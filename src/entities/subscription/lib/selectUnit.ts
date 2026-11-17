import type { SubscriptionDetail, SubscriptionUnit } from "../model/types";

/** 주소의 ?unit= 열쇠로 고른 호. 비어 있으면 기본 호(첫 도면·첫 주택형), 고를 호가 없는 공고는 null이다 */
export function selectSubscriptionUnit(detail: SubscriptionDetail, requested?: string): SubscriptionUnit | null {
  if (requested) return detail.units.find((unit) => unit.unitKey === requested) ?? null;
  return detail.units.find((unit) => unit.unitKey === detail.defaultUnitKey) ?? detail.units[0] ?? null;
}
