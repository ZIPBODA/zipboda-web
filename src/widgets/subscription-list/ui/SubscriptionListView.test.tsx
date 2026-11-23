import { describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Subscription, SubscriptionPage } from "@/entities/subscription";
import { SubscriptionListView } from "./SubscriptionListView";

vi.mock("next/link", () => ({ default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} /> }));

const item = (id: string): Subscription => ({
  id, title: `공고 ${id}`, agency: "LH", region: "서울", location: "서울 노원구", sizes: [16.3], applicants: null, households: null,
  competition: null, moveIn: null, deadline: null, dday: null, image: null
});
const pageOf = (page: number, ids: string[], totalCount: number): SubscriptionPage => ({ items: ids.map(item), page, pageSize: 2, totalCount });

describe("목록 화면 더 보기", () => {
  it("'더 보기'를 누르면 다음 페이지를 이어 그리고, 다 보이면 버튼을 거둔다", async () => {
    const loadPage = vi.fn(async () => pageOf(2, ["c"], 3));
    render(<SubscriptionListView initialPage={pageOf(1, ["a", "b"], 3)} loadPage={loadPage} />);
    // PC·모바일 카드를 함께 그려 제목이 두 벌이다
    expect(screen.getAllByText("공고 b")).toHaveLength(2);
    expect(screen.queryByText("공고 c")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));
    expect(await screen.findAllByText("공고 c")).toHaveLength(2);
    expect(loadPage).toHaveBeenCalledWith(2);
    expect(screen.queryByRole("button", { name: "더 보기" })).toBeNull();
  });

  it("더 받지 못하면 알리고 다시 시도할 수 있다", async () => {
    const loadPage = vi.fn().mockRejectedValueOnce(new Error("API down")).mockResolvedValue(pageOf(2, ["c"], 3));
    render(<SubscriptionListView initialPage={pageOf(1, ["a", "b"], 3)} loadPage={loadPage} />);
    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("공고를 더 불러오지 못했습니다");
    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));
    expect(await screen.findAllByText("공고 c")).toHaveLength(2);
  });

  // 첫 모바일 카드 사진이 목록 화면의 LCP다. PC에서는 그 카드가 숨어 있어 모바일 폭에서만 미리 받는다
  it("첫 카드 사진을 모바일 폭에서만 미리 받고, 사진 자체는 늦게 받기(lazy)를 그대로 둔다", () => {
    const first = { ...item("a"), image: "https://apply.lh.or.kr/upload/a.jpg" };
    render(<SubscriptionListView initialPage={{ items: [first, item("b")], page: 1, pageSize: 2, totalCount: 2 }} loadPage={vi.fn()} />);
    const preloads = [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]')];
    expect(preloads).toHaveLength(1);
    expect(preloads[0]).toHaveAttribute("media", "(max-width: 767px)");
    expect(preloads[0].getAttribute("imagesrcset")).toContain(encodeURIComponent(first.image));
    expect(preloads[0]).toHaveAttribute("imagesizes", "(min-width: 640px) 50vw, 100vw");
    document.querySelectorAll("img").forEach((image) => expect(image).toHaveAttribute("loading", "lazy"));
  });

  it("공고가 없으면 빈 안내를 보이고 더 보기가 없다", () => {
    render(<SubscriptionListView initialPage={pageOf(1, [], 0)} loadPage={vi.fn()} />);
    expect(screen.getByText("조건에 맞는 공고가 없습니다")).toBeInTheDocument();
    expect(within(document.body).queryByRole("button", { name: "더 보기" })).toBeNull();
  });
});
