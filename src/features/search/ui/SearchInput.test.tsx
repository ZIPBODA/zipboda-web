import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SUGGESTION_DEBOUNCE_MS } from "../config/constants";
import { getSuggestions, searchAll } from "../lib/search";
import type { SearchEntry, SearchSuggestions } from "../model/types";
import { SearchInput } from "./SearchInput";

const navigation = vi.hoisted(() => ({ push: vi.fn(), pathname: "/", query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.query)
}));

const index: SearchEntry[] = [
  { id: "h1", kind: "housing", name: "서울 자양 주택", description: "서울 광진구 자양동", context: "LH · 서울", fields: ["서울", "LH"], href: "/subscriptions/h1" },
  { id: "s1", kind: "product", name: "서울 원목 의자", description: "브랜드 · 의자", context: "", price: 100000, fields: ["원목"], href: "/shop/s1" }
];
// 서버 액션 자리 — 같은 항목에서 같은 순위로 찾아 상위 몇 건과 전체 건수를 돌려준다
const loadSuggestions = vi.fn(async (query: string, _signal: AbortSignal): Promise<SearchSuggestions> => {
  const results = searchAll(index, query);
  return { entries: getSuggestions(results), totalCount: results.length };
});
const props = { loadSuggestions, icon: <svg />, onActivate: vi.fn() };
function setup(query = "") {
  const view = render(<SearchInput {...props} />);
  const input = screen.getByRole("combobox", { name: "주택·가구 검색" });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query } });
  return { ...view, input };
}

beforeEach(() => { navigation.push.mockReset(); navigation.pathname = "/"; navigation.query = ""; loadSuggestions.mockClear(); });

