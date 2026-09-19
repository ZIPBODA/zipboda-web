import Link from "next/link";
import {
  AGENCY_TAG_TONE,
  STATUS_BADGE_TONE,
  type SubscriptionDetail
} from "@/entities/subscription";
import type { DetailHrefBuilder } from "../model/types";
import { LocationCard } from "./LocationCard";
import { PENDING_CLASS, PENDING_TITLE } from "@/shared/config/pending";

interface Props {
  detail: SubscriptionDetail;
  selectedSize: string | number | null;
  hrefFor: DetailHrefBuilder;
}

// figma 135:5140 우측 — 공고 요약 · 스펙 · 위치 · 평형 선택 · 외부 신청 CTA
export function DetailInfoPanel({ detail, selectedSize, hrefFor }: Props) {
  const specs: [string, string][] = [
    ["신청 기간", detail.applyPeriod ?? ""],
    ["총 세대수", detail.households ?? ""],
    ["공급 호수", detail.supplyUnits === null || detail.supplyUnits === undefined ? "" : `${detail.supplyUnits}호`],
    ["모집 인원", detail.recruitCount === null || detail.recruitCount === undefined ? "" : `${detail.recruitCount}명`],
    ["공급 유형", detail.supplyType ?? ""],
    ["경쟁률", detail.competition ?? ""],
    ["계약일", detail.contractDate ?? ""],
    ["입주", detail.moveIn ?? ""],
    ["공고일", detail.postDate ?? ""]
  ];

  return (
    <div>
      {/* figma 135:5141 배지 · 단지명 · 위치 */}
      <div className="flex items-center gap-2">
        {detail.agency && <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${AGENCY_TAG_TONE[detail.agency]}`}>
          {detail.agencyLabel}
        </span>}
        {detail.dday !== null && <span className="rounded-md bg-brand/50 px-2.5 py-1 text-xs font-bold text-fg-strong">
          D-{detail.dday} 마감 임박
        </span>}
        {detail.status && <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_TONE[detail.status]}`}>
          {detail.status}
        </span>}
      </div>
      <h1 className="mt-2.5 text-h2 font-bold tracking-[-0.015em] text-fg-heading">{detail.title}</h1>
      <p className="mt-1 text-sm text-fg-disabled">{detail.address}</p>

      {/* figma 135:5152 공고 스펙 */}
      <dl className="mt-5 grid grid-cols-2 gap-2.5">
        {specs.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-secondary p-3.5">
            <dt className="text-xs text-fg-disabled">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-fg-heading">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-2.5">
        <LocationCard title={detail.title} address={detail.address} coord={detail.coord} className="h-[120px]" />
      </div>

      {/* figma 135:5183 평형 선택 */}
      <section className="py-5">
        <h2 className="text-sm font-semibold text-gray-700">평형 선택</h2>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {detail.units.map((unit) => {
            const selected = (unit.unitKey ?? unit.size) === selectedSize;
            return (
              <Link
                key={unit.unitKey ?? unit.size}
                href={hrefFor({ unit: unit.unitKey ?? unit.size ?? undefined })}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={`rounded-lg border-2 py-3 text-center text-sm font-semibold transition-colors ${
                  selected ? "border-brand bg-amber-100 text-fg-heading" : "border-line text-fg-muted hover:bg-surface-secondary"
                }`}
              >
                {unit.label ?? (unit.size === null ? "" : `${unit.size}㎡`)}
              </Link>
            );
          })}
        </div>
      </section>

      {/* figma 135:5194 외부 신청 CTA — 집보다는 신청을 대행하지 않는다(REQ-US-001) */}
      <div className="flex flex-col gap-2.5">
        {detail.applyUrl && <a
          href={detail.applyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-14 items-center justify-center rounded-xl bg-brand px-4 text-base font-bold text-brand-on shadow-lg transition-colors hover:bg-brand-hover"
        >
          해당 기관에서 신청 ↗
        </a>}
        <p className="text-xs text-fg-muted">
          집보다는 신청을 대행하지 않으며 공급기관(LH/SH/GH/IH) 사이트로 이동합니다.
        </p>
        <div className="flex gap-2">
          {["♡ 찜하기", "🔔 구독(알림)", "신청함 표시"].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              title={PENDING_TITLE}
              className={`h-[52px] flex-1 rounded-xl border-2 border-line px-3 text-sm font-semibold text-gray-700 ${PENDING_CLASS}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
