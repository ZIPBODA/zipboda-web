import { describe, expect, it } from "vitest";
import type { SubscriptionDetail } from "../model/types";
import { selectSubscriptionUnit } from "./selectUnit";

const detail = (units: SubscriptionDetail["units"], defaultUnitKey?: string): SubscriptionDetail => ({
  id: "cell", agency: "LH", agencyLabel: "LH", status: "접수중", title: "단지", address: "서울", dday: null, applyPeriod: null,
  households: null, supplyType: null, competition: null, contractDate: null, moveIn: null, postDate: null, image: null, applyUrl: null,
  units, defaultUnitKey, defaultUnitSize: null
});
const plans = [
  { unitKey: "p-01", layoutKey: "p-01", size: 28.81, type: "" },
  { unitKey: "p-02", layoutKey: "p-02", size: 31.99, type: "" }
];

describe("selectSubscriptionUnit", () => {
  it("주소의 열쇠로 호를 고르고, 없는 열쇠는 null이다", () => {
    expect(selectSubscriptionUnit(detail(plans), "p-02")?.unitKey).toBe("p-02");
    expect(selectSubscriptionUnit(detail(plans), "p-99")).toBeNull();
    // 예전 숫자 링크(?unit=28)는 열쇠가 아니다
    expect(selectSubscriptionUnit(detail(plans), "28")).toBeNull();
  });

  it("열쇠가 없거나 비어 있으면 기본 호, 기본이 없으면 첫 호다", () => {
    expect(selectSubscriptionUnit(detail(plans, "p-02"))?.unitKey).toBe("p-02");
    expect(selectSubscriptionUnit(detail(plans, "p-02"), "")?.unitKey).toBe("p-02");
    expect(selectSubscriptionUnit(detail(plans))?.unitKey).toBe("p-01");
  });

  // API에는 주택형·도면이 모두 없는 공고가 있다(상세 표본 100건 중 19건)
  it("고를 호가 없는 공고는 null이다", () => {
    expect(selectSubscriptionUnit(detail([]))).toBeNull();
    expect(selectSubscriptionUnit(detail([]), "")).toBeNull();
  });
});
