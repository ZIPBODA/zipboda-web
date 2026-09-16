import type { Calibration, TraceDocument } from "../model/types";
import { createProjection } from "./projection";
import { orientWall, snapPointToGrid } from "./snap";
import { wallLengthMm } from "./wallOps";

/**
 * 캘리브레이션을 바꿔도 이미 그린 것이 도면 위 같은 자리에 남게 한다.
 * mm → 이미지 px → 새 mm로 옮기고 격자에 다시 맞춘다. 길이(개구부 offset·폭)는 배율만 곱한다
 */
export function reprojectDocument(document: TraceDocument, calibration: Calibration): TraceDocument {
  const before = createProjection(document.calibration);
  const after = createProjection(calibration);
  if (!before || !after || !document.calibration) return { ...document, calibration };

  const mapPoint = (p: { x: number; z: number }) => after.toMm(before.toPx(p));
  const ratio = calibration.mmPerPx / document.calibration.mmPerPx;
  const walls = document.walls.map((wall) => orientWall({ ...wall, a: snapPointToGrid(mapPoint(wall.a)), b: snapPointToGrid(mapPoint(wall.b)) }));
  const lengthById = new Map(walls.map((wall) => [wall.id, wallLengthMm(wall)]));
  const openings = document.openings.flatMap((opening) => {
    const length = lengthById.get(opening.wallId) ?? 0;
    const widthMm = Math.min(length, Math.round(opening.widthMm * ratio));
    const offsetMm = Math.max(0, Math.min(length - widthMm, Math.round(opening.offsetMm * ratio)));
    return widthMm > 0 ? [{ ...opening, widthMm, offsetMm }] : [];
  });
  const labelAnchors = document.labelAnchors.map((anchor) => ({ ...anchor, at: mapPoint(anchor.at) }));
  return { ...document, calibration, walls, openings, labelAnchors };
}
