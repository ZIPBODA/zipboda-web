/**
 * 일괄 추출 보고서(data/housing-extraction/report.json)의 초안을 3D 승격 기준으로 판정한다.
 *   node scripts/run-ts.cjs scripts/validate-housing-drafts.ts
 * 결과: data/housing-extraction/validation.json + 콘솔 표. 초안을 고치거나 승격하지 않는다(판정만).
 */
import fs from "node:fs";
import path from "node:path";
import {
  REVIEWED_MODELS,
  REVIEWED_MODEL_MANIFEST,
  type FloorplanModel2D,
  type NormalizeResult,
} from "@/entities/floorplan";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import {
  evaluateModelFor3d,
  type ReviewStatus,
} from "@/widgets/floorplan-viewer";

interface BatchEntry {
  layoutKey: string;
  status: "draft" | "blocked" | "failed";
  result?: NormalizeResult;
  geometry?: { segments: number; regions: number };
  error?: string;
}

export interface LayoutValidation {
  property: string;
  layoutKey: string;
  unitKey: string;
  exclusiveAreaM2: number | null;
  sourceIssue: string | null;
  extraction: BatchEntry["status"];
  extractionError: string | null;
  /** 추출기가 매긴 신뢰도(초안 시점) */
  extractionConfidence: number | null;
  /** 판정 시점 재정규화 신뢰도 */
  confidence: number | null;
  flags: string[];
  rooms: number;
  walls: number;
  openings: number;
  doors: number;
  segments: number | null;
  scaleSource: string | null;
  areaDeviation: number | null;
  /** 초안(자동 추출) 자체의 판정 */
  draftStatus: ReviewStatus;
  draftReasons: string[];
  /** 초안이 승격되지 못한 주된 원인 분류 */
  cause: FailureCause | null;
  /** 등록된 검수 모델(트레이싱 등)이 있으면 그 방법 — 3D는 이 모델로 나간다 */
  reviewedMethod: string | null;
  /** 최종 3D 노출 판정: 등록 모델이 있으면 reviewed, 없으면 초안 판정 */
  status: ReviewStatus;
  reasons: string[];
}

export type FailureCause =
  | "scale"
  | "extraction-failed"
  | "geometry"
  | "wall-extraction"
  | "room-segmentation"
  | "opening"
  | "source"
  | "quality";

function classifyCause(row: {
  extraction: BatchEntry["status"];
  extractionError: string | null;
  flags: string[];
  rooms: number;
  walls: number;
  doors: number;
  sourceIssue: string | null;
  draftReasons: string[];
}): FailureCause | null {
  if (row.extraction !== "draft")
    return row.extractionError?.includes("스케일")
      ? "scale"
      : "extraction-failed";
  if (row.flags.includes("geometry-invalid")) return "geometry";
  if (row.walls < 4) return "wall-extraction";
  if (row.rooms === 0) return "room-segmentation";
  if (row.doors === 0) return "opening";
  if (row.sourceIssue) return "source";
  return row.draftReasons.length > 0 ? "quality" : null;
}

function withRegisteredModel(
  row: Omit<
    LayoutValidation,
    "status" | "reasons" | "reviewedMethod" | "cause"
  >,
): LayoutValidation {
  const cause = classifyCause(row);
  const registered = REVIEWED_MODEL_MANIFEST.find(
    (entry) => entry.layoutKey === row.layoutKey,
  );
  if (registered && row.layoutKey in REVIEWED_MODELS) {
    return {
      ...row,
      cause,
      reviewedMethod: registered.method,
      status: "reviewed",
      reasons: [
        `registered: ${registered.method} · ${registered.reviewer} · ${registered.note}`,
      ],
    };
  }
  return {
    ...row,
    cause,
    reviewedMethod: null,
    status: row.draftStatus,
    reasons: row.draftReasons,
  };
}

const ROOT = path.resolve(__dirname, "..");
const REPORT = path.join(ROOT, "data/housing-extraction/report.json");
const OUT = path.join(ROOT, "data/housing-extraction/validation.json");

