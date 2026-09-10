import Image from "next/image";
import Link from "next/link";
import { RoomSpecGrid, type Floorplan } from "@/entities/floorplan";

interface Props {
  floorplan: Floorplan | null;
  subscriptionId: string;
  unitSize: number;
}

// figma 135:5023 좌측 — 평면도 프리뷰(2D) + 전용 뷰어(2D/3D·1인칭) 진입 + 방별 치수
export function FloorplanViewer({ floorplan, subscriptionId, unitSize }: Props) {
  const base = `/subscriptions/${subscriptionId}/floorplan?unit=${unitSize}`;

  return (
    <section className="min-w-0 flex-1">
      <h2 className="text-h2 font-bold tracking-[-0.015em] text-fg-heading">평면도 뷰어</h2>

      <div className="relative mt-4 h-[280px] overflow-hidden rounded-xl border border-line bg-surface-warm md:mt-5 md:h-[440px]">
        {floorplan ? (
          <Image src={floorplan.image2dUrl} alt="2D 평면도" fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-fg-muted">평면도 준비 중</div>
        )}

        {floorplan && (
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/50 to-transparent p-4">
            <Link href={`${base}&view=2d`} className="rounded-lg bg-surface/90 px-4 py-2 text-sm font-semibold text-fg-heading shadow-sm transition-colors hover:bg-surface">
              2D 크게 보기
            </Link>
            <Link href={`${base}&view=3d`} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-fg-heading shadow-sm transition-colors hover:bg-brand-hover">
              3D·1인칭 집구경 ↗
            </Link>
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
