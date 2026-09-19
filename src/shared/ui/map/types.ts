import type { ReactNode } from "react";
import type { GeoPoint } from "../../lib/geo";

export interface MapMarker {
  id: string;
  point: GeoPoint;
  label?: string;
}

/** 제공자에 기대지 않는 계약 — 카카오를 다른 지도로 바꿔도 이 모양은 그대로다 */
export interface MapViewProps {
  markers: MapMarker[];
  /** 없으면 마커를 모두 담도록 맞춘다 */
  center?: GeoPoint | null;
  level?: number;
  /** false면 드래그·휠 확대를 잠근다. 작은 카드에서 스크롤을 뺏기지 않게 */
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** 키가 없거나 좌표가 없거나 로드에 실패했을 때 대신 보일 것 */
  fallback?: ReactNode;
  /** 크기는 언제나 부모가 정한다 */
  className?: string;
  ariaLabel?: string;
}