function validate(
  entry: BatchEntry,
  property: string,
  layout: {
    unitKey: string;
    exclusiveAreaM2: number | null;
    issue: string | null;
  },
): LayoutValidation {
  const base = {
    property,
    layoutKey: entry.layoutKey,
    unitKey: layout.unitKey,
    exclusiveAreaM2: layout.exclusiveAreaM2,
    sourceIssue: layout.issue,
    extraction: entry.status,
    extractionError: entry.error ?? null,
    extractionConfidence: entry.result?.confidence ?? null,
    segments: entry.geometry?.segments ?? null,
  };
  if (!entry.result) {
    return withRegisteredModel({
      ...base,
      confidence: null,
      flags: [],
      rooms: 0,
      walls: 0,
      openings: 0,
      doors: 0,
      scaleSource: null,
      areaDeviation: null,
      draftStatus: "blocked",
      draftReasons: [entry.error ?? "추출 결과 없음"],
    });
  }
  const model: FloorplanModel2D = entry.result.model;
  const verdict = evaluateModelFor3d(model);
  const m = verdict.normalized.model;
  // 원본 도면 자체가 애매하면(호수 표기 불일치 등) 기하가 맞아도 자동 승격하지 않는다
  const reasons = layout.issue
    ? [`source: ${layout.issue}`, ...verdict.reasons]
    : verdict.reasons;
  const status: ReviewStatus =
    verdict.status === "blocked"
      ? "blocked"
      : reasons.length > 0
        ? "needs-review"
        : "reviewed";
  return withRegisteredModel({
    ...base,
    confidence: verdict.normalized.confidence,
    flags: verdict.normalized.flags.map((f) => f.code),
    rooms: m.rooms.length,
    walls: m.walls.length,
    openings: m.openings.length,
    doors: m.openings.filter((o) => o.type === "door").length,
    scaleSource: m.scale.source,
    areaDeviation: verdict.areaDeviation,
    draftStatus: status,
    draftReasons: reasons,
  });
}

function main() {
  const report: BatchEntry[] = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const byKey = new Map(report.map((entry) => [entry.layoutKey, entry]));
  const rows: LayoutValidation[] = [];
  for (const property of HOUSING_SOURCE_DATA) {
    for (const layout of property.layouts) {
      const entry = byKey.get(layout.layoutKey) ?? {
        layoutKey: layout.layoutKey,
        status: "blocked" as const,
        error: "보고서에 없음",
      };
      rows.push(validate(entry, property.id, layout));
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2) + "\n");

  const count = (status: ReviewStatus) =>
    rows.filter((r) => r.status === status).length;
  const draftCount = (status: ReviewStatus) =>
    rows.filter((r) => r.draftStatus === status).length;
  console.log(
    `layouts ${rows.length} · 3D reviewed ${count("reviewed")} · needs-review ${count("needs-review")} · blocked ${count("blocked")}`,
  );
  console.log(
    `초안 자체 판정: reviewed ${draftCount("reviewed")} · needs-review ${draftCount("needs-review")} · blocked ${draftCount("blocked")}`,
  );
  const causes = new Map<string, number>();
  for (const r of rows)
    if (r.status !== "reviewed" && r.cause)
      causes.set(r.cause, (causes.get(r.cause) ?? 0) + 1);
  console.log(
    "미승격 원인:",
    [...causes.entries()].map(([cause, n]) => `${cause} ${n}`).join(" · "),
  );
  console.log("");
  console.log(
    "layoutKey".padEnd(32),
    "status".padEnd(12),
    "cause".padEnd(18),
    "conf ",
    "rm wl op dr",
    "area%",
    "reasons",
  );
  for (const r of rows) {
    const conf =
      r.confidence === null ? "  -  " : r.confidence.toFixed(2) + " ";
    const area =
      r.areaDeviation === null
        ? "  -  "
        : (r.areaDeviation * 100).toFixed(0).padStart(4) + "%";
    console.log(
      r.layoutKey.padEnd(32),
      r.status.padEnd(12),
      (r.cause ?? "-").padEnd(18),
      conf,
      `${String(r.rooms).padStart(2)} ${String(r.walls).padStart(2)} ${String(r.openings).padStart(2)} ${String(r.doors).padStart(2)}`,
      area,
      r.reasons.slice(0, 3).join(" | "),
    );
  }
  console.log("");
  console.log("per property:");
  for (const property of HOUSING_SOURCE_DATA) {
    const mine = rows.filter((r) => r.property === property.id);
    console.log(
      ` ${property.id.padEnd(20)} reviewed ${mine.filter((r) => r.status === "reviewed").length} / needs-review ${mine.filter((r) => r.status === "needs-review").length} / blocked ${mine.filter((r) => r.status === "blocked").length} (총 ${mine.length})`,
    );
  }
  console.log(`\nsaved ${path.relative(ROOT, OUT)}`);
}

main();
