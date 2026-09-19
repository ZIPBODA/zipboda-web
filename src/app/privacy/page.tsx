import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/shared/ui";
import { LegalDocument, PRIVACY_SECTIONS } from "@/widgets/legal";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 집보다",
  description: "집보다가 다루는 정보와 브라우저 저장소 사용 안내"
};

export default function PrivacyPage() {
  return (
    <PageContainer>
      <PageHeader title="개인정보처리방침" description="회원가입 없이 이용하는 서비스입니다" />
      <LegalDocument sections={PRIVACY_SECTIONS} />
    </PageContainer>
  );
}
