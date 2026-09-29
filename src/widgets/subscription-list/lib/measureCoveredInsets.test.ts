import { afterEach, describe, expect, it } from "vitest";
import { measureCoveredInsets } from "./measureCoveredInsets";

type Box = { top: number; left: number; width: number; height: number; position?: "absolute" | "relative" };

function workspace(parts: [html: string, box: Box][]) {
  const root = document.createElement("main");
  for (const [html, box] of parts) {
    root.insertAdjacentHTML("beforeend", html);
    const node = root.lastElementChild as HTMLElement;
    node.style.position = box.position ?? "absolute";
    node.getBoundingClientRect = () => ({ ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => ({}) });
  }
  document.body.append(root);
  return root;
}

const canvas: [string, Box] = ['<div class="map-workspace-canvas"></div>', { top: 0, left: 0, width: 360, height: 600 }];

afterEach(() => document.body.replaceChildren());

describe("지도 위를 덮은 폭", () => {
  it("모바일: 툴바는 위, 왼쪽 탐색 메뉴 열은 왼쪽, 배율은 오른쪽, 시트는 아래를 가린다", () => {
    const root = workspace([
      canvas,
      ['<div class="map-workspace-toolbar"></div>', { top: 12, left: 12, width: 336, height: 62 }],
      ['<nav class="map-workspace-rail"></nav>', { top: 86, left: 12, width: 46, height: 134 }],
      ['<div aria-label="지도 배율"></div>', { top: 86, left: 302, width: 46, height: 90 }],
      ['<aside aria-label="청약 목록"></aside>', { top: 400, left: 0, width: 360, height: 264 }]
    ]);
    expect(measureCoveredInsets(root)).toEqual([74, 58, 200, 58]);
  });

  it("지도 전체를 덮는 모바일 상세는 셈하지 않는다 — 닫으면 그 아래 지도가 그대로 보인다", () => {
    const root = workspace([
      canvas,
      ['<aside aria-label="청약 목록"></aside>', { top: 300, left: 0, width: 360, height: 364 }],
      ['<aside aria-label="선택한 청약 상세"></aside>', { top: 0, left: 0, width: 360, height: 664 }]
    ]);
    expect(measureCoveredInsets(root)[2]).toBe(300);
  });

  it("PC: 흐름 안에 선 패널은 왼쪽을 가리고, 가장 오른쪽 끝까지 비켜 간다", () => {
    const root = workspace([
      ['<div class="map-workspace-canvas"></div>', { top: 0, left: 0, width: 1280, height: 789 }],
      ['<nav class="map-workspace-rail"></nav>', { top: 12, left: 12, width: 80, height: 166, position: "relative" }],
      ['<aside aria-label="청약 목록"></aside>', { top: 12, left: 104, width: 320, height: 765, position: "relative" }],
      ['<aside aria-label="선택한 청약 상세"></aside>', { top: 12, left: 436, width: 384, height: 765, position: "relative" }]
    ]);
    expect(measureCoveredInsets(root)[3]).toBe(820);
  });
});
