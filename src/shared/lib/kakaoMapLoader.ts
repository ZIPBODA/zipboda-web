import { IS_MAP_ENABLED, KAKAO_MAP_SDK_SRC, MAP_SCRIPT_TIMEOUT_MS } from "../config/map";

export type MapSdkStatus = "disabled" | "ready" | "failed";

export interface MapSdkResult {
  status: MapSdkStatus;
  maps: typeof kakao.maps | null;
}

const DISABLED: MapSdkResult = { status: "disabled", maps: null };
const FAILED: MapSdkResult = { status: "failed", maps: null };

const SCRIPT_ID = "kakao-maps-sdk";

let pending: Promise<MapSdkResult> | null = null;

/**
 * 지도 SDK를 한 번만 받아 온다. 지도가 세 화면에 흩어져 있어 각자 스크립트를 붙이면 중복 로드가 난다.
 * 앱키가 없으면 스크립트를 아예 붙이지 않는다 — 키 없는 로컬·CI가 네트워크를 건드리지 않고 같은 경로를 탄다.
 * 스크립트 onload는 네임스페이스 준비를 뜻하지 않아 kakao.maps.load()까지 기다려야 한다.
 */
export function loadKakaoMaps(): Promise<MapSdkResult> {
  if (pending) return pending;
  if (!IS_MAP_ENABLED || typeof window === "undefined" || typeof document === "undefined") return Promise.resolve(DISABLED);

  pending = new Promise<MapSdkResult>((resolve) => {
    let settled = false;
    const settle = (result: MapSdkResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(result);
    };
    const timer = window.setTimeout(() => settle(FAILED), MAP_SCRIPT_TIMEOUT_MS);

    const ready = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        settle(FAILED);
        return;
      }
      maps.load(() => settle({ status: "ready", maps }));
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.kakao?.maps) ready();
      else {
        existing.addEventListener("load", ready, { once: true });
        existing.addEventListener("error", () => settle(FAILED), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = KAKAO_MAP_SDK_SRC;
    script.addEventListener("load", ready, { once: true });
    script.addEventListener("error", () => settle(FAILED), { once: true });
    document.head.appendChild(script);
  });

  return pending;
}

/** 테스트 전용 — 모듈 수준 캐시를 비운다 */
export function resetKakaoMapsLoaderForTest(): void {
  pending = null;
  document.getElementById(SCRIPT_ID)?.remove();
}
