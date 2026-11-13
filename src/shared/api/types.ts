/** zipboda-api 응답 엔벌로프. error.code는 오류코드 정의서의 반환 코드(E001…), message는 반환 메시지(NOT_FOUND…)다 */
export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string } };

export type ApiQuery = Record<string, string | number | undefined>;
