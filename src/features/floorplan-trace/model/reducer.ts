import { pointInPolygon, snapToGrid, type PointMm } from "@/entities/floorplan";
import { BOUNDARY_THICKNESS_MM, CALIBRATION_POINTS, DEFAULT_OPENING_PRESET, MIN_WALL_LENGTH_MM } from "../config/constants";
import { emptyDocument } from "../lib/documentFromModel";
import { reprojectDocument } from "../lib/reprojectDocument";
import { isBoundary, isHorizontal, orientWall, orthogonalize, snapPoint } from "../lib/snap";
import { nearestWall, pointOnWall, projectOntoWall, reprojectOpenings, wallLengthMm } from "../lib/wallOps";
import { commitStep, redo, undo } from "./history";
import type { DragState, PointerSample, TraceAction, TraceDocument, TraceOpening, TraceState, TraceUiState, TraceWall } from "./types";

interface Step {
  document: TraceDocument;
  ui: TraceUiState;
}

export const createInitialUi = (): TraceUiState => ({
  tool: "wall",
  selection: null,
  wallDraft: null,
  drag: null,
  labelPickerAt: null,
  calibratePoints: [],
  openingPreset: DEFAULT_OPENING_PRESET,
  drawBoundary: false
});

export const createInitialState = (document: TraceDocument = emptyDocument()): TraceState => ({
  present: document,
  past: [],
  future: [],
  ui: createInitialUi()
});

export function traceReducer(state: TraceState, action: TraceAction): TraceState {
  switch (action.type) {
    case "UNDO":
      return undo(state);
    case "REDO":
      return redo(state);
    case "LOAD_DOCUMENT":
      return {
        present: action.document,
        past: [],
        future: [],
        ui: { ...createInitialUi(), tool: state.ui.tool, openingPreset: state.ui.openingPreset, drawBoundary: state.ui.drawBoundary }
      };
    default: {
      const { document, ui } = applyAction(state.present, state.ui, action);
      return commitStep(state, document, ui);
    }
  }
}

function applyAction(document: TraceDocument, ui: TraceUiState, action: TraceAction): Step {
  switch (action.type) {
    case "SET_TOOL":
      return { document, ui: { ...ui, tool: action.tool, wallDraft: null, drag: null, labelPickerAt: null, calibratePoints: [] } };
    case "CANCEL":
      return { document, ui: { ...ui, selection: null, wallDraft: null, drag: null, labelPickerAt: null, calibratePoints: [] } };
    case "SET_OPENING_PRESET":
      return { document, ui: { ...ui, openingPreset: action.preset } };
    case "SET_DRAW_BOUNDARY":
      return { document, ui: { ...ui, drawBoundary: action.value } };
    case "POINTER_DOWN":
      return pointerDown(document, ui, action.at);
    case "POINTER_MOVE":
      return pointerMove(document, ui, action.at);
    case "POINTER_UP":
      return pointerUp(document, ui, action.at);
    case "DELETE_SELECTION":
      return deleteSelection(document, ui);
    case "SET_LABEL": {
      const kept = document.labelAnchors.filter((anchor) => !pointInPolygon(anchor.at, action.roomPolygon));
      const isDefault = action.label === "기타";
      const labelAnchors = isDefault ? kept : [...kept, { id: `l${document.seq + 1}`, at: action.at, label: action.label }];
      return { document: { ...document, labelAnchors, seq: isDefault ? document.seq : document.seq + 1 }, ui: { ...ui, labelPickerAt: null } };
    }
    case "UPDATE_OPENING": {
      const openings = document.openings.map((opening) => (opening.id === action.id ? clampOpening({ ...opening, ...action.patch }, document.walls) : opening));
      return { document: { ...document, openings }, ui };
    }
    case "UPDATE_WALL": {
      const walls = document.walls.map((wall) => (wall.id === action.id ? { ...wall, thicknessMm: action.patch.thicknessMm } : wall));
      // 경계선에는 문·창을 달 수 없다(3D 벽으로 세우지 않으므로 뚫을 것이 없다) — 벽을 경계선으로 바꾸면 그 개구부도 지운다
      const openings =
        action.patch.thicknessMm === BOUNDARY_THICKNESS_MM ? document.openings.filter((opening) => opening.wallId !== action.id) : document.openings;
      return { document: { ...document, walls, openings }, ui };
    }
    case "COMMIT_CALIBRATION": {
      const [first, second] = ui.calibratePoints;
      if (!first || !second || action.distanceMm <= 0) return { document, ui };
      const distancePx = Math.hypot(second.x - first.x, second.y - first.y);
      if (distancePx === 0) return { document, ui };
      const calibration = { mmPerPx: action.distanceMm / distancePx, originPx: first, source: "dimension-chain" as const };
      return { document: reprojectDocument(document, calibration), ui: { ...ui, calibratePoints: [] } };
    }
    case "SET_SCALE": {
      if (action.mmPerPx <= 0) return { document, ui };
      const originPx = document.calibration?.originPx ?? { x: 0, y: 0 };
      return { document: reprojectDocument(document, { mmPerPx: action.mmPerPx, originPx, source: "estimated" }), ui };
    }
    case "SET_PRINTED":
      return { document: { ...document, printed: { ...document.printed, ...action.patch } }, ui };
    default:
      return { document, ui };
  }
}

