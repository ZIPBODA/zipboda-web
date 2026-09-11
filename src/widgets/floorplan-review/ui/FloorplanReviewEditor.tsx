"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FloorplanModel2D, PointMm } from "@/entities/floorplan";
import { extractFloorplan, type ExtractOutput, type ExtractProgress } from "@/features/floorplan-extract";
import { DEFAULT_IMAGE_URL, OVERLAY_COLOR, OVERLAY_LABEL_FONT_PX, OVERLAY_STROKE_PX, PERCENT, STAGE_LABELS } from "../config/constants";

const parseOptionalNumber = (value: string): number | undefined => {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) && n > 0 ? n : undefined;
};

interface Props {
  /** 추출 결과 모델이 바뀔 때마다 알림(없으면 null) — 상위(app)가 3D 미리보기 등을 조합 */
  onModelChange?: (model: FloorplanModel2D | null) => void;
  /** 결과 섹션 옆에 붙일 미리보기 슬롯(위젯 간 직접 의존 대신 composition) */
  preview?: ReactNode;
  /** 이미지 로드 직후 추출을 한 번 자동 실행(dev 검증 자동화용) */
  autoRun?: boolean;
}

// 도면 이미지에서 자동 추출한 2D 모델을 원본 위에 겹쳐 확인하고 JSON으로 내보내는 검수 화면(dev)
export function FloorplanReviewEditor({ onModelChange, preview, autoRun = false }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE_URL);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [exclusiveArea, setExclusiveArea] = useState("");
  const [fallbackWidth, setFallbackWidth] = useState("");
  const [progress, setProgress] = useState<ExtractProgress | null>(null);
  const [output, setOutput] = useState<ExtractOutput | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  const resetOutput = () => {
    setOutput(null);
    setError("");
    setProgress(null);
  };

  const run = async () => {
    const image = imgRef.current;
    if (!image || !natural) return;
    setRunning(true);
    resetOutput();
    try {
      const result = await extractFloorplan(image, {
        exclusiveAreaM2: parseOptionalNumber(exclusiveArea),
        fallbackWidthMm: parseOptionalNumber(fallbackWidth),
        onProgress: setProgress
      });
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  // 캐시된 이미지는 React가 붙기 전에 로드가 끝나 onLoad가 오지 않는다 — 완료 상태를 직접 확인해 버튼이 잠기지 않게 한다
  useEffect(() => {
    const image = imgRef.current;
    if (!image || !image.complete || image.naturalWidth === 0) return;
    setNatural({ w: image.naturalWidth, h: image.naturalHeight });
  }, [imageUrl]);

  const runRef = useRef(run);
  runRef.current = run;
  const autoRanRef = useRef(false);

  // 이미지가 준비되면 1회만 자동 실행. 수동 조작과 충돌하지 않도록 실행 여부를 ref로 고정한다
  useEffect(() => {
    if (!autoRun || autoRanRef.current || natural === null) return;
    autoRanRef.current = true;
    void runRef.current();
  }, [autoRun, natural]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setNatural(null);
    resetOutput();
  };

  const toPx = useMemo(() => {
    if (!output) return null;
    const { crop } = output.geometry;
    const { mmPerPx } = output.result.model.scale;
    return (p: PointMm) => ({ x: crop.x + p.x / mmPerPx, y: crop.y + p.z / mmPerPx });
  }, [output]);

  const exportJson = useMemo(() => (output ? JSON.stringify(output.result.model, null, 2) : ""), [output]);
  const model = output?.result.model;

  useEffect(() => {
    onModelChange?.(model ?? null);
  }, [model, onModelChange]);

  return (
    <main className="mx-auto max-w-6xl p-4 text-sm text-fg-strong">
      <h1 className="text-h2 font-bold text-fg-heading">평면도 자동 추출 검수 (dev)</h1>
      <p className="mt-1 text-fg-muted">도면 이미지 → 벽/방 자동 추출 → 오버레이 확인 → 모델 JSON 저장</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setNatural(null);
            resetOutput();
          }}
          className="w-72 rounded border border-line px-2 py-1"
          placeholder="이미지 경로/URL"
        />
        <label className="rounded border border-line px-2.5 py-1">
          파일 열기
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <label className="flex items-center gap-1">
          전용면적(㎡)
          <input value={exclusiveArea} onChange={(e) => setExclusiveArea(e.target.value)} className="w-20 rounded border border-line px-2 py-1" placeholder="33.56" />
        </label>
        <label className="flex items-center gap-1">
          실측 폭(mm, 치수 OCR 실패 시)
          <input value={fallbackWidth} onChange={(e) => setFallbackWidth(e.target.value)} className="w-20 rounded border border-line px-2 py-1" placeholder="4500" />
        </label>
        <button type="button" onClick={run} disabled={running || !natural} className="rounded bg-brand px-3 py-1 font-bold text-brand-on disabled:opacity-50">
          {running ? "추출 중…" : "자동 추출 실행"}
        </button>
      </div>

      {progress && running && (
        <div className="mt-2 text-fg-muted">
          {STAGE_LABELS[progress.stage]} · {Math.round(progress.ratio * PERCENT)}%
        </div>
      )}
      {error && <div className="mt-2 rounded border border-status-error/40 bg-surface-secondary px-3 py-2 text-status-error">{error}</div>}

      <div className="mt-3 overflow-auto rounded border border-line">
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="평면도"
            crossOrigin="anonymous"
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="block max-w-none"
          />
          {natural && model && toPx && (
            <svg width={natural.w} height={natural.h} className="pointer-events-none absolute left-0 top-0">
              <rect
                x={output.geometry.crop.x}
                y={output.geometry.crop.y}
                width={output.geometry.crop.width}
                height={output.geometry.crop.height}
                fill="none"
                stroke={OVERLAY_COLOR.crop}
                strokeWidth={OVERLAY_STROKE_PX.crop}
                strokeDasharray="6 4"
              />
              {model.rooms.map((room) => {
                const pts = room.polygon.map(toPx);
                const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
                const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
                const confidence = Math.round((model.confidence.perRoom[room.id] ?? 0) * PERCENT);
                return (
                  <g key={room.id}>
                    <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={OVERLAY_COLOR.roomFill} stroke={OVERLAY_COLOR.room} strokeWidth={OVERLAY_STROKE_PX.room} />
                    <text x={cx} y={cy} fontSize={OVERLAY_LABEL_FONT_PX} fontWeight={700} textAnchor="middle" fill={OVERLAY_COLOR.label}>
                      {room.label} {confidence}%
                    </text>
                  </g>
                );
              })}
              {model.walls.map((wall) => {
                const a = toPx(wall.a);
                const b = toPx(wall.b);
                return (
                  <line
                    key={wall.id}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={wall.exterior ? OVERLAY_COLOR.exteriorWall : OVERLAY_COLOR.interiorWall}
                    strokeWidth={wall.exterior ? OVERLAY_STROKE_PX.exteriorWall : OVERLAY_STROKE_PX.interiorWall}
                  />
                );
              })}
              {model.openings.map((opening, i) => {
                const wall = model.walls.find((w) => w.id === opening.wallId);
                if (!wall) return null;
                const length = Math.hypot(wall.b.x - wall.a.x, wall.b.z - wall.a.z);
                if (length === 0) return null;
                const at = (mm: number) => {
                  const t = mm / length;
                  return toPx({ x: wall.a.x + (wall.b.x - wall.a.x) * t, z: wall.a.z + (wall.b.z - wall.a.z) * t });
                };
                const s0 = at(opening.offsetMm);
                const s1 = at(opening.offsetMm + opening.widthMm);
                return (
                  <line
                    key={`${opening.wallId}-${i}`}
                    x1={s0.x}
                    y1={s0.y}
                    x2={s1.x}
                    y2={s1.y}
                    stroke={opening.type === "door" ? OVERLAY_COLOR.door : OVERLAY_COLOR.window}
                    strokeWidth={OVERLAY_STROKE_PX.opening}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {output && (
        <section className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded border border-line p-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-fg-heading">신뢰도 {Math.round(output.result.confidence * PERCENT)}%</span>
              <span className={`rounded px-2 py-0.5 text-2xsmall font-bold ${output.result.autoAccept ? "bg-status-success text-fg-ondark" : "bg-brand text-brand-on"}`}>
                {output.result.autoAccept ? "자동 확정" : "검수 필요"}
              </span>
              <span className="text-fg-muted">
                스케일 {output.result.model.scale.mmPerPx.toFixed(2)} mm/px ({output.result.model.scale.source})
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {output.result.flags.length === 0 && <li className="text-fg-muted">검증 플래그 없음</li>}
              {output.result.flags.map((flag, i) => (
                <li key={`${flag.code}-${i}`} className="text-fg-body">
                  <span className="font-mono text-2xsmall text-status-error">{flag.code}</span> {flag.detail}
                </li>
              ))}
            </ul>
            <div className="mt-2 text-fg-muted">
              방 {model?.rooms.length} · 벽 {model?.walls.length} · 문 {model?.openings.filter((o) => o.type === "door").length} · 창 {model?.openings.filter((o) => o.type === "window").length}
            </div>
          </div>
          <div className="rounded border border-line p-3">
            <div className="font-semibold text-fg-heading">모델 JSON (FloorplanModel2D)</div>
            <textarea readOnly value={exportJson} className="mt-2 h-64 w-full rounded border border-line p-2 font-mono text-xs" />
          </div>
          {preview && (
            <div className="relative h-80 overflow-hidden rounded border border-line md:col-span-2">
              <div className="absolute left-3 top-3 z-10 rounded bg-black/60 px-2 py-1 text-2xsmall font-semibold text-white">3D 미리보기(3인칭)</div>
              {preview}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
