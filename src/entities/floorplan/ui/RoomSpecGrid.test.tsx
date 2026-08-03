import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomSpecGrid } from "./RoomSpecGrid";

describe("RoomSpecGrid", () => {
  it("방 이름·치수·면적을 모두 렌더한다", () => {
    render(
      <RoomSpecGrid
        rooms={[
          { name: "거실 / 식당", dimensions: "5.2 × 4.8m", area: "24.96㎡" },
          { name: "욕실 ×2", dimensions: "2.2 × 2.0m", area: "8.80㎡" }
        ]}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("거실 / 식당")).toBeInTheDocument();
    expect(screen.getByText("5.2 × 4.8m")).toBeInTheDocument();
    expect(screen.getByText("8.80㎡")).toBeInTheDocument();
  });

  it("방이 없으면 항목을 렌더하지 않는다", () => {
    render(<RoomSpecGrid rooms={[]} />);

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
