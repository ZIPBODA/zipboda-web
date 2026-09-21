"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { SEARCH_KIND_LABEL } from "../config/constants";
import { cleanQuery, getSuggestions, searchAll, searchHref } from "../lib/search";
import type { SearchEntry } from "../model/types";

type SearchInputProps = {
  index: readonly SearchEntry[];
  icon: ReactNode;
  blocked?: boolean;
  onActivate: () => void;
};

export function SearchInput(props: SearchInputProps) {
  return (
    <Suspense fallback={<SearchField {...props} initialQuery="" />}>
      <UrlSearchInput {...props} />
    </Suspense>
  );
}

function UrlSearchInput(props: SearchInputProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = pathname === "/search" ? cleanQuery(params.get("q")) : "";
  return <SearchField key={`${pathname}?${params.toString()}`} {...props} initialQuery={query} />;
}

function SearchField({ index, icon, blocked, onActivate, initialQuery }: SearchInputProps & { initialQuery: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const composing = useRef(false);
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const results = useMemo(() => searchAll(index, query), [index, query]);
  const suggestions = getSuggestions(results);
  const open = expanded && !blocked && Boolean(cleanQuery(query));
  const selected = open ? suggestions[selectedIndex] : undefined;

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    if (open && selectedIndex >= 0) {
      document.getElementById(`${listId}-${selectedIndex}`)?.scrollIntoView?.({ block: "nearest" });
    }
  }, [listId, open, selectedIndex]);

  const navigate = (href: string) => {
    setExpanded(false);
    setSelectedIndex(-1);
    router.push(href);
  };

  return (
    <form
      ref={rootRef}
      role="search"
      className="flex min-w-0 flex-1 items-center md:relative md:max-w-lg"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setExpanded(false);
          setSelectedIndex(-1);
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!composing.current && cleanQuery(query)) navigate(selected?.href ?? searchHref(query));
      }}
    >
      {icon}
      <input
        type="search"
        role="combobox"
        name="q"
        autoComplete="off"
        aria-label="주택·가구 검색"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={selected ? `${listId}-${selectedIndex}` : undefined}
        placeholder="주택, 가구 검색..."
        value={query}
        onFocus={() => { onActivate(); setExpanded(true); }}
        onClick={() => { onActivate(); setExpanded(true); }}
        onChange={(event) => { setQuery(event.target.value); setSelectedIndex(-1); setExpanded(true); }}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={(event) => {
          if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === "Escape") {
            event.preventDefault();
            setExpanded(false);
            setSelectedIndex(-1);
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setExpanded(true);
            if (suggestions.length) {
              const direction = event.key === "ArrowDown" ? 1 : -1;
              setSelectedIndex((previous) => !open || previous < 0
                ? direction === 1 ? 0 : suggestions.length - 1
                : (previous + direction + suggestions.length) % suggestions.length);
            }
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (cleanQuery(query)) navigate(selected?.href ?? searchHref(query));
          }
        }}
        className="h-8 w-full min-w-0 rounded-lg bg-surface-tertiary px-3 text-xs text-fg-strong outline-none transition-colors placeholder:text-fg-disabled focus:border-brand md:h-[42px] md:border md:border-line md:bg-surface-secondary md:pl-10 md:pr-4 md:text-sm"
      />
      {open && (
        <div className="fixed inset-x-4 top-14 z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-lg md:absolute md:inset-x-0 md:top-full md:mt-2">
          <div className="max-h-[50dvh] overflow-y-auto overscroll-contain md:max-h-96">
            <p role="status" className="px-4 py-2 text-xs text-fg-muted">
              {results.length ? `검색 결과 ${results.length}건 · 추천 ${suggestions.length}건` : "검색 결과가 없습니다. 다른 검색어로 검색해보세요."}
            </p>
            <ul id={listId} role="listbox" aria-label="검색 추천">
              {suggestions.map((item, position) => (
                <li
                  key={`${item.kind}:${item.id}`}
                  id={`${listId}-${position}`}
                  role="option"
                  aria-selected={selectedIndex === position}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigate(item.href)}
                  className={`cursor-pointer px-4 py-3 text-sm hover:bg-surface-secondary ${selectedIndex === position ? "bg-surface-tertiary" : ""}`}
                >
                  <span className="text-xs font-semibold text-fg-muted">{SEARCH_KIND_LABEL[item.kind]}</span>
                  <p className="break-words font-semibold text-fg-heading">{item.name}</p>
                  <p className="mt-1 break-words text-xs text-fg-muted">{item.description}</p>
                  {item.context && <p className="mt-1 text-xs text-fg-muted">{item.context}</p>}
                  {item.price !== undefined && <p className="mt-1 text-xs font-semibold text-fg-heading">{item.price.toLocaleString("ko-KR")}원</p>}
                </li>
              ))}
            </ul>
          </div>
          <Link href={searchHref(query)} onClick={() => { setExpanded(false); setSelectedIndex(-1); }} className="block truncate border-t border-line-subtle px-4 py-3 text-sm font-semibold text-fg-heading hover:bg-surface-secondary">
            ‘{cleanQuery(query)}’ 검색 결과 전체보기
          </Link>
        </div>
      )}
    </form>
  );
}
