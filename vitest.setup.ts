import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { createElement, type AnchorHTMLAttributes, type ReactNode } from "react";

// next/link는 App Router 컨텍스트를 요구하므로 테스트에서는 앵커로 대체한다
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    scroll: _scroll,
    ...rest
  }: { href: string; children: ReactNode; scroll?: boolean } & AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement("a", { href, ...rest }, children)
}));

afterEach(cleanup);
