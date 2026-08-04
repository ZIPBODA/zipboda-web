import Link from "next/link";
import type { MyProfile } from "../model/types";

// figma 135:1519 프로필 카드 — 아바타 + 이름·인증·이메일·통계 + 프로필 수정
export function ProfileCard({ profile }: { profile: MyProfile }) {
  return (
    <div className="flex items-center gap-6 rounded-3xl border border-line-subtle bg-surface p-8">
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
  );
}
