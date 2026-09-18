import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  HOUSING_FLOORPLANS,
  REVIEWED_MODELS,
  REVIEWED_MODEL_MANIFEST,
  normalizeModel,
} from "@/entities/floorplan";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { buildScene } from "./buildScene";
import { evaluateModelFor3d } from "./reviewGate";
import { validateBuiltScene } from "./validateScene";

const reviewedKeys = Object.keys(REVIEWED_MODELS);
const catalogKeys = new Set(
  HOUSING_SOURCE_DATA.flatMap((property) =>
    property.layouts.map((layout) => layout.layoutKey),
  ),
);
const PUBLIC_DIR = path.resolve(__dirname, "../../../../public");

// 검수 모델은 데이터가 늘어도 같은 검사를 자동으로 받는다 — 모델마다 테스트를 따로 쓰지 않는다
describe("검수 모델(REVIEWED_MODELS)", () => {
  it("등록된 모델은 모두 카탈로그 layout에 대응한다", () => {
    for (const key of reviewedKeys)
      expect(catalogKeys.has(key), key).toBe(true);
  });

  it("3D는 검수 모델이 있는 layout에서만 켜진다(초안·차단 layout은 2D만)", () => {
    for (const floorplan of HOUSING_FLOORPLANS) {
      const reviewed =
        floorplan.layoutKey !== undefined &&
        floorplan.layoutKey in REVIEWED_MODELS;
      expect(floorplan.has3d, floorplan.layoutKey).toBe(reviewed);
      expect(floorplan.model2d !== undefined, floorplan.layoutKey).toBe(
        reviewed,
      );
    }
  });

  it("검수 모델의 2D 크롭 자산이 저장소에 있다", () => {
    for (const floorplan of HOUSING_FLOORPLANS) {
      if (!floorplan.has3d) continue;
      expect(
        fs.existsSync(path.join(PUBLIC_DIR, floorplan.image2dUrl)),
        floorplan.image2dUrl,
      ).toBe(true);
    }
  });

  it("출처 기록(reviewed.json)과 등록 모델이 1:1이고 크롭 원점이 유한하다", () => {
    const manifestKeys = REVIEWED_MODEL_MANIFEST.map(
      (entry) => entry.layoutKey,
    ).sort();
    expect(manifestKeys).toEqual([...reviewedKeys].sort());
    for (const entry of REVIEWED_MODEL_MANIFEST) {
      expect(
        Number.isFinite(entry.originPx.x) && Number.isFinite(entry.originPx.y),
        entry.layoutKey,
      ).toBe(true);
      expect(["extraction", "traced"]).toContain(entry.method);
      expect(
        fs.existsSync(path.join(PUBLIC_DIR, entry.image2dUrl)),
        entry.image2dUrl,
      ).toBe(true);
    }
  });

  if (reviewedKeys.length === 0) {
    it("아직 검수 모델이 없다", () => {
      expect(reviewedKeys).toEqual([]);
    });
  }

  for (const key of reviewedKeys) {
    describe(key, () => {
      const model = REVIEWED_MODELS[key];

      it("승격 기준을 다시 통과한다(정규화·문·면적·씬 검증)", () => {
        const verdict = evaluateModelFor3d(model);
        expect(verdict.reasons).toEqual([]);
        expect(verdict.status).toBe("reviewed");
      });

      it("정규화 검증에 기하 결함이 없고 유한한 좌표만 쓴다", () => {
        const result = normalizeModel(model);
        expect(result.flags.map((f) => f.code)).not.toContain(
          "geometry-invalid",
        );
        expect(JSON.stringify(model)).not.toMatch(/null|NaN|Infinity/);
      });

      it("buildScene이 예외 없이 벽·바닥·스폰을 만들고 씬 검증을 통과한다", () => {
        const scene = buildScene(normalizeModel(model).model);
        expect(scene.walls.length).toBeGreaterThan(0);
        expect(scene.floors.length).toBeGreaterThan(0);
        expect(validateBuiltScene(scene)).toEqual([]);
      });

      it("개구부는 모두 벽 안에 있고 폭이 양수다", () => {
        const wallsById = new Map(model.walls.map((w) => [w.id, w]));
        for (const opening of model.openings) {
          const wall = wallsById.get(opening.wallId);
          expect(wall, opening.wallId).toBeDefined();
          if (!wall) continue;
          const length = Math.hypot(wall.b.x - wall.a.x, wall.b.z - wall.a.z);
          expect(opening.widthMm).toBeGreaterThan(0);
          expect(opening.offsetMm).toBeGreaterThanOrEqual(0);
          expect(opening.offsetMm + opening.widthMm).toBeLessThanOrEqual(
            length + 1,
          );
        }
      });
    });
  }
});