describe("검색 자동완성", () => {
  it("빈 입력에는 닫히고, 입력이 멈추면 주택·가구 정보가 나타난다", async () => {
    const { input } = setup();
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.change(input, { target: { value: "서울" } });
    expect(screen.getByRole("status")).toHaveTextContent("검색 중…");
    expect(await screen.findAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("검색 결과 2건 · 추천 2건");
    expect(screen.getByText("서울 광진구 자양동")).toBeInTheDocument();
    expect(screen.getByText("LH · 서울")).toBeInTheDocument();
    expect(screen.getByText("100,000원")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("아래·위 방향키로 순환 선택하고 Enter로 선택 항목에 이동한다", async () => {
    const { input } = setup("서울");
    await screen.findAllByRole("option");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[1].id);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(navigation.push).toHaveBeenCalledWith("/shop/s1");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("선택 없이 Enter를 누르면 정규화한 URL로 이동한다", () => {
    const { input } = setup("  서울   주택  ");
    fireEvent.keyDown(input, { key: "Enter" });
    const url = new URL(navigation.push.mock.calls[0][0], "https://example.com");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("서울 주택");
  });

  it("Escape는 닫고 선택을 해제하므로 다음 Enter는 전체 검색으로 이동한다", async () => {
    const { input } = setup("서울");
    await screen.findAllByRole("option");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-activedescendant");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(navigation.push.mock.calls[0][0]).toMatch(/^\/search\?/);
  });

  it.each([["자양", "/subscriptions/h1"], ["의자", "/shop/s1"]])("추천 %s을 클릭하면 상세로 이동한다", async (query, href) => {
    setup(query);
    const item = await screen.findByRole("option");
    expect(fireEvent.mouseDown(item)).toBe(false);
    fireEvent.click(item);
    expect(navigation.push).toHaveBeenCalledWith(href);
  });

  it("전체보기 링크의 query를 유지하고 링크로의 포커스 이동은 목록을 닫지 않는다", () => {
    const { input } = setup("서울");
    const link = screen.getByRole("link", { name: /검색 결과 전체보기/ });
    expect(new URL(link.getAttribute("href")!, "https://example.com").searchParams.get("q")).toBe("서울");
    fireEvent.blur(input, { relatedTarget: link });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("포커스 해제와 외부 포인터 클릭은 목록을 닫는다", () => {
    const { input } = setup("서울");
    fireEvent.blur(input, { relatedTarget: document.body });
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.focus(input);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("한글 조합 중 Enter는 탐색하지 않으며 확정 후 Enter는 검색한다", () => {
    const { input } = setup("서울");
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.submit(screen.getByRole("search"));
    expect(navigation.push).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(navigation.push).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });

  it("빠른 입력 변경은 이전 선택을 버리고 최신 결과만 사용한다", async () => {
    const { input } = setup("서울");
    await screen.findAllByRole("option");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.change(input, { target: { value: "의자" } });
    expect(input).not.toHaveAttribute("aria-activedescendant");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    fireEvent.change(input, { target: { value: "없는결과" } });
    expect(await screen.findByText(/검색 결과가 없습니다/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("다른 Header 패널이 열리면 추천은 숨긴다", () => {
    const { rerender } = setup("서울");
    rerender(<SearchInput {...props} blocked />);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("검색 URL과 뒤로·앞으로 이동에 맞춰 입력·선택을 초기화한다", () => {
    navigation.pathname = "/search";
    navigation.query = "q=의자";
    const { rerender } = render(<SearchInput {...props} />);
    expect(screen.getByRole("combobox")).toHaveValue("의자");
    navigation.query = "q=자양";
    rerender(<SearchInput {...props} />);
    expect(screen.getByRole("combobox")).toHaveValue("자양");
    expect(screen.queryByRole("listbox")).toBeNull();
    navigation.pathname = "/shop/s1";
    navigation.query = "";
    rerender(<SearchInput {...props} />);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("입력이 멈출 때까지 기다렸다가 마지막 검색어로 한 번만 묻는다", async () => {
    const { input } = setup("서");
    fireEvent.change(input, { target: { value: "서울" } });
    fireEvent.change(input, { target: { value: "서울 자양" } });
    await screen.findByRole("option");
    expect(loadSuggestions).toHaveBeenCalledTimes(1);
    expect(loadSuggestions).toHaveBeenCalledWith("서울 자양", expect.any(AbortSignal));
  });

  // 늦게 온 이전 검색어의 답을 지금 검색어의 추천으로 보이면 다른 공고로 이동시킨다
  it("이전 검색어의 늦은 답은 보이지 않는다", async () => {
    let answerSlow: (value: SearchSuggestions) => void = () => {};
    loadSuggestions.mockImplementationOnce(() => new Promise((resolve) => { answerSlow = resolve; }));
    const { input } = setup("자양");
    await waitFor(() => expect(loadSuggestions).toHaveBeenCalledWith("자양", expect.any(AbortSignal)));
    fireEvent.change(input, { target: { value: "의자" } });
    await screen.findByText("서울 원목 의자");
    await act(async () => answerSlow({ entries: [index[0]], totalCount: 1 }));
    expect(screen.queryByText("서울 자양 주택")).toBeNull();
  });

  it("검색어가 바뀌면 지난 검색어의 요청을 끊는다", async () => {
    const signals: AbortSignal[] = [];
    loadSuggestions.mockImplementationOnce((_query, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    const { input } = setup("자양");
    await waitFor(() => expect(signals).toHaveLength(1));
    fireEvent.change(input, { target: { value: "의자" } });
    expect(signals[0].aborted).toBe(true);
    await screen.findByText("서울 원목 의자");
  });

  it("추천을 받지 못하면 실패를 알리고, 전체 검색으로는 계속 갈 수 있다", async () => {
    loadSuggestions.mockRejectedValueOnce(new Error("API down"));
    const { input } = setup("서울");
    expect(await screen.findByText("검색 결과를 불러오지 못했습니다.")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(navigation.push.mock.calls[0][0]).toMatch(/^\/search\?/);
  });

  it("목록이 닫혀 있으면 묻지 않는다", async () => {
    navigation.pathname = "/search";
    navigation.query = "q=의자";
    render(<SearchInput {...props} />);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, SUGGESTION_DEBOUNCE_MS * 2)); });
    expect(loadSuggestions).not.toHaveBeenCalled();
  });
});
