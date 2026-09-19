const STORAGE_KEY = "zipboda.score.steps";

/**
 * 가점 입력값을 브라우저에만 남긴다.
 * 로그인 없이 쓰는 계산기라 서버에 보낼 곳이 없고, 다시 찾아왔을 때 처음부터 다시 맞추지 않게 하는 것이 목적이다.
 * 저장소를 막아 둔 브라우저(사생활 보호 모드 등)에서는 조용히 포기한다.
 */
export function loadSavedSteps(stepCounts: number[]): number[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== stepCounts.length) return null;
    const valid = parsed.every((value, i) => Number.isInteger(value) && 0 <= value && value < stepCounts[i]);
    return valid ? (parsed as number[]) : null;
  } catch {
    return null;
  }
}

export function saveSteps(steps: number[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
    return true;
  } catch {
    return false;
  }
}
