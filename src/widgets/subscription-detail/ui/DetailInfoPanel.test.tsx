import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailInfoPanel } from "./DetailInfoPanel";
import type { SubscriptionDetail } from "@/entities/subscription";

const detail: SubscriptionDetail = {
  id: "1",
  agency: "LH",
  agencyLabel: "LH 공공",
  status: "접수중",
  title: "광진 자양 LH 주택",
  address: "서울 · 광진구 · 자양동",
  dday: 3,
  applyPeriod: "2025년 8월 12일 - 15일",
  households: "480세대",
  supplyType: "국민 일반",
  competition: "12.4 : 1",
  contractDate: "2025년 9월",
  moveIn: "2026년 3월",
  postDate: "2025년 7월 25일",
  units: [
    { size: 59, type: "A" },
    { size: 84, type: "A" },
    { size: 114, type: "A" }
  ],
  defaultUnitSize: 84,
  applyUrl: "https://apply.lh.or.kr"
};

const hrefFor = () => "/subscriptions/1";

describe("DetailInfoPanel", () => {
  it("공고 요약과 스펙 7항목을 렌더한다", () => {
    render(<DetailInfoPanel detail={detail} selectedSize={84} hrefFor={hrefFor} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("광진 자양 LH 주택");
    expect(screen.getByText("서울 · 광진구 · 자양동")).toBeInTheDocument();
    expect(screen.getByText("접수중")).toBeInTheDocument();
    expect(screen.getByText("D-3 마감 임박")).toBeInTheDocument();

    for (const label of ["신청 기간", "총 세대수", "공급 유형", "경쟁률", "계약일", "입주", "공고일"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("480세대")).toBeInTheDocument();
  });

  it("신청 CTA는 공급기관 사이트를 새 탭으로 연다", () => {
    render(<DetailInfoPanel detail={detail} selectedSize={84} hrefFor={hrefFor} />);

    const cta = screen.getByRole("link", { name: /해당 기관에서 신청/ });
    expect(cta).toHaveAttribute("href", "https://apply.lh.or.kr");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    expect(screen.getByText(/집보다는 신청을 대행하지 않으며/)).toBeInTheDocument();
  });

  it("선택된 평형만 aria-current로 표시한다", () => {
    render(<DetailInfoPanel detail={detail} selectedSize={84} hrefFor={hrefFor} />);

    expect(screen.getByText("84㎡")).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("59㎡")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("114㎡")).not.toHaveAttribute("aria-current");
  });
});
