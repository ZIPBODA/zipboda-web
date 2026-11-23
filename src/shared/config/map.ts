/**
 * shared/config — 지도 설정 단일 진입점.
 * 앱키는 반드시 리터럴 멤버 표현식으로 읽는다. 동적 접근은 Next가 빌드 시점에 값으로 바꾸지 못한다.
 */
export const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

/** 키가 없으면 지도를 시도하지 않고 대체 표시로 간다 — 로컬·CI·미등록 환경이 모두 여기 해당한다 */
export const IS_MAP_ENABLED = KAKAO_MAP_APP_KEY.length > 0;

/**
 * autoload=false로 받아 kakao.maps.load()로 준비 시점을 직접 기다린다.
 * 묶음 배지는 직접 계산하므로(markerClusters) clusterer 라이브러리를 받지 않는다 — 지도가 그만큼 일찍 선다.
 * services(지오코딩)도 싣지 않는다.
 */
export const KAKAO_MAP_SDK_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&autoload=false`;

/** 스크립트가 이 시간 안에 오지 않으면 대체 표시로 확정한다. 로딩 표시가 영원히 도는 것을 막는다 */
export const MAP_SCRIPT_TIMEOUT_MS = 8000;

/** 카카오 확대 단계 — 숫자가 작을수록 가깝다 */
export const MAP_LEVEL = { card: 4, detail: 4, list: 8 } as const;

/** 마커가 하나뿐일 때 자동 맞춤이 과하게 당겨지므로 이 단계로 고정한다 */
export const MAP_SINGLE_MARKER_LEVEL = MAP_LEVEL.detail;

export const MAP_ZOOM_RANGE = { min: 1, max: 14 } as const;

/** 카카오 지도 1px이 담는 거리. 3단계에서 1m이고 한 단계 오를 때마다 두 배가 된다(배율별 실측) */
export const MAP_METERS_PER_PIXEL = { level: 3, meters: 1 } as const;

/** 위도 1°의 길이. 경도 1°는 여기에 cos(위도)를 곱한다 — 배율이 두 배씩 뛰어 이 정도 어림이면 단계가 맞는다 */
export const METERS_PER_DEGREE = 111_320;

export const NO_MAP_PADDING = [0, 0, 0, 0] as const;

/**
 * 목록에서 고른 집으로 날아갈 때 멈추는 배율. 상세 화면의 위치 카드와 같아서 같은 집이 같은 크기로 보인다.
 * 이미 더 가까이 보고 있으면 물러나지 않고 자리만 옮긴다.
 */
export const MAP_FOCUS_LEVEL = MAP_LEVEL.detail;

/**
 * 이동과 확대를 한 번의 jump 애니메이션으로 끝내는 시간. 카카오는 이 동안 마커를 감추므로 길수록 핀이 오래 사라진다.
 * 누른 뒤 0.5초 안에 끝내야 한다 — 그 뒤에 움직이는 지도 조각은 CWV가 레이아웃 이동으로 센다(0.7초일 때 CLS 0.62)
 */
export const MAP_FOCUS_ANIMATION_MS = 450;

/**
 * 지도는 두 얼굴을 가진다. 멀리서는 어느 동네에 몇 건이 몰렸는지, 가까이서는 어느 집인지 본다.
 * 이 단계에서는 같은 자리의 핀만 배지로 묶고 나머지는 모두 핀이다 — MAP_SAME_SPOT_GRID_SIZE 참고.
 */
export const MAP_DETAIL_PIN_LEVEL = MAP_ZOOM_RANGE.min;

/**
 * 한 건짜리는 여기까지만 배지로 두고, 이 단계부터는 바로 핀으로 보여준다.
 * 겹칠 이웃이 없는 집을 최대 배율까지 파고들어야 볼 수 있는 것은 번거롭다.
 * 여러 건은 이 단계에서도 배지로 남아 확대할수록 갈라진다.
 */
export const MAP_SINGLE_PIN_LEVEL = 5;

/** 핀 이름표는 핀(0·1)보다 위, 고른 집의 이름표는 다른 이름표보다 위에 놓는다 */
export const MAP_PIN_LABEL_Z_INDEX = { idle: 2, selected: 3 } as const;

/**
 * 내 위치로 옮길 때 멈추는 배율. 청약 핀·이름표가 보이기 시작하는 단계라 내 주변 공고가 바로 보인다.
 * 이미 더 가까이 보고 있으면 물러나지 않는다.
 */
export const MAP_MY_LOCATION_LEVEL = MAP_SINGLE_PIN_LEVEL;

/** 내 위치 점은 청약 핀·이름표보다 위에 둔다 — 어디가 나인지 가장 먼저 보여야 한다 */
export const MAP_MY_LOCATION_Z_INDEX = MAP_PIN_LABEL_Z_INDEX.selected + 1;

/** 묶는 격자(화면 px). 묶음 중심에서 가로·세로 이 안에 드는 집을 하나의 숫자 배지로 묶는다 */
export const MAP_CLUSTER_GRID_SIZE = 80;

/**
 * 화면 밖으로 미리 묶어 두는 폭(px). 이 안의 집은 지도를 조금 끌어도 손을 떼기 전에 이미 배지·핀으로 서 있다.
 * 격자와 따로 둔다 — 같은 자리만 묶는 가장 가까운 단계(격자 1px)에서도 여유가 줄지 않게
 */
export const MAP_CLUSTER_VIEW_MARGIN = MAP_CLUSTER_GRID_SIZE;

/** 묶음 크기가 이보다 작으면 배지 대신 핀으로 보인다. 1이면 멀리서는 한 건도 '1건' 배지이고, 2면 한 건짜리만 핀으로 풀린다 */
export const minClusterSizeFor = (level: number): number => (level <= MAP_SINGLE_PIN_LEVEL ? 2 : 1);

/**
 * 가장 가까운 단계에서 묶는 격자(화면 px). 같은 단지의 여러 공고는 좌표가 같아 핀이 한 자리에 포개지고 맨 위 하나만
 * 눌린다(실데이터 121곳, 한 곳 최대 12건) — 같은 자리만 다른 단계와 같은 'N건' 배지로 묶는다. 1px은 이 단계에서 약 0.25m다.
 * 다른 단지끼리는 20m(80px) 안에 붙은 곳이 있어(실데이터 20쌍) 격자를 넓히면 서로 다른 집이 배지로 묶인다
 */
export const MAP_SAME_SPOT_GRID_SIZE = 1;

export const clusterGridSizeFor = (level: number): number =>
  level <= MAP_DETAIL_PIN_LEVEL ? MAP_SAME_SPOT_GRID_SIZE : MAP_CLUSTER_GRID_SIZE;
