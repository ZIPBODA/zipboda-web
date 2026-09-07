import Image from "next/image";
import Link from "next/link";
import type { CommunityHero as Hero } from "@/entities/community";

// figma 135:2334 인기글 히어로 — 이미지 위 그라디언트 + 콘텐츠
export function CommunityHero({ hero }: { hero: Hero }) {
  return (
    <Link href={`/community/${hero.id}`} className="relative block h-[200px] overflow-hidden rounded-2xl bg-surface-tertiary md:h-[340px] md:rounded-3xl">
      <Image src={hero.image} alt="" fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8">
        <span className="mb-2 w-fit rounded-full bg-brand px-3 py-1 text-caption font-bold text-brand-on md:mb-3 md:text-xs">🔥 인기글</span>
        <h2 className="text-base font-bold tracking-[-0.0125em] text-fg-ondark md:text-h1">{hero.title}</h2>
        <div className="mt-2 flex items-center gap-2 text-2xsmall text-white/60 md:gap-3 md:text-sm">
          <span className="size-5 shrink-0 rounded-full bg-white/20 md:size-7" aria-hidden />
          <span>{hero.handle}</span>
          <span>·</span>
          <span>❤️ {hero.likes.toLocaleString()}</span>
          <span>💬 {hero.comments.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
