import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DdayBadge } from "./DdayBadge";

describe("DdayBadge", () => {
  it("마감 임박(D-7 이하)은 brand로 강조한다", () => {
    render(<DdayBadge dday={3} />);
    expect(screen.getByText("D-3")).toHaveClass("bg-brand");
  });

  it("여유가 있으면 중립색으로 표시한다", () => {
    render(<DdayBadge dday={8} />);
    expect(screen.getByText("D-8")).toHaveClass("bg-surface-tertiary");
  });

  it("타일형은 고정 크기 박스라 줄높이를 눌러 중앙 정렬한다", () => {
    render(<DdayBadge dday={3} variant="tile" />);
    const badge = screen.getByText("D-3");

    expect(badge).toHaveClass("h-16", "w-16", "leading-none");
  });

  it("태그형은 패딩으로 높이를 잡으므로 줄높이를 누르지 않는다", () => {
    render(<DdayBadge dday={3} variant="tag" />);
    const badge = screen.getByText("D-3");

    expect(badge).toHaveClass("px-5", "py-3");
    expect(badge).not.toHaveClass("leading-none");
  });

  it("태그형은 마감 여유 시 텍스트까지 흐리게 처리한다", () => {
    render(<DdayBadge dday={37} variant="tag" />);
    expect(screen.getByText("D-37")).toHaveClass("text-fg-disabled");
  });
});
