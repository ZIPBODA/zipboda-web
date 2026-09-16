import { describe, it, expect } from "vitest";
import { mergeTextTokens } from "./mergeTokens";
import { mapRoomLabel } from "./labelMap";
import type { OcrTextToken } from "../model/types";

// 실측 OCR 출력을 본떴다: 글자 높이 12, 폭 10이 가로로 붙어 나온다
const chars = (text: string, startX: number, y: number): OcrTextToken[] =>
  [...text].map((ch, i) => ({ text: ch, center: { x: startX + i * 11, y }, width: 10, height: 12 }));

describe("mergeTextTokens", () => {
  it("글자 단위로 쪼개진 방 이름을 단어로 되돌린다", () => {
    const merged = mergeTextTokens(chars("주방/식당", 100, 50));
    expect(merged).toHaveLength(1);
    expect(merged[0].text).toBe("주방/식당");
  });

  it("떨어진 단어는 합치지 않는다", () => {
    const merged = mergeTextTokens([...chars("욕실", 100, 50), ...chars("현관", 400, 50)]);
    expect(merged.map((t) => t.text)).toEqual(["욕실", "현관"]);
  });

  it("줄이 다르면 합치지 않는다", () => {
    const merged = mergeTextTokens([...chars("주방", 100, 50), ...chars("거실", 100, 200)]);
    expect(merged.map((t) => t.text)).toEqual(["주방", "거실"]);
  });

  it("합친 토큰의 중심과 폭이 전체를 감싼다", () => {
    const [merged] = mergeTextTokens(chars("반침", 100, 50));
    expect(merged.center.x).toBeCloseTo(105.5, 0);
    expect(merged.width).toBeGreaterThan(10);
  });

  it("빈 입력은 빈 배열", () => {
    expect(mergeTextTokens([])).toEqual([]);
  });
});

describe("글자 묶기 후 라벨 매핑", () => {
  it("쪼개진 채로는 '방' 한 글자가 침실로 오탐되지 않는다", () => {
    expect(mapRoomLabel("방").label).toBe("기타");
  });

  it("묶은 뒤에는 주방/식당이 주방으로 잡힌다", () => {
    const [merged] = mergeTextTokens(chars("주방/식당", 100, 50));
    expect(mapRoomLabel(merged.text).label).toBe("주방");
  });

  it("묶은 뒤에는 거실/침실이 거실로 잡힌다", () => {
    const [merged] = mergeTextTokens(chars("거실/침실", 100, 50));
    expect(mapRoomLabel(merged.text).label).toBe("거실");
  });

  it("묶은 뒤에는 발코니1이 발코니로 잡힌다", () => {
    const [merged] = mergeTextTokens(chars("발코니1", 100, 50));
    expect(mapRoomLabel(merged.text).label).toBe("발코니");
  });
});
