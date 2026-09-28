import { SUGGESTION_LIMIT } from "../config/constants";
import type { SearchEntry } from "../model/types";
import { cleanQuery, normalizeQuery } from "@/shared/lib/searchQuery";

export { cleanQuery, normalizeQuery } from "@/shared/lib/searchQuery";

export function searchHref(query: string): string {
  return `/search?${new URLSearchParams({ q: cleanQuery(query) })}`;
}

export function searchAll(index: readonly SearchEntry[], query: string | null | undefined): SearchEntry[] {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  return index.map((entry) => {
    const name = normalizeQuery(entry.name);
    const rank = name === keyword ? 0 : name.startsWith(keyword) ? 1 : name.includes(keyword) ? 2
      : entry.fields.some((field) => normalizeQuery(field).includes(keyword)) ? 3 : -1;
    return { entry, rank };
  }).filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ entry }) => entry);
}

export function getSuggestions(results: readonly SearchEntry[]): SearchEntry[] {
  return results.slice(0, SUGGESTION_LIMIT);
}
