import { afterEach, describe, expect, it, vi } from "vitest";
import { readSubscriptionsReturn, rememberSubscriptionsReturn } from "./returnHref";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("청약 화면 복귀 주소", () => {
  it("마지막으로 적어 둔 지도·목록 주소를 돌려준다", () => {
    rememberSubscriptionsReturn("/subscriptions?region=서울&lat=37.5&lng=127&zoom=5");
    expect(readSubscriptionsReturn()).toBe("/subscriptions?region=서울&lat=37.5&lng=127&zoom=5");
  });

  it("적어 둔 것이 없거나 청약 화면 주소가 아니면 첫 화면으로 간다", () => {
    expect(readSubscriptionsReturn()).toBe("/subscriptions");
    sessionStorage.setItem("zipboda:subscriptions-return", "https://example.com/phishing");
    expect(readSubscriptionsReturn()).toBe("/subscriptions");
  });

  it("저장소를 쓸 수 없는 브라우저에서도 멈추지 않고 첫 화면으로 간다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => rememberSubscriptionsReturn("/subscriptions?view=list")).not.toThrow();
    expect(readSubscriptionsReturn()).toBe("/subscriptions");
  });
});
