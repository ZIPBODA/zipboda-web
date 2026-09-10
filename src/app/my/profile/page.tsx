import type { Metadata } from "next";
import { getProfileEdit, ProfileEditForm } from "@/widgets/my-page";

export const metadata: Metadata = {
  title: "프로필 수정 | 집보다",
  description: "닉네임·연락처·자기소개·관심 분야를 수정하세요."
};

// figma 419:9384 프로필 수정(ZB-U-MY-04) — 모바일 전체화면 페이지. PC는 /my에서 모달로 진입
export default async function ProfileEditPage() {
  const data = await getProfileEdit();

  return (
    <main className="bg-surface md:bg-surface-secondary">
      <div className="mx-auto max-w-5xl px-0 pb-20 pt-0 md:px-6 md:pt-10">
        <ProfileEditForm data={data} />
      </div>
    </main>
  );
}
