export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** 대한민국 육지·부속도서가 들어가는 범위. 지오코딩이 엉뚱한 나라를 집었는지 거르는 용도다 */
export const KOREA_BOUNDS: GeoBounds = { south: 33, west: 124, north: 39, east: 132 };

export const isInKorea = (point: GeoPoint): boolean =>
  point.lat >= KOREA_BOUNDS.south && point.lat <= KOREA_BOUNDS.north && point.lng >= KOREA_BOUNDS.west && point.lng <= KOREA_BOUNDS.east;

export function boundsOf(points: GeoPoint[]): GeoBounds | null {
  if (points.length === 0) return null;
  return points.reduce<GeoBounds>(
    (acc, point) => ({
      south: Math.min(acc.south, point.lat),
      west: Math.min(acc.west, point.lng),
      north: Math.max(acc.north, point.lat),
      east: Math.max(acc.east, point.lng)
    }),
    { south: points[0].lat, west: points[0].lng, north: points[0].lat, east: points[0].lng }
  );
}

export function centerOf(points: GeoPoint[]): GeoPoint | null {
  const bounds = boundsOf(points);
  if (!bounds) return null;
  return { lat: (bounds.south + bounds.north) / 2, lng: (bounds.west + bounds.east) / 2 };
}
