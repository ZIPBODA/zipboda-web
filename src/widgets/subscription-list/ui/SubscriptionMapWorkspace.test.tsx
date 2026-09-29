import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Subscription } from "@/entities/subscription";
import type { MapViewProps } from "@/shared/ui/map";
import { SubscriptionMapWorkspace } from "./SubscriptionMapWorkspace";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/subscriptions", useSearchParams: () => navigation.params, useRouter: () => ({ push: navigation.push }) }));
let mapProps: MapViewProps;
vi.mock("@/shared/ui/map", () => ({
  MapViewLoader: (props: MapViewProps) => { mapProps = props; return <div aria-label={props.ariaLabel} />; },
  MapFallback: () => <p>지도 대체 표시</p>
}));
const base: Subscription = { id: "a", title: "강남 개포동", agency: "LH", status: "접수중", region: "서울", location: "강남구", coord: { lat: 37.5, lng: 127 }, sizes: [24], applicants: null, households: 12, competition: null, moveIn: null, deadline: null, dday: null, image: null };
const items = [base, { ...base, id: "b", title: "도봉 방학동" }, { ...base, id: "c", title: "관악 신림동" }];
const options = { regions: ["전체", "서울"], agencies: ["전체", "LH"], sizeRanges: [{ value: "전체", label: "전체" }, { value: "20-25", label: "20~25㎡" }], statuses: ["접수중" as const] };
const loadDetail = vi.fn(async () => null);
const draw = (next = items) => <SubscriptionMapWorkspace items={next} options={options} loadDetail={loadDetail} />;
const panel = () => screen.getByRole("complementary", { name: "청약 목록" });
const panelStatus = () => within(panel()).getByRole("status").textContent;
const resultTitles = () => within(screen.getByLabelText("청약 결과")).queryAllByRole("heading").map((node) => node.textContent);
const handle = () => within(panel()).getByRole("button", { expanded: panel().dataset.sheet !== "peek" });
let resize = () => {};
beforeEach(() => {
  navigation.params = new URLSearchParams();
  navigation.push.mockClear();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resize = () => callback([], {} as ResizeObserver); }
    observe() {} disconnect() {}
  });
});

