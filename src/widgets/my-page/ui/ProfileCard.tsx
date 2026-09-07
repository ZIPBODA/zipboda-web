import Link from "next/link";
import type { MyProfile } from "../model/types";

// figma PC 135:1519 / Mobile 419:9003 프로필 — PC는 인라인 통계 카드, 모바일은 컴팩트 카드 + 별도 통계 바
export function ProfileCard({ profile }: { profile: MyProfile }) {
  return (
    <div>
      {/* 모바일(≤767) */}
      <div className="md:hidden">
        <div className="flex items-center gap-4 rounded-2xl border border-line-subtle bg-surface p-4">
          <div className="relative shrink-0">
            <div className="size-14 rounded-2xl bg-surface-tertiary" />
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand text-caption shadow" aria-hidden>
              ✏️
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-fg-heading">{profile.name}</h2>
              {profile.verified && <span className="rounded bg-status-info-bg px-1.5 py-0.5 text-caption font-semibold text-blue-600">인증됨</span>}
            </div>
            <p className="mt-0.5 truncate text-caption text-fg-disabled">{profile.email}</p>
          </div>
          <Link href="/my/profile" className="shrink-0 rounded-xl border border-line px-3 py-1.5 text-caption font-semibold text-fg-body">
            수정
          </Link>
        </div>
        <dl className="mt-3 flex justify-around rounded-2xl bg-surface-secondary py-3">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dd className="text-base font-bold text-fg-heading">{stat.value}</dd>
              <dt className="mt-0.5 text-caption text-fg-disabled">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* PC(≥768) */}
      <div className="hidden items-center gap-6 rounded-3xl border border-line-subtle bg-surface p-8 md:flex">
        <div className="relative shrink-0">
          <div className="h-20 w-20 rounded-2xl bg-surface-tertiary" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs shadow-md" aria-hidden>
            ✏️
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-h2 font-bold tracking-[-0.015em] text-fg-heading">{profile.name}</h2>
            {profile.verified && <span className="rounded-full bg-status-info-bg px-2.5 py-0.5 text-xs font-semibold text-blue-600">인증됨</span>}
          </div>
          <p className="mt-1 text-sm text-fg-disabled">
            {profile.email} · {profile.region}
          </p>
          <dl className="mt-4 flex gap-6">
            {profile.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dd className="text-lg font-bold text-fg-heading">{stat.value}</dd>
                <dt className="mt-0.5 text-xs text-fg-disabled">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <Link href="/my/profile" className="shrink-0 rounded-xl border-2 border-line px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-surface-secondary">
          프로필 수정
        </Link>
      </div>
    </div>
  );
}
