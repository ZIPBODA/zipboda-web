import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { Subscription } from "@/entities/subscription";
import type { MapViewProps } from "@/shared/ui/map";
import { SubscriptionMapWorkspace } from "./SubscriptionMapWorkspace";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams("view=map"), push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/subscriptions", useSearchParams: () => navigation.params, useRouter: () => ({ push: navigation.push }) }));
let mapProps: MapViewProps;
vi.mock("@/shared/ui/map", () => ({
  MapViewLoader: (props: MapViewProps) => { mapProps = props; return <div aria-label={props.ariaLabel} />; },
  MapFallback: () => <p>지도 대체 표시</p>
}));
const base: Subscription = { id: "a", title: "강남 개포동", agency: "LH", status: "접수중", region: "서울", location: "강남구", coord: { lat: 37.5, lng: 127 }, sizes: [24], applicants: null, households: 12, competition: null, moveIn: null, deadline: null, dday: null, image: null };
const items = [base, { ...base, id: "b", title: "도봉 방학동" }, { ...base, id: "c", title: "관악 신림동" }];
const options = { regions: ["전체", "서울"], agencies: ["전체", "LH"], sizeRanges: [{ value: "전체", label: "전체" }, { value: "20-25", label: "20~25㎡" }], statuses: ["접수중" as const] };
const draw = (next = items) => <SubscriptionMapWorkspace items={next} options={options} />;
const panel = () => screen.queryByRole("complementary", { name: "선택한 청약 목록" });
const resultTitles = () => within(screen.getByLabelText("선택한 청약 결과")).getAllByRole("heading").map((node) => node.textContent);
beforeEach(() => { navigation.params = new URLSearchParams("view=map"); navigation.push.mockClear(); });

describe("숫자 선택과 청약 패널", () => {
  it("초기에는 패널 없이 탐색 메뉴와 지도 필터만 표시한다", () => {
    render(draw());
    expect(panel()).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "청약 탐색 메뉴" })).toBeInTheDocument();
    expect(screen.getByRole("search", { name: "공공주택 지도 검색" })).toBeInTheDocument();
    expect(mapProps.selectedIds).toEqual([]);
  });

  it("그룹 선택만 패널을 열고, 다른 그룹·같은 그룹은 패널을 재생성하지 않는다", () => {
    render(draw());
    act(() => mapProps.onGroupSelect?.(["c", "a", "b"]));
    const existing = panel();
    expect(resultTitles()).toEqual(["강남 개포동", "도봉 방학동", "관악 신림동"]);
    act(() => mapProps.onGroupSelect?.(["b", "c"]));
    expect(panel()).toBe(existing);
    expect(resultTitles()).toEqual(["도봉 방학동", "관악 신림동"]);
    act(() => mapProps.onGroupSelect?.(["b", "c"]));
    expect(panel()).toBe(existing);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it.each(["badge", "pin"])("%s 단일 선택은 패널 1건만 열고 상세로 이동하지 않는다", (kind) => {
    render(draw());
    act(() => kind === "badge" ? mapProps.onGroupSelect?.(["b"]) : mapProps.onSelect?.("b"));
    expect(resultTitles()).toEqual(["도봉 방학동"]);
    expect(mapProps.selectedIds).toEqual(["b"]);
    expect(screen.getByRole("link", { name: "상세 보기 →" })).toHaveAttribute("href", "/subscriptions/b");
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("지도 drag·zoom의 visibleIds 변경은 선택 목록을 바꾸지 않는다", () => {
    render(draw());
    act(() => mapProps.onGroupSelect?.(["a", "b"]));
    act(() => mapProps.onVisibleMarkersChange?.(["c"]));
    expect(resultTitles()).toEqual(["강남 개포동", "도봉 방학동"]);
    expect(screen.getByText("현재 지도 1건 · 전체 3건")).toBeInTheDocument();
    act(() => mapProps.onVisibleMarkersChange?.([]));
    expect(resultTitles()).toHaveLength(2);
  });

  it("닫기는 선택만 비우고 지도·탐색 메뉴를 유지한다", () => {
    render(draw());
    act(() => mapProps.onGroupSelect?.(["a"]));
    fireEvent.click(screen.getByRole("button", { name: "청약 목록 닫기" }));
    expect(panel()).not.toBeInTheDocument();
    expect(mapProps.selectedIds).toEqual([]);
    expect(screen.getByRole("navigation", { name: "청약 탐색 메뉴" })).toBeInTheDocument();
  });

  it("필터에서 사라진 선택을 제거하고 모두 사라지면 닫으며 초기화해도 되살리지 않는다", () => {
    const { rerender } = render(draw());
    act(() => mapProps.onGroupSelect?.(["a", "b", "c"]));
    rerender(draw(items.slice(1)));
    expect(resultTitles()).toEqual(["도봉 방학동", "관악 신림동"]);
    rerender(draw([base]));
    expect(panel()).not.toBeInTheDocument();
    rerender(draw());
    expect(mapProps.selectedIds).toEqual([]);
  });

  it("정렬만 변경하면 선택 집합은 유지하고 서버 결과 순서를 따른다", () => {
    const { rerender } = render(draw());
    act(() => mapProps.onGroupSelect?.(["a", "b"]));
    fireEvent.change(screen.getByRole("combobox", { name: "결과 정렬" }), { target: { value: "HOUSEHOLDS" } });
    expect(navigation.push).toHaveBeenCalledWith("/subscriptions?view=map&sort=HOUSEHOLDS", { scroll: false });
    rerender(draw([...items].reverse()));
    expect(resultTitles()).toEqual(["도봉 방학동", "강남 개포동"]);
  });

  it("빈 결과·좌표 누락은 패널을 열지 않고 지도 위에서 안내한다", () => {
    const { rerender } = render(draw([]));
    expect(screen.getByText(/조건에 맞는 공고가 없습니다/)).toBeInTheDocument();
    rerender(draw([{ ...base, coord: null }]));
    expect(mapProps.markers).toHaveLength(0);
    expect(screen.getByText(/좌표가 없는 공고 1건/)).toBeInTheDocument();
    expect(panel()).not.toBeInTheDocument();
  });

  it.each([["지역", "region", "서울"], ["면적", "size", "20-25"], ["공급기관", "agency", "LH"], ["모집 상태", "status", "접수중"]])("%s 필터 URL 계약을 유지한다", (label, key, value) => {
    render(draw());
    fireEvent.change(screen.getByRole("combobox", { name: label }), { target: { value } });
    const url = new URL(navigation.push.mock.calls[0][0], "https://example.com");
    expect(url.searchParams.get(key)).toBe(value);
    expect(url.searchParams.get("view")).toBe("map");
  });

  it("초기화·뒤로가기·검색어 URL 복원을 유지하고 검색도 자동 확대하지 않는다", () => {
    navigation.params = new URLSearchParams("view=map&sort=HOUSEHOLDS&region=서울&size=20-25&agency=LH&status=접수중&q=강남");
    const { rerender } = render(draw());
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(navigation.push).toHaveBeenLastCalledWith("/subscriptions?view=map&sort=HOUSEHOLDS", { scroll: false });
    navigation.params = new URLSearchParams("view=map&region=서울");
    rerender(draw());
    expect(screen.getByRole("combobox", { name: "지역" })).toHaveValue("서울");
    fireEvent.change(screen.getByRole("textbox", { name: "지역, 주택명 검색" }), { target: { value: "  개포  " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(decodeURIComponent(navigation.push.mock.calls.at(-1)![0])).toContain("q=개포");
    rerender(draw([base]));
  });
});
