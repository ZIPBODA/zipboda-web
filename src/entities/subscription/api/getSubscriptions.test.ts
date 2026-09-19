import { describe, it, expect } from "vitest";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { getSubscriptions } from "./getSubscriptions";
import { getSubscriptionFilterOptions } from "./getSubscriptionFilterOptions";

describe("getSubscriptions 필터", () => {
  // 건수를 숫자로 박아 두면 주택이 늘 때마다 테스트가 깨진다. 데이터에서 기대값을 끌어온다
  it("조건이 없으면 전부 돌려준다", async () => {
    expect((await getSubscriptions()).length).toBe(HOUSING_SOURCE_DATA.length);
  });

  it("면적 구간이 실제로 목록을 줄인다", async () => {
    const small = await getSubscriptions({ size: "0-15" });
    const large = await getSubscriptions({ size: "30-" });

    expect(small.map((s) => s.id).sort()).toEqual(["dobong-banghak", "gangseo-hwagok", "gwanak-sillim", "jungnang-myeonmok"]);
    expect(large.map((s) => s.id).sort()).toEqual(["gangnam-gaepo", "seongdong-yongdap"]);
  });

  it("어떤 구간도 빈 목록을 내지 않는다", async () => {
    const { sizeRanges } = await getSubscriptionFilterOptions();
    for (const range of sizeRanges) {
      expect((await getSubscriptions({ size: range.value })).length).toBeGreaterThan(0);
    }
  });

  it("지역과 기관으로도 거른다", async () => {
    expect((await getSubscriptions({ region: "서울" })).length).toBe(HOUSING_SOURCE_DATA.length);
    expect((await getSubscriptions({ region: "부산" })).length).toBe(0);
    expect((await getSubscriptions({ agency: "LH" })).length).toBe(HOUSING_SOURCE_DATA.length);
  });

  it("조건을 겹쳐 걸 수 있다", async () => {
    const list = await getSubscriptions({ region: "서울", agency: "LH", size: "20-25" });
    expect(list.map((s) => s.id)).toEqual(["songpa-ogeum"]);
  });

  it("마감 임박 순은 남은 날이 적은 공고부터, 마감한 공고는 뒤로 보낸다", async () => {
    const ddays = (await getSubscriptions({ sort: "DEADLINE" })).map((s) => s.dday);
    const open = ddays.filter((d): d is number => d !== null);

    expect(open).toEqual([...open].sort((a, b) => a - b));
    expect(ddays.slice(open.length).every((d) => d === null)).toBe(true);
  });
});

describe("getSubscriptionFilterOptions", () => {
  it("칩은 언제나 전체로 시작한다", async () => {
    const { regions, agencies, sizeRanges } = await getSubscriptionFilterOptions();

    expect(regions[0]).toBe("전체");
    expect(agencies[0]).toBe("전체");
    expect(sizeRanges[0]).toEqual({ value: "전체", label: "전체" });
  });

  it("데이터에 없는 지역·기관 칩은 만들지 않는다", async () => {
    const { regions, agencies } = await getSubscriptionFilterOptions();

    expect(regions).toEqual(["전체", "서울"]);
    expect(agencies).toEqual(["전체", "LH"]);
  });

  it("칩마다 결과가 있는지 스스로 확인한다", async () => {
    const { regions, agencies } = await getSubscriptionFilterOptions();

    for (const region of regions) expect((await getSubscriptions({ region })).length).toBeGreaterThan(0);
    for (const agency of agencies) expect((await getSubscriptions({ agency })).length).toBeGreaterThan(0);
  });
});
