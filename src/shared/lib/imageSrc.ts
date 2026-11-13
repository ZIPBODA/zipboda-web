import { REMOTE_IMAGE_PREFIXES } from "@/shared/config/images";

/** next/image로 그릴 수 있는 주소만 남긴다 — 우리 정적 파일(/…)과 허용한 원격 주소. 그 밖은 사진 없음으로 본다 */
export function displayableImageOf(url: string | null): string | null {
  if (url === null) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return REMOTE_IMAGE_PREFIXES.some((prefix) => url.startsWith(prefix)) ? url : null;
}