describe("지도 첫 화면과 청약 목록", () => {
  it("처음부터 지금 지도에 보이는 공고 목록을 펼쳐 두고 지도·목록 전환을 둔다", () => {
    render(draw());
    expect(panel()).toHaveAttribute("data-open", "true");
    expect(resultTitles()).toEqual(["강남 개포동", "도봉 방학동", "관악 신림동"]);
    expect(panelStatus()).toBe("이 지역 3건");
    // 지도 영역 목록은 배지를 누른 선택이 아니다
    expect(mapProps.selectedIds).toEqual([]);
    expect(screen.getByRole("button", { name: "청약 3" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("navigation", { name: "청약 탐색 메뉴" })).toBeInTheDocument();
    expect(screen.getByRole("search", { name: "공공주택 지도 검색" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "목록" })[0]).toHaveAttribute("href", "/subscriptions?view=list");
    // 왼쪽 아래는 목록·상세 패널과 상태 안내가 덮는다
    expect(mapProps.attributionCorner).toBe("bottom-right");
  });

  it("지도를 움직이면 목록과 청약 버튼 숫자가 지금 보이는 공고로 바뀐다", () => {
    render(draw());
    act(() => mapProps.onVisibleMarkersChange?.(["c"]));
    expect(resultTitles()).toEqual(["관악 신림동"]);
    expect(panelStatus()).toBe("이 지역 1건");
    expect(screen.getByRole("button", { name: "청약 1" })).toBeInTheDocument();
    // 지도 아래 가운데에 떠 있는 버튼이다. 왼쪽 탐색 메뉴에는 두지 않는다
    expect(within(screen.getByRole("navigation", { name: "청약 탐색 메뉴" })).queryByRole("button", { name: /^청약/ })).not.toBeInTheDocument();
    act(() => mapProps.onVisibleMarkersChange?.([]));
    expect(resultTitles()).toEqual([]);
    expect(screen.getAllByText(/이 지도 영역에는 공고가 없습니다/).length).toBeGreaterThan(0);
  });

  it.each(["badge", "pin"])("%s를 누르면 그 공고로 좁히고, 지도를 움직여도 유지하다가 '지도 영역 전체 보기'로 돌아간다", (kind) => {
    render(draw());
    act(() => kind === "badge" ? mapProps.onGroupSelect?.(["b"]) : mapProps.onSelect?.("b"));
    expect(resultTitles()).toEqual(["도봉 방학동"]);
    expect(panelStatus()).toBe("선택 1건");
    expect(mapProps.selectedIds).toEqual(["b"]);
    expect(mapProps.selectedId).toBe("b");
    act(() => mapProps.onVisibleMarkersChange?.(["c"]));
    expect(resultTitles()).toEqual(["도봉 방학동"]);
    fireEvent.click(screen.getByRole("button", { name: "← 지도 영역 전체 보기" }));
    expect(resultTitles()).toEqual(["관악 신림동"]);
    expect(mapProps.selectedIds).toEqual([]);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("묶음을 바꿔 골라도 패널을 새로 만들지 않는다", () => {
    render(draw());
    const existing = panel();
    act(() => mapProps.onGroupSelect?.(["c", "a", "b"]));
    expect(resultTitles()).toEqual(["강남 개포동", "도봉 방학동", "관악 신림동"]);
    act(() => mapProps.onGroupSelect?.(["b", "c"]));
    expect(panel()).toBe(existing);
    expect(resultTitles()).toEqual(["도봉 방학동", "관악 신림동"]);
  });

  it("청약 버튼은 지도 영역 목록을 접고 펴고, 접으면 지도 위 안내가 대신 건수를 보여준다", () => {
    render(draw());
    fireEvent.click(screen.getByRole("button", { name: "청약 3" }));
    expect(panel()).toHaveAttribute("data-open", "false");
    expect(screen.getByText("지도 대상 3건 · 전체 3건")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "청약 3" }));
    expect(panel()).toHaveAttribute("data-open", "true");
  });

  it("고른 목록을 닫은 뒤 청약 버튼은 선택이 아니라 지도 영역 목록을 연다", () => {
    render(draw());
    act(() => mapProps.onGroupSelect?.(["a"]));
    expect(screen.getByRole("button", { name: "청약 3" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "청약 목록 닫기" }));
    expect(panel()).toHaveAttribute("data-open", "false");
    expect(mapProps.selectedIds).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "청약 3" }));
    expect(resultTitles()).toEqual(["강남 개포동", "도봉 방학동", "관악 신림동"]);
  });

  it("공고 상세를 연 동안에는 지도가 움직여도 목록을 멈추고, 닫으면 다시 지도를 따른다", async () => {
    render(draw());
    fireEvent.click(screen.getByRole("button", { name: "강남 개포동 상세 보기" }));
    expect(await screen.findByRole("complementary", { name: "선택한 청약 상세" })).toBeInTheDocument();
    expect(mapProps.selectedId).toBe("a");
    // 상세로 날아가며 확대되면 옆 카드가 줄줄이 사라지므로 목록을 멈춘다
    act(() => mapProps.onVisibleMarkersChange?.(["a"]));
    expect(resultTitles()).toEqual(["강남 개포동", "도봉 방학동", "관악 신림동"]);
    fireEvent.click(screen.getByRole("button", { name: "← 목록으로" }));
    expect(screen.queryByRole("complementary", { name: "선택한 청약 상세" })).not.toBeInTheDocument();
    expect(resultTitles()).toEqual(["강남 개포동"]);
  });

  it("전체 위치와 지도 유형은 선택 목록을 유지하고, 맞출 때는 가려진 폭을 다시 잰다", () => {
    render(draw());
    act(() => mapProps.onGroupSelect?.(["a", "b"]));
    fireEvent.click(screen.getByRole("button", { name: "전체 위치" }));
    expect(mapProps.fitRequest).toBe(1);
    expect(mapProps.fitPadding).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "위성지도" }));
    expect(mapProps.mapType).toBe("hybrid");
    expect(mapProps.selectedIds).toEqual(["a", "b"]);
  });

  it("위치 권한 거부는 지도와 선택을 바꾸지 않고 안내한다", () => {
    const getCurrentPosition = vi.fn((_success, failure) => failure({ code: 1 }));
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
    render(draw());
    act(() => mapProps.onGroupSelect?.(["a"]));
    fireEvent.click(screen.getByRole("button", { name: "내 위치" }));
    expect(screen.getByText(/위치 권한이 거부/)).toBeInTheDocument();
    expect(mapProps.locationRequest).toBeUndefined();
    expect(mapProps.selectedIds).toEqual(["a"]);
    Reflect.deleteProperty(navigator, "geolocation");
  });

  it("필터에서 사라진 선택을 지우고, 모두 사라지면 지도 영역 목록으로 돌아가며 초기화해도 되살리지 않는다", () => {
    const { rerender } = render(draw());
    act(() => mapProps.onGroupSelect?.(["a", "b"]));
    rerender(draw(items.slice(1)));
    expect(resultTitles()).toEqual(["도봉 방학동"]);
    rerender(draw([items[2]]));
    expect(panelStatus()).toBe("이 지역 1건");
    rerender(draw());
    expect(mapProps.selectedIds).toEqual([]);
  });

  it("정렬만 변경하면 선택 집합은 유지하고 서버 결과 순서를 따른다", () => {
    const { rerender } = render(draw());
    act(() => mapProps.onGroupSelect?.(["a", "b"]));
    fireEvent.change(screen.getByRole("combobox", { name: "결과 정렬" }), { target: { value: "HOUSEHOLDS" } });
    expect(navigation.push).toHaveBeenCalledWith("/subscriptions?sort=HOUSEHOLDS", { scroll: false });
    rerender(draw([...items].reverse()));
    expect(resultTitles()).toEqual(["도봉 방학동", "강남 개포동"]);
  });

  it("빈 결과·좌표 누락은 목록 안에서 안내한다", () => {
    const { rerender } = render(draw([]));
    expect(within(panel()).getByText(/조건에 맞는 공고가 없습니다/)).toBeInTheDocument();
    rerender(draw([{ ...base, coord: null }]));
    expect(mapProps.markers).toHaveLength(0);
    expect(within(panel()).getByText(/좌표가 없는 공고 1건/)).toBeInTheDocument();
    expect(within(panel()).getByRole("link", { name: "목록 보기" })).toHaveAttribute("href", "/subscriptions?view=list");
  });
});

