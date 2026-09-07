import type { Metadata } from "next";
import { CommunityPostForm } from "@/widgets/community-editor";

export const metadata: Metadata = {
  title: "새 글 작성 | 집보다",
  description: "커뮤니티에 새 글을 작성하세요."
};

// figma 199:60 커뮤니티 글쓰기(ZB-U-COMM-03, PC)
export default function CommunityWritePage() {
  return (
    <main className="bg-surface md:bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-0 pb-20 pt-0 md:px-6 md:pt-10">
        <CommunityPostForm mode="create" />
      </div>
    </main>
  );
}
