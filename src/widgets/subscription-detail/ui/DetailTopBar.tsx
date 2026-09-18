import Link from "next/link";
import { AGENCY_TAG_TONE, type AgencyCode } from "@/entities/subscription";

interface Props {
  title: string;
  unitLabel: string;
  dday: number | null;
  agency: AgencyCode | null;
  agencyLabel: string;
}

// figma 135:5002 상세 상단 바 — 목록 복귀 · 현재 위치 · D-day/공급기관
export function DetailTopBar({ title, unitLabel, dday, agency, agencyLabel }: Props) {
  return (
    <div className="border-b border-line-subtle bg-surface">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-4">
        <Link
          href="/subscriptions"
          aria-label="목록으로 돌아가기"
          className="flex shrink-0 items-center gap-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg-body"
        >
          <ArrowLeftIcon />
          <span className="hidden sm:inline">목록으로 돌아가기</span>
        </Link>
        <span aria-hidden className="hidden text-lg text-line sm:inline">
          |
        </span>
        <p className="min-w-0 truncate text-sm text-fg-disabled">
          {title} · {unitLabel}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {dday !== null && <span className="rounded-md bg-brand px-2.5 py-1 text-xs font-bold text-brand-on md:px-3 md:py-1.5">D-{dday}</span>}
          {agency && <span className={`hidden rounded-md px-3 py-1.5 text-xs font-semibold sm:inline ${AGENCY_TAG_TONE[agency]}`}>{agencyLabel}</span>}
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.67}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.83 10H4.17" />
      <path d="M10 15.83 4.17 10 10 4.17" />
    </svg>
  );
}