describe("모바일 목록 시트", () => {
  // jsdom에는 PointerEvent가 없어 clientY가 사라진다. 좌표를 싣는 MouseEvent로 대신한다
  beforeEach(() => {
    vi.stubGlobal("PointerEvent", class extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 0; }
    });
  });

  it("손잡이를 누르면 반 높이와 접힘을 오간다", () => {
    render(draw());
    expect(panel()).toHaveAttribute("data-sheet", "peek");
    fireEvent.click(within(panel()).getByRole("button", { name: "청약 목록 펼치기" }));
    expect(panel()).toHaveAttribute("data-sheet", "half");
    fireEvent.click(within(panel()).getByRole("button", { name: "청약 목록 접기" }));
    expect(panel()).toHaveAttribute("data-sheet", "peek");
  });

  it("끌면 다음 단계에 붙고, 길게 끌면 한 단계를 건너뛰며, 끈 뒤의 누름은 무시한다", () => {
    render(draw());
    Object.defineProperty(panel().parentElement!, "clientHeight", { configurable: true, value: 600 });
    const drag = (fromY: number, toY: number) => {
      fireEvent.pointerDown(handle(), { clientY: fromY, pointerId: 1 });
      fireEvent.pointerMove(handle(), { clientY: toY, pointerId: 1 });
      fireEvent.pointerUp(handle(), { clientY: toY, pointerId: 1 });
      fireEvent.click(handle());
    };
    drag(560, 500);
    expect(panel()).toHaveAttribute("data-sheet", "half");
    drag(300, 600 - 20);
    expect(panel()).toHaveAttribute("data-sheet", "peek");
    drag(560, 300);
    expect(panel()).toHaveAttribute("data-sheet", "full");
  });

  it("손가락이 조금만 움직이면 끌기가 아니라 누름이다", () => {
    render(draw());
    fireEvent.pointerDown(handle(), { clientY: 560, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientY: 556, pointerId: 1 });
    fireEvent.pointerUp(handle(), { clientY: 556, pointerId: 1 });
    fireEvent.click(handle());
    expect(panel()).toHaveAttribute("data-sheet", "half");
  });

  it("배지·핀을 누르면 접힌 시트를 반 높이로 펼치고, 이미 펼쳤으면 그대로 둔다", () => {
    render(draw());
    act(() => mapProps.onGroupSelect?.(["a"]));
    expect(panel()).toHaveAttribute("data-sheet", "half");
    fireEvent.click(handle());
    act(() => mapProps.onSelect?.("b"));
    expect(panel()).toHaveAttribute("data-sheet", "half");
  });
});

describe("모바일 지도 선택 시트와 검색", () => {
  it("지도에서 고른 카드에만 '상세 보기' 버튼 모양을 덧대고, 시트를 접으면 선택을 내려놓고 지도 영역 목록으로 돌아간다", () => {
    render(draw());
    expect(screen.queryByText("상세 보기")).not.toBeInTheDocument();
    act(() => mapProps.onSelect?.("b"));
    expect(within(panel()).getByText("상세 보기")).toBeInTheDocument();
    fireEvent.click(within(panel()).getByRole("button", { name: "청약 목록 접기" }));
    expect(panel()).toHaveAttribute("data-sheet", "peek");
    expect(panelStatus()).toBe("이 지역 3건");
    expect(mapProps.selectedIds).toEqual([]);
  });

  it("지도 영역 목록은 접어도 그대로다", () => {
    render(draw());
    fireEvent.click(within(panel()).getByRole("button", { name: "청약 목록 펼치기" }));
    fireEvent.click(within(panel()).getByRole("button", { name: "청약 목록 접기" }));
    expect(panelStatus()).toBe("이 지역 3건");
  });

  it("검색창은 접혀 있다가 검색 아이콘으로 펼치고, 검색어를 들고 들어오면 초점은 건드리지 않고 펼친 채로 연다", async () => {
    const { unmount } = render(draw());
    const toggle = screen.getByRole("button", { name: "검색 열기" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", screen.getByRole("search").id);
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "검색 닫기" })).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "지역, 주택명 검색" })).toHaveFocus());
    unmount();
    navigation.params = new URLSearchParams("q=강남");
    render(draw());
    expect(screen.getByRole("button", { name: "검색 닫기" })).toHaveAttribute("aria-expanded", "true");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(screen.getByRole("textbox", { name: "지역, 주택명 검색" })).not.toHaveFocus();
  });
});

