import { describe, expect, it } from "vitest";
import { addToNearestCluster, type ClusterPoint, type PinCluster } from "./markerClusters";

const clusterAll = (points: ClusterPoint[], gridSize: number) => {
  const clusters: PinCluster[] = [];
  points.forEach((point) => addToNearestCluster(clusters, point, gridSize));
  return clusters;
};

describe("핀 묶음 계산(카카오 MarkerClusterer와 같은 규칙)", () => {
  it("중심에서 가로·세로 격자 안이면 같은 묶음, 벗어나면 새 묶음이다 — 경계는 안에 든다", () => {
    const clusters = clusterAll([
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 80, y: -80 },
      { id: "c", x: 200, y: 0 }
    ], 80);
    expect(clusters.map((cluster) => cluster.ids)).toEqual([["a", "b"], ["c"]]);
  });

  it("묶음 중심은 더한 점의 평균이고, 다음 점은 움직인 중심으로 잰다", () => {
    const clusters = clusterAll([
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 80, y: 0 },
      // 처음 중심(0)에서는 120 떨어져 못 들지만, 평균 중심(40)에서는 80이라 든다
      { id: "c", x: 120, y: 0 }
    ], 80);
    expect(clusters).toEqual([{ ids: ["a", "b", "c"], x: 200 / 3, y: 0 }]);
  });

  it("여러 묶음 중 중심이 가장 가까운(가로+세로) 묶음에 들고, 같으면 먼저 생긴 묶음이다", () => {
    const clusters = clusterAll([
      { id: "left", x: 0, y: 0 },
      { id: "right", x: 100, y: 0 },
      { id: "middle", x: 50, y: 0 },
      { id: "near-right", x: 90, y: 10 }
    ], 60);
    expect(clusters.map((cluster) => cluster.ids)).toEqual([["left", "middle"], ["right", "near-right"]]);
  });

  it("가장 가까운 묶음의 격자를 벗어나면, 더 먼 묶음의 격자 안이어도 새 묶음이다(카카오와 같다)", () => {
    const clusters: PinCluster[] = [
      { ids: ["a"], x: 0, y: 0 },
      { ids: ["b"], x: 30, y: 25 }
    ];
    // a까지 26+0, b까지 4+25 — 가까운 a의 격자(25)는 벗어나고 b의 격자 안이지만 b는 보지 않는다
    addToNearestCluster(clusters, { id: "c", x: 26, y: 0 }, 25);
    expect(clusters.map((cluster) => cluster.ids)).toEqual([["a"], ["b"], ["c"]]);
  });

  // 같은 단지의 여러 공고는 좌표가 같다 — 가장 가까운 단계의 1px 격자에서는 같은 자리만 묶인다
  it("격자 1px에서는 좌표가 같은 점만 묶이고 바로 옆 점은 따로 선다", () => {
    const clusters = clusterAll([
      { id: "same-a", x: 10, y: 10 },
      { id: "next", x: 12, y: 10 },
      { id: "same-b", x: 10, y: 10 }
    ], 1);
    expect(clusters.map((cluster) => cluster.ids)).toEqual([["same-a", "same-b"], ["next"]]);
  });
});
