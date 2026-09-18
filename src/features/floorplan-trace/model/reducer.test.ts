import { describe, it, expect } from "vitest";
import { emptyDocument } from "../lib/documentFromModel";
import { createInitialState, traceReducer } from "./reducer";
import type { PointerSample, TraceAction, TraceDocument, TraceState } from "./types";

const TOLERANCE_MM = 100;
const calibrated = (): TraceDocument => ({ ...emptyDocument(), calibration: { mmPerPx: 10, originPx: { x: 0, y: 0 }, source: "dimension-chain" } });
const sample = (x: number, z: number): PointerSample => ({ px: { x: x / 10, y: z / 10 }, mm: { x, z }, toleranceMm: TOLERANCE_MM });
const run = (state: TraceState, ...actions: TraceAction[]) => actions.reduce(traceReducer, state);
const click = (state: TraceState, x: number, z: number) => run(state, { type: "POINTER_DOWN", at: sample(x, z) }, { type: "POINTER_UP", at: sample(x, z) });

/** 4500×6000 상자를 클릭 체인으로 그린다 */
const drawBox = (state: TraceState) => {
  let s = run(state, { type: "SET_TOOL", tool: "wall" });
  for (const [x, z] of [
    [0, 0],
    [4500, 0],
    [4500, 6000],
    [0, 6000],
    [0, 0]
  ]) {
    s = click(s, x, z);
  }
  return run(s, { type: "CANCEL" });
};

describe("wall 도구", () => {
  it("클릭-클릭 체인으로 벽을 이어 그리고, 직교로 맞춘다", () => {
    let state = run(createInitialState(calibrated()), { type: "SET_TOOL", tool: "wall" });
    state = click(state, 12, -8);
    expect(state.ui.wallDraft?.start).toEqual({ x: 0, z: 0 });
    state = click(state, 3010, 60);
    expect(state.present.walls).toEqual([{ id: "w1", a: { x: 0, z: 0 }, b: { x: 3000, z: 0 } }]);
    expect(state.ui.wallDraft?.start).toEqual({ x: 3000, z: 0 });
    state = click(state, 2950, 2000);
    expect(state.present.walls[1]).toEqual({ id: "w2", a: { x: 3000, z: 0 }, b: { x: 3000, z: 2000 } });
  });

  it("같은 자리를 다시 클릭하면 체인이 끝나고, Esc는 드래프트를 지운다", () => {
    let state = run(createInitialState(calibrated()), { type: "SET_TOOL", tool: "wall" });
    state = click(state, 0, 0);
    state = click(state, 20, 30);
    expect(state.ui.wallDraft).toBeNull();
    state = click(state, 0, 0);
    state = run(state, { type: "CANCEL" });
    expect(state.ui.wallDraft).toBeNull();
    expect(state.present.walls).toEqual([]);
  });

  it("캘리브레이션 전에는 mm가 없어 그릴 수 없다", () => {
    const uncalibrated: PointerSample = { px: { x: 10, y: 10 }, mm: null, toleranceMm: TOLERANCE_MM };
    const state = run(createInitialState(), { type: "SET_TOOL", tool: "wall" }, { type: "POINTER_DOWN", at: uncalibrated });
    expect(state.ui.wallDraft).toBeNull();
  });
});

describe("history", () => {
  it("벽 하나가 undo 한 단계, 이동 중 미리보기는 히스토리에 안 쌓인다", () => {
    let state = drawBox(createInitialState(calibrated()));
    expect(state.present.walls).toHaveLength(4);
    expect(state.past).toHaveLength(4);
    state = run(state, { type: "SET_TOOL", tool: "select" }, { type: "POINTER_DOWN", at: sample(2000, 0) }, { type: "POINTER_MOVE", at: sample(2000, 100) });
    expect(state.past).toHaveLength(4);
    state = run(state, { type: "POINTER_UP", at: sample(2000, 200) });
    expect(state.past).toHaveLength(5);
    expect(state.present.walls[0].a.z).toBe(200);
    state = run(state, { type: "UNDO" });
    expect(state.present.walls[0].a.z).toBe(0);
    expect(state.future).toHaveLength(1);
    state = run(state, { type: "REDO" });
    expect(state.present.walls[0].a.z).toBe(200);
  });

  it("LOAD_DOCUMENT는 히스토리를 비운다", () => {
    const state = run(drawBox(createInitialState(calibrated())), { type: "LOAD_DOCUMENT", document: calibrated() });
    expect(state.past).toEqual([]);
    expect(state.present.walls).toEqual([]);
  });
});

