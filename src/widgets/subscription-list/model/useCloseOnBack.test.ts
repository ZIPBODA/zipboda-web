import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCloseOnBack } from "./useCloseOnBack";

const OPENED_AT = "/subscriptions?lat=37.5&lng=127&zoom=5";
const mobile = (matches: boolean) => vi.stubGlobal("matchMedia", vi.fn(() => ({ matches })));

describe("모바일 상세 뒤로가기", () => {
  let back: MockInstance;
  let push: MockInstance;
  beforeEach(() => {
    window.history.replaceState(null, "", OPENED_AT);
    push = vi.spyOn(window.history, "pushState");
    // jsdom의 뒤로가기는 비동기라 상세를 열기 전 주소로 바로 돌아간 것처럼 흉내 낸다
    back = vi.spyOn(window.history, "back").mockImplementation(() => {
      window.history.replaceState(null, "", OPENED_AT);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  });
  afterEach(() => { back.mockRestore(); push.mockRestore(); vi.unstubAllGlobals(); });

  it("모바일에서 상세를 열면 기록을 하나 쌓고, 뒤로가기는 페이지를 떠나지 않고 상세만 닫는다", () => {
    mobile(true);
    const onClose = vi.fn();
    const { rerender } = renderHook(({ open }) => useCloseOnBack(open, onClose), { initialProps: { open: true } });
    expect(push).toHaveBeenCalledOnce();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(onClose).toHaveBeenCalledOnce();
    rerender({ open: false });
    // 이미 뒤로 간 기록을 한 번 더 되돌리지 않는다
    expect(back).not.toHaveBeenCalled();
  });

  it("화면 안 버튼으로 닫으면 쌓은 기록을 되돌린다", () => {
    mobile(true);
    const onClose = vi.fn();
    const { rerender } = renderHook(({ open }) => useCloseOnBack(open, onClose), { initialProps: { open: true } });
    rerender({ open: false });
    expect(back).toHaveBeenCalledOnce();
    // 되돌리며 생긴 popstate로 상세를 한 번 더 닫지 않는다
    expect(onClose).not.toHaveBeenCalled();
  });

  it("상세 안 링크로 다른 페이지로 떠나면 그 이동을 되돌리지 않는다", () => {
    mobile(true);
    const { unmount } = renderHook(() => useCloseOnBack(true, vi.fn()));
    window.history.pushState(null, "", "/subscriptions/dobong-banghak");
    unmount();
    expect(back).not.toHaveBeenCalled();
  });

  it("PC에서는 기록을 쌓지 않는다", () => {
    mobile(false);
    renderHook(() => useCloseOnBack(true, vi.fn()));
    expect(push).not.toHaveBeenCalled();
  });
});
