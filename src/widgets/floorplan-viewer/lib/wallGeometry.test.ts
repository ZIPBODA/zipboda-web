import { describe, expect, it } from "vitest";
import { wallBoxGeometry } from "./wallGeometry";

describe("벽 렌더링 그룹", () => {
  it("모든 삼각형을 한 번씩 그리며 넓은 면에만 벽지를 적용한다", () => {
    const geometry = wallBoxGeometry(4, 2.4, 0.15);
    expect(geometry.groups).toHaveLength(2);
    const index = geometry.index!;
    const normal = geometry.getAttribute("normal");
    const covered: number[] = [];
    for (const group of geometry.groups) {
      for (let i = group.start; i < group.start + group.count; i++) {
        covered.push(i);
        const z = Math.abs(normal.getZ(index.getX(i)));
        expect(z).toBe(group.materialIndex === 1 ? 1 : 0);
      }
    }
    expect(covered.length).toBe(index.count);
    expect(new Set(covered).size).toBe(index.count);
    geometry.dispose();
  });
});
