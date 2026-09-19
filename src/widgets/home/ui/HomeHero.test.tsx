import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeHero } from "./HomeHero";
import { HOME_HERO_STATS } from "../config/constants";

describe("HomeHero", () => {
  it("헤드라인·설명·CTA와 지표를 렌더한다", () => {
    render(<HomeHero />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("꿈꾸는 집을 찾고");
    expect(screen.getByText(/한곳에서 모두 가능합니다/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /지금 신청/ })).toHaveAttribute("href", "/subscriptions");

    for (const stat of HOME_HERO_STATS) {
      expect(screen.getByText(stat.value)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });
});
