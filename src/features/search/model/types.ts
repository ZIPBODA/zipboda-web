export type SearchEntry = {
  id: string;
  kind: "housing" | "product";
  name: string;
  href: string;
  description: string;
  context: string;
  fields: string[];
  price?: number;
};

/** 헤더 추천 — 순위대로 자른 추천과, 추천 밖까지 센 전체 결과 수 */
export type SearchSuggestions = {
  entries: SearchEntry[];
  totalCount: number;
};

/** signal이 끊기면 지난 검색어의 요청을 그만둔다 */
export type LoadSearchSuggestions = (query: string, signal: AbortSignal) => Promise<SearchSuggestions>;
