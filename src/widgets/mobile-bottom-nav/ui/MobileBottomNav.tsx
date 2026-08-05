"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS, type BottomNavIcon } from "../config/nav";

// figma 353:3101 하단 탭 내비게이션(ZB-U-COM-02) — 767px 이하에서만 노출
export function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="하단 내비게이션"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-subtle bg-surface md:hidden"
    >
      <ul className="flex">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 ${active ? "text-brand" : "text-fg-disabled"}`}
              >
                <NavIcon name={item.icon} />
                <span className="text-caption font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const ICON_PATHS: Record<BottomNavIcon, React.ReactNode> = {
  home: (
    <>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
    </>
  ),
  subscription: (
    <>
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M9 21v-6h6v6" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </>
  ),
  shop: (
    <>
      <path d="M4 8h16l-1.2 12H5.2L4 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  community: (
    <>
      <path d="M21 12a8 8 0 1 1-3.2-6.4" />
      <path d="M21 4v5h-5" />
      <path d="M8 12h8M8 16h5" />
    </>
  ),
  my: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  )
};

function NavIcon({ name }: { name: BottomNavIcon }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
