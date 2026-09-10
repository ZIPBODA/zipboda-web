"use client";

import { useState } from "react";
import { MY_TABS, type MyTabId } from "../config/constants";
import { MySubscriptionList } from "./MySubscriptionList";
import { WishlistGrid } from "./WishlistGrid";
import { OrderList } from "./OrderList";
import type { MyListing, WishlistItem, Order } from "../model/types";

// figma 135:1556 마이페이지 탭 — 한 페이지 안에서 콘텐츠 전환(별도 라우트 아님)
export function MyPageContent({ listings, wishlist, orders }: { listings: MyListing[]; wishlist: WishlistItem[]; orders: Order[] }) {
  const [tab, setTab] = useState<MyTabId>("subscriptions");

  return (
    <>
      {/* figma PC 135:1556(언더라인) / Mobile 419:9037(pill 세그먼트) 탭 */}
      <div
        role="tablist"
        aria-label="마이페이지"
        className="mt-6 flex gap-1 rounded-xl bg-surface-tertiary p-1 md:mt-10 md:rounded-none md:border-b md:border-line-subtle md:bg-transparent md:p-0"
      >
        {MY_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`my-tab-${t.id}`}
              aria-selected={active}
              aria-controls={`my-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors md:flex-none md:rounded-none md:border-b-2 md:px-5 md:py-3 md:text-sm ${
                active
                  ? "bg-surface text-fg-heading shadow-sm md:border-brand md:bg-transparent md:shadow-none"
                  : "text-fg-disabled md:border-transparent md:hover:text-fg-body"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`my-panel-${tab}`} aria-labelledby={`my-tab-${tab}`}>
        {tab === "subscriptions" && <MySubscriptionList items={listings} />}
        {tab === "wishlist" && <WishlistGrid items={wishlist} />}
        {tab === "orders" && <OrderList items={orders} />}
      </div>
    </>
  );
}
