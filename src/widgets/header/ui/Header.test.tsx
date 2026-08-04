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
});
