import { useMemo, useReducer } from "react";
import { normalizeModel } from "@/entities/floorplan";
import { assembleTraceModel } from "../lib/assembleTraceModel";
import { deriveLayout } from "../lib/deriveLayout";
import { resolveRoomLabels } from "../lib/labelAnchors";
import { createProjection } from "../lib/projection";
import { createInitialState, traceReducer } from "./reducer";
import type { TraceDocument } from "./types";

/** 편집 상태와 그로부터 파생되는 방·모델·검증을 함께 제공한다. 파생값은 문서가 바뀔 때만 다시 계산된다 */
export function useTraceEditor(initial?: TraceDocument) {
  const [state, dispatch] = useReducer(traceReducer, initial, createInitialState);
  const { present, ui } = state;
  const projection = useMemo(() => createProjection(present.calibration), [present.calibration]);
  const layout = useMemo(() => deriveLayout(present.walls), [present.walls]);
  const rooms = useMemo(() => resolveRoomLabels(layout.rooms, present.labelAnchors), [layout.rooms, present.labelAnchors]);
  const model = useMemo(() => assembleTraceModel(present, layout, rooms), [present, layout, rooms]);
  const normalized = useMemo(() => (model ? normalizeModel(model) : null), [model]);

  return {
    document: present,
    ui,
    projection,
    layout,
    rooms,
    normalized,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    dispatch
  };
}