/** 시작점 기준으로 수평/수직을 잡은 뒤 자유 축만 스냅한다 — 끝점 스냅이 축을 흔들지 않게 */
function snapWallEnd(mm: PointMm, start: PointMm, walls: readonly TraceWall[], toleranceMm: number): PointMm {
  return orthogonalize(snapPoint(orthogonalize(mm, start), walls, toleranceMm), start);
}

function pointerDown(document: TraceDocument, ui: TraceUiState, at: PointerSample): Step {
  if (ui.tool === "calibrate") {
    const points = ui.calibratePoints.length >= CALIBRATION_POINTS ? [at.px] : [...ui.calibratePoints, at.px];
    return { document, ui: { ...ui, calibratePoints: points } };
  }
  if (!at.mm) return { document, ui };
  switch (ui.tool) {
    case "wall":
      return drawWall(document, ui, at.mm, at.toleranceMm);
    case "select":
      return { document, ui: { ...ui, ...hitTest(document, at.mm, at.toleranceMm) } };
    case "label":
      return { document, ui: { ...ui, labelPickerAt: at.mm, selection: null } };
    case "opening":
      return placeOpening(document, ui, at.mm, at.toleranceMm);
    default:
      return { document, ui };
  }
}

function drawWall(document: TraceDocument, ui: TraceUiState, mm: PointMm, toleranceMm: number): Step {
  if (!ui.wallDraft) {
    const start = snapPoint(mm, document.walls, toleranceMm);
    return { document, ui: { ...ui, wallDraft: { start, current: start }, selection: null } };
  }
  const { start } = ui.wallDraft;
  const end = snapWallEnd(mm, start, document.walls, toleranceMm);
  if (Math.hypot(end.x - start.x, end.z - start.z) < MIN_WALL_LENGTH_MM) return { document, ui: { ...ui, wallDraft: null } };
  const wall = orientWall({ id: `w${document.seq + 1}`, a: start, b: end, ...(ui.drawBoundary ? { thicknessMm: BOUNDARY_THICKNESS_MM } : {}) });
  return {
    document: { ...document, walls: [...document.walls, wall], seq: document.seq + 1 },
    ui: { ...ui, wallDraft: { start: end, current: end } }
  };
}

function hitTest(document: TraceDocument, mm: PointMm, toleranceMm: number): Pick<TraceUiState, "selection" | "drag"> {
  const distance = (p: PointMm) => Math.hypot(p.x - mm.x, p.z - mm.z);
  const wallsById = new Map(document.walls.map((wall) => [wall.id, wall]));
  for (const opening of document.openings) {
    const wall = wallsById.get(opening.wallId);
    if (wall && distance(pointOnWall(wall, opening.offsetMm + opening.widthMm / 2)) <= toleranceMm) {
      return { selection: { kind: "opening", id: opening.id }, drag: { kind: "opening", id: opening.id, from: mm, to: mm } };
    }
  }
  for (const wall of document.walls) {
    for (const end of ["a", "b"] as const) {
      if (distance(wall[end]) <= toleranceMm) return { selection: { kind: "wall", id: wall.id }, drag: { kind: "endpoint", id: wall.id, end, from: mm, to: mm } };
    }
  }
  const hit = nearestWall(document.walls, mm, toleranceMm);
  if (hit) return { selection: { kind: "wall", id: hit.wall.id }, drag: { kind: "wall", id: hit.wall.id, from: mm, to: mm } };
  return { selection: null, drag: null };
}

function placeOpening(document: TraceDocument, ui: TraceUiState, mm: PointMm, toleranceMm: number): Step {
  const hit = nearestWall(document.walls.filter((wall) => !isBoundary(wall)), mm, toleranceMm);
  if (!hit) return { document, ui };
  const length = wallLengthMm(hit.wall);
  const widthMm = Math.min(ui.openingPreset.widthMm, length);
  const along = projectOntoWall(hit.wall, mm);
  const offsetMm = clampOffset(snapToGrid(along - widthMm / 2), widthMm, length);
  const opening: TraceOpening = { id: `o${document.seq + 1}`, wallId: hit.wall.id, type: ui.openingPreset.type, offsetMm, widthMm };
  return {
    document: { ...document, openings: [...document.openings, opening], seq: document.seq + 1 },
    ui: { ...ui, selection: { kind: "opening", id: opening.id } }
  };
}

