"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FILTER_ALL } from "@/entities/subscription";
import { MAP_FILTER_KEYS } from "../config/constants";

export function useSubscriptionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const navigate = (next: URLSearchParams) => router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  const update = (key: string, value: string, isDefault = value === FILTER_ALL || value === "") => {
    const next = new URLSearchParams(params.toString());
    if (isDefault) next.delete(key);
    else next.set(key, value);
    navigate(next);
  };
  const reset = () => {
    const next = new URLSearchParams(params.toString());
    MAP_FILTER_KEYS.forEach((key) => next.delete(key));
    navigate(next);
  };
  const listParams = new URLSearchParams(params.toString());
  listParams.set("view", "list");
  return { params, update, reset, listHref: `${pathname}?${listParams}` };
}
