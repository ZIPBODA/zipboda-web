"use client";

import { useEffect, useRef, useState } from "react";
import { FILTER_ALL, type SubscriptionFilterOptions } from "@/entities/subscription";
import { Button, Input, cn } from "@/shared/ui";
import { cleanQuery } from "@/shared/lib/searchQuery";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";
import { ListViewToggle } from "./ListViewToggle";

export function SubscriptionMapToolbar({ options }: { options: SubscriptionFilterOptions }) {
  const { params, update, reset } = useSubscriptionFilters();
  const query = params.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  // 모바일은 지도를 넓게 쓰려고 검색창을 접어 둔다. 검색어를 들고 들어오면 펼쳐서 보여준다
  const [searchOpen, setSearchOpen] = useState(query !== "");
  const searchForm = useRef<HTMLFormElement>(null);
  // 사용자가 펼칠 때만 입력으로 옮긴다. 검색어를 들고 들어온 첫 화면에서 초점을 빼앗지 않는다
  const toggleSearch = () => {
    const opening = !searchOpen;
    setSearchOpen(opening);
    if (opening) requestAnimationFrame(() => searchForm.current?.querySelector("input")?.focus({ preventScroll: true }));
  };
  const groups = [
    { key: "region", label: "지역", options: options.regions.map((value) => ({ value, label: value })) },
    { key: "size", label: "면적", options: options.sizeRanges },
    { key: "agency", label: "공급기관", options: options.agencies.map((value) => ({ value, label: value })) },
    { key: "status", label: "모집 상태", options: [FILTER_ALL, ...(options.statuses ?? [])].map((value) => ({ value, label: value })) }
  ];

  return (
    <div className="map-workspace-toolbar absolute inset-x-0 top-0 z-20 flex flex-col gap-2 rounded-2xl border border-line-subtle bg-surface p-2 shadow-sm">
      <form ref={searchForm} id="map-workspace-search" role="search" aria-label="공공주택 지도 검색" className={cn("flex min-w-0 flex-1 items-center gap-1", !searchOpen && "max-md:hidden")} onSubmit={(event) => {
        event.preventDefault();
        const next = cleanQuery(draft);
        setDraft(next);
        update("q", next);
      }}>
        <Input aria-label="지역, 주택명 검색" placeholder="지역, 주택명 검색" value={draft} onChange={(event) => setDraft(event.target.value)} className="h-11 min-w-0 flex-1" />
        <Button type="submit" size="sm" variant="secondary" className="min-h-11 shrink-0">검색</Button>
        <Button type="button" size="sm" variant="ghost" className="min-h-11 shrink-0" onClick={() => { setDraft(""); reset(); }}>초기화</Button>
      </form>
      <div className="map-workspace-filters flex min-w-0 items-center gap-1">
        <Button type="button" size="sm" variant={searchOpen || query ? "secondary" : "ghost"} aria-label={searchOpen ? "검색 닫기" : "검색 열기"} aria-expanded={searchOpen} aria-controls="map-workspace-search"
          onClick={toggleSearch} className="min-h-11 min-w-11 shrink-0 !px-0 md:hidden"><SearchIcon /></Button>
        {/* 필터가 넘치면 필터만 옆으로 밀리고 보기 전환은 늘 보인다 */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="지도 필터">
          {groups.map((group) => (
            <select key={group.key} aria-label={group.label} value={params.get(group.key) ?? FILTER_ALL} onChange={(event) => update(group.key, event.target.value)}
              className={cn("h-11 min-w-0 shrink-0 rounded-lg border px-2 text-xs font-semibold focus-visible:outline-brand", params.has(group.key) ? "border-brand bg-brand text-brand-on" : "border-line bg-surface text-fg-body")}>
              {group.options.map((option) => <option key={option.value} value={option.value}>{option.value === FILTER_ALL ? group.label : option.label}</option>)}
              {params.has(group.key) && !group.options.some((option) => option.value === params.get(group.key)) && <option value={params.get(group.key)!}>{params.get(group.key)}</option>}
            </select>
          ))}
        </div>
        <ListViewToggle searchParams={Object.fromEntries(params.entries())} view="map" placement="toolbar" />
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
