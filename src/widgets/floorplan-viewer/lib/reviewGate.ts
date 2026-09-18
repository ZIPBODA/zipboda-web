import {
  AREA_TOLERANCE,
  exclusiveAreaBounds,
  exclusiveAreaDeviation,
  normalizeModel,
  type FloorplanModel2D,
  type NormalizeFlagCode,
  type NormalizeResult,
} from "@/entities/floorplan";
import { REVIEW_MIN_CONFIDENCE, REVIEW_MIN_WALLS } from "../config/constants";
import { buildScene, type BuiltScene } from "./buildScene";
import { validateBuiltScene, type SceneIssue } from "./validateScene";

export type ReviewStatus = "reviewed" | "needs-review" | "blocked";

export interface ReviewVerdict {
  status: ReviewStatus;
  /** 사람이 읽는 판정 이유. reviewed면 비어 있다 */
  reasons: string[];
  normalized: NormalizeResult;
  scene: BuiltScene | null;
  sceneIssues: SceneIssue[];
  /** 인쇄 전용면적이 [안목 환산, 방 합(중심선)] 구간을 벗어난 비율. 구간 안이면 0, 전용면적이 없으면 null */
  areaDeviation: number | null;
}

/** 있어도 자동 승격을 막지 않는 플래그 — 치수 체인은 수기 스케일에서는 애초에 없다 */
const TOLERATED_FLAGS: NormalizeFlagCode[] = ["scale-no-chain"];

/**
 * 추출 초안이 사람 검토 없이 3D로 나가도 되는지 판정한다.
 * 기준은 기존 정규화 검증(normalizeModel)과 씬 검증(validateBuiltScene)의 합이다 — 여기서 새 기하 규칙을 만들지 않는다.
 * 하나라도 걸리면 needs-review, 씬을 만들 수 없거나 기하가 깨졌으면 blocked
 */
export function evaluateModelFor3d(model: FloorplanModel2D): ReviewVerdict {
  const normalized = normalizeModel(model);
  const reasons: string[] = [];
  const geometryBroken = normalized.flags.some(
    (flag) => flag.code === "geometry-invalid",
  );
  if (geometryBroken) {
    return {
      status: "blocked",
      reasons: normalized.flags.map((flag) => `${flag.code}: ${flag.detail}`),
      normalized,
      scene: null,
      sceneIssues: [],
      areaDeviation: null,
    };
  }

  let scene: BuiltScene | null = null;
  let sceneIssues: SceneIssue[] = [];
  try {
    scene = buildScene(normalized.model);
    sceneIssues = validateBuiltScene(scene);
  } catch (error) {
    return {
      status: "blocked",
      reasons: [
        `buildScene 실패: ${error instanceof Error ? error.message : String(error)}`,
      ],
      normalized,
      scene: null,
      sceneIssues: [],
      areaDeviation: null,
    };
  }

  const { model: m } = normalized;
  const printed = m.printed.exclusiveAreaM2;
  const { centerline: roomArea, innerFace: innerFaceArea } =
    exclusiveAreaBounds(m);
  const areaDeviation = exclusiveAreaDeviation(m);

  for (const flag of normalized.flags) {
    if (!TOLERATED_FLAGS.includes(flag.code))
      reasons.push(`${flag.code}: ${flag.detail}`);
  }
  if (normalized.confidence < REVIEW_MIN_CONFIDENCE)
    reasons.push(
      `신뢰도 ${Math.round(normalized.confidence * 100)}% < ${Math.round(REVIEW_MIN_CONFIDENCE * 100)}%`,
    );
  if (m.walls.length < REVIEW_MIN_WALLS)
    reasons.push(
      `벽 ${m.walls.length}개 < ${REVIEW_MIN_WALLS}개(외곽을 둘러싸지 못함)`,
    );
  if (!m.openings.some((opening) => opening.type === "door"))
    reasons.push("문 없음");
  if (areaDeviation !== null && areaDeviation > AREA_TOLERANCE) {
    reasons.push(
      `면적 편차 ${(areaDeviation * 100).toFixed(1)}% (전용 ${printed}㎡ vs 방 합 ${roomArea.toFixed(2)}㎡·안목 환산 ${innerFaceArea.toFixed(2)}㎡)`,
    );
  }
  for (const issue of sceneIssues)
    reasons.push(`scene ${issue.code}: ${issue.detail}`);

  return {
    status: reasons.length === 0 ? "reviewed" : "needs-review",
    reasons,
    normalized,
    scene,
    sceneIssues,
    areaDeviation,
  };
}
