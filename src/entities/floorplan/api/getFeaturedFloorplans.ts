import { API_STATUS, ApiError, getApi } from "@/shared/api/client";
import { FEATURED_FLOORPLAN_COUNT } from "../config/constants";
import type { Floorplan, FloorplanShowcase } from "../model/types";
import type { FloorplanDetailDto } from "./floorplan.dto";
import { HOUSING_FLOORPLANS } from "./housingFloorplans";

const getFloorplanDetail = async (id: string): Promise<FloorplanDetailDto | null> => {
  try {
    return await getApi<FloorplanDetailDto>(`/floorplans/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === API_STATUS.NOT_FOUND) return null;
    throw error;
  }
};

const firstPerComplex = (plans: Floorplan[]): Floorplan[] =>
  plans.filter((plan, index) => plans.findIndex((other) => other.complexId === plan.complexId) === index);

/**
 * 3D 검수를 마친 도면을 단지마다 하나씩 앞세운다. 도면은 단지에 붙어 여러 공고에 나오므로
 * 어느 공고로 들어갈지는 API가 고른다(API-031) — 보여 줄 공고가 없는 도면은 빼서 빈 상세로 이어지지 않게 한다.
 * 몇 건만 실패하면 그 도면만 빼고 보인다(홈의 한 칸 때문에 홈 전체가 오류가 나지 않게). 모두 실패하면 오류를 올린다
 */
export async function getFeaturedFloorplans(): Promise<FloorplanShowcase[]> {
  const candidates = firstPerComplex(HOUSING_FLOORPLANS.filter((plan) => plan.has3d));
  const settled = await Promise.allSettled(candidates.map(async (plan): Promise<FloorplanShowcase | null> => {
    const detail = await getFloorplanDetail(plan.id);
    if (!detail?.subscriptionId) return null;
    return {
      id: plan.id,
      title: detail.complexName,
      size: plan.size,
      type: plan.type,
      summary: `${plan.type ? `${plan.type}타입 · ` : ""}원본 도면 · 3D 탐색`,
      has2d: true,
      has3d: plan.has3d,
      image: plan.image2dUrl,
      href: `/subscriptions/${encodeURIComponent(detail.subscriptionId)}/floorplan?unit=${encodeURIComponent(plan.id)}`
    };
  }));
  const failures = settled.filter((result) => result.status === "rejected");
  if (candidates.length > 0 && failures.length === candidates.length) throw failures[0].reason;
  return settled
    .flatMap((result) => (result.status === "fulfilled" && result.value !== null ? [result.value] : []))
    .slice(0, FEATURED_FLOORPLAN_COUNT);
}
