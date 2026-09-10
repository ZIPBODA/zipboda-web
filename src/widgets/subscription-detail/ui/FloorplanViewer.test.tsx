import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FloorplanViewer } from "./FloorplanViewer";
import type { Floorplan } from "@/entities/floorplan";

const floorplan: Floorplan = {
  id: "fp-84a",
  subscriptionId: "1",
  size: 84,
  type: "A",
  has3d: true,
  image2dUrl: "/mock/floorplans/fp-1-84a.png",
  rooms: [{ name: "거실 / 식당", dimensions: "5.2 × 4.8m", area: "24.96㎡" }]
};

describe("FloorplanViewer", () => {
  it("평면도가 있으면 2D·3D 뷰어 진입 링크를 노출한다", () => {
    render(<FloorplanViewer floorplan={floorplan} subscriptionId="1" unitSize={84} />);

    expect(screen.getByText("평면도 뷰어")).toBeInTheDocument();
    expect(screen.getByText("2D 크게 보기").closest("a")).toHaveAttribute("href", "/subscriptions/1/floorplan?unit=84&view=2d");
    expect(screen.getByText("3D·1인칭 집구경 ↗").closest("a")).toHaveAttribute("href", "/subscriptions/1/floorplan?unit=84&view=3d");
    expect(screen.getByText("거실 / 식당")).toBeInTheDocument();
  });

  it("평면도가 없으면 준비 중 안내를 노출하고 방별 치수·링크를 감춘다", () => {
    render(<FloorplanViewer floorplan={null} subscriptionId="1" unitSize={84} />);

    expect(screen.getByText("평면도 준비 중")).toBeInTheDocument();
    expect(screen.queryByText("3D·1인칭 집구경 ↗")).not.toBeInTheDocument();
    expect(screen.queryByText("거실 / 식당")).not.toBeInTheDocument();
  });
});
