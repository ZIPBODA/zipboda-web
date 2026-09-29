import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { rememberSubscriptionsReturn } from "../lib/returnHref";
import { SubscriptionsBackLink } from "./SubscriptionsBackLink";

afterEach(() => sessionStorage.clear());

describe("청약 화면으로 돌아가기", () => {
  it("마지막으로 보던 지도(필터·위치 포함)로 돌아간다", async () => {
    rememberSubscriptionsReturn("/subscriptions?agency=LH&lat=37.5&lng=127&zoom=5");
    render(<SubscriptionsBackLink ariaLabel="목록으로 돌아가기">←</SubscriptionsBackLink>);
    expect(await screen.findByRole("link", { name: "목록으로 돌아가기" })).toHaveAttribute("href", "/subscriptions?agency=LH&lat=37.5&lng=127&zoom=5");
  });

  it("처음 들어온 상세라면 청약 첫 화면으로 간다", () => {
    render(<SubscriptionsBackLink ariaLabel="목록으로 돌아가기">←</SubscriptionsBackLink>);
    expect(screen.getByRole("link", { name: "목록으로 돌아가기" })).toHaveAttribute("href", "/subscriptions");
  });
});
