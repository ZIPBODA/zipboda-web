import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { MapDetailData } from "../model/mapDetail";
import { SubscriptionMapDetail } from "./SubscriptionMapDetail";

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
