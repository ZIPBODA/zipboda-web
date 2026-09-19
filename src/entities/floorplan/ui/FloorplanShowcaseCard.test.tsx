import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FloorplanShowcaseCard } from "./FloorplanShowcaseCard";

const item = { id: "fp-84a", size: 84, type: "A", summary: "방3 · 화장실2 · 거실/식당 통합", has2d: true, has3d: true, image: "/mock/main/main-interactive-1.png" };

describe("FloorplanShowcaseCard", () => {
  it("2D와 3D 링크가 선택한 호실을 유지한다", () => {
    const href = "/subscriptions/gangnam-gaepo/floorplan?unit=gangnam-gaepo-2-3-01";
    render(<FloorplanShowcaseCard item={{ ...item, title: "강남개포동", href }} />);
    expect(screen.getByRole("link", { name: "2D 도면 보기" })).toHaveAttribute("href", href + "&view=2d");
    expect(screen.getByRole("link", { name: "3D 탐색 →" })).toHaveAttribute("href", href + "&view=3d");
    expect(screen.getByRole("link", { name: "강남개포동 평면도 탐색" })).toHaveAttribute("href", href + "&view=3d");
  });
  it("평형·구성과 2D/3D 지원을 표시한다", () => {
    render(<FloorplanShowcaseCard item={item} />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("84㎡ A타입");
    expect(screen.getByText("방3 · 화장실2 · 거실/식당 통합")).toBeInTheDocument();
    expect(screen.getByText("2D")).toBeInTheDocument();
    expect(screen.getByText("3D")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "3D 탐색 →" })).toBeInTheDocument();
  });

  it("3D 미지원 평면도는 3D 배지를 감춘다", () => {
    render(<FloorplanShowcaseCard item={{ ...item, has3d: false }} />);

    expect(screen.getByText("2D")).toBeInTheDocument();
    expect(screen.queryByText("3D")).not.toBeInTheDocument();
  });
});
