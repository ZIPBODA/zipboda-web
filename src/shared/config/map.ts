/**
 * shared/config — 지도 설정 단일 진입점.
 * 앱키는 반드시 리터럴 멤버 표현식으로 읽는다. 동적 접근은 Next가 빌드 시점에 값으로 바꾸지 못한다.
 */
export const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

/** 키가 없으면 지도를 시도하지 않고 대체 표시로 간다 — 로컬·CI·미등록 환경이 모두 여기 해당한다 */
export const IS_MAP_ENABLED = KAKAO_MAP_APP_KEY.length > 0;

/**
 * autoload=false로 받아 kakao.maps.load()로 준비 시점을 직접 기다린다.
 * 목록의 확대 단계별 개수 표시에 clusterer를 사용한다. services(지오코딩)는 싣지 않는다.
 */
export const KAKAO_MAP_SDK_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&autoload=false&libraries=clusterer`;

/** 스크립트가 이 시간 안에 오지 않으면 대체 표시로 확정한다. 로딩 표시가 영원히 도는 것을 막는다 */
export const MAP_SCRIPT_TIMEOUT_MS = 8000;

/** 카카오 확대 단계 — 숫자가 작을수록 가깝다 */
export const MAP_LEVEL = { card: 4, detail: 4, list: 8 } as const;

/** 마커가 하나뿐일 때 자동 맞춤이 과하게 당겨지므로 이 단계로 고정한다 */
export const MAP_SINGLE_MARKER_LEVEL = MAP_LEVEL.detail;

export const MAP_ZOOM_RANGE = { min: 1, max: 14 } as const;

/**
 * 지도는 두 얼굴을 가진다. 멀리서는 어느 동네에 몇 건이 몰렸는지, 가까이서는 어느 집인지 본다.
 * 이 단계에서만 개별 핀을 찍는다.
 */
export const MAP_DETAIL_PIN_LEVEL = MAP_ZOOM_RANGE.min;

/** 이 단계부터는 여러 건을 숫자 배지로 묶는다 */
export const MAP_AGGREGATE_MIN_LEVEL = MAP_DETAIL_PIN_LEVEL + 1;

/**
 * 한 건짜리는 여기까지만 배지로 두고, 이 단계부터는 바로 핀으로 보여준다.
 * 겹칠 이웃이 없는 집을 최대 배율까지 파고들어야 볼 수 있는 것은 번거롭다.
 * 여러 건은 이 단계에서도 배지로 남아 확대할수록 갈라진다.
 */
export const MAP_SINGLE_PIN_LEVEL = 6;

/**
 * minClusterSize 1은 한 건도 배지로 만든다. 카카오 SDK에서 실제로 1건짜리 묶음이 생기는 것을
 * 확인하고 정했다(그 아래 단계에서는 SDK가 스스로 개별 마커로 되돌린다).
 * 확대 단계에 따라 이 값을 2로 바꾸면 한 건짜리만 핀으로 풀린다 — minClusterSizeFor 참고.
 */
export const MAP_CLUSTER_OPTIONS = {
  gridSize: 80,
  minLevel: MAP_AGGREGATE_MIN_LEVEL,
  minClusterSize: 1
} as const;

/** 한 건짜리를 배지로 둘지(1) 핀으로 풀지(2) — 확대 단계가 정한다 */
export const minClusterSizeFor = (level: number): number => (level <= MAP_SINGLE_PIN_LEVEL ? 2 : 1);
