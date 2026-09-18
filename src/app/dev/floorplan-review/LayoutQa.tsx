"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import {
  REVIEWED_MODELS,
  REVIEWED_MODEL_MANIFEST,
  type FloorplanModel2D,
} from "@/entities/floorplan";
import {
  extractFloorplan,
  type ExtractOutput,
} from "@/features/floorplan-extract";
import {
  FloorplanModelPreviewLoader,
  evaluateModelFor3d,
} from "@/widgets/floorplan-viewer";
import {
  QA_DOOR_STROKE,
  QA_EXTERIOR_WALL_STROKE,
  QA_IMAGE_MAX_WIDTH_PX,
  QA_INTERIOR_WALL_STROKE,
  QA_OPENING_STROKE_PX,
  QA_ROOM_FILL,
  QA_ROOM_STROKE,
  QA_WALL_STROKE_PX,
  QA_WINDOW_STROKE,
} from "./layoutQa.constants";

type HousingProperty = (typeof HOUSING_SOURCE_DATA)[number];
type HousingLayout = HousingProperty["layouts"][number];

interface Props {
  layoutKey: string;
}

interface PixelPoint {
  x: number;
  y: number;
}

function findLayout(
  layoutKey: string,
): { property: HousingProperty; layout: HousingLayout } | null {
  for (const property of HOUSING_SOURCE_DATA) {
    const layout = property.layouts.find(
      (candidate) => candidate.layoutKey === layoutKey,
    );
    if (layout) return { property, layout };
  }
  return null;
}

