import { MAP_METERS_PER_PIXEL, MAP_ZOOM_RANGE, METERS_PER_DEGREE } from "../config/map";
import type { GeoBounds, GeoPoint } from "./geo";

export type MapPadding = readonly [top: number, right: number, bottom: number, left: number];

const metersPerPixel = (level: number) => MAP_METERS_PER_PIXEL.meters * 2 ** (level - MAP_METERS_PER_PIXEL.level);

/**
 * 카카오 setBounds가 고를 화면(중심·배율)을 지도를 만들기 전에 어림한다.
 * 지도를 기본 배율로 만든 뒤 setBounds로 다시 맞추면 기본 배율의 지도 조각을 한 벌 더 받는다(모바일 첫 화면 12장).
 * 만들 때부터 이 화면에서 시작하면 그 한 벌을 아낀다. 어림이 한 단계 어긋나도 뒤이은 setBounds가 바로잡아
 * 보이는 결과는 전과 같다.
 */
export function estimateFitView(bounds: GeoBounds, size: { width: number; height: number }, [top, right, bottom, left]: MapPadding): { center: GeoPoint; level: number } | null {
  const width = size.width - left - right;
  const height = size.height - top - bottom;
  if (width <= 0 || height <= 0) return null;

  const midLat = (bounds.south + bounds.north) / 2;
  const metersPerDegreeLng = METERS_PER_DEGREE * Math.cos((midLat * Math.PI) / 180);
  const spanX = (bounds.east - bounds.west) * metersPerDegreeLng;
  const spanY = (bounds.north - bounds.south) * METERS_PER_DEGREE;
  const fits = (level: number) => spanX / metersPerPixel(level) <= width && spanY / metersPerPixel(level) <= height;

  let level = MAP_ZOOM_RANGE.min;
  while (level < MAP_ZOOM_RANGE.max && !fits(level)) level += 1;

  // 가려진 쪽을 비켜 남은 화면 가운데에 범위 가운데가 오도록 지도 중심을 반대쪽으로 민다
  const meters = metersPerPixel(level);
  return {
    center: {
      lat: midLat + (((top - bottom) / 2) * meters) / METERS_PER_DEGREE,
      lng: (bounds.west + bounds.east) / 2 + (((right - left) / 2) * meters) / metersPerDegreeLng
    },
    level
  };
}
