import { ORDER_STATUS_TONE } from "../config/constants";
import type { Order } from "../model/types";

// figma 135:2095 주문내역 리스트
export function OrderList({ items }: { items: Order[] }) {
  return (
    <div className="mt-7 flex flex-col gap-3.5">
      {items.map((order) => (
        <div key={order.id} className="flex items-center gap-4 rounded-xl border border-line-subtle bg-surface p-5">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-surface-tertiary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-fg-disabled">{order.brand}</p>
            <p className="mt-0.5 text-base font-semibold text-fg-heading">{order.name}</p>
            <p className="mt-0.5 text-xs text-fg-disabled">{order.orderDate}</p>
          </div>
          <div className="flex w-[220px] shrink-0 flex-col items-end gap-3">
            <p className="text-sm font-bold text-fg-heading">{order.price.toLocaleString()}원</p>
            <p className={`text-xs font-semibold ${ORDER_STATUS_TONE[order.status]}`}>{order.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
