import { describe, it, expect, beforeEach } from "vitest";
import { IS_MAP_ENABLED } from "../config/map";
import { loadKakaoMaps, resetKakaoMapsLoaderForTest } from "./kakaoMapLoader";

// 테스트 환경에는 앱키가 없다. 그 상태가 곧 CI·키 없는 로컬의 동작이라 그대로 검증한다
describe("loadKakaoMaps — 앱키 없음", () => {
  beforeEach(() => {
    resetKakaoMapsLoaderForTest();
  });

  it("테스트 환경은 지도를 끈 상태로 시작한다", () => {
    expect(IS_MAP_ENABLED).toBe(false);
  });

  it("스크립트를 문서에 붙이지 않는다", async () => {
    await loadKakaoMaps();
    expect(document.querySelector('script[src*="dapi.kakao.com"]')).toBeNull();
  });

  it("예외 대신 disabled를 돌려준다", async () => {
    const result = await loadKakaoMaps();
    expect(result.status).toBe("disabled");
    expect(result.maps).toBeNull();
  });

  it("여러 번 불러도 같은 결과를 돌려준다", async () => {
    const results = await Promise.all([loadKakaoMaps(), loadKakaoMaps(), loadKakaoMaps()]);
    expect(results.map((r) => r.status)).toEqual(["disabled", "disabled", "disabled"]);
    expect(document.querySelectorAll("script").length).toBe(0);
  });
});
