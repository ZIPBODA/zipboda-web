"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/shared/ui";
import type { LoadMapDetail, MapDetailData } from "../model/mapDetail";

export function SubscriptionMapDetail({ id, loadDetail, onClose }: { id: string; loadDetail: LoadMapDetail; onClose: () => void }) {
  const [data, setData] = useState<MapDetailData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [unit, setUnit] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
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
  const specs = detail ? [
    ["신청 기간", detail.applyPeriod], ["총 세대수", detail.households],
    ["공급 호수", detail.supplyUnits == null ? null : `${detail.supplyUnits}호`],
    ["모집 인원", detail.recruitCount == null ? null : `${detail.recruitCount}명`],
    ["공급 유형", detail.supplyType], ["공고일", detail.postDate], ["계약일", detail.contractDate], ["입주", detail.moveIn]
  ] : [];
  return (
    <aside aria-label="선택한 청약 상세" className="absolute inset-x-3 bottom-3 z-30 flex h-1/2 flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-sm md:relative md:inset-auto md:h-auto md:w-96 md:shrink-0" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <div className="flex shrink-0 items-center justify-between border-b border-line-subtle px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>← 목록으로</Button>
        <h2 ref={heading} tabIndex={-1} className="font-bold outline-none">청약 상세</h2>
        <Button variant="ghost" size="sm" aria-label="청약 상세 닫기" onClick={onClose}>×</Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-busy={status === "loading"}>
        {status === "loading" && <p role="status" className="p-5 text-sm text-fg-muted">공고를 불러오는 중입니다.</p>}
        {status === "error" && <div className="p-5"><p role="alert">공고를 불러오지 못했습니다.</p><Button className="mt-3" onClick={() => setAttempt((value) => value + 1)}>다시 시도</Button></div>}
        {status === "ready" && detail && <>
          {detail.image && <div className="relative h-48 bg-surface-secondary"><Image src={detail.image} alt={detail.title} fill sizes="384px" className="object-cover" /></div>}
          <div className="space-y-5 p-5">
            <div><p className="text-sm text-fg-muted">{[detail.agencyLabel, detail.status].filter(Boolean).join(" · ")}</p><h3 className="mt-2 text-xl font-bold text-fg-heading">{detail.title}</h3><p className="mt-2 text-sm text-fg-muted">{detail.address}</p></div>
            <section><h4 className="font-bold">기본 정보</h4><dl className="mt-2 divide-y divide-line-subtle">{specs.filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><dt className="shrink-0 text-fg-muted">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl></section>
            {detail.units.length > 0 && <section><label htmlFor="map-detail-unit" className="font-bold">평형·호수 선택</label><select id="map-detail-unit" value={unit} onChange={(event) => setUnit(event.target.value)} className="mt-3 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm">{detail.units.map((entry) => <option key={entry.unitKey ?? entry.size} value={String(entry.unitKey ?? entry.size ?? "")}>{entry.label ?? `${entry.size ?? ""}㎡`}</option>)}</select></section>}
            {plan?.image && <Link href={`${href}/floorplan?${new URLSearchParams({ unit, view: "2D" })}`} className="block"><div className="relative h-56 rounded-lg border border-line"><Image src={plan.image} alt={`${detail.title} 선택 호수 평면도`} fill sizes="344px" className="object-contain" /></div><span className="mt-2 block text-sm font-semibold">2D 평면도 크게 보기 →</span></Link>}
            {plan?.has3d && <Link href={`${href}/floorplan?${new URLSearchParams({ unit, view: "3D" })}`} className="flex min-h-11 items-center justify-center rounded-lg bg-brand font-bold text-brand-on">3D 둘러보기</Link>}
            <Link href={`${href}?${new URLSearchParams({ unit })}`} className="flex min-h-11 items-center justify-center rounded-lg border border-line text-sm font-semibold">공고 전체 보기 →</Link>
            {detail.applyUrl && <a href={detail.applyUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-on">공급기관 바로가기 ↗</a>}
          </div>
        </>}
      </div>
    </aside>
  );
}
