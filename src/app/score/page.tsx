import type { Metadata } from "next";
import { getSubscriptions } from "@/entities/subscription";
import { PageContainer, PageHeader } from "@/shared/ui";
import { ScoreCalculator } from "@/features/score";

export const metadata: Metadata = {
  title: "청약가점 계산기 | 집보다",
  description: "무주택 기간·부양가족 수·청약통장 가입기간으로 공공주택 청약 가점(최고 84점)을 계산하세요."
};

// figma 135:2577 청약가점 계산기(ZB-U-SCORE-01, PC)
export default async function ScorePage() {
  const eligible = (await getSubscriptions()).slice(0, 2);

  return (
    <PageContainer>
      <PageHeader title="청약가점 계산기" description="공공주택 청약 가점을 계산하세요 (최고 84점)" />

      <div className="mt-6 md:mt-8">
        <ScoreCalculator eligible={eligible} />
      </div>
    </PageContainer>
  );
}
