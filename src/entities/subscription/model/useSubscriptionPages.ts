"use client";

import { useState } from "react";
import type { SubscriptionPage } from "./types";

export type LoadSubscriptionPage = (page: number) => Promise<SubscriptionPage>;

/**
 * 첫 페이지는 서버가 그리고, 다음 페이지는 '더 보기'로 이어 붙인다.
 * 두 번 받는 사이에 공고가 새로 들어오면 페이지 경계가 밀려 같은 공고가 다시 올 수 있어 이미 받은 공고는 건너뛴다
 */
export function useSubscriptionPages(initialPage: SubscriptionPage, loadPage: LoadSubscriptionPage) {
  const [items, setItems] = useState(initialPage.items);
  const [last, setLast] = useState({ page: initialPage.page, pageSize: initialPage.pageSize, totalCount: initialPage.totalCount });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const loadMore = async () => {
    setStatus("loading");
    try {
      const next = await loadPage(last.page + 1);
      setItems((previous) => {
        const seen = new Set(previous.map((item) => item.id));
        return [...previous, ...next.items.filter((item) => !seen.has(item.id))];
      });
      setLast({ page: next.page, pageSize: next.pageSize, totalCount: next.totalCount });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return {
    items,
    totalCount: last.totalCount,
    hasMore: last.page * last.pageSize < last.totalCount,
    loading: status === "loading",
    failed: status === "error",
    loadMore
  };
}
