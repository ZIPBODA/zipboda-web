import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailTopBar } from "./DetailTopBar";

describe("DetailTopBar", () => {
  it("목록 복귀 링크와 현재 평형·배지를 렌더한다", () => {
    render(
      <DetailTopBar title="광진 자양 LH 주택" unitLabel="84㎡ A타입" dday={3} agency="LH" agencyLabel="LH 공공" />
    );

    expect(screen.getByRole("link", { name: /목록으로 돌아가기/ })).toHaveAttribute("href", "/subscriptions");
    expect(screen.getByText("광진 자양 LH 주택 · 84㎡ A타입")).toBeInTheDocument();
    expect(screen.getByText("D-3")).toBeInTheDocument();
    expect(screen.getByText("LH 공공")).toBeInTheDocument();
  });
});
