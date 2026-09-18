import { describe, it, expect } from "vitest";
import { SCENE2D_ZOOM } from "../config/constants";
import { zoomAtPoint } from "./zoomAtPoint";

const fit = { scale: SCENE2D_ZOOM.fit, offset: { x: 0, y: 0 } };

describe("zoomAtPoint", () => {
  it("포인터 아래 지점은 확대해도 제자리에 남는다", () => {
    const pointer = { x: 120, y: -80 };
    const next = zoomAtPoint(fit, pointer, 2);

    // 화면 좌표 = 원본 좌표 × scale + offset. 확대 전후로 포인터가 가리키는 원본 좌표가 같아야 한다
    const before = (pointer.x - fit.offset.x) / fit.scale;
    const after = (pointer.x - next.offset.x) / next.scale;
    expect(after).toBeCloseTo(before);
  });

  it("중심에서 확대하면 이동량이 생기지 않는다", () => {
    expect(zoomAtPoint(fit, { x: 0, y: 0 }, 1.3).offset).toEqual({ x: 0, y: 0 });
  });

  it("최대 배율을 넘지 않는다", () => {
    const next = zoomAtPoint({ scale: SCENE2D_ZOOM.max, offset: { x: 0, y: 0 } }, { x: 50, y: 50 }, 2);
    expect(next.scale).toBe(SCENE2D_ZOOM.max);
  });

  it("맞춤 배율 아래로는 줄어들지 않고 상태를 그대로 돌려준다", () => {
    const next = zoomAtPoint(fit, { x: 50, y: 50 }, 0.5);
    expect(next).toBe(fit);
  });

  it("확대 후 축소하면 원래 배율로 돌아온다", () => {
    const pointer = { x: 30, y: 40 };
    const zoomed = zoomAtPoint(fit, pointer, SCENE2D_ZOOM.factor);
    const back = zoomAtPoint(zoomed, pointer, 1 / SCENE2D_ZOOM.factor);
    expect(back.scale).toBeCloseTo(fit.scale);
    expect(back.offset.x).toBeCloseTo(0);
    expect(back.offset.y).toBeCloseTo(0);
  });
});
