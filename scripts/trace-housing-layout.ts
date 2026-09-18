/**
 * 사람이 크롭 도면을 보고 적은 벽·이름·문 명세(mm)를 트레이서 파이프라인에 넣어 FloorplanModel2D를 만든다.
 *   node scripts/run-ts.cjs scripts/trace-housing-layout.ts <spec.json> [out.model2d.json]
 *
 * 명세 형식(모두 mm, 크롭 이미지 좌상단 원점 기준):
 *   { "layoutKey": "...", "originPx": {"x":0,"y":0}, "exclusiveAreaM2": 13.66,
 *     "walls": [{ "a": [x,z], "b": [x,z], "thicknessMm"?: 150 | 0(경계선) }],
 *     "labels": [{ "at": [x,z], "label": "거실" }],
 *     "openings": [{ "wall": <walls 배열 인덱스>, "alongMm": <a에서 중심까지>, "type": "door"|"window", "widthMm": 900 }],
 *     "dimensionChains"?: [{ "axis": "x"|"z", "values": [2300, 2200] }]  ← PDF 치수선에서 읽은 외곽 전체 체인만 }
 * 방 폴리곤은 적지 않는다 — 벽에서 자동 도출된다(deriveLayout). 결과는 승격 기준(evaluateModelFor3d)까지 판정해 출력한다.
 */
import fs from "node:fs";
import path from "node:path";
import { polygonBBox, type RoomLabel } from "@/entities/floorplan";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import {
  deriveLayout,
  emptyDocument,
  resolveRoomLabels,
  type TraceDocument,
  type TraceOpening,
  type TraceWall,
} from "@/features/floorplan-trace";
import { assembleTraceModel } from "@/features/floorplan-trace/lib/assembleTraceModel";
import { orientWall } from "@/features/floorplan-trace/lib/snap";
import { evaluateModelFor3d } from "@/widgets/floorplan-viewer";

interface Spec {
  layoutKey: string;
  originPx?: { x: number; y: number };
  exclusiveAreaM2?: number;
  walls: { a: [number, number]; b: [number, number]; thicknessMm?: number }[];
  labels: { at: [number, number]; label: RoomLabel }[];
  openings: {
    wall: number;
    alongMm: number;
    type: "door" | "window";
    widthMm: number;
  }[];
  dimensionChains?: { axis: "x" | "z"; values: number[] }[];
}

const specPath = process.argv[2];
if (!specPath) throw new Error("spec.json 경로가 필요합니다");
const spec: Spec = JSON.parse(fs.readFileSync(path.resolve(specPath), "utf8"));
type HousingLayout = (typeof HOUSING_SOURCE_DATA)[number]["layouts"][number];
const layout = HOUSING_SOURCE_DATA.flatMap(
  (p): HousingLayout[] => p.layouts,
).find((l) => l.layoutKey === spec.layoutKey);
if (!layout) throw new Error(`카탈로그에 없는 layoutKey: ${spec.layoutKey}`);
if (layout.mmPerPx === null)
  throw new Error(`${spec.layoutKey}: 실측 스케일이 없어 모델을 만들 수 없다`);

const walls: TraceWall[] = spec.walls.map((w, i) =>
  orientWall({
    id: `w${i + 1}`,
    a: { x: w.a[0], z: w.a[1] },
    b: { x: w.b[0], z: w.b[1] },
    ...(w.thicknessMm === undefined ? {} : { thicknessMm: w.thicknessMm }),
  }),
);
const openings: TraceOpening[] = spec.openings.map((o, i) => {
  const wall = walls[o.wall];
  if (!wall) throw new Error(`openings[${i}]: 벽 인덱스 ${o.wall} 없음`);
  const length = Math.hypot(wall.b.x - wall.a.x, wall.b.z - wall.a.z);
  // 명세의 alongMm는 원 명세 a 기준이다 — orientWall로 a/b가 뒤집혔으면 반대편에서 잰다
  const raw = spec.walls[o.wall];
  const flipped = raw.a[0] !== wall.a.x || raw.a[1] !== wall.a.z;
  const center = flipped ? length - o.alongMm : o.alongMm;
  const offsetMm = Math.max(
    0,
    Math.min(length - o.widthMm, Math.round(center - o.widthMm / 2)),
  );
  return {
    id: `o${i + 1}`,
    wallId: wall.id,
    type: o.type,
    offsetMm,
    widthMm: o.widthMm,
  };
});
const document: TraceDocument = {
  ...emptyDocument(),
  calibration: {
    mmPerPx: layout.mmPerPx,
    originPx: spec.originPx ?? { x: 0, y: 0 },
    source: spec.dimensionChains?.length ? "dimension-chain" : "estimated",
  },
  walls,
  openings,
  labelAnchors: spec.labels.map((l, i) => ({
    id: `l${i + 1}`,
    at: { x: l.at[0], z: l.at[1] },
    label: l.label,
  })),
  printed: {
    exclusiveAreaM2:
      spec.exclusiveAreaM2 ?? layout.exclusiveAreaM2 ?? undefined,
    dimensionChains: spec.dimensionChains ?? [],
  },
  seq: walls.length + openings.length + spec.labels.length,
};

const derived = deriveLayout(document.walls);
const rooms = resolveRoomLabels(derived.rooms, document.labelAnchors);
const model = assembleTraceModel(document, derived, rooms);
if (!model) throw new Error("모델을 만들 수 없다(벽 없음)");

const verdict = evaluateModelFor3d(model);
const outPath =
  process.argv[3] ??
  path.join(
    path.dirname(path.resolve(specPath)),
    `${spec.layoutKey}.model2d.json`,
  );
fs.writeFileSync(
  outPath,
  JSON.stringify(verdict.normalized.model, null, 2) + "\n",
);

const m = verdict.normalized.model;
console.log(
  `${spec.layoutKey}: ${verdict.status}  conf=${verdict.normalized.confidence.toFixed(2)}  rooms=${m.rooms.length} walls=${m.walls.length} openings=${m.openings.length}`,
);
console.log(
  " rooms:",
  m.rooms.map((r) => `${r.label} ${(r.areaM2 ?? 0).toFixed(2)}㎡`).join(" | "),
);
console.log(
  " 열린 끝점:",
  derived.openEndpoints.length,
  derived.openEndpoints.map((p) => `(${p.x},${p.z})`).join(" "),
);
if (verdict.reasons.length)
  console.log(" reasons:", verdict.reasons.join(" | "));
const shift = polygonBBox(derived.outline);
const originPx = {
  x: Math.round(shift.minX / layout.mmPerPx),
  y: Math.round(shift.minZ / layout.mmPerPx),
};
console.log(
  ` 크롭 기준 이동(mm): (${shift.minX}, ${shift.minZ}) → 승격 --origin ${originPx.x},${originPx.y}`,
);
console.log(" outline:", JSON.stringify(m.outline));
console.log(" saved", path.relative(process.cwd(), outPath));
