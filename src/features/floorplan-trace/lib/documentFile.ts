import { DEFAULT_TRACE_NAME, TRACE_FILE_VERSION } from "../config/constants";
import type { TraceDocument, TraceFile } from "../model/types";

export const serializeTraceFile = (file: TraceFile): string => JSON.stringify(file, null, 2);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function isTraceDocument(value: unknown): value is TraceDocument {
  if (!isRecord(value)) return false;
  const hasParts = Array.isArray(value.walls) && Array.isArray(value.openings) && Array.isArray(value.labelAnchors);
  const printed = isRecord(value.printed) && Array.isArray(value.printed.dimensionChains);
  return hasParts && printed && typeof value.seq === "number";
}

/** 저장해 둔 작업 파일을 읽는다. 남의 JSON을 열었을 때 화면이 깨지는 대신 무엇이 잘못됐는지 알린다 */
export function parseTraceFile(text: string): TraceFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("작업 파일이 JSON이 아닙니다");
  }
  if (!isRecord(raw)) throw new Error("작업 파일 형식이 아닙니다");
  if (raw.version !== TRACE_FILE_VERSION) throw new Error(`지원하지 않는 작업 파일 버전입니다(${String(raw.version)})`);
  if (!isTraceDocument(raw.document)) throw new Error("작업 파일에 편집 내용이 없습니다");
  return {
    version: TRACE_FILE_VERSION,
    name: typeof raw.name === "string" ? raw.name : "",
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    document: raw.document
  };
}

/** 파일명으로 쓸 수 없는 글자를 걷어낸다 */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^[-.]+|-+$/g, "");
  return cleaned === "" ? DEFAULT_TRACE_NAME : cleaned;
}

/** 이미지 경로에서 도면 이름 기본값을 뽑는다. blob 주소는 이름이 될 수 없어 기본값으로 둔다 */
export function defaultNameFromImage(url: string): string {
  if (url.startsWith("blob:")) return DEFAULT_TRACE_NAME;
  const base = url.split(/[?#]/)[0].split("/").pop() ?? "";
  return sanitizeFileName(base.replace(/\.[^.]+$/, ""));
}
