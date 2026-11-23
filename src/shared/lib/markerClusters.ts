/** 지도 픽셀 좌표의 점. 같은 배율 안에서는 지도를 옮겨도 바뀌지 않는 좌표(투영의 pointFromCoords)를 쓴다 */
export interface ClusterPoint {
  id: string;
  x: number;
  y: number;
}

/** 묶음. 중심은 더한 점들의 평균이다 */
export interface PinCluster {
  ids: string[];
  x: number;
  y: number;
}

/**
 * 카카오 MarkerClusterer(1.1.5)와 같은 규칙으로 점 하나를 묶음에 더하고, 더한 묶음을 돌려준다.
 * 중심이 가장 가까운(가로+세로 거리) 묶음을 고르고, 그 중심에서 가로·세로 gridSize 안이면 더하고 아니면 새 묶음을 만든다.
 * 카카오는 점을 하나 더할 때마다 배지를 다시 그리고 높이를 읽어 핀 수만큼 강제 레이아웃을 일으켰다(모바일 1초 이상) —
 * 여기서는 계산만 하고 배지는 묶음마다 한 번 그린다
 */
export function addToNearestCluster(clusters: PinCluster[], point: ClusterPoint, gridSize: number): PinCluster {
  let nearest: PinCluster | null = null;
  let nearestDistance = Infinity;
  for (const cluster of clusters) {
    const distance = Math.abs(point.x - cluster.x) + Math.abs(point.y - cluster.y);
    if (distance < nearestDistance) {
      nearest = cluster;
      nearestDistance = distance;
    }
  }
  const fits = nearest !== null && Math.abs(point.x - nearest.x) <= gridSize && Math.abs(point.y - nearest.y) <= gridSize;
  if (!nearest || !fits) {
    const created = { ids: [point.id], x: point.x, y: point.y };
    clusters.push(created);
    return created;
  }
  const count = nearest.ids.length + 1;
  nearest.x = (nearest.x * (count - 1) + point.x) / count;
  nearest.y = (nearest.y * (count - 1) + point.y) / count;
  nearest.ids.push(point.id);
  return nearest;
}
