import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/shared/ui";
import { LegalDocument, TERMS_SECTIONS } from "@/widgets/legal";

export const metadata: Metadata = {
  title: "이용약관 | 집보다",
  description: "집보다 서비스의 성격과 책임 범위 안내"
};

export default function TermsPage() {
  return (
    <PageContainer>
      <PageHeader title="이용약관" description="청약 정보는 참고용이며 신청은 공급기관에서 진행합니다" />
      <LegalDocument sections={TERMS_SECTIONS} />
    </PageContainer>
  );
}
