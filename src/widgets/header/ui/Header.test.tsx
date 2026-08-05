import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider } from "@/features/cart";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function renderHeader(authenticated = false) {
  return render(
    <CartProvider>
      <Header authenticated={authenticated} />
    </CartProvider>
  );
}

describe("Header", () => {
  it("로그인 전에는 로그인 버튼을 보이고 알림 버튼은 없다", () => {
    renderHeader(false);
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "알림" })).toBeNull();
  });

  it("로그인 후 알림 아이콘을 누르면 알림 패널이 열린다", () => {
    renderHeader(true);
    fireEvent.click(screen.getByRole("button", { name: "알림" }));
    expect(screen.getByRole("heading", { name: "알림" })).toBeInTheDocument();
    expect(screen.getByText(/광진 자양 LH 주택/)).toBeInTheDocument();
  });

  it("로그인 후 내 정보 아이콘을 누르면 프로필 패널이 열린다", () => {
    renderHeader(true);
    fireEvent.click(screen.getByRole("button", { name: "내 정보" }));
    expect(screen.getByText("김민지")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /설정/ })).toHaveAttribute("href", "/my/profile");
  });

  // figma 353:3077 — 모바일 액션은 알림·장바구니만, 순서는 알림 → 장바구니
  it("모바일에서는 찜·내 정보를 감춘다", () => {
    renderHeader(true);

    expect(screen.getByRole("button", { name: "찜" }).parentElement).toHaveClass("hidden", "md:inline-flex");
    expect(screen.getByRole("button", { name: "내 정보" }).parentElement).toHaveClass("hidden", "md:block");
  });

  it("모바일 액션 순서는 알림 → 장바구니다", () => {
    renderHeader(true);

    expect(screen.getByRole("button", { name: "알림" }).parentElement).toHaveClass("order-1", "md:order-3");
    expect(screen.getByRole("button", { name: "장바구니" }).parentElement).toHaveClass("order-2", "md:order-1");
  });

  // figma 353:3084 — 모바일 검색은 입력 pill만 노출(돋보기 노드 없음), PC는 입력 내부 아이콘
  it("검색 아이콘은 모바일에서 감추고 PC에서만 입력 안쪽에 둔다", () => {
    renderHeader(true);

    const input = screen.getByRole("searchbox", { name: "주택·가구 검색" });
    const icon = input.previousElementSibling as SVGElement;
    const iconClass = icon.getAttribute("class") ?? "";

    expect(icon.tagName.toLowerCase()).toBe("svg");
    expect(iconClass).toContain("hidden");
    expect(iconClass).toContain("md:block");
    expect(iconClass).toContain("md:absolute");
  });

  it("주 메뉴 행은 모바일에서 감춘다(하단 탭이 대체)", () => {
    renderHeader(true);

    expect(screen.getByRole("navigation", { name: "주 메뉴" })).toHaveClass("hidden", "md:flex");
  });
});
