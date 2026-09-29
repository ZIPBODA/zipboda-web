import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Subscription } from "@/entities/subscription";
import type { MapDetailData } from "../model/mapDetail";
import { SubscriptionMapDetail } from "./SubscriptionMapDetail";

vi.mock("@/shared/ui/map", () => ({
  MapViewLoader: ({ ariaLabel }: { ariaLabel?: string }) => <div role="img" aria-label={ariaLabel} />,
  MapFallback: () => null
}));

const data: MapDetailData = { detail: { id: "a", title: "청약 A", address: "서울", agency: "LH", agencyLabel: "LH", status: "접수중", dday: null, applyPeriod: null, households: null, supplyType: null, competition: null, contractDate: null, moveIn: null, postDate: null, units: [], defaultUnitSize: null, image: null, applyUrl: null }, plans: [] };

describe("지도 상세 조회", () => {
  it("늦게 도착한 이전 공고가 새 상세를 덮어쓰지 않는다", async () => {
    let resolveFirst: (value: MapDetailData) => void = () => {};
    const first = new Promise<MapDetailData>((resolve) => { resolveFirst = resolve; });
    const load = vi.fn((id: string) => id === "a" ? first : Promise.resolve({ ...data, detail: { ...data.detail, id: "b", title: "청약 B" } }));
    const { rerender } = render(<SubscriptionMapDetail id="a" loadDetail={load} onClose={vi.fn()} />);
    rerender(<SubscriptionMapDetail id="b" loadDetail={load} onClose={vi.fn()} />);
    expect(await screen.findByText("청약 B")).toBeInTheDocument();
    await act(async () => { resolveFirst(data); });
    expect(screen.queryByText("청약 A")).not.toBeInTheDocument();
    expect(screen.getByText("청약 B")).toBeInTheDocument();
  });
  it("조회 실패 후 재시도하고 상세 닫기를 제공한다", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValue(data);
    const close = vi.fn();
    render(<SubscriptionMapDetail id="a" loadDetail={load} onClose={close} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByText("청약 A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "청약 상세 닫기" }));
    expect(close).toHaveBeenCalledOnce();
  });
});

describe("모바일 지도 상세", () => {
  afterEach(() => vi.unstubAllGlobals());
  const mobile = () => vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const item: Subscription = { id: "a", title: "청약 A", agency: "LH", status: "접수중", region: "서울", location: "서울", coord: { lat: 37.5, lng: 127 }, sizes: [13.66, 13.86], applicants: null, households: 10, competition: null, moveIn: null, deadline: "2026년 9월 30일", dday: 1, image: null };

  it("사진 옆 위치 지도·요약 줄·마감 태그를 보이고, 신청 버튼을 아래에 고정한다", async () => {
    mobile();
    const load = vi.fn().mockResolvedValue({ ...data, detail: { ...data.detail, supplyUnits: 5, applyUrl: "https://apply.example.com" } });
    render(<SubscriptionMapDetail id="a" item={item} loadDetail={load} onClose={vi.fn()} />);
    expect(await screen.findByRole("img", { name: "청약 A 위치 지도" })).toBeInTheDocument();
    expect(screen.getByText("전용 13.66~13.86㎡")).toBeInTheDocument();
    expect(screen.getByText("총 10세대")).toBeInTheDocument();
    expect(screen.getByText("공급 5호")).toBeInTheDocument();
    expect(screen.getByText("D-1 · 2026년 9월 30일 마감")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "공급기관 바로가기 ↗" }).at(-1)).toHaveAttribute("href", "https://apply.example.com");
  });

  it("공급기관 주소가 없으면 고정 버튼이 공고 전체 보기로 간다", async () => {
    mobile();
    render(<SubscriptionMapDetail id="a" item={item} loadDetail={vi.fn().mockResolvedValue(data)} onClose={vi.fn()} />);
    await screen.findByText("청약 A");
    expect(screen.queryByRole("link", { name: "공급기관 바로가기 ↗" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "공고 전체 보기 →" }).at(-1)).toHaveAttribute("href", "/subscriptions/a?unit=");
  });

  it("PC에서는 두 번째 지도를 띄우지 않는다", async () => {
    render(<SubscriptionMapDetail id="a" item={item} loadDetail={vi.fn().mockResolvedValue(data)} onClose={vi.fn()} />);
    await screen.findByText("청약 A");
    expect(screen.queryByRole("img", { name: "청약 A 위치 지도" })).not.toBeInTheDocument();
  });
});
