export { SearchInput } from "./ui/SearchInput";
export { SearchHousingResults } from "./ui/SearchHousingResults";
export { cleanQuery, normalizeQuery, searchAll, mergeSearchResults, getSuggestions, searchHref } from "./lib/search";
export { createProductSearchIndex, toHousingSearchEntry } from "./lib/createSearchIndex";
export { SUGGESTION_LIMIT } from "./config/constants";
export type { SearchEntry, SearchSuggestions, LoadSearchSuggestions } from "./model/types";
