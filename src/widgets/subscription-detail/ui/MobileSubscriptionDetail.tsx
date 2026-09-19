import Image from "next/image";
import Link from "next/link";
import {
  AGENCY_TAG_TONE,
  STATUS_BADGE_TONE,
  SubscriptionCardMobile,
  type Subscription,
  type SubscriptionDetail,
  type SubscriptionUnit
} from "@/entities/subscription";
import type { Floorplan } from "@/entities/floorplan";
import { DEFAULT_MOBILE_DETAIL_TAB, MOBILE_DETAIL_TABS, type MobileDetailTab } from "../config/constants";
import { LocationCard } from "./LocationCard";

interface Props {
  detail: SubscriptionDetail;
  floorplan: Floorplan | null;
  selectedUnit: SubscriptionUnit | null;
  activeTab: MobileDetailTab;
  nearby: Subscription[];
}

// figma 419:10352 청약 상세(SUBS-03) 모바일 — 컨텍스트 헤더·히어로·정보·탭·뷰어·주변 매물
export function MobileSubscriptionDetail({ detail, floorplan, selectedUnit, activeTab, nearby }: Props) {
  const sizes = detail.units.flatMap((u) => u.size === null ? [] : [u.size]);
  const areaRange = sizes.length === 0 ? "" : `${Math.min(...sizes)}㎡ ~ ${Math.max(...sizes)}㎡`;
  const summary: [string, string][] = [
    ["신청 기간", detail.applyPeriod ?? ""],
    ["세대수", detail.households ?? ""],
    ["전용면적", areaRange],
    ["입주예정", detail.moveIn ?? ""]
  ];

  const hrefFor = ({ tab, unit }: { tab?: MobileDetailTab; unit?: string | number }) => {
    const query = new URLSearchParams();
    const nextUnit = unit ?? selectedUnit?.unitKey ?? selectedUnit?.size;
    const nextTab = tab ?? activeTab;
    if (nextUnit !== (detail.defaultUnitKey ?? detail.defaultUnitSize)) query.set("unit", String(nextUnit));
    if (nextTab !== DEFAULT_MOBILE_DETAIL_TAB) query.set("tab", nextTab);
    const search = query.toString();
    return search ? `/subscriptions/${detail.id}?${search}` : `/subscriptions/${detail.id}`;
  };

  return (
    <div className="bg-surface-tertiary pb-6">
      {/* figma 419:10354 컨텍스트 헤더 — 뒤로가기 · 단지명 · 공유 */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line-subtle bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/subscriptions" aria-label="목록으로 돌아가기" className="shrink-0 text-fg-heading">
            <ArrowLeftIcon />
          </Link>
          <span className="truncate text-base font-bold text-fg-heading">{detail.title}</span>
        </div>
        <button type="button" aria-label="공유" className="shrink-0 text-fg-heading">
          <ShareIcon />
        </button>
      </div>

      {/* figma 419:10367 히어로 배너 — 사진 + 카운터 */}
      <div className="relative h-[200px] bg-surface-tertiary">
        {detail.image && <Image src={detail.image} alt="" fill priority sizes="100vw" className="object-cover" />}
        <span className="absolute bottom-4 right-4 rounded bg-black/70 px-2 py-1 text-caption font-semibold text-fg-ondark">1 / 1</span>
      </div>

      {/* figma 419:10370 배지 · 제목 · 위치 · 요약 */}
      <section className="flex flex-col gap-3 bg-surface p-5">
        <div className="flex flex-wrap gap-2">
          {detail.agency && <span className={`rounded-lg px-2.5 py-1 text-2xsmall font-semibold ${AGENCY_TAG_TONE[detail.agency]}`}>{detail.agencyLabel}</span>}
          {detail.status && <span className={`rounded-lg px-2.5 py-1 text-2xsmall font-semibold ${STATUS_BADGE_TONE[detail.status]}`}>{detail.status}</span>}
        </div>
        <div>
          <h1 className="text-h2 font-bold tracking-[-0.015em] text-fg-heading">{detail.title}</h1>
          <p className="mt-1 text-compact text-fg-muted">{detail.address}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          {summary.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface-secondary p-3">
              <dt className="text-2xsmall text-fg-muted">{label}</dt>
              <dd className="mt-1 text-compact font-semibold text-fg-heading">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* figma 419:10394 탭 바 */}
      <nav aria-label="상세 보기 전환" className="grid grid-cols-3 gap-2 bg-surface px-5 pb-1">
        {MOBILE_DETAIL_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={hrefFor({ tab: tab.key })}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={`rounded-lg border px-2 py-2.5 text-center text-compact ${
                active ? "border-brand bg-brand/10 font-bold text-fg-heading" : "border-line font-medium text-fg-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* figma 419:10403 탭 콘텐츠 — 뷰어 · 방 치수 · 평형 · CTA · 링크 */}
      <section className="flex flex-col gap-4 bg-surface p-5">
        <TabViewer
          activeTab={activeTab}
          floorplan={floorplan}
          detailId={detail.id}
          unitSize={selectedUnit?.unitKey ?? selectedUnit?.size ?? null}
          detail={detail}
        />

        {floorplan && (activeTab === "2d" || activeTab === "3d") && (
          <ul className="grid grid-cols-2 gap-2">
            {floorplan.rooms.map((room) => (
              <li key={room.name} className="flex items-center justify-between rounded-lg border border-line bg-surface-secondary px-3 py-2.5">
                <span className="text-compact font-medium text-fg-body">{room.name}</span>
                <span className="text-compact font-bold text-fg-heading">{room.area}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-compact font-bold text-fg-heading">평형 타입 선택</h2>
          <div className="flex flex-wrap gap-2">
            {detail.units.map((unit) => {
              const selected = (unit.unitKey ?? unit.size) === (selectedUnit?.unitKey ?? selectedUnit?.size);
              return (
                <Link
                  key={unit.unitKey ?? unit.size}
                  href={hrefFor({ unit: unit.unitKey ?? unit.size ?? undefined })}
                  scroll={false}
                  aria-current={selected ? "true" : undefined}
                  className={`rounded-lg border px-3 py-2 text-compact font-semibold ${
                    selected ? "border-brand bg-brand/10 text-fg-heading" : "border-line text-fg-muted"
                  }`}
                >
                  {unit.label ?? (unit.size === null ? "" : `${unit.size}㎡ ${unit.type}`)}
                </Link>
              );
            })}
          </div>
        </div>

        {/* figma 419:10445 외부 신청 CTA — 집보다는 신청을 대행하지 않는다(REQ-US-001) */}
        {detail.applyUrl && <a
          href={detail.applyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-brand-on shadow-md transition-colors hover:bg-brand-hover"
        >
          해당 기관에서 신청 ↗
        </a>}

        {/* figma 419:10447 보조 링크 */}
        <div className="flex items-center justify-center gap-3 py-2 text-xs text-fg-muted">
          {detail.applyUrl && <a href={detail.applyUrl} target="_blank" rel="noreferrer noopener" className="font-medium">
            신청 바로가기
          </a>}
          <span aria-hidden className="text-line">|</span>
          <Link href="/score" className="font-medium">
            가점 계산기
          </Link>
          <span aria-hidden className="text-line">|</span>
          <span className="font-medium">신청확인 및 수정</span>
        </div>
      </section>

      {/* figma 419:10453 이 공고 주변 인기 매물 */}
      {nearby.length > 0 && (
        <section className="flex flex-col gap-3 bg-surface p-5">
          <h2 className="text-sm font-bold text-fg-heading">이 공고 주변 인기 매물</h2>
          <div className="flex flex-col gap-3">
            {nearby.map((item) => (
              <SubscriptionCardMobile key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// figma 419:10404 뷰어 — 2D는 도면 프리뷰, 3D는 전용 워크스루 라우트 진입(SUBS-08)
function TabViewer({
  activeTab,
  floorplan,
  detailId,
  unitSize,
  detail
}: {
  activeTab: MobileDetailTab;
  floorplan: Floorplan | null;
  detailId: string;
  unitSize: string | number | null;
  detail: SubscriptionDetail;
}) {
  const viewerHref = (view: "2d" | "3d") => `/subscriptions/${detailId}/floorplan?view=${view}&unit=${unitSize}`;

  if (activeTab === "3d" && floorplan?.has3d) {
    return (
      <Link
        href={viewerHref("3d")}
        className="relative flex h-[240px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-gray-900 text-fg-ondark"
      >
        {floorplan && <Image src={floorplan.image2dUrl} alt="" fill sizes="100vw" className="object-cover opacity-30" />}
        <span className="relative text-2xl" aria-hidden>🧭</span>
        <span className="relative text-sm font-bold">3D·1인칭 집구경 시작</span>
        <span className="relative text-caption text-white/70">평면도를 3D로 둘러보세요</span>
      </Link>
    );
  }
  if (activeTab === "location") {
    return <LocationCard title={detail.title} address={detail.address} coord={detail.coord} className="h-[240px]" />;
  }
  if (!floorplan) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-line bg-surface-warm text-sm font-medium text-fg-muted">
        2D 평면도 준비 중
      </div>
    );
  }
  return (
    <Link href={viewerHref("2d")} className="relative block h-[240px] overflow-hidden rounded-xl border border-line bg-surface-warm">
      <Image src={floorplan.image2dUrl} alt="2D 평면도" fill sizes="100vw" className="object-contain" />
      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-caption font-medium text-white">탭하여 크게 보기</span>
    </Link>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
