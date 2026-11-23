/** 지도를 놓을 자리가 있는지. 없으면 지도 대신 대체 표시만 보이고 SDK도 받지 않는다 */
export const hasMapPlace = ({ markers, center, initialCenter, initialViewport }: { markers: readonly unknown[]; center?: unknown; initialCenter?: unknown; initialViewport?: unknown }): boolean =>
  markers.length > 0 || (center !== null && center !== undefined) || initialCenter !== undefined || initialViewport !== undefined;
