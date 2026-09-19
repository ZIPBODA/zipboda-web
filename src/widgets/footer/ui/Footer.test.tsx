import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  // figma 353:2974 — 모바일에도 푸터가 있다(브랜드+태그라인+하단만). 숨기면 안 된다
  it("모바일에서도 노출한다", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).not.toHaveClass("hidden");
    expect(footer).toHaveClass("bg-surface-dark");
  });

  it("링크 컬럼(주택·쇼핑)은 PC에서만 노출한다", () => {
    render(<Footer />);

    for (const label of ["주택", "쇼핑"]) {
      expect(screen.getByRole("navigation", { name: label })).toHaveClass("hidden", "md:block");
    }
  });

  it("브랜드·태그라인·저작권은 공통으로 노출한다", () => {
    render(<Footer />);

    expect(screen.getByText("집보다")).toBeInTheDocument();
    expect(screen.getByText(/대한민국 대표 주거 플랫폼/)).toBeInTheDocument();
    expect(screen.getByText(/© 2026 집보다 Inc\./)).toBeInTheDocument();
  });

  it("영어 항목은 PC에서만 노출한다(모바일 디자인 미포함)", () => {
    render(<Footer />);

    expect(screen.getByText("🇰🇷 한국어")).toBeInTheDocument();
    expect(screen.getByText("🌐 영어")).toHaveClass("hidden", "md:inline");
  });
});
