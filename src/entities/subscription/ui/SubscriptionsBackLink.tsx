"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { SUBSCRIPTIONS_PATH } from "../config/constants";
import { readSubscriptionsReturn } from "../lib/returnHref";

/** 마지막으로 보던 지도·목록(필터·지도 위치 포함)으로 돌아간다. 서버에서는 기억을 모르므로 첫 화면 주소로 그린다 */
export function SubscriptionsBackLink({ className, ariaLabel, children }: { className?: string; ariaLabel: string; children: ReactNode }) {
  const [href, setHref] = useState(SUBSCRIPTIONS_PATH);
  useEffect(() => setHref(readSubscriptionsReturn()), []);
  return <Link href={href} aria-label={ariaLabel} className={className}>{children}</Link>;
}
