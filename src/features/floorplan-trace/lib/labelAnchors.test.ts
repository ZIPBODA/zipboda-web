import { describe, it, expect } from "vitest";
import type { DerivedRoom, LabelAnchor } from "../model/types";
import { resolveRoomLabels, roomAt } from "./labelAnchors";

const room = (key: string, x: number, w: number): DerivedRoom => ({
  key,
  polygon: [
    { x, z: 0 },
    { x: x + w, z: 0 },
    { x: x + w, z: 3000 },
    { x, z: 3000 }
  ],
  areaM2: (w * 3000) / 1_000_000,
  labelAt: { x: x + w / 2, z: 1500 }
});
const rooms = [room("room-0", 0, 2000), room("room-1", 2000, 2500)];

describe("resolveRoomLabels", () => {
  it("앵커가 든 방에 이름을 붙이고 없는 방은 기타", () => {
    const anchors: LabelAnchor[] = [{ id: "l1", at: { x: 1000, z: 1000 }, label: "욕실" }];
    const labeled = resolveRoomLabels(rooms, anchors);
    expect(labeled[0]).toMatchObject({ label: "욕실", anchorId: "l1" });
    expect(labeled[1]).toMatchObject({ label: "기타", anchorId: null });
  });

  it("한 방에 앵커가 둘이면 나중 것이 이긴다", () => {
    const anchors: LabelAnchor[] = [
      { id: "l1", at: { x: 500, z: 500 }, label: "욕실" },
      { id: "l2", at: { x: 1500, z: 2500 }, label: "현관" }
    ];
    expect(resolveRoomLabels(rooms, anchors)[0].label).toBe("현관");
  });

  it("어느 방에도 안 드는 앵커는 무시한다", () => {
    const anchors: LabelAnchor[] = [{ id: "l1", at: { x: 9000, z: 9000 }, label: "거실" }];
    expect(resolveRoomLabels(rooms, anchors).every((r) => r.label === "기타")).toBe(true);
  });
});

describe("roomAt", () => {
  it("점이 든 방을 돌려주고 밖이면 null", () => {
    expect(roomAt(rooms, { x: 3000, z: 100 })?.key).toBe("room-1");
    expect(roomAt(rooms, { x: -100, z: 100 })).toBeNull();
  });
});
