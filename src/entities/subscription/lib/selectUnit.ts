import type { SubscriptionDetail, SubscriptionUnit } from "../model/types";

export function selectSubscriptionUnit(detail: SubscriptionDetail, requested?: string): SubscriptionUnit | null {
  if (requested !== undefined) {
    const exact = detail.units.find((unit) => unit.unitKey === requested);
    if (exact) return exact;
    const legacy = detail.units.filter((unit) => unit.size !== null && unit.size === Number(requested));
    return legacy.length === 1 ? legacy[0] : null;
  }
  return detail.units.find((unit) => unit.unitKey === detail.defaultUnitKey) ?? detail.units[0] ?? null;
}
