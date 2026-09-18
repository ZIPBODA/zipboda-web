import type { GeoPoint } from "../../lib/geo";

/** 좌표가 있으면 카카오맵 앱·웹이 그 지점을 바로 연다. 이 주소는 앱키 없이 동작한다 */
export const kakaoMapLink = (name: string, point: GeoPoint | null): string | null =>
  point === null ? null : `https://map.kakao.com/link/map/${encodeURIComponent(name)},${point.lat},${point.lng}`;

/**
 * 지도를 못 그릴 때 대신 보이는 것.
 * 빈 회색 상자로 두지 않는 이유는 주소가 이미 있는 데이터이기 때문이다 — 있는 것은 보여준다.
 */
export function MapFallback({ name, address, point }: { name: string; address: string; point: GeoPoint | null }) {
  const link = kakaoMapLink(name, point);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-10 bg-surface-tertiary p-4 text-center">
      <p className="text-sm font-medium text-fg-body">{address}</p>
      {link && (
        <a href={link} target="_blank" rel="noreferrer noopener" className="text-xs font-semibold text-fg-muted underline">
          카카오맵에서 보기
        </a>
      )}
    </div>
  );
}
