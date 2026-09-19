import Image from "next/image";
import { HOME_HERO_STATS } from "../config/constants";

// figma 135:7753 히어로 — 배경 이미지 + 그라디언트/문구는 디자인 그대로
export function HomeHero() {
  return (
    <section className="relative h-[520px] overflow-hidden bg-line">
      <Image src="/mock/main/main-banner.png" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/[0.68] via-black/[0.35] to-transparent" />

      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center px-6">
        <div className="w-[576px]">
          <span className="inline-flex items-center rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-on">
            🏠 2026년 3분기 청약 오픈 — 신규 14건
          </span>
          <h1 className="mt-6 whitespace-pre-line text-display-lg font-bold tracking-[-0.03125em] text-fg-ondark">
            {"꿈꾸는 집을 찾고\n평면도를 꾸며보세요"}
          </h1>
          <p className="mt-5 w-[448px] text-base text-white/75">
            공공주택 공고 탐색, 인터랙티브 3D 평면도 체험, 맞춤 가구 쇼핑까지 — 한곳에서 모두 가능합니다.
          </p>
          <button
            type="button"
            className="mt-8 rounded-lg bg-brand px-6 py-3.5 text-sm font-bold text-brand-on shadow-lg transition-colors hover:bg-brand-hover"
          >
            지금 신청 — 2026년 3분기 오픈
          </button>
        </div>

        {/* figma 135:7776 지표 카드 */}
        <div className="absolute bottom-[26px] right-6 flex gap-3">
          {HOME_HERO_STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center">
              <p className="text-lg font-bold leading-none text-fg-ondark">{stat.value}</p>
              <p className="mt-1 text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
