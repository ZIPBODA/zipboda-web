import Link from "next/link";
import { RoomSpecGrid, VIEWPOINTS, type Floorplan, type FloorplanViewMode, type Viewpoint } from "@/entities/floorplan";
import type { DetailHrefBuilder } from "../model/types";

interface Props {
  floorplan: Floorplan | null;
  view: FloorplanViewMode;
  viewpoint: Viewpoint;
  hrefFor: DetailHrefBuilder;
}

// figma 135:5023 좌측 — 평면도 뷰어(2D/3D 전환) + 방별 치수
export function FloorplanViewer({ floorplan, view, viewpoint, hrefFor }: Props) {
  return (
    <section className="min-w-0 flex-1">
      {/* figma 135:5024 제목 + 2D/3D 토글 */}
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-bold tracking-[-0.015em] text-fg-heading">평면도 뷰어</h2>
        <div className="flex gap-1 rounded-lg bg-surface-tertiary p-1">
          <Link
            href={hrefFor({ view: "2D" })}
            aria-current={view === "2D" ? "true" : undefined}
            className={`rounded-md px-5 py-2 text-sm ${
              view === "2D" ? "bg-surface font-semibold text-fg-heading shadow-sm" : "font-bold text-fg-muted"
            }`}
          >
            2D 평면도
          </Link>
          <Link
            href={hrefFor({ view: "3D" })}
            aria-current={view === "3D" ? "true" : undefined}
            className={`flex items-center gap-1.5 rounded-md px-5 py-2 text-sm ${
              view === "3D" ? "bg-surface font-semibold text-fg-heading shadow-sm" : "font-bold text-fg-muted"
            }`}
          >
            <CubeIcon />
            3D 배치도
          </Link>
        </div>
      </div>

      {/* figma 135:5037 뷰어 — 자산 렌더는 API-031/032 연동(S4) 전까지 공백 */}
      <div className="relative mt-5 h-[440px] overflow-hidden rounded-xl border border-line bg-surface-warm">
        {view === "2D" ? (
          <span className="absolute left-4 top-4 rounded-full border border-line-subtle bg-surface/80 px-3 py-1.5 text-xs font-medium text-fg-muted">
            2D 건축 평면도
          </span>
        ) : (
          <div className="absolute inset-4 flex flex-col justify-between">
            {/* figma 150:27 상단 — 안내 문구 · 전체화면 */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-fg-heading">집구경 - 1·3인칭으로 둘러보기</p>
              <span className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-gray-700">
                <MaximizeIcon />
                전체화면
              </span>
            </div>
            {/* figma 150:32 하단 — 시점 전환 · 조작 안내 */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 rounded-lg bg-surface-tertiary p-1">
                {VIEWPOINTS.map((point) => (
                  <Link
                    key={point}
                    href={hrefFor({ viewpoint: point })}
                    aria-current={viewpoint === point ? "true" : undefined}
                    className={`rounded-10 px-3 py-2 text-[13px] font-semibold ${
                      viewpoint === point ? "bg-surface text-fg-heading" : "text-fg-muted"
                    }`}
                  >
                    {point}
                  </Link>
                ))}
              </div>
              <p className="text-xs text-fg-muted">드래그로 회전 · 스크롤로 확대/축소</p>
            </div>
          </div>
        )}
      </div>

      {floorplan && (
        <div className="mt-5">
          <RoomSpecGrid rooms={floorplan.rooms} />
        </div>
      )}
    </section>
  );
}

function CubeIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.13 4.69v5.62L7.5 13.44l-5.63-3.13V4.69L7.5 1.56l5.63 3.13Z" />
      <path d="m2.04 4.35 5.46 3.03 5.46-3.03" />
      <path d="M7.5 7.5v6.3" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.33} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2H2v4M10 2h4v4M10 14h4v-4M6 14H2v-4" />
    </svg>
  );
}
