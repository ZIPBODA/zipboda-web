export function cleanQuery(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeQuery(value: string | null | undefined): string {
  return cleanQuery(value).toLowerCase();
}

export function matchesSearchQuery(fields: readonly (string | null | undefined)[], query: string): boolean {
  const keyword = normalizeQuery(query);
  return !keyword || fields.some((field) => normalizeQuery(field).includes(keyword));
}
