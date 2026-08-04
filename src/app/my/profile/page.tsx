import type { Metadata } from "next";
import { getProfileEdit, ProfileEditForm } from "@/widgets/my-page";

export const metadata: Metadata = {
  title: "프로필 수정 | 집보다",
  description: "닉네임·연락처·자기소개·관심 분야를 수정하세요."
};

// figma 208:205 마이페이지 프로필 수정(ZB-U-MY-04, PC)
export default async function ProfileEditPage() {
  const data = await getProfileEdit();

  return (
    <main className="bg-surface-secondary">
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <ProfileEditForm data={data} />
      </div>
    </main>
  );
}
