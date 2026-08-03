import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubscriptionSummaryRow } from "./SubscriptionSummaryRow";
import type { Subscription } from "../model/types";

const item: Subscription = {
  id: "1",
  agency: "LH",
  title: "광진 자양 LH 주택",
  region: "서울",
  location: "서울 · 광진구",
  sizes: [59, 84],
  applicants: 1240,
  households: 480,
  competition: "12.4:1",
  moveIn: "2026년 3월",
  deadline: "2025년 8월 15일",
  dday: 3
};

describe("SubscriptionSummaryRow", () => {
  it("공고 요약과 마감 정보를 렌더한다", () => {
    render(<SubscriptionSummaryRow item={item} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/subscriptions/1");
    expect(screen.getByText("광진 자양 LH 주택")).toBeInTheDocument();
    expect(screen.getByText("서울 · 광진구")).toBeInTheDocument();
    expect(screen.getByText("59㎡")).toBeInTheDocument();
    expect(screen.getByText("84㎡")).toBeInTheDocument();
    expect(screen.getByText("1,240")).toBeInTheDocument();
    expect(screen.getByText("12.4:1")).toBeInTheDocument();
    expect(screen.getByText("2025년 8월 15일")).toBeInTheDocument();
    expect(screen.getByText("D-3")).toBeInTheDocument();
  });

  it("마감이 임박하면 D-day를 brand로 강조한다", () => {
    const { rerender } = render(<SubscriptionSummaryRow item={item} />);
    expect(screen.getByText("D-3")).toHaveClass("bg-brand");

    rerender(<SubscriptionSummaryRow item={{ ...item, dday: 37 }} />);
    expect(screen.getByText("D-37")).toHaveClass("bg-surface-tertiary");
  });
});
