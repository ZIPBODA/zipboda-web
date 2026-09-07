"use client";

import { useState } from "react";
import { FormModal } from "@/shared/ui";
import { ProfileCard } from "./ProfileCard";
import { ProfileEditForm } from "./ProfileEditForm";
import type { MyProfile, ProfileEditData } from "../model/types";

// figma 208:205 프로필 카드 + PC 프로필 수정 모달(로컬). 모바일은 ProfileCard의 /my/profile 링크(전체화면 페이지)
export function MyProfileSection({ profile, editData }: { profile: MyProfile; editData: ProfileEditData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ProfileCard profile={profile} onEdit={() => setOpen(true)} />
      <FormModal open={open} title="프로필 수정" onClose={() => setOpen(false)}>
        <ProfileEditForm data={editData} onDone={() => setOpen(false)} />
      </FormModal>
    </>
  );
}
