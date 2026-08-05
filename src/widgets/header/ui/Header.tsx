"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import icon from "@/shared/assets/brand/icon.png";
import { useCart } from "@/features/cart";
import { NAV_ITEMS } from "../config/nav";
import { NotificationPanel } from "./NotificationPanel";
import { ProfilePanel } from "./ProfilePanel";

type HeaderPanel = "notifications" | "profile" | null;

// figma 135:7847(로그인 후) / 170:2(로그인 전) 공통 헤더/GNB (ZB-U-COM-01/04)
export function Header({ authenticated = false }: { authenticated?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const [panel, setPanel] = useState<HeaderPanel>(null);
  const toggle = (next: Exclude<HeaderPanel, null>) => setPanel((p) => (p === next ? null : next));

  return (
    <header className="sticky top-0 z-40 border-b border-line-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* figma 353:3077(모바일 56) / 135:7849(PC 64) 상단: 로고 · 검색 · 액션 */}
        <div className="flex h-14 items-center gap-2.5 md:h-16 md:gap-6">
          {/* figma 353:3078 로고 — 모바일 28(r8) · PC 32(r12) */}
          <Link href="/" className="flex shrink-0 items-center gap-1.5 md:gap-2" aria-label="집보다 홈">
            <span className="relative size-7 shrink-0 overflow-hidden rounded-md md:size-8 md:rounded-lg">
              <Image src={icon} alt="" fill sizes="32px" priority className="object-contain" />
            </span>
            <span className="text-base font-bold text-fg-heading md:text-lg">집보다</span>
          </Link>

          {/* figma 353:3084(모바일 fill·입력만) / 135:7856(PC 512·아이콘 내부) */}
          <div className="flex flex-1 items-center md:relative md:w-full md:max-w-lg md:flex-none">
            <SearchIcon />
            <input
              type="search"
              aria-label="주택·가구 검색"
              placeholder="주택, 가구 검색..."
              className="h-8 w-full rounded-lg bg-surface-tertiary px-3 text-xs text-fg-strong outline-none transition-colors placeholder:text-fg-disabled focus:border-brand md:h-[42px] md:border md:border-line md:bg-surface-secondary md:pl-10 md:pr-4 md:text-sm"
            />
          </div>

          {/* figma 353:3091 액션 — 장바구니 + (로그인 후 아이콘 3개 / 로그인 전 로그인 버튼) */}
          {/* figma 353:3091 모바일은 알림·장바구니만 노출(순서도 PC와 반대). 찜·내 정보는 하단 탭으로 접근 */}
          <div className="flex shrink-0 items-center gap-1 md:ml-auto">
            <span className="order-2 inline-flex md:order-1">
              <CartButton />
            </span>
            {authenticated ? (
              <>
                <span className="hidden md:order-2 md:inline-flex">
                  <IconButton label="찜">
                    <HeartIcon />
                  </IconButton>
                </span>
                <div className="relative order-1 md:order-3">
                  <button type="button" onClick={() => toggle("notifications")} aria-label="알림" aria-expanded={panel === "notifications"} className="relative rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-secondary">
                    <BellIcon />
                    <span className="absolute right-2 top-2 size-2 rounded-full border border-surface bg-brand" />
                  </button>
                  {panel === "notifications" && (
                    <div className="absolute right-0 top-full z-50 mt-2">
                      <NotificationPanel />
                    </div>
                  )}
                </div>
                <div className="relative hidden md:order-4 md:block">
                  <button type="button" onClick={() => toggle("profile")} aria-label="내 정보" aria-expanded={panel === "profile"} className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-secondary">
                    <UserIcon />
                  </button>
                  {panel === "profile" && (
                    <div className="absolute right-0 top-full z-50 mt-2">
                      <ProfilePanel onNavigate={() => setPanel(null)} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-surface-secondary">
                로그인
              </Link>
            )}
          </div>
          {panel && <button type="button" aria-label="패널 닫기" tabIndex={-1} onClick={() => setPanel(null)} className="fixed inset-0 z-40 cursor-default" />}
        </div>

        {/* figma 135:7882 하단: 주 메뉴 — 모바일은 하단 탭(353:3101)이 대체 */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="주 메뉴">
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

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} className="relative rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-secondary">
      {children}
    </button>
  );
}

function CartButton() {
  const { count, open } = useCart();
  return (
    <button type="button" onClick={open} aria-label="장바구니" className="relative rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-secondary">
      <CartIcon />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-on">{count}</span>
      )}
    </button>
  );
}

function CartIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.67} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="hidden text-fg-disabled md:pointer-events-none md:absolute md:left-3.5 md:top-1/2 md:block md:-translate-y-1/2"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.67} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.67} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.67} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
