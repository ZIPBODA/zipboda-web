import { SEARCH_SUGGESTIONS_PATH } from "../config/constants";
import type { SearchEntry, SearchSuggestions } from "../model/types";

const isSearchEntry = (value: unknown): value is SearchEntry =>
  typeof value === "object" && value !== null &&
  "id" in value && typeof value.id === "string" &&
  "name" in value && typeof value.name === "string" &&
  "href" in value && typeof value.href === "string";

const isSearchSuggestions = (body: unknown): body is SearchSuggestions =>
  typeof body === "object" && body !== null &&
  "totalCount" in body && typeof body.totalCount === "number" &&
  "entries" in body && Array.isArray(body.entries) && body.entries.every(isSearchEntry);

export async function fetchSearchSuggestions(query: string, signal: AbortSignal): Promise<SearchSuggestions> {
  const response = await fetch(`${SEARCH_SUGGESTIONS_PATH}?${new URLSearchParams({ q: query })}`, { signal });
  if (!response.ok) throw new Error(`검색 추천을 받지 못했습니다(${response.status})`);
  const body: unknown = await response.json();
  if (!isSearchSuggestions(body)) throw new Error("검색 추천 응답 모양이 다릅니다");
  return body;
}
