"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/shared/assets/brand/logo.png";
import { NAV_ITEMS } from "../config/nav";

// figma 135:7846(로그인 후) / 170:2(로그인 전) 공통 헤더/GNB (ZB-U-COM-01/04)
export function Header({ authenticated = false }: { authenticated?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line-subtle bg-surface">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* 상단: 로고 · 검색 · 액션 */}
        <div className="flex h-16 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center" aria-label="집보다 홈">
            <Image src={logo} alt="집보다" priority className="h-8 w-auto" />
          </Link>

          <div className="relative hidden min-w-0 flex-1 md:block">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-disabled"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              aria-label="통합 검색"
              placeholder="주택, 가구 검색..."
              className="h-[42px] w-full rounded-lg border border-line bg-surface-secondary pl-10 pr-4 text-sm text-fg-strong outline-none transition-colors placeholder:text-fg-disabled focus:border-brand"
            />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {authenticated ? (
              <>
                <button type="button" aria-label="알림" className="relative rounded-lg p-2 text-fg-muted hover:bg-surface-secondary">
                  <BellIcon />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full border border-surface bg-brand" />
                </button>
                <button type="button" aria-label="내 정보" className="rounded-lg p-2 text-fg-muted hover:bg-surface-secondary">
                  <UserIcon />
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-surface-secondary">
                로그인
              </Link>
            )}
          </div>
        </div>

        {/* 하단: 주 메뉴 */}
        <nav className="flex items-center gap-0.5" aria-label="주 메뉴">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active ? "border-brand text-fg-heading" : "border-transparent text-fg-muted hover:text-fg-body"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
