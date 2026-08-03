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
  rooms: [{ name: "거실 / 식당", dimensions: "5.2 × 4.8m", area: "24.96㎡" }]
};

const hrefFor = () => "/subscriptions/1";

describe("FloorplanViewer", () => {
  it("2D 모드에서는 도면 라벨만 노출하고 3D 조작 UI는 감춘다", () => {
    render(<FloorplanViewer floorplan={floorplan} view="2D" viewpoint="1인칭" hrefFor={hrefFor} />);

    expect(screen.getByText("2D 건축 평면도")).toBeInTheDocument();
    expect(screen.queryByText("전체화면")).not.toBeInTheDocument();
    expect(screen.queryByText("드래그로 회전 · 스크롤로 확대/축소")).not.toBeInTheDocument();
  });

  it("3D 모드에서는 시점 전환·전체화면·조작 안내를 노출한다", () => {
    render(<FloorplanViewer floorplan={floorplan} view="3D" viewpoint="1인칭" hrefFor={hrefFor} />);

    expect(screen.getByText("전체화면")).toBeInTheDocument();
    expect(screen.getByText("1인칭")).toBeInTheDocument();
    expect(screen.getByText("3인칭")).toBeInTheDocument();
    expect(screen.getByText("드래그로 회전 · 스크롤로 확대/축소")).toBeInTheDocument();
    expect(screen.queryByText("2D 건축 평면도")).not.toBeInTheDocument();
  });

  it("선택된 시점을 aria-current로 표시한다", () => {
    render(<FloorplanViewer floorplan={floorplan} view="3D" viewpoint="3인칭" hrefFor={hrefFor} />);

    expect(screen.getByText("3인칭")).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("1인칭")).not.toHaveAttribute("aria-current");
  });

  it("평면도가 없으면 방별 치수를 렌더하지 않는다", () => {
    render(<FloorplanViewer floorplan={null} view="2D" viewpoint="1인칭" hrefFor={hrefFor} />);

    expect(screen.getByText("평면도 뷰어")).toBeInTheDocument();
    expect(screen.queryByText("거실 / 식당")).not.toBeInTheDocument();
  });
});
