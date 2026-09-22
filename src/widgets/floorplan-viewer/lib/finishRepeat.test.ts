import { describe, expect, it } from "vitest";
import { FINISH_ATLAS_REGIONS, FINISH_ATLAS_SIZE, ROOM_FINISH } from "../config/finishAtlas";
import { finishRepeat } from "./finishRepeat";

describe("아틀라스 재질 배치", () => {
  it("욕실·현관·발코니를 일반 마루와 구분한다", () => {
    expect(ROOM_FINISH.거실).toBe("flooring");
    expect(ROOM_FINISH.침실).toBe("flooring");
    expect(ROOM_FINISH.욕실).toBe("bathroomTile");
    expect(ROOM_FINISH.현관).toBe("tile");
    expect(ROOM_FINISH.발코니).toBe("concrete");
  });
  it("직사각형 원본 비율을 보존하며 미터 단위 반복을 계산한다", () => {
    expect(finishRepeat("wallpaper", 4, 2.4)).toEqual({ x: 4, y: 2.4 });
    expect(finishRepeat("flooring").y / finishRepeat("flooring").x).toBeCloseTo(512 / 500);
    expect(finishRepeat("tile", 2.4, 2.4)).toEqual({ x: 1, y: 1 });
    expect(finishRepeat("bathroomTile", 4.8, 2.4)).toEqual({ x: 1, y: 1 });
  });
  it("재질 영역은 원본 경계 안에 있고 빈 우측 하단을 참조하지 않는다", () => {
    for (const region of Object.values(FINISH_ATLAS_REGIONS)) {
      expect(region.x + region.width).toBeLessThanOrEqual(FINISH_ATLAS_SIZE);
      expect(region.y + region.height).toBeLessThanOrEqual(FINISH_ATLAS_SIZE);
      expect(region.x < 768 || region.y + region.height <= 768).toBe(true);
    }
  });
});
