import { HISTORY_LIMIT } from "../config/constants";
import type { TraceDocument, TraceState, TraceUiState } from "./types";

const clearTransient = (ui: TraceUiState): TraceUiState => ({
  ...ui,
  selection: null,
  wallDraft: null,
  drag: null,
  labelPickerAt: null,
  calibratePoints: []
});

/** 문서 참조가 바뀐 경우에만 히스토리에 남긴다. 드래그 미리보기 같은 UI 변화는 undo 대상이 아니다 */
export function commitStep(state: TraceState, document: TraceDocument, ui: TraceUiState): TraceState {
  if (document === state.present) return ui === state.ui ? state : { ...state, ui };
  const past = [...state.past, state.present].slice(-HISTORY_LIMIT);
  return { present: document, past, future: [], ui };
}

export function undo(state: TraceState): TraceState {
  const previous = state.past[state.past.length - 1];
  if (!previous) return state;
  return { present: previous, past: state.past.slice(0, -1), future: [state.present, ...state.future], ui: clearTransient(state.ui) };
}

export function redo(state: TraceState): TraceState {
  const [next, ...rest] = state.future;
  if (!next) return state;
  return { present: next, past: [...state.past, state.present], future: rest, ui: clearTransient(state.ui) };
}
