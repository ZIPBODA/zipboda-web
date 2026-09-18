import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubscriptionDetail, selectSubscriptionUnit } from "@/entities/subscription";
import { getFloorplan } from "@/entities/floorplan";
import { DEFAULT_FLOORPLAN_TAB, FLOORPLAN_TAB_KEYS, FloorplanExperienceLoader, type FloorplanTab } from "@/widgets/floorplan-viewer";

interface PageProps {
  params: { id: string };
  searchParams: { unit?: string; view?: string; mode?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const detail = await getSubscriptionDetail(params.id);
  return { title: detail ? `${detail.title} 평면도 집구경 | 집보다` : "평면도 집구경 | 집보다" };
}

// figma 353:3980·353:3799·353:3902 평면도 2D/3D/1인칭 워크스루(SUBS-08) — 전용 풀스크린
export default async function FloorplanViewerPage({ params, searchParams }: PageProps) {
  const detail = await getSubscriptionDetail(params.id);
  if (!detail) notFound();

  const unit = selectSubscriptionUnit(detail, searchParams.unit);
  if (!unit) notFound();
  const key = unit.unitKey ?? unit.size;
  const floorplan = key === null ? null : await getFloorplan(detail.id, key);
  if (!floorplan) notFound();

  const initialTab: FloorplanTab = FLOORPLAN_TAB_KEYS.includes(searchParams.view ?? "") ? (searchParams.view as FloorplanTab) : DEFAULT_FLOORPLAN_TAB;
  const initialWalk = searchParams.mode === "walk";

  return (
    <FloorplanExperienceLoader
      floorplan={floorplan}
      title={detail.title}
      backHref={`/subscriptions/${detail.id}?unit=${encodeURIComponent(String(key))}`}
      initialTab={initialTab}
      initialWalk={initialWalk}
    />
  );
}
