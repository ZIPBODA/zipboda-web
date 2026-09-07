import Image from "next/image";
import { ORDER_STATUS_TONE } from "../config/constants";
import type { Order } from "../model/types";

// figma 135:2095 주문내역 리스트
export function OrderList({ items }: { items: Order[] }) {
  return (
    <div className="mt-5 flex flex-col gap-3 md:mt-7 md:gap-3.5">
      {items.map((order) => (
        <div key={order.id} className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface p-4 md:gap-4 md:p-5">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-tertiary md:size-16">
            <Image src={order.image} alt="" fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-fg-disabled">{order.brand}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-fg-heading md:text-base">{order.name}</p>
            <p className="mt-0.5 text-2xsmall text-fg-disabled md:text-xs">{order.orderDate}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 md:w-[220px] md:gap-3">
            <p className="whitespace-nowrap text-sm font-bold text-fg-heading">{order.price.toLocaleString()}원</p>
            <p className={`text-xs font-semibold ${ORDER_STATUS_TONE[order.status]}`}>{order.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
