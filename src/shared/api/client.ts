import { API_REVALIDATE_SECONDS, API_TIMEOUT_MS } from "@/shared/config/api";
import type { ApiEnvelope, ApiQuery } from "./types";

export const API_STATUS = { NOT_FOUND: 404, VALIDATION: 422 } as const;

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string | null, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API 주소는 서버 환경 변수로만 받는다(NEXT_PUBLIC_ 아님) — 브라우저는 서버 컴포넌트·서버 액션을 거쳐 API에 닿는다.
 * 비어 있으면 목 데이터로 돌아가지 않고 실패한다(frontend-rule A1)
 */
const baseUrl = (): string => {
  const value = process.env.ZIPBODA_API_URL;
  if (!value) throw new Error("ZIPBODA_API_URL이 설정되지 않았습니다");
  return value.replace(/\/+$/, "");
};

const urlOf = (path: string, query: ApiQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const search = params.toString();
  return `${baseUrl()}${path}${search ? `?${search}` : ""}`;
};

// data의 모양은 zipboda-api DTO 계약을 따른다. 여기서는 엔벌로프만 확인한다
const isEnvelope = <T>(body: unknown): body is ApiEnvelope<T> =>
  typeof body === "object" && body !== null && "success" in body && typeof body.success === "boolean";

export async function getApi<T>(path: string, query: ApiQuery = {}): Promise<T> {
  const response = await fetch(urlOf(path, query), {
    headers: { Accept: "application/json" },
    next: { revalidate: API_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(API_TIMEOUT_MS)
  });
  const body: unknown = await response.json().catch(() => null);
  if (!isEnvelope<T>(body)) throw new ApiError(response.status, null, `API 응답이 엔벌로프가 아닙니다(${response.status} ${path})`);
  if (!body.success) throw new ApiError(response.status, body.error.code, body.error.message);
  return body.data;
}
