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
      <div role="tablist" aria-label="마이페이지" className="mt-10 flex gap-1 border-b border-line-subtle">
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
              className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                active ? "border-brand text-fg-heading" : "border-transparent text-fg-disabled hover:text-fg-body"
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
