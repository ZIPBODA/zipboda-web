export const SUGGESTION_LIMIT = 8;
export const SEARCH_KIND_LABEL = { housing: "주택", product: "가구" } as const;

/** 타자를 칠 때마다 서버에 묻지 않고, 입력이 이만큼 멈추면 추천을 받는다 */
export const SUGGESTION_DEBOUNCE_MS = 200;

/** 헤더 추천을 주는 web 경로(app/search/suggestions/route.ts) */
export const SEARCH_SUGGESTIONS_PATH = "/search/suggestions";
