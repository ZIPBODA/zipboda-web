import { describe, it, expect } from "vitest";
import { normalizeModel } from "@/entities/floorplan";
import { TRACE_EXTERIOR_WALL_MM, TRACE_INTERIOR_WALL_MM } from "../config/constants";
import type { TraceDocument, TraceWall } from "../model/types";
import { assembleTraceModel } from "./assembleTraceModel";
import { deriveLayout } from "./deriveLayout";
import { emptyDocument } from "./documentFromModel";
import { resolveRoomLabels } from "./labelAnchors";

const wall = (id: string, ax: number, az: number, bx: number, bz: number): TraceWall => ({ id, a: { x: ax, z: az }, b: { x: bx, z: bz } });

// 원점에서 떨어진 자리에 그린 두 방 + 현관문 + 칸막이 문
const twoRoomDocument = (): TraceDocument => ({
  ...emptyDocument(),
  calibration: { mmPerPx: 10, originPx: { x: 0, y: 0 }, source: "dimension-chain" },
  walls: [
    wall("top", 1000, 1000, 5500, 1000),
    wall("right", 5500, 1000, 5500, 7000),
    wall("bottom", 1000, 7000, 5500, 7000),
    wall("left", 1000, 1000, 1000, 7000),
    wall("div", 3000, 1000, 3000, 7000)
  ],
  openings: [
    { id: "o1", wallId: "top", type: "door", offsetMm: 500, widthMm: 900 },
    { id: "o2", wallId: "div", type: "door", offsetMm: 2000, widthMm: 900 }
  ],
  labelAnchors: [
    { id: "l1", at: { x: 2000, z: 4000 }, label: "현관" },
    { id: "l2", at: { x: 4000, z: 4000 }, label: "거실" }
  ],
  seq: 4
});

const assemble = (document: TraceDocument) => {
  const layout = deriveLayout(document.walls);
  return assembleTraceModel(document, layout, resolveRoomLabels(layout.rooms, document.labelAnchors));
};

describe("assembleTraceModel", () => {
  it("캘리브레이션이나 벽이 없으면 null", () => {
    expect(assembleTraceModel(emptyDocument(), deriveLayout([]), [])).toBeNull();
  });

  it("외곽 좌상단을 (0,0)으로 옮긴다", () => {
    const model = assemble(twoRoomDocument());
    expect(model?.outline).toContainEqual({ x: 0, z: 0 });
    expect(model?.outline).toContainEqual({ x: 4500, z: 6000 });
    expect(model?.walls.find((w) => w.id === "top")?.a).toEqual({ x: 0, z: 0 });
  });

  it("외벽·내벽 기본 두께와 exterior 플래그", () => {
    const model = assemble(twoRoomDocument());
    const top = model?.walls.find((w) => w.id === "top");
    const div = model?.walls.find((w) => w.id === "div");
    expect(top).toMatchObject({ exterior: true, thicknessMm: TRACE_EXTERIOR_WALL_MM });
    expect(div).toMatchObject({ exterior: false, thicknessMm: TRACE_INTERIOR_WALL_MM });
  });

  it("방 라벨·면적·신뢰도(앵커 1.0, 기타 0.5)", () => {
    const document = twoRoomDocument();
    document.labelAnchors = document.labelAnchors.slice(0, 1);
    const model = assemble(document);
    expect(model?.rooms.map((r) => r.label)).toEqual(["현관", "기타"]);
    expect(model?.rooms[0].areaM2).toBe(12);
    expect(model?.confidence.perRoom).toEqual({ "room-0": 1, "room-1": 0.5 });
  });

  it("이름 없는 1.5㎡ 이하 공간(PS)은 방으로 내보내지 않는다", () => {
    const document = twoRoomDocument();
    // 오른쪽 방 구석에 1000×1000 상자를 벽 두 개로 만든다
    document.walls = [...document.walls, wall("ps-h", 4500, 6000, 5500, 6000), wall("ps-v", 4500, 6000, 4500, 7000)];
    const model = assemble(document);
    expect(model?.rooms.map((r) => r.label)).toEqual(["현관", "거실"]);
    expect(model?.walls.map((w) => w.id)).toContain("ps-h");
  });

  it("경계선은 방을 가르지만 벽으로 내보내지 않고, 두 방은 열린 통로로 도달 가능하다", () => {
    const document = twoRoomDocument();
    document.walls = document.walls.map((w) => (w.id === "div" ? { ...w, thicknessMm: 0 } : w));
    document.openings = document.openings.filter((o) => o.wallId !== "div");
    const model = assemble(document);
    if (!model) throw new Error("model");
    expect(model.rooms).toHaveLength(2);
    expect(model.walls.map((w) => w.id)).not.toContain("div");
    expect(normalizeModel(model).flags.map((f) => f.code)).not.toContain("unreachable-room");
  });

  it("문은 벽 위 그 자리에 남고 normalizeModel에서 타일링·개구부 플래그가 없다", () => {
    const model = assemble(twoRoomDocument());
    if (!model) throw new Error("model");
    expect(model.openings).toEqual([
      { wallId: "top", type: "door", offsetMm: 500, widthMm: 900 },
      { wallId: "div", type: "door", offsetMm: 2000, widthMm: 900 }
    ]);
    const codes = normalizeModel(model).flags.map((f) => f.code);
    expect(codes.filter((c) => c.startsWith("tiling") || c === "opening-invalid" || c === "unreachable-room" || c === "no-doors")).toEqual([]);
  });
});
