import { DRAFT_STORAGE_PREFIX } from "../config/constants";
import type { TraceFile } from "../model/types";
import { parseTraceFile } from "./documentFile";

export interface TraceDraft {
  file: TraceFile;
  savedAt: number;
}

const keyOf = (imageUrl: string) => DRAFT_STORAGE_PREFIX + imageUrl;

/**
 * 그리던 내용을 브라우저에 남긴다. 새로 고침 한 번에 몇 십 분 작업이 날아가는 것을 막는 용도이고,
 * 보관은 사람이 내려받는 작업 파일이 맡는다.
 * 비공개 창·용량 초과에서는 조용히 포기한다 — 임시 보관이 안 된다고 편집을 막을 이유가 없다.
 */
export function saveDraft(file: TraceFile): void {
  if (file.imageUrl === "") return;
  try {
    window.localStorage.setItem(keyOf(file.imageUrl), JSON.stringify({ savedAt: Date.now(), ...file }));
  } catch {
    return;
  }
}

/** 남겨둔 내용을 읽는다. 형식이 바뀌었거나 깨졌으면 없는 셈 친다 */
export function loadDraft(imageUrl: string): TraceDraft | null {
  if (imageUrl === "") return null;
  try {
    const text = window.localStorage.getItem(keyOf(imageUrl));
    if (text === null) return null;
    const raw: unknown = JSON.parse(text);
    const savedAt = typeof raw === "object" && raw !== null && "savedAt" in raw && typeof raw.savedAt === "number" ? raw.savedAt : 0;
    return { file: parseTraceFile(text), savedAt };
  } catch {
    return null;
  }
}

export function clearDraft(imageUrl: string): void {
  try {
    window.localStorage.removeItem(keyOf(imageUrl));
  } catch {
    return;
  }
}