describe("select 도구", () => {
  it("끝점을 끌면 벽 축을 따라 움직이고 문은 도면 위 자리에 남는다", () => {
    let state = drawBox(createInitialState(calibrated()));
    state = run(state, { type: "SET_TOOL", tool: "opening" });
    state = click(state, 1000, 0);
    expect(state.present.openings).toEqual([{ id: "o5", wallId: "w1", type: "door", offsetMm: 550, widthMm: 900 }]);
    state = run(state, { type: "SET_TOOL", tool: "select" }, { type: "POINTER_DOWN", at: sample(0, 0) }, { type: "POINTER_UP", at: sample(300, 40) });
    expect(state.present.walls[0].a).toEqual({ x: 300, z: 0 });
    expect(state.present.openings[0].offsetMm).toBe(250);
  });

  it("벽을 지우면 그 벽의 문도 함께 사라진다", () => {
    let state = drawBox(createInitialState(calibrated()));
    state = click(run(state, { type: "SET_TOOL", tool: "opening" }), 1000, 0);
    state = run(state, { type: "SET_TOOL", tool: "select" }, { type: "POINTER_DOWN", at: sample(2000, 0) }, { type: "POINTER_UP", at: sample(2000, 0) });
    expect(state.ui.selection).toEqual({ kind: "wall", id: "w1" });
    state = run(state, { type: "DELETE_SELECTION" });
    expect(state.present.walls.map((w) => w.id)).toEqual(["w2", "w3", "w4"]);
    expect(state.present.openings).toEqual([]);
  });

  it("이어 그린 두 벽의 공유 끝점을 끌면 둘 다 따라온다", () => {
    let state = run(createInitialState(calibrated()), { type: "SET_TOOL", tool: "wall" });
    state = click(state, 0, 0);
    state = click(state, 2000, 0);
    state = click(state, 4500, 0);
    state = run(state, { type: "CANCEL" }, { type: "SET_TOOL", tool: "select" });
    state = run(state, { type: "POINTER_DOWN", at: sample(2000, 0) }, { type: "POINTER_UP", at: sample(2500, 0) });
    expect(state.present.walls[0].b).toEqual({ x: 2500, z: 0 });
    expect(state.present.walls[1].a).toEqual({ x: 2500, z: 0 });
  });

  it("경계선에는 문을 놓을 수 없고, 벽을 경계선으로 바꾸면 달려 있던 문이 사라진다", () => {
    let state = drawBox(createInitialState(calibrated()));
    state = click(run(state, { type: "SET_TOOL", tool: "opening" }), 1000, 0);
    expect(state.present.openings).toHaveLength(1);
    state = run(state, { type: "UPDATE_WALL", id: "w1", patch: { thicknessMm: 0 } });
    expect(state.present.openings).toEqual([]);
    state = click(run(state, { type: "SET_TOOL", tool: "opening" }), 1000, 0);
    expect(state.present.openings).toEqual([]);
  });

  it("개구부 마커가 끝점보다 먼저 잡힌다", () => {
    let state = drawBox(createInitialState(calibrated()));
    state = click(run(state, { type: "SET_TOOL", tool: "opening" }), 4500, 3000);
    state = run(state, { type: "SET_TOOL", tool: "select" }, { type: "POINTER_DOWN", at: sample(4500, 3000) });
    expect(state.ui.selection).toEqual({ kind: "opening", id: "o5" });
    state = run(state, { type: "POINTER_UP", at: sample(4500, 4000) });
    expect(state.present.openings[0].offsetMm).toBe(3550);
  });
});

describe("label 도구", () => {
  it("SET_LABEL은 같은 방의 옛 앵커를 치우고 새 앵커를 둔다", () => {
    const polygon = [
      { x: 0, z: 0 },
      { x: 4500, z: 0 },
      { x: 4500, z: 6000 },
      { x: 0, z: 6000 }
    ];
    let state = drawBox(createInitialState(calibrated()));
    state = run(state, { type: "SET_TOOL", tool: "label" }, { type: "POINTER_DOWN", at: sample(1000, 1000) });
    expect(state.ui.labelPickerAt).toEqual({ x: 1000, z: 1000 });
    state = run(state, { type: "SET_LABEL", at: { x: 1000, z: 1000 }, label: "욕실", roomPolygon: polygon });
    state = run(state, { type: "SET_LABEL", at: { x: 3000, z: 3000 }, label: "거실", roomPolygon: polygon });
    expect(state.present.labelAnchors).toEqual([{ id: "l6", at: { x: 3000, z: 3000 }, label: "거실" }]);
    expect(state.ui.labelPickerAt).toBeNull();
  });
});

describe("calibrate 도구", () => {
  it("두 점과 실측 거리로 스케일을 정하고 원점은 첫 점이다", () => {
    let state = run(createInitialState(), { type: "SET_TOOL", tool: "calibrate" });
    state = run(state, { type: "POINTER_DOWN", at: { px: { x: 100, y: 50 }, mm: null, toleranceMm: 0 } });
    state = run(state, { type: "POINTER_DOWN", at: { px: { x: 550, y: 50 }, mm: null, toleranceMm: 0 } });
    state = run(state, { type: "COMMIT_CALIBRATION", distanceMm: 4500 });
    expect(state.present.calibration).toEqual({ mmPerPx: 10, originPx: { x: 100, y: 50 }, source: "dimension-chain" });
    expect(state.ui.calibratePoints).toEqual([]);
  });

  it("재캘리브레이션 뒤에도 벽은 이미지 위 같은 자리에 남는다", () => {
    let state = drawBox(createInitialState(calibrated()));
    state = run(state, { type: "SET_SCALE", mmPerPx: 20 });
    expect(state.present.walls[0]).toEqual({ id: "w1", a: { x: 0, z: 0 }, b: { x: 9000, z: 0 } });
  });
});
