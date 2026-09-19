import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocationCard } from "./LocationCard";

// 테스트 환경에는 앱키가 없어 항상 대체 표시가 그려진다 — 키 없는 로컬·CI와 같은 경로다.
// 지도 묶음은 CSR로 떼어 놓아 대체 표시가 다음 틱에 나타나므로 find*로 기다린다
describe("LocationCard", () => {
  it("좌표가 있으면 카카오맵으로 새 탭에서 연다", () => {
    render(<LocationCard title="강남개포동" coord={{ lat: 37.47, lng: 127.05 }} />);

    const link = screen.getByRole("link", { name: "지도 보기" });
    expect(link).toHaveAttribute("href", "https://map.kakao.com/link/map/%EA%B0%95%EB%82%A8%EA%B0%9C%ED%8F%AC%EB%8F%99,37.47,127.05");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("지도를 못 그려도 열어 볼 방법은 남긴다", async () => {
    render(<LocationCard title="강남개포동" coord={{ lat: 37.47, lng: 127.05 }} />);

    expect(screen.getByText("위치")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "카카오맵에서 보기" })).toBeInTheDocument();
  });

  it("좌표가 없어도 주소가 있으면 카카오맵 검색으로 연결한다", async () => {
    render(<LocationCard title="강남개포동" address="서울특별시 강남구 논현로12길 23-5" coord={null} />);

    const link = screen.getByRole("link", { name: "지도 보기" });
    expect(link).toHaveAttribute("href", "https://map.kakao.com/link/search/%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EB%85%BC%ED%98%84%EB%A1%9C12%EA%B8%B8%2023-5");
    expect(await screen.findByRole("link", { name: "카카오맵에서 보기" })).toBeInTheDocument();
  });

  it("좌표도 주소도 없으면 외부 링크를 걸지 않는다", async () => {
    const { container } = render(<LocationCard title="강남개포동" coord={null} />);

    expect(screen.queryByRole("link", { name: "지도 보기" })).not.toBeInTheDocument();
    await screen.findByText("위치 정보 준비 중");
    expect(container.querySelectorAll("a").length).toBe(0);
  });
});
