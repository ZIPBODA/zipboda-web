import { MAP_LEVEL } from "@/shared/config/map";
import type { GeoPoint } from "@/shared/lib/geo";
import { MapFallback, MapViewLoader, kakaoMapLink, kakaoSearchLink } from "@/shared/ui/map";
import { cn } from "@/shared/ui";

interface Props {
  title: string;
  /** 좌표를 아직 못 구했을 때 카카오맵 검색에 쓴다 — 주소는 화면 위쪽에 이미 있어 여기서는 링크로만 쓴다 */
  address?: string;
  coord?: GeoPoint | null;
  /** 지도 높이 — PC 카드와 모바일 탭이 크기만 다르다 */
  className?: string;
}

// figma 150:51 위치 — 주소는 화면 상단에 이미 있으므로 여기서는 지도와 외부 링크만 둔다
export function LocationCard({ title, address, coord = null, className }: Props) {
  const point = coord ?? null;
  const link = kakaoMapLink(title, point) ?? (address ? kakaoSearchLink(address) : null);

  return (
    <section className="rounded-lg border border-line bg-surface-tertiary p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-fg-heading">위치</h2>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer noopener" className="text-xs font-semibold text-fg-muted underline">
            지도 보기
          </a>
        ) : (
          <span className="text-xs font-semibold text-fg-disabled">지도 보기</span>
        )}
      </div>

      <MapViewLoader
        markers={point ? [{ id: "property", point, label: title }] : []}
        center={point}
        level={MAP_LEVEL.card}
        interactive={false}
        ariaLabel={`${title} 위치 지도`}
        fallback={<MapFallback name={title} point={point} query={address} />}
        className={cn("mt-2.5 overflow-hidden rounded-10", className)}
      />
    </section>
  );
}
