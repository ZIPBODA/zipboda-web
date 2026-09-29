import { MAP_ZOOM_RANGE } from "@/shared/config/map";
import { isInKorea } from "@/shared/lib/geo";
import type { MapViewport } from "@/shared/ui/map";
import { MAP_VIEWPORT_PRECISION, MAP_VIEWPORT_QUERY_KEYS } from "../config/constants";

const readNumber = (params: URLSearchParams, key: string) => {
  const raw = params.get(key);
  return raw === null || raw.trim() === "" ? Number.NaN : Number(raw);
};

/** 셋 중 하나라도 없거나 어긋나면 없는 것으로 본다 — 지도는 공고 전체에 맞춰 열린다 */
export function readMapViewport(params: URLSearchParams): MapViewport | null {
  const center = { lat: readNumber(params, MAP_VIEWPORT_QUERY_KEYS.lat), lng: readNumber(params, MAP_VIEWPORT_QUERY_KEYS.lng) };
  const level = readNumber(params, MAP_VIEWPORT_QUERY_KEYS.zoom);
  const isLevel = Number.isInteger(level) && MAP_ZOOM_RANGE.min <= level && level <= MAP_ZOOM_RANGE.max;
  return isLevel && isInKorea(center) ? { center, level } : null;
}

export function writeMapViewport(params: URLSearchParams, { center, level }: MapViewport): URLSearchParams {
  const next = new URLSearchParams(params);
  next.set(MAP_VIEWPORT_QUERY_KEYS.lat, center.lat.toFixed(MAP_VIEWPORT_PRECISION));
  next.set(MAP_VIEWPORT_QUERY_KEYS.lng, center.lng.toFixed(MAP_VIEWPORT_PRECISION));
  next.set(MAP_VIEWPORT_QUERY_KEYS.zoom, String(level));
  return next;
}
