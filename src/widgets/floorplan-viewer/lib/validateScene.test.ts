import { describe, it, expect } from "vitest";
import type { FloorplanModel2D } from "@/entities/floorplan";
import { buildScene } from "./buildScene";
import { validateBuiltScene } from "./validateScene";

const rect = (x: number, z: number, w: number, d: number) => [
  { x, z },
  { x: x + w, z },
  { x: x + w, z: z + d },
  { x, z: z + d },
];

// 4000×6000 원룸: 외벽 4 + 현관문
const sound = (): FloorplanModel2D => ({
  scale: { mmPerPx: 10, source: "dimension-chain" },
  outline: rect(0, 0, 4000, 6000),
  rooms: [{ id: "room-0", label: "거실", polygon: rect(0, 0, 4000, 6000) }],
  walls: [
    {
      id: "top",
      a: { x: 0, z: 0 },
      b: { x: 4000, z: 0 },
      thicknessMm: 150,
      exterior: true,
    },
    {
      id: "right",
      a: { x: 4000, z: 0 },
      b: { x: 4000, z: 6000 },
      thicknessMm: 150,
      exterior: true,
    },
    {
      id: "bottom",
      a: { x: 0, z: 6000 },
      b: { x: 4000, z: 6000 },
      thicknessMm: 150,
      exterior: true,
    },
    {
      id: "left",
      a: { x: 0, z: 0 },
      b: { x: 0, z: 6000 },
      thicknessMm: 150,
      exterior: true,
    },
  ],
  openings: [{ wallId: "top", type: "door", offsetMm: 1500, widthMm: 900 }],
  printed: { dimensionChains: [] },
  confidence: { overall: 1, perRoom: {} },
});

describe("validateBuiltScene", () => {
  it("정상 원룸은 문제가 없다", () => {
    expect(validateBuiltScene(buildScene(sound()))).toEqual([]);
  });

  it("벽이 없으면 no-walls", () => {
    const model = sound();
    model.walls = [];
    model.openings = [];
    expect(validateBuiltScene(buildScene(model)).map((i) => i.code)).toContain(
      "no-walls",
    );
  });

  it("스케일이 잘못되어 유닛이 60m를 넘으면 bounds-abnormal", () => {
    const model = sound();
    const grow = (p: { x: number; z: number }) => ({
      x: p.x * 20,
      z: p.z * 20,
    });
    model.outline = model.outline.map(grow);
    model.rooms = model.rooms.map((r) => ({
      ...r,
      polygon: r.polygon.map(grow),
    }));
    model.walls = model.walls.map((w) => ({
      ...w,
      a: grow(w.a),
      b: grow(w.b),
    }));
    expect(validateBuiltScene(buildScene(model)).map((i) => i.code)).toContain(
      "bounds-abnormal",
    );
  });

  it("스폰이 방 바닥 밖이면 spawn-outside", () => {
    // 방 바닥이 유닛 왼쪽 절반만 덮고, 시작 방(가장 넓은 방)은 오른쪽에 있다고 속인다
    const model = sound();
    model.rooms = [
      { id: "room-0", label: "기타", polygon: rect(0, 0, 1000, 6000) },
      { id: "room-1", label: "현관", polygon: rect(3000, 0, 1000, 6000) },
    ];
    const scene = buildScene(model);
    // 현관 안에서 시작하므로 정상 — 그 바닥을 지워 밖으로 만든다
    scene.floors = scene.floors.filter((f) => f.roomId !== "room-1");
    expect(validateBuiltScene(scene).map((i) => i.code)).toContain(
      "spawn-outside",
    );
  });

  it("스폰이 벽 두께 안이면 spawn-in-wall", () => {
    const scene = buildScene(sound());
    const wall = scene.collision[0];
    scene.spawn = { ...scene.spawn, x: (wall.x1 + wall.x2) / 2, z: wall.z1 };
    expect(validateBuiltScene(scene).map((i) => i.code)).toContain(
      "spawn-in-wall",
    );
  });

  it("NaN 좌표는 non-finite", () => {
    const scene = buildScene(sound());
    scene.walls[0] = { ...scene.walls[0], cx: Number.NaN };
    expect(validateBuiltScene(scene).map((i) => i.code)).toContain(
      "non-finite",
    );
  });
});
