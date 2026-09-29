"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { rememberSubscriptionsReturn } from "@/entities/subscription";

/** 공고 상세의 '돌아가기'가 이 주소(필터·보기·지도 위치 포함)로 오도록 바뀔 때마다 적어 둔다 */
export function SubscriptionsReturnTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => rememberSubscriptionsReturn(search ? `${pathname}?${search}` : pathname), [pathname, search]);
  return null;
}