const clampOffset = (offsetMm: number, widthMm: number, lengthMm: number) => Math.max(0, Math.min(lengthMm - widthMm, offsetMm));

function clampOpening(opening: TraceOpening, walls: readonly TraceWall[]): TraceOpening {
  const wall = walls.find((candidate) => candidate.id === opening.wallId);
  if (!wall) return opening;
  const length = wallLengthMm(wall);
  const widthMm = Math.max(0, Math.min(length, opening.widthMm));
  return { ...opening, widthMm, offsetMm: clampOffset(opening.offsetMm, widthMm, length) };
}

function pointerMove(document: TraceDocument, ui: TraceUiState, at: PointerSample): Step {
  if (!at.mm) return { document, ui };
  if (ui.tool === "wall" && ui.wallDraft) {
    return { document, ui: { ...ui, wallDraft: { ...ui.wallDraft, current: snapWallEnd(at.mm, ui.wallDraft.start, document.walls, at.toleranceMm) } } };
  }
  if (ui.tool === "select" && ui.drag) return { document, ui: { ...ui, drag: { ...ui.drag, to: at.mm } } };
  return { document, ui };
}

function pointerUp(document: TraceDocument, ui: TraceUiState, at: PointerSample): Step {
  if (!ui.drag) return { document, ui };
  const drag = at.mm ? { ...ui.drag, to: at.mm } : ui.drag;
  return { document: applyDrag(document, drag, at.toleranceMm), ui: { ...ui, drag: null } };
}

/** 드래그가 끝날 때 한 번만 문서에 반영한다 — 이동 중에는 미리보기만 그린다 */
function applyDrag(document: TraceDocument, drag: DragState, toleranceMm: number): TraceDocument {
  const wall = document.walls.find((candidate) => candidate.id === drag.id);
  switch (drag.kind) {
    case "wall": {
      if (!wall) return document;
      const delta = { x: snapToGrid(drag.to.x - drag.from.x), z: snapToGrid(drag.to.z - drag.from.z) };
      if (delta.x === 0 && delta.z === 0) return document;
      const moved = { ...wall, a: { x: wall.a.x + delta.x, z: wall.a.z + delta.z }, b: { x: wall.b.x + delta.x, z: wall.b.z + delta.z } };
      return { ...document, walls: document.walls.map((candidate) => (candidate === wall ? moved : candidate)) };
    }
    case "endpoint": {
      if (!wall) return document;
      const anchor = wall[drag.end];
      const others = document.walls.filter((candidate) => candidate !== wall);
      const target = snapPoint(drag.to, others, toleranceMm);
      const horizontal = isHorizontal(wall);
      const point = horizontal ? { x: target.x, z: anchor.z } : { x: anchor.x, z: target.z };
      if (point.x === anchor.x && point.z === anchor.z) return document;

      // 한 점에 모인 같은 축 벽들을 함께 옮긴다 — 한쪽만 움직이면 이어 그린 벽 가운데가 끊긴다
      let walls = document.walls;
      let openings = document.openings;
      for (const candidate of document.walls) {
        if (isHorizontal(candidate) !== horizontal) continue;
        for (const end of ["a", "b"] as const) {
          if (candidate[end].x !== anchor.x || candidate[end].z !== anchor.z) continue;
          const moved = orientWall({ ...candidate, [end]: point });
          if (wallLengthMm(moved) < MIN_WALL_LENGTH_MM) continue;
          walls = walls.map((w) => (w.id === candidate.id ? moved : w));
          openings = reprojectOpenings(openings, candidate, moved);
        }
      }
      return walls === document.walls ? document : { ...document, walls, openings };
    }
    case "opening": {
      const opening = document.openings.find((candidate) => candidate.id === drag.id);
      const host = opening && document.walls.find((candidate) => candidate.id === opening.wallId);
      if (!opening || !host) return document;
      const length = wallLengthMm(host);
      const offsetMm = clampOffset(snapToGrid(projectOntoWall(host, drag.to) - opening.widthMm / 2), opening.widthMm, length);
      if (offsetMm === opening.offsetMm) return document;
      return { ...document, openings: document.openings.map((candidate) => (candidate === opening ? { ...opening, offsetMm } : candidate)) };
    }
    default:
      return document;
  }
}

function deleteSelection(document: TraceDocument, ui: TraceUiState): Step {
  const { selection } = ui;
  if (!selection) return { document, ui };
  const next = { ...ui, selection: null, drag: null };
  if (selection.kind === "wall") {
    return {
      document: {
        ...document,
        walls: document.walls.filter((wall) => wall.id !== selection.id),
        openings: document.openings.filter((opening) => opening.wallId !== selection.id)
      },
      ui: next
    };
  }
  return { document: { ...document, openings: document.openings.filter((opening) => opening.id !== selection.id) }, ui: next };
}
