/**
 * 검수를 통과한 FloorplanModel2D를 서비스 자산으로 등록한다.
 *
 *   node scripts/run-ts.cjs scripts/promote-housing-models.ts --auto
 *       validation.json에서 status=reviewed인 초안을 report.json의 정규화 모델로 등록한다(사람 검토 없이 자동 승격된 것으로 기록).
 *   node scripts/run-ts.cjs scripts/promote-housing-models.ts --layout <layoutKey> --from <model.json> --method traced --note "..."
 *       트레이서 등에서 저장한 모델을 사람이 검토한 것으로 등록한다. 등록 전 같은 승격 기준(evaluateModelFor3d)을 다시 통과해야 한다.
 *
 * 산출: src/entities/floorplan/api/models/<layoutKey>.model2d.json, models/reviewed.json(출처·방법·일시), models/index.ts(정적 import 목록)
 * 뷰어는 index.ts만 읽는다 — 추출 런타임과 무관하게 정적 JSON으로 3D를 그린다.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  FloorplanModel2D,
  NormalizeResult,
  ReviewedModelEntry,
} from "@/entities/floorplan";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { evaluateModelFor3d } from "@/widgets/floorplan-viewer";

type Method = "extraction" | "traced";

type ReviewedEntry = ReviewedModelEntry;

const ROOT = path.resolve(__dirname, "..");
const MODELS_DIR = path.join(ROOT, "src/entities/floorplan/api/models");
const MANIFEST = path.join(MODELS_DIR, "reviewed.json");
const REPORT = path.join(ROOT, "data/housing-extraction/report.json");
const VALIDATION = path.join(ROOT, "data/housing-extraction/validation.json");

const args = process.argv.slice(2);
const flag = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const isModel = (value: unknown): value is FloorplanModel2D =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as FloorplanModel2D).walls) &&
  Array.isArray((value as FloorplanModel2D).rooms) &&
  "scale" in value;

function readManifest(): ReviewedEntry[] {
  return fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : [];
}

function layoutOf(layoutKey: string) {
  for (const property of HOUSING_SOURCE_DATA) {
    const layout = property.layouts.find((l) => l.layoutKey === layoutKey);
    if (layout) return { property, layout };
  }
  throw new Error(`카탈로그에 없는 layoutKey: ${layoutKey}`);
}

function register(
  layoutKey: string,
  model: FloorplanModel2D,
  method: Method,
  note: string,
  reviewer: string,
  originPx: { x: number; y: number },
  manifest: ReviewedEntry[],
) {
  const verdict = evaluateModelFor3d(model);
  if (verdict.status !== "reviewed") {
    throw new Error(
      `${layoutKey}: 승격 기준 미달(${verdict.status}) — ${verdict.reasons.join(" | ")}`,
    );
  }
  const { property, layout } = layoutOf(layoutKey);
  fs.writeFileSync(
    path.join(MODELS_DIR, `${layoutKey}.model2d.json`),
    JSON.stringify(verdict.normalized.model, null, 2) + "\n",
  );
  const entry: ReviewedEntry = {
    layoutKey,
    property: property.id,
    method,
    reviewedAt: new Date().toISOString(),
    reviewer,
    note,
    sourcePdf: property.sourcePdf,
    sourcePage: layout.page,
    image2dUrl: layout.image2dUrl,
    originPx,
  };
  const rest = manifest.filter((m) => m.layoutKey !== layoutKey);
  rest.push(entry);
  rest.sort((a, b) => a.layoutKey.localeCompare(b.layoutKey));
  return rest;
}

function writeIndex(manifest: ReviewedEntry[]) {
  const ident = (key: string) => "m_" + key.replace(/[^a-zA-Z0-9]/g, "_");
  const lines = [
    "// 이 파일은 scripts/promote-housing-models.ts가 생성한다. 손으로 고치지 말고 스크립트로 등록·해제한다.",
    'import type { FloorplanModel2D, ReviewedModelEntry } from "../../model/types";',
    'import manifest from "./reviewed.json";',
    ...manifest.map(
      (m) =>
        `import ${ident(m.layoutKey)} from "./${m.layoutKey}.model2d.json";`,
    ),
    "",
    "/** 검수를 통과해 3D로 내보내는 모델. 여기 없는 layout은 2D만 제공한다 */",
    "export const REVIEWED_MODELS: Record<string, FloorplanModel2D> = {",
    ...manifest.map(
      (m) => `  "${m.layoutKey}": ${ident(m.layoutKey)} as FloorplanModel2D,`,
    ),
    "};",
    "",
    "/** 검수 모델의 출처·방법·크롭 원점 — 개발 검수 화면이 2D 위에 모델을 겹칠 때 쓴다 */",
    "export const REVIEWED_MODEL_MANIFEST = manifest as ReviewedModelEntry[];",
    "",
  ];
  fs.writeFileSync(path.join(MODELS_DIR, "index.ts"), lines.join("\n"));
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
}

function main() {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  let manifest = readManifest();
  const reviewer = flag("reviewer") ?? "auto";

  if (args.includes("--reindex")) {
    writeIndex(readManifest());
    console.log("index regenerated");
    return;
  }
  if (args.includes("--auto")) {
    const report: {
      layoutKey: string;
      result?: NormalizeResult;
      geometry?: { crop: { x: number; y: number } };
    }[] = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    const validation: { layoutKey: string; status: string }[] = JSON.parse(
      fs.readFileSync(VALIDATION, "utf8"),
    );
    const eligible = validation
      .filter((v) => v.status === "reviewed")
      .map((v) => v.layoutKey);
    for (const layoutKey of eligible) {
      const entry = report.find((r) => r.layoutKey === layoutKey);
      if (!entry?.result) continue;
      const originPx = {
        x: entry.geometry?.crop.x ?? 0,
        y: entry.geometry?.crop.y ?? 0,
      };
      manifest = register(
        layoutKey,
        entry.result.model,
        "extraction",
        "자동 추출 결과가 승격 기준을 통과",
        reviewer,
        originPx,
        manifest,
      );
      console.log(`registered ${layoutKey} (extraction)`);
    }
    if (eligible.length === 0) console.log("자동 승격 대상 없음");
  } else {
    const layoutKey = flag("layout");
    const from = flag("from");
    if (!layoutKey || !from)
      throw new Error(
        "--layout <layoutKey> --from <model.json> 이 필요합니다(또는 --auto)",
      );
    const parsed: unknown = JSON.parse(
      fs.readFileSync(path.resolve(from), "utf8"),
    );
    // 트레이서 작업 파일(TraceFile)이면 문서를 모델로 바꾸지 않는다 — 모델 JSON(FloorplanModel2D)만 받는다
    if (!isModel(parsed))
      throw new Error(
        "--from 은 FloorplanModel2D JSON이어야 합니다(트레이서의 '모델 저장' 산출물)",
      );
    const [ox, oy] = (flag("origin") ?? "0,0").split(",").map(Number);
    if (!Number.isFinite(ox) || !Number.isFinite(oy))
      throw new Error("--origin x,y 형식이어야 합니다");
    manifest = register(
      layoutKey,
      parsed,
      (flag("method") as Method | undefined) ?? "traced",
      flag("note") ?? "",
      flag("reviewer") ?? "human",
      { x: ox, y: oy },
      manifest,
    );
    console.log(`registered ${layoutKey} (${flag("method") ?? "traced"})`);
  }

  writeIndex(manifest);
  console.log(`reviewed models: ${manifest.length}`);
}

main();
