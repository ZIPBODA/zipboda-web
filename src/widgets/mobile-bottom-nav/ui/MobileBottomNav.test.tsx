import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileBottomNav } from "./MobileBottomNav";
import { BOTTOM_NAV_ITEMS } from "../config/nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/subscriptions" }));

describe("MobileBottomNav", () => {
  it("하단 탭 5종을 렌더한다", () => {
    render(<MobileBottomNav />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    for (const item of BOTTOM_NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }
  });

  it("현재 경로 탭만 활성 표시한다", () => {
    render(<MobileBottomNav />);

    expect(screen.getByRole("link", { name: "청약" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute("aria-current");
  });

  it("768px 이상에서는 감춘다", () => {
    render(<MobileBottomNav />);

    expect(screen.getByRole("navigation", { name: "하단 내비게이션" })).toHaveClass("md:hidden");
  });
});