/** 크롭 이미지 위에 2D 모델(방·벽·개구부)을 겹쳐 그린다 — 원점은 모델 (0,0)이 놓인 크롭 px */
function ModelOverlay({
  src,
  model,
  originPx,
}: {
  src: string;
  model: FloorplanModel2D;
  originPx: PixelPoint;
}) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const toPx = (p: { x: number; z: number }): PixelPoint => ({
    x: originPx.x + p.x / model.scale.mmPerPx,
    y: originPx.y + p.z / model.scale.mmPerPx,
  });
  const wallsById = new Map(model.walls.map((wall) => [wall.id, wall]));
  return (
    <div
      className="relative inline-block"
      style={{ maxWidth: QA_IMAGE_MAX_WIDTH_PX }}
    >
      <img
        src={src}
        alt="2D 크롭 + 모델"
        className="block h-auto w-full"
        onLoad={(e) =>
          setSize({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight,
          })
        }
      />
      {size && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-label="모델 오버레이"
        >
          {model.rooms.map((room) => (
            <polygon
              key={room.id}
              points={room.polygon
                .map(toPx)
                .map((p) => `${p.x},${p.y}`)
                .join(" ")}
              fill={QA_ROOM_FILL}
              stroke={QA_ROOM_STROKE}
              strokeWidth={1}
            />
          ))}
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
                stroke={
                  wall.exterior
                    ? QA_EXTERIOR_WALL_STROKE
                    : QA_INTERIOR_WALL_STROKE
                }
                strokeWidth={QA_WALL_STROKE_PX}
              />
            );
          })}
          {model.openings.map((opening, index) => {
            const wall = wallsById.get(opening.wallId);
            if (!wall) return null;
            const length =
              Math.hypot(wall.b.x - wall.a.x, wall.b.z - wall.a.z) || 1;
            const at = (t: number) =>
              toPx({
                x: wall.a.x + ((wall.b.x - wall.a.x) * t) / length,
                z: wall.a.z + ((wall.b.z - wall.a.z) * t) / length,
              });
            const a = at(opening.offsetMm);
            const b = at(opening.offsetMm + opening.widthMm);
            return (
              <line
                key={`${opening.wallId}-${index}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  opening.type === "door" ? QA_DOOR_STROKE : QA_WINDOW_STROKE
                }
                strokeWidth={QA_OPENING_STROKE_PX}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** layout 하나를 2D 원본 · 2D 모델 오버레이 · 3D 미리보기로 나란히 놓고 승격 판정을 함께 보여주는 개발 검수 화면 */
export function LayoutQa({ layoutKey }: Props) {
  const router = useRouter();
  const found = findLayout(layoutKey);
  const reviewed = REVIEWED_MODELS[layoutKey];
  const manifest = REVIEWED_MODEL_MANIFEST.find(
    (entry) => entry.layoutKey === layoutKey,
  );
  const [draft, setDraft] = useState<ExtractOutput | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const model = reviewed ?? draft?.result.model ?? null;
  const draftOrigin = draft
    ? { x: draft.geometry.crop.x, y: draft.geometry.crop.y }
    : null;
  const originPx = reviewed
    ? (manifest?.originPx ?? { x: 0, y: 0 })
    : draftOrigin;
  const verdict = useMemo(
    () => (model ? evaluateModelFor3d(model) : null),
    [model],
  );

  const runDraft = async () => {
    if (!found || found.layout.mmPerPx === null) return;
    setExtracting(true);
    setError(null);
    try {
      const image = new Image();
      image.src = found.layout.image2dUrl;
      await image.decode();
      setDraft(
        await extractFloorplan(image, {
          calibratedMmPerPx: found.layout.mmPerPx,
          exclusiveAreaM2: found.layout.exclusiveAreaM2 ?? undefined,
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setExtracting(false);
    }
  };

  const options = HOUSING_SOURCE_DATA.flatMap((property) =>
    property.layouts.map((layout) => ({
      key: layout.layoutKey,
      reviewed: layout.layoutKey in REVIEWED_MODELS,
    })),
  );
  const scaleLabel =
    found === null
      ? ""
      : found.layout.mmPerPx === null
        ? "근거 없음"
        : `${found.layout.mmPerPx.toFixed(3)} mm/px (치수 ${found.layout.calibration?.[0] ?? "-"}mm = ${found.layout.calibration?.[1] ?? "-"}px)`;

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-bold">현황도 layout 검수 · 개발용</h1>
      <label className="flex items-center gap-2">
        layout
        <select
          value={layoutKey}
          onChange={(e) =>
            router.push(
              `/dev/floorplan-review?layout=${encodeURIComponent(e.target.value)}`,
            )
          }
        >
          <option value="">선택</option>
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.reviewed ? "● " : "○ "}
              {option.key}
            </option>
          ))}
        </select>
      </label>
      {!found && layoutKey !== "" && (
        <p role="alert">카탈로그에 없는 layoutKey: {layoutKey}</p>
      )}
      {found && (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt>property</dt>
            <dd>
              {found.property.id} · {found.property.title}
            </dd>
            <dt>layoutKey / unitKey</dt>
            <dd>
              {found.layout.layoutKey} / {found.layout.unitKey}
            </dd>
            <dt>전용면적 · 스케일</dt>
            <dd>
              {found.layout.exclusiveAreaM2 ?? "미기재"}㎡ · {scaleLabel}
            </dd>
            <dt>원천 이슈</dt>
            <dd>{found.layout.issue ?? "없음"}</dd>
            <dt>검수 상태</dt>
            <dd>
              {reviewed
                ? `reviewed · ${manifest?.method ?? "-"} · ${manifest?.reviewer ?? "-"} · ${manifest?.reviewedAt ?? "-"}`
                : draft
                  ? "draft(이 화면에서 추출)"
                  : "모델 없음"}
              {manifest?.note ? ` · ${manifest.note}` : ""}
            </dd>
            {verdict && (
              <>
                <dt>승격 판정</dt>
                <dd>
                  {verdict.status} · 신뢰도{" "}
                  {Math.round(verdict.normalized.confidence * 100)}% · 방{" "}
                  {verdict.normalized.model.rooms.length} · 벽{" "}
                  {verdict.normalized.model.walls.length} · 개구부{" "}
                  {verdict.normalized.model.openings.length} · 스케일 출처{" "}
                  {verdict.normalized.model.scale.source}
                </dd>
                <dt>플래그</dt>
                <dd>
                  {verdict.normalized.flags.length === 0
                    ? "없음"
                    : verdict.normalized.flags
                        .map((flag) => `${flag.code}(${flag.detail})`)
                        .join(" | ")}
                </dd>
                <dt>사유</dt>
                <dd>
                  {verdict.reasons.length === 0
                    ? "없음"
                    : verdict.reasons.join(" | ")}
                </dd>
              </>
            )}
          </dl>
          {!reviewed && (
            <div className="flex items-center gap-2">
              <button
                disabled={extracting || found.layout.mmPerPx === null}
                onClick={() => void runDraft()}
              >
                {extracting ? "추출 중…" : "초안 추출(브라우저)"}
              </button>
              {found.layout.mmPerPx === null && (
                <span className="text-sm">
                  실측 스케일이 없어 초안을 만들 수 없다
                </span>
              )}
              {error && <span role="alert">{error}</span>}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <section>
              <h2 className="text-sm font-semibold">2D 원본(크롭)</h2>
              <img
                src={found.layout.image2dUrl}
                alt="2D 크롭"
                className="block h-auto"
                style={{ maxWidth: QA_IMAGE_MAX_WIDTH_PX }}
              />
            </section>
            <section>
              <h2 className="text-sm font-semibold">2D 모델 오버레이</h2>
              {model && originPx ? (
                <ModelOverlay
                  src={found.layout.image2dUrl}
                  model={model}
                  originPx={originPx}
                />
              ) : (
                <p className="text-sm">모델 없음</p>
              )}
            </section>
            <section>
              <h2 className="text-sm font-semibold">3D 미리보기</h2>
              {model ? (
                <div className="relative h-80 overflow-hidden rounded border border-line">
                  <FloorplanModelPreviewLoader model={model} />
                </div>
              ) : (
                <p className="text-sm">모델 없음</p>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
