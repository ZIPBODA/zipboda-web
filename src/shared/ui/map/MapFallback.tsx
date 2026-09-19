import type { GeoPoint } from "../../lib/geo";

/** 좌표가 있으면 카카오맵 앱·웹이 그 지점을 바로 연다. 이 주소는 앱키 없이 동작한다 */
export const kakaoMapLink = (name: string, point: GeoPoint | null): string | null =>
  point === null ? null : `https://map.kakao.com/link/map/${encodeURIComponent(name)},${point.lat},${point.lng}`;

/** 좌표를 아직 못 구한 주택도 주소만으로 카카오맵에서 찾아볼 수 있다 */
export const kakaoSearchLink = (query: string): string | null =>
  query.trim() === "" ? null : `https://map.kakao.com/link/search/${encodeURIComponent(query.trim())}`;

/**
 * 지도를 못 그릴 때 그 자리를 채운다.
 * 주소는 어느 화면에서든 지도 바깥에 이미 있으므로 여기서 되풀이하지 않고, 바로 열어 볼 링크만 남긴다.
 * 좌표가 없어도 빈 상자로 두지 않는다 — 주소라는 진짜 데이터가 있으면 검색으로 연결한다.
 */
export function MapFallback({ name, point, query }: { name: string; point: GeoPoint | null; query?: string }) {
  const link = kakaoMapLink(name, point) ?? (query ? kakaoSearchLink(query) : null);

  return (
    <div className="flex h-full w-full items-center justify-center rounded-10 bg-surface-tertiary p-4">
      {link ? (
        <a href={link} target="_blank" rel="noreferrer noopener" className="text-xs font-semibold text-fg-muted underline">
          카카오맵에서 보기
        </a>
      ) : (
        <span className="text-xs font-semibold text-fg-disabled">위치 정보 준비 중</span>
      )}
    </div>
  );
}
