import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunityPost } from "@/entities/community";
import { CommunityPostForm } from "@/widgets/community-editor";

export const metadata: Metadata = {
  title: "글 수정 | 집보다"
};

// figma 208:30 커뮤니티 글 수정(ZB-U-COMM-04, PC)
export default async function CommunityEditPage({ params }: { params: { id: string } }) {
  const post = await getCommunityPost(params.id);
  if (!post) notFound();

  return (
    <main className="bg-surface md:bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-0 pb-20 pt-0 md:px-6 md:pt-10">
        <CommunityPostForm mode="edit" initial={{ category: post.category, title: post.title, body: post.body.join("\n\n"), imageCount: 2 }} />
      </div>
    </main>
  );
}
