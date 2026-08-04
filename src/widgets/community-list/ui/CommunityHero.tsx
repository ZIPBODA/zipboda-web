import Link from "next/link";
import type { CommunityHero as Hero } from "@/entities/community";

// figma 135:2334 인기글 히어로 — 이미지 위 그라디언트 + 콘텐츠. 실 이미지 연동 전 플레이스홀더
export function CommunityHero({ hero }: { hero: Hero }) {
  return (
    <Link href={`/community/${hero.id}`} className="relative block h-[340px] overflow-hidden rounded-3xl bg-surface-tertiary">
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-8">
        <span className="mb-3 w-fit rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-on">🔥 인기글</span>
        <h2 className="text-h1 font-bold tracking-[-0.0125em] text-fg-ondark">{hero.title}</h2>
        <div className="mt-2 flex items-center gap-3 text-sm text-white/60">
          <span className="h-7 w-7 shrink-0 rounded-full bg-white/20" aria-hidden />
          <span>{hero.handle}</span>
          <span>·</span>
          <span>❤️ {hero.likes.toLocaleString()}</span>
          <span>💬 {hero.comments.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
