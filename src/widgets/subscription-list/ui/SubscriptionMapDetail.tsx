"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AGENCY_TAG_TONE, STATUS_BADGE_TONE, type Subscription } from "@/entities/subscription";
import { MAP_LEVEL } from "@/shared/config/map";
import { MOBILE_MEDIA_QUERY } from "@/shared/config/viewport";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { Button, cn } from "@/shared/ui";
import { MapFallback, MapViewLoader } from "@/shared/ui/map";
import { ShareButton } from "@/shared/ui/ShareButton";
import { formatAreaRange } from "../lib/formatAreaRange";
import type { LoadMapDetail, MapDetailData } from "../model/mapDetail";
import { DeadlineTag } from "./DeadlineTag";

/**
 * PC에서는 목록 옆 패널이고, 모바일에서는 지도 위를 덮는 한 장의 페이지다.
 * 모바일은 사진 옆에 작은 위치 지도를 두고, 신청으로 가는 버튼을 화면 아래에 고정한다 — 긴 기본 정보를 내려 읽어도 신청이 늘 한 번에 닿게.
 */
export function SubscriptionMapDetail({ id, loadDetail, onClose, item }: { id: string; loadDetail: LoadMapDetail; onClose: () => void; item?: Subscription }) {
  const [data, setData] = useState<MapDetailData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [unit, setUnit] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  // 숨긴 채로 두 번째 지도를 띄우지 않도록 모바일일 때만 위치 지도를 그린다
  const mobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    void loadDetail(id).then((result) => {
      if (cancelled) return;
      setData(result);
      setUnit(String(result?.detail.defaultUnitKey ?? result?.detail.defaultUnitSize ?? ""));
      setStatus(result ? "ready" : "error");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    heading.current?.focus();
    return () => { cancelled = true; };
  }, [id, loadDetail, attempt]);
  const detail = data?.detail;
  const plan = data?.plans.find((entry) => entry.unit === unit);
  const href = `/subscriptions/${encodeURIComponent(id)}`;
  const noticeHref = `${href}?${new URLSearchParams({ unit })}`;
  const point = detail?.coord ?? item?.coord ?? null;
  const showsMiniMap = mobile && point !== null;
  const summary = detail ? [
    formatAreaRange(item?.sizes ?? []),
    item?.households == null ? detail.households : `총 ${item.households}세대`,
    detail.supplyUnits == null ? null : `공급 ${detail.supplyUnits}호`
  ].filter(Boolean) : [];
  const specs = detail ? [
    ["신청 기간", detail.applyPeriod], ["총 세대수", detail.households],
    ["공급 호수", detail.supplyUnits == null ? null : `${detail.supplyUnits}호`],
    ["모집 인원", detail.recruitCount == null ? null : `${detail.recruitCount}명`],
    ["공급 유형", detail.supplyType], ["공고일", detail.postDate], ["계약일", detail.contractDate], ["입주", detail.moveIn]
  ] : [];
  return (
    <aside aria-label="선택한 청약 상세" className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-surface-tertiary md:relative md:inset-auto md:z-auto md:h-auto md:w-96 md:shrink-0 md:rounded-2xl md:border md:border-line-subtle md:bg-surface md:shadow-sm" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <div className="flex shrink-0 items-center justify-between border-b border-line-subtle bg-surface px-5 py-3 max-md:px-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="min-h-11 max-md:min-w-11 max-md:!px-0">
          <span aria-hidden className="md:hidden"><ArrowLeftIcon /></span>
          <span className="max-md:sr-only">← 목록으로</span>
        </Button>
        <h2 ref={heading} tabIndex={-1} className="text-lg font-bold text-fg-heading outline-none">청약 상세</h2>
        <Button variant="ghost" size="sm" aria-label="청약 상세 닫기" onClick={onClose} className="min-h-11 min-w-11 max-md:hidden"><span aria-hidden className="text-xl">×</span></Button>
        {detail ? <ShareButton title={detail.title} className="flex size-11 items-center justify-center text-fg-heading md:hidden"><ShareIcon /></ShareButton> : <span aria-hidden className="size-11 md:hidden" />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-busy={status === "loading"}>
        {status === "loading" && <p role="status" className="p-5 text-sm text-fg-muted">공고를 불러오는 중입니다.</p>}
        {status === "error" && <div className="p-5"><p role="alert" className="text-sm text-fg-heading">공고를 불러오지 못했습니다.</p><Button className="mt-3" onClick={() => setAttempt((value) => value + 1)}>다시 시도</Button></div>}
        {status === "ready" && detail && <>
          {(detail.image || showsMiniMap) && <div className="grid h-48 grid-cols-3 gap-px bg-line-subtle max-md:h-40">
            <div className={cn("relative bg-surface-secondary", showsMiniMap ? "col-span-2" : "col-span-3")}>{detail.image && <Image src={detail.image} alt={detail.title} fill sizes="384px" className="object-cover" />}</div>
            {showsMiniMap && point && <MapViewLoader markers={[{ id, point, label: detail.title }]} center={point} level={MAP_LEVEL.card} interactive={false} ariaLabel={`${detail.title} 위치 지도`}
              fallback={<MapFallback name={detail.title} point={point} query={detail.address} />} className="h-full" />}
          </div>}
          <div className="space-y-5 p-5 max-md:space-y-2 max-md:p-0">
            <section className="max-md:bg-surface max-md:p-5">
              <p className="text-xs font-medium text-fg-muted max-md:hidden">{[detail.agencyLabel, detail.status].filter(Boolean).join(" · ")}</p>
              <div className="flex flex-wrap gap-2 md:hidden">
                {detail.agency && <span className={`rounded-lg px-2.5 py-1 text-2xsmall font-semibold ${AGENCY_TAG_TONE[detail.agency]}`}>{detail.agencyLabel}</span>}
                {detail.status && <span className={`rounded-lg px-2.5 py-1 text-2xsmall font-semibold ${STATUS_BADGE_TONE[detail.status]}`}>{detail.status}</span>}
              </div>
              <h3 className="mt-2 text-xl font-bold text-fg-heading">{detail.title}</h3>
              {summary.length > 0 && <p className="mt-2 flex flex-wrap divide-x divide-line text-sm text-fg-body md:hidden">{summary.map((part) => <span key={part} className="px-2 first:pl-0">{part}</span>)}</p>}
              <p className="mt-2 text-sm text-fg-muted">{detail.address}</p>
              <DeadlineTag dday={detail.dday ?? item?.dday ?? null} deadline={item?.deadline ?? null} className="mt-3 md:hidden" />
            </section>
            <section className="max-md:bg-surface max-md:p-5"><h4 className="font-bold text-fg-heading max-md:text-lg">기본 정보</h4><dl className="mt-2 divide-y divide-line-subtle">{specs.filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><dt className="shrink-0 text-fg-muted">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl></section>
            <section className="space-y-5 max-md:bg-surface max-md:p-5">
              {detail.units.length > 0 && <div><label htmlFor="map-detail-unit" className="font-bold text-fg-heading">평형·호수 선택</label><select id="map-detail-unit" value={unit} onChange={(event) => setUnit(event.target.value)} className="mt-3 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm">{detail.units.map((entry) => <option key={entry.unitKey ?? entry.size} value={String(entry.unitKey ?? entry.size ?? "")}>{entry.label ?? `${entry.size ?? ""}㎡`}</option>)}</select></div>}
              {plan?.image && <Link href={`${href}/floorplan?${new URLSearchParams({ unit, view: "2D" })}`} className="block"><div className="relative h-56 rounded-lg border border-line"><Image src={plan.image} alt={`${detail.title} 선택 호수 평면도`} fill sizes="344px" className="object-contain" /></div><span className="mt-2 block text-sm font-semibold">2D 평면도 크게 보기 →</span></Link>}
              {plan?.has3d && <Link href={`${href}/floorplan?${new URLSearchParams({ unit, view: "3D" })}`} className="flex min-h-11 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-on">3D 둘러보기</Link>}
              {/* 모바일에서는 아래 고정 버튼이 맡는 링크를 본문에서 한 번 더 보이지 않는다 */}
              <Link href={noticeHref} className={cn("flex min-h-11 items-center justify-center rounded-lg border border-line text-sm font-semibold", !detail.applyUrl && "max-md:hidden")}>공고 전체 보기 →</Link>
              {detail.applyUrl && <a href={detail.applyUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-on max-md:hidden">공급기관 바로가기 ↗</a>}
            </section>
          </div>
        </>}
      </div>
      {status === "ready" && detail && <div className="shrink-0 border-t border-line-subtle bg-surface p-3 md:hidden">
        {detail.applyUrl
          ? <a href={detail.applyUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center rounded-xl bg-brand text-base font-bold text-brand-on">공급기관 바로가기 ↗</a>
          : <Link href={noticeHref} className="flex min-h-12 items-center justify-center rounded-xl bg-brand text-base font-bold text-brand-on">공고 전체 보기 →</Link>}
      </div>}
    </aside>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
