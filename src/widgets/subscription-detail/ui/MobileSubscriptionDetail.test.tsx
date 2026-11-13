import { describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import type { SubscriptionDetail } from "@/entities/subscription";
import { MobileSubscriptionDetail } from "./MobileSubscriptionDetail";

vi.mock("next/link", () => ({ default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} /> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));
vi.mock("@/shared/ui/map", () => ({ MapViewLoader: () => null, MapFallback: () => null }));

const detail: SubscriptionDetail = {
  id: "cell", agency: "GH", agencyLabel: "GH", status: "접수중", title: "광교40 더포레스트", address: "경기 수원시", dday: 3,
  applyPeriod: null, households: null, supplyType: null, competition: null, contractDate: null, moveIn: null, postDate: null,
  image: null, applyUrl: null, units: [], defaultUnitKey: undefined, defaultUnitSize: null
};

describe("모바일 공고 상세", () => {
  // API에는 주택형·도면이 모두 없는 공고가 있다 — ?unit=undefined로 없는 호를 찾으면 404다
  it("고를 호가 없는 공고의 탭 링크에는 unit을 붙이지 않는다", () => {
    render(<MobileSubscriptionDetail detail={detail} floorplan={null} selectedUnit={null} activeTab="2d" nearby={[]} />);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href") ?? "");
    const detailLinks = hrefs.filter((href) => href.startsWith("/subscriptions/cell"));
    expect(detailLinks.length).toBeGreaterThan(0);
    for (const href of detailLinks) expect(href).not.toContain("unit=");
  });
});
