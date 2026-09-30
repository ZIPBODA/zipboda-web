import type { ReactNode } from "react";
import type { GeoPoint } from "../../lib/geo";

export interface MapMarker {
  id: string;
  point: GeoPoint;
  label?: string;
}

/** 지도가 지금 보고 있는 자리 */
export interface MapViewport {
  center: GeoPoint;
  level: number;
}

/** 기기가 알려준 내 위치. 가려진 폭(padding)을 비켜 그 자리로 옮긴다 */
export interface MapMyLocation {
  point: GeoPoint;
  /** 오차 반경(m). 모르면 점만 찍는다 */
  accuracy: number | null;
  padding: readonly [top: number, right: number, bottom: number, left: number];
}

/** 제공자에 기대지 않는 계약 — 카카오를 다른 지도로 바꿔도 이 모양은 그대로다 */
export interface MapViewProps {
  markers: MapMarker[];
  /** 없으면 마커를 모두 담도록 맞춘다 */
  center?: GeoPoint | null;
  initialCenter?: GeoPoint;
  /** 지난번에 보던 자리. 있으면 마커 전체에 맞추지 않고 이 중심·배율로 연다 */
  initialViewport?: MapViewport;
  /** 이동·확대가 끝날 때마다 지금 자리를 알린다 */
  onViewportChange?: (viewport: MapViewport) => void;
  fitPadding?: readonly [top: number, right: number, bottom: number, left: number];
  controlsClassName?: string;
  level?: number;
  /** false면 드래그·휠 확대를 잠근다. 작은 카드에서 스크롤을 뺏기지 않게 */
  interactive?: boolean;
  /** 목록에서 가까운 공고를 묶어 개수로 표시한다. 상세의 단일 위치 지도는 사용하지 않는다. */
  clustering?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onGroupSelect?: (ids: string[]) => void;
  selectedIds?: readonly string[];
  fitRequest?: number;
  /** 받을 때마다 그 자리로 옮기고 파란 점과 오차 원을 남긴다 */
  myLocation?: MapMyLocation;
  /** 사용자가 손으로 끌기 시작할 때만 온다 — 코드가 지도를 옮길 때(jump·setCenter)는 오지 않는다 */
  onDragStart?: () => void;
  focusRequest?: { point: GeoPoint; padding: readonly [number, number, number, number] };
  mapType?: "roadmap" | "hybrid";
  /** 지도 제공자 로고·축척을 둘 모서리. 왼쪽 아래를 패널이 덮는 화면은 오른쪽으로 옮겨 가리지 않는다 */
  attributionCorner?: "bottom-left" | "bottom-right";
  onVisibleMarkersChange?: (ids: string[]) => void;
  /** 키가 없거나 좌표가 없거나 로드에 실패했을 때 대신 보일 것 */
  fallback?: ReactNode;
  /** 크기는 언제나 부모가 정한다 */
  className?: string;
  ariaLabel?: string;
}
