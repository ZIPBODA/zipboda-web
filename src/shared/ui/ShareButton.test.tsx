import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareButton } from "./ShareButton";

const setNavigator = (patch: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(patch)) {
    Object.defineProperty(navigator, key, { value, configurable: true, writable: true });
  }
};

describe("ShareButton", () => {
  beforeEach(() => setNavigator({ share: undefined, clipboard: undefined }));
  afterEach(() => vi.restoreAllMocks());

  it("공유 시트를 지원하면 현재 주소를 넘긴다", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share });

    render(<ShareButton title="강남개포동">공유</ShareButton>);
    fireEvent.click(screen.getByRole("button", { name: "공유" }));

    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "강남개포동", url: window.location.href }));
  });

  it("공유 시트가 없으면 주소를 복사하고 알려 준다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({ clipboard: { writeText } });

    render(<ShareButton title="강남개포동">공유</ShareButton>);
    fireEvent.click(screen.getByRole("button", { name: "공유" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(window.location.href));
    expect(await screen.findByText("복사됨")).toBeInTheDocument();
  });

  it("사용자가 공유 시트를 닫아도 조용히 넘어간다", async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(new Error("AbortError")) });

    render(<ShareButton title="강남개포동">공유</ShareButton>);
    fireEvent.click(screen.getByRole("button", { name: "공유" }));

    await waitFor(() => expect(screen.queryByText("복사됨")).not.toBeInTheDocument());
  });
});
