import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Subscription } from "@/entities/subscription";
import { SubscriptionMapView } from "./SubscriptionMapView";

const base: Subscription = {
  id: "gangnam-gaepo",
  agency: "SH",
  title: "강남 개포동",
  region: "서울",
  location: "강남구",
  coord: { lat: 37.47, lng: 127.05 },
  sizes: [24],
  applicants: null,
  households: 12,
  competition: null,
  moveIn: null,
  deadline: null,
  dday: null,
  image: null
};

// 테스트 환경에는 앱키가 없어 지도는 항상 대체 표시를 그린다 — 키 없는 로컬·CI와 같은 경로다
describe("SubscriptionMapView", () => {
  it("좌표가 있는 공고를 지도와 카드로 보여준다", () => {
    render(<SubscriptionMapView items={[base]} />);

    expect(screen.getAllByText("강남 개포동").length).toBeGreaterThan(0);
    expect(screen.queryByText("지도에 표시할 공고가 없습니다")).not.toBeInTheDocument();
  });

  it("좌표가 없으면 지도 대신 빈 상태를 알린다", () => {
    render(<SubscriptionMapView items={[{ ...base, coord: null }]} />);

    expect(screen.getByText("지도에 표시할 공고가 없습니다")).toBeInTheDocument();
    expect(screen.getByText("좌표를 확인하지 못한 공고입니다. 목록 보기에서 볼 수 있습니다.")).toBeInTheDocument();
  });

  it("공고 자체가 없으면 필터를 바꾸라고 안내한다", () => {
    render(<SubscriptionMapView items={[]} />);

    expect(screen.getByText("필터를 변경해 다시 검색해 보세요.")).toBeInTheDocument();
  });

  it("지도에 못 올린 공고 수를 숨기지 않는다", () => {
    render(<SubscriptionMapView items={[base, { ...base, id: "no-coord", coord: null }]} />);

    expect(screen.getByText("좌표가 없어 지도에 올리지 못한 공고 1건은 목록 보기에서 확인할 수 있습니다.")).toBeInTheDocument();
  });
});
