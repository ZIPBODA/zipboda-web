import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeSection } from "./HomeSection";

describe("HomeSection", () => {
  it("이동 대상이 있으면 전체보기를 링크로 렌더한다", () => {
    render(
      <HomeSection title="LH/SH 공공 청약" description="최신 청약 마감일" actionLabel="전체 보기" actionHref="/subscriptions">
        <p>콘텐츠</p>
      </HomeSection>
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("LH/SH 공공 청약");
    expect(screen.getByRole("link", { name: /전체 보기/ })).toHaveAttribute("href", "/subscriptions");
  });

  it("이동 대상이 없으면 링크로 만들지 않는다", () => {
    render(
      <HomeSection title="인터랙티브 평면도" description="2D & 3D 미리보기" actionLabel="전체 보기">
        <p>콘텐츠</p>
      </HomeSection>
    );

    expect(screen.getByText("전체 보기")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