describe("지도 위치 보존", () => {
  it("주소의 지도 위치로 열고, 되살린 자리를 SDK가 반올림해 돌려줘도 주소를 고치지 않다가 움직이면 바꾼다", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    navigation.params = new URLSearchParams("region=서울&lat=37.5&lng=127&zoom=5");
    render(draw());
    expect(mapProps.initialViewport).toEqual({ center: { lat: 37.5, lng: 127 }, level: 5 });
    act(() => mapProps.onViewportChange?.({ center: { lat: 37.500004, lng: 127 }, level: 5 }));
    act(() => mapProps.onViewportChange?.({ center: { lat: 37.500004, lng: 127 }, level: 5 }));
    expect(replaceState).not.toHaveBeenCalled();
    act(() => mapProps.onViewportChange?.({ center: { lat: 37.6, lng: 127.1 }, level: 6 }));
    expect(replaceState).toHaveBeenLastCalledWith(null, "", expect.stringContaining("lat=37.60000&lng=127.10000&zoom=6"));
    // 서버를 다시 부르는 라우터 이동은 쓰지 않는다
    expect(navigation.push).not.toHaveBeenCalled();
    replaceState.mockRestore();
  });

  it("주소에 위치가 없으면 공고 전체에 맞춘 자리를 바로 적는다", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    render(draw());
    expect(mapProps.initialViewport).toBeUndefined();
    act(() => mapProps.onViewportChange?.({ center: { lat: 37.55, lng: 126.99 }, level: 8 }));
    expect(replaceState).toHaveBeenCalledWith(null, "", expect.stringContaining("zoom=8"));
    replaceState.mockRestore();
  });
});

describe("툴바와 필터 주소", () => {
  it("툴바의 실제 높이를 작업 공간에 넘기고, 툴바가 줄바꿈되면 다시 넘긴다", () => {
    const heights = new Map([["map-workspace-toolbar", 62]]);
    const offsetHeight = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return [...heights].find(([name]) => this.classList.contains(name))?.[1] ?? 0;
    });
    render(draw());
    const workspace = screen.getByRole("main", { name: "공공주택 지도 탐색" });
    expect(workspace.style.getPropertyValue("--map-toolbar-height")).toBe("62px");
    heights.set("map-workspace-toolbar", 114);
    act(() => resize());
    expect(workspace.style.getPropertyValue("--map-toolbar-height")).toBe("114px");
    offsetHeight.mockRestore();
  });

  it.each([["지역", "region", "서울"], ["면적", "size", "20-25"], ["공급기관", "agency", "LH"], ["모집 상태", "status", "접수중"]])("%s 필터 URL 계약을 유지하고 첫 화면이라 view를 붙이지 않는다", (label, key, value) => {
    render(draw());
    fireEvent.change(screen.getByRole("combobox", { name: label }), { target: { value } });
    const url = new URL(navigation.push.mock.calls[0][0], "https://example.com");
    expect(url.pathname).toBe("/subscriptions");
    expect(url.searchParams.get(key)).toBe(value);
    expect(url.searchParams.get("view")).toBeNull();
  });

  it("초기화는 필터만 지우고 정렬·지도 위치는 남기며, 검색도 자동 확대하지 않는다", () => {
    navigation.params = new URLSearchParams("sort=HOUSEHOLDS&region=서울&size=20-25&agency=LH&status=접수중&q=강남&lat=37.5&lng=127&zoom=5");
    const { rerender } = render(draw());
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(navigation.push).toHaveBeenLastCalledWith("/subscriptions?sort=HOUSEHOLDS&lat=37.5&lng=127&zoom=5", { scroll: false });
    navigation.params = new URLSearchParams("region=서울");
    rerender(draw());
    expect(screen.getByRole("combobox", { name: "지역" })).toHaveValue("서울");
    fireEvent.change(screen.getByRole("textbox", { name: "지역, 주택명 검색" }), { target: { value: "  개포  " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(decodeURIComponent(navigation.push.mock.calls.at(-1)![0])).toContain("q=개포");
    expect(mapProps.fitRequest).toBe(0);
  });
});
