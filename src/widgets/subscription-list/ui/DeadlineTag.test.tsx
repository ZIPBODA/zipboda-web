import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeadlineTag } from "./DeadlineTag";

describe("마감 태그", () => {
  it("마감이 가까우면 브랜드 색으로 D-day와 마감일을 함께 적는다", () => {
    render(<DeadlineTag dday={1} deadline="2026년 9월 30일" />);
    expect(screen.getByText("D-1 · 2026년 9월 30일 마감")).toHaveClass("bg-amber-100", "text-brand-dark");
  });

  it("여유가 있으면 차분한 회색, 지난 공고는 흐리게 둔다", () => {
    const { rerender } = render(<DeadlineTag dday={30} deadline={null} />);
    expect(screen.getByText("D-30")).toHaveClass("bg-surface-tertiary", "text-fg-body");
    rerender(<DeadlineTag dday={-2} deadline="2026년 9월 1일" />);
    expect(screen.getByText("마감 · 2026년 9월 1일 마감")).toHaveClass("text-fg-muted");
  });

  it("알 수 있는 것이 없으면 그리지 않는다", () => {
    const { container } = render(<DeadlineTag dday={null} deadline={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
