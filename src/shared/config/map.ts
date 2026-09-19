/**
 * shared/config — 지도 설정 단일 진입점.
 * 앱키는 반드시 리터럴 멤버 표현식으로 읽는다. 동적 접근은 Next가 빌드 시점에 값으로 바꾸지 못한다.
 */
export const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

/** 키가 없으면 지도를 시도하지 않고 대체 표시로 간다 — 로컬·CI·미등록 환경이 모두 여기 해당한다 */
export const IS_MAP_ENABLED = KAKAO_MAP_APP_KEY.length > 0;

/**
 * autoload=false로 받아 kakao.maps.load()로 준비 시점을 직접 기다린다.
 * 좌표는 빌드 시점에 확정해 두므로 services(지오코딩) 라이브러리는 싣지 않는다.
 */
export const KAKAO_MAP_SDK_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&autoload=false`;

/** 스크립트가 이 시간 안에 오지 않으면 대체 표시로 확정한다. 로딩 표시가 영원히 도는 것을 막는다 */
export const MAP_SCRIPT_TIMEOUT_MS = 8000;

/** 카카오 확대 단계 — 숫자가 작을수록 가깝다 */
export const MAP_LEVEL = { card: 4, detail: 4, list: 8 } as const;

/** 마커가 하나뿐일 때 자동 맞춤이 과하게 당겨지므로 이 단계로 고정한다 */
export const MAP_SINGLE_MARKER_LEVEL = MAP_LEVEL.detail;
