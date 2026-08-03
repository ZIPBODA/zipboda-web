import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeCategories } from "./HomeCategories";
import { HOME_CATEGORIES } from "../config/constants";

describe("HomeCategories", () => {
  it("카테고리 6종을 라벨·설명과 함께 렌더한다", () => {
    render(<HomeCategories />);

    expect(screen.getAllByRole("listitem")).toHaveLength(HOME_CATEGORIES.length);
    for (const category of HOME_CATEGORIES) {
      expect(screen.getByText(category.label)).toBeInTheDocument();
      expect(screen.getByText(category.description)).toBeInTheDocument();
    }
  });
});
