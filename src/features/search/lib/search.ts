import { SUGGESTION_LIMIT } from "../config/constants";
import type { SearchEntry } from "../model/types";
import { cleanQuery, normalizeQuery } from "@/shared/lib/searchQuery";

export { cleanQuery, normalizeQuery } from "@/shared/lib/searchQuery";

/** 이름이 검색어와 같음 → 검색어로 시작 → 검색어를 품음 → 다른 필드만 맞음. API 통합 검색(API-095)과 같은 순위다 */
const SEARCH_RANK = { SAME_NAME: 0, NAME_PREFIX: 1, IN_NAME: 2, OTHER_FIELD: 3, NO_MATCH: -1 } as const;

const searchRankOf = (entry: SearchEntry, keyword: string): number => {
  const name = normalizeQuery(entry.name);
  if (name === keyword) return SEARCH_RANK.SAME_NAME;
  if (name.startsWith(keyword)) return SEARCH_RANK.NAME_PREFIX;
  if (name.includes(keyword)) return SEARCH_RANK.IN_NAME;
  return entry.fields.some((field) => normalizeQuery(field).includes(keyword)) ? SEARCH_RANK.OTHER_FIELD : SEARCH_RANK.NO_MATCH;
};

const housingRankOf = (entry: SearchEntry, keyword: string): number => {
  const rank = searchRankOf(entry, keyword);
  return rank === SEARCH_RANK.NO_MATCH ? SEARCH_RANK.OTHER_FIELD : rank;
};

const byRank = (ranked: { entry: SearchEntry; rank: number }[]): SearchEntry[] =>
  ranked.sort((a, b) => a.rank - b.rank).map(({ entry }) => entry);

export function searchHref(query: string): string {
  return `/search?${new URLSearchParams({ q: cleanQuery(query) })}`;
}

export function searchAll(index: readonly SearchEntry[], query: string | null | undefined): SearchEntry[] {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];
  return byRank(index.map((entry) => ({ entry, rank: searchRankOf(entry, keyword) })).filter(({ rank }) => rank >= 0));
}

/**
 * API가 찾은 공고(이미 순위대로)와 web에서 찾은 결과를 한 순위로 섞는다. 같은 순위면 공고가 앞이다.
 * 공고는 web이 모르는 필드(공고명·시군구)로 맞았을 수 있어, 이름으로 순위를 못 매기면 '다른 필드'로 둔다
 */
export function mergeSearchResults(housing: readonly SearchEntry[], others: readonly SearchEntry[], query: string): SearchEntry[] {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];
  return byRank([
    ...housing.map((entry) => ({ entry, rank: housingRankOf(entry, keyword) })),
    ...others.map((entry) => ({ entry, rank: searchRankOf(entry, keyword) })).filter(({ rank }) => rank >= 0)
  ]);
}

export function getSuggestions(results: readonly SearchEntry[]): SearchEntry[] {
  return results.slice(0, SUGGESTION_LIMIT);
}
