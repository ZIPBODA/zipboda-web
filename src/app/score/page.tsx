import type { Metadata } from "next";
import { getSubscriptions } from "@/entities/subscription";
import { PageContainer, PageHeader } from "@/shared/ui";
import { ELIGIBLE_LISTING_COUNT, ScoreCalculator } from "@/features/score";

/**
 * 요청 때 그린다. 주소 값을 읽지 않는 화면이라 그대로 두면 빌드가 미리 그리며 API를 부른다 — API에 닿지 않는 빌드(CI)가 깨진다.
 * API 응답은 fetch의 60초 데이터 캐시(shared/api/client)로 계속 아낀다
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "청약가점 계산기 | 집보다",
  description: "무주택 기간·부양가족 수·청약통장 가입기간으로 공공주택 청약 가점(최고 84점)을 계산하세요."
};

// figma 135:2577 청약가점 계산기(ZB-U-SCORE-01, PC)
export default async function ScorePage() {
  const { items: eligible } = await getSubscriptions({}, { pageSize: ELIGIBLE_LISTING_COUNT });

  return (
    <PageContainer>
      <PageHeader title="청약가점 계산기" description="공공주택 청약 가점을 계산하세요 (최고 84점)" />

      <div className="mt-6 md:mt-8">
        <ScoreCalculator eligible={eligible} />
      </div>
    </PageContainer>
  );
}
