import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunityPost } from "@/entities/community";
import { CommunityDetailView } from "@/widgets/community-detail";
import { CommunityEditLauncher } from "@/widgets/community-editor";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getCommunityPost(params.id);
  if (!post) return { title: "커뮤니티 | 집보다" };
  return { title: `${post.title} | 집보다`, description: post.body[0]?.slice(0, 80) };
}

// figma 199:216 커뮤니티 글 상세(ZB-U-COMM-02, PC)
export default async function CommunityPostPage({ params }: { params: { id: string } }) {
  const post = await getCommunityPost(params.id);
  if (!post) notFound();

  return (
    <main className="bg-surface md:bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-0 pb-20 pt-0 md:px-6 md:pt-10">
        <CommunityDetailView
          post={post}
          editSlot={
            <CommunityEditLauncher
              postId={post.id}
              initial={{ category: post.category, title: post.title, body: post.body.join("\n\n"), imageCount: post.bodyImages.length }}
            />
          }
        />
      </div>
    </main>
  );
}
