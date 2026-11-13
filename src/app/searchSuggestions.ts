import { searchSubscriptions } from "@/entities/subscription";
import {
  SUGGESTION_LIMIT,
  cleanQuery,
  getSuggestions,
  mergeSearchResults,
  searchAll,
  toHousingSearchEntry,
  type SearchSuggestions
} from "@/features/search";
import { getProductSearchData } from "./searchData";

/** 헤더 추천 — 공공주택은 API가 순위대로 찾은 앞 몇 건을, 가구는 web에서 찾은 결과를 한 순위로 섞어 상위만 준다 */
export async function loadSearchSuggestions(query: string): Promise<SearchSuggestions> {
  const keyword = cleanQuery(query);
  if (!keyword) return { entries: [], totalCount: 0 };
  const [housing, { index }] = await Promise.all([
    searchSubscriptions(keyword, { pageSize: SUGGESTION_LIMIT }),
    getProductSearchData()
  ]);
  const products = searchAll(index, keyword);
  return {
    entries: getSuggestions(mergeSearchResults(housing.items.map(toHousingSearchEntry), products, keyword)),
    totalCount: housing.totalCount + products.length
  };
}
