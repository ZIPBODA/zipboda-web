import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubscriptions, selectSubscriptionUnit } from "@/entities/subscription";
import {
  getFloorplan,
  DEFAULT_VIEW_MODE,
  DEFAULT_VIEWPOINT,
  VIEW_MODES,
  VIEWPOINTS,
  type FloorplanViewMode,
  type Viewpoint
} from "@/entities/floorplan";
import { getRecommendedProducts } from "@/entities/product";
import { firstParam } from "@/shared/lib/searchParams";
import { getRequestSubscriptionDetail } from "../subscriptionDetailData";
import {
  DetailTopBar,
  FloorplanViewer,
  DetailInfoPanel,
  FurnitureSuggestions,
  MobileSubscriptionDetail,
  createDetailHrefBuilder,
  DEFAULT_MOBILE_DETAIL_TAB,
  MOBILE_DETAIL_TAB_KEYS,
  type MobileDetailTab
} from "@/widgets/subscription-detail";

const NEARBY_COUNT = 2;

interface PageProps {
  params: { id: string };
  searchParams: { unit?: string | string[]; view?: string; viewpoint?: string; tab?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const detail = await getRequestSubscriptionDetail(params.id);
  if (!detail) return { title: "청약 공고 | 집보다" };
  return {
    title: `${detail.title} | 집보다`,
    description: [detail.address, detail.supplyType, detail.households].filter(Boolean).join(" · ")
  };
}

// figma 135:4998(2D)·135:5295(3D) 청약 공고 상세(SUBS-03)
export default async function SubscriptionDetailPage({ params, searchParams }: PageProps) {
  const detail = await getRequestSubscriptionDetail(params.id);
  if (!detail) notFound();

  const requestedUnit = firstParam(searchParams.unit);
  const selectedUnit = selectSubscriptionUnit(detail, requestedUnit);
  if (requestedUnit && !selectedUnit) notFound();
  const unitKey = selectedUnit?.unitKey ?? selectedUnit?.size ?? null;

  const view = VIEW_MODES.includes(searchParams.view as FloorplanViewMode)
    ? (searchParams.view as FloorplanViewMode)
    : DEFAULT_VIEW_MODE;
  const viewpoint = VIEWPOINTS.includes(searchParams.viewpoint as Viewpoint)
    ? (searchParams.viewpoint as Viewpoint)
    : DEFAULT_VIEWPOINT;
  const activeTab = MOBILE_DETAIL_TAB_KEYS.includes(searchParams.tab as MobileDetailTab)
    ? (searchParams.tab as MobileDetailTab)
    : DEFAULT_MOBILE_DETAIL_TAB;

  // 지금 공고가 첫 페이지에 들 수 있어 하나 더 받아 둔다
  const [floorplan, products, firstPage] = await Promise.all([
    selectedUnit?.layoutKey ? getFloorplan(selectedUnit.layoutKey) : null,
    getRecommendedProducts(),
    getSubscriptions({}, { pageSize: NEARBY_COUNT + 1 })
  ]);
  const nearby = firstPage.items.filter((s) => s.id !== detail.id).slice(0, NEARBY_COUNT);

  const hrefFor = createDetailHrefBuilder({
    id: detail.id,
    defaultUnitSize: detail.defaultUnitKey ?? detail.defaultUnitSize,
    unit: unitKey,
    view,
    viewpoint
  });

  return (
    <>
      {/* PC — 기존 2단 레이아웃 유지 */}
      <div className="hidden md:block">
        <DetailTopBar
          title={detail.title}
          unitLabel={selectedUnit?.label ?? ""}
          dday={detail.dday}
          agency={detail.agency}
          agencyLabel={detail.agencyLabel}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row">
            <FloorplanViewer floorplan={floorplan} subscriptionId={detail.id} unitSize={unitKey} />
            <div className="flex w-full shrink-0 flex-col lg:w-[476px]">
              <DetailInfoPanel detail={detail} selectedSize={unitKey} hrefFor={hrefFor} />
              <FurnitureSuggestions products={products} />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile — figma 419:10352 전용 구조 */}
      <div className="md:hidden">
        <MobileSubscriptionDetail
          detail={detail}
          floorplan={floorplan}
          selectedUnit={selectedUnit}
          activeTab={activeTab}
          nearby={nearby}
        />
      </div>
    </>
  );
}
