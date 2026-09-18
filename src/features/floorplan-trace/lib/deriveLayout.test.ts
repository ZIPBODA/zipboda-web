import { describe, it, expect } from "vitest";
import { polygonAreaM2 } from "@/entities/floorplan";
import type { TraceWall } from "../model/types";
import { deriveLayout } from "./deriveLayout";

const wall = (id: string, ax: number, az: number, bx: number, bz: number): TraceWall => ({ id, a: { x: ax, z: az }, b: { x: bx, z: bz } });
const rect = (x: number, z: number, w: number, d: number) => [
  { x, z },
  { x: x + w, z },
  { x: x + w, z: z + d },
  { x, z: z + d }
];
const sortedPoints = (polygon: { x: number; z: number }[]) => [...polygon].sort((p, q) => p.x - q.x || p.z - q.z);

// 4500×6000 외곽 + x=2000 칸막이 → 왼쪽 2000×6000, 오른쪽 2500×6000
const box = () => [
  wall("top", 0, 0, 4500, 0),
  wall("right", 4500, 0, 4500, 6000),
  wall("bottom", 0, 6000, 4500, 6000),
  wall("left", 0, 0, 0, 6000)
];
const twoRooms = () => [...box(), wall("div", 2000, 0, 2000, 6000)];

describe("deriveLayout", () => {
  it("벽이 없으면 빈 레이아웃", () => {
    const layout = deriveLayout([]);
    expect(layout.rooms).toEqual([]);
    expect(layout.outline).toEqual([]);
  });

  it("두 방 직사각: 폴리곤이 벽 중심선 좌표와 정확히 일치한다", () => {
    const layout = deriveLayout(twoRooms());
    expect(layout.rooms).toHaveLength(2);
    expect(sortedPoints(layout.rooms[0].polygon)).toEqual(sortedPoints(rect(0, 0, 2000, 6000)));
    expect(sortedPoints(layout.rooms[1].polygon)).toEqual(sortedPoints(rect(2000, 0, 2500, 6000)));
    expect(layout.rooms[0].areaM2).toBe(12);
    expect(layout.rooms[1].areaM2).toBe(15);
    expect(layout.rooms.map((room) => room.key)).toEqual(["room-0", "room-1"]);
  });

  it("외벽 네 개만 exterior, 칸막이는 interior", () => {
    const layout = deriveLayout(twoRooms());
    expect([...layout.exteriorWallIds].sort()).toEqual(["bottom", "left", "right", "top"]);
  });

  it("외곽은 외벽 중심선 사각형이다", () => {
    const layout = deriveLayout(twoRooms());
    expect(sortedPoints(layout.outline)).toEqual(sortedPoints(rect(0, 0, 4500, 6000)));
  });

  it("ㄱ자 방은 꼭짓점 6개, 면적이 정확하다", () => {
    // 오른쪽 아래 2500×3000을 벽 두 개로 떼어낸다
    const walls = [...box(), wall("h", 2000, 3000, 4500, 3000), wall("v", 2000, 3000, 2000, 6000)];
    const layout = deriveLayout(walls);
    expect(layout.rooms).toHaveLength(2);
    const lShaped = layout.rooms.find((room) => room.polygon.length === 6);
    expect(lShaped).toBeDefined();
    expect(lShaped?.areaM2).toBe(27 - 7.5);
  });

  it("T-교차: 칸막이가 다른 칸막이 중간에서 끝나도 벽을 쪼개지 않고 방 3개가 나온다", () => {
    const walls = [...twoRooms(), wall("t", 2000, 3000, 4500, 3000)];
    const layout = deriveLayout(walls);
    expect(layout.rooms).toHaveLength(3);
    expect(layout.rooms.reduce((sum, room) => sum + room.areaM2, 0)).toBe(27);
  });

  it("외벽 하나가 빠지면 방이 없고 열린 끝점 두 개가 남는다", () => {
    const layout = deriveLayout(box().filter((w) => w.id !== "bottom"));
    expect(layout.rooms).toEqual([]);
    expect(layout.openEndpoints).toEqual([
      { x: 4500, z: 6000 },
      { x: 0, z: 6000 }
    ]);
    expect(sortedPoints(layout.outline)).toEqual(sortedPoints(rect(0, 0, 4500, 6000)));
  });

  it("방 안에 떠 있는 토막은 방을 나누지 않는다", () => {
    const layout = deriveLayout([...box(), wall("stub", 1000, 1000, 2000, 1000)]);
    expect(layout.rooms).toHaveLength(1);
    expect(polygonAreaM2(layout.rooms[0].polygon)).toBe(27);
  });

  it("공선 중복 벽이 있어도 결과가 같다", () => {
    const layout = deriveLayout([...twoRooms(), wall("dup", 2000, 1000, 2000, 4000)]);
    expect(layout.rooms).toHaveLength(2);
  });

  it("바깥으로 뻗은 토막은 외곽에 들지 않는다", () => {
    const layout = deriveLayout([...box(), wall("out", 4500, 3000, 6000, 3000)]);
    expect(sortedPoints(layout.outline)).toEqual(sortedPoints(rect(0, 0, 4500, 6000)));
    expect(layout.exteriorWallIds.has("out")).toBe(false);
  });

  it("ㄱ자 유닛의 외곽은 bbox가 아닌 6각형이다", () => {
    const walls = [
      wall("a", 0, 0, 4000, 0),
      wall("b", 4000, 0, 4000, 2000),
      wall("c", 2000, 2000, 4000, 2000),
      wall("d", 2000, 2000, 2000, 5000),
      wall("e", 0, 5000, 2000, 5000),
      wall("f", 0, 0, 0, 5000)
    ];
    const layout = deriveLayout(walls);
    expect(layout.rooms).toHaveLength(1);
    expect(layout.outline).toHaveLength(6);
    expect(polygonAreaM2(layout.outline)).toBe(8 + 6);
  });
});
