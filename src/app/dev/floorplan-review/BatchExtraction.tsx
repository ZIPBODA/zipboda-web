"use client";

import { useEffect, useState } from "react";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { extractFloorplan } from "@/features/floorplan-extract";
import type { NormalizeResult } from "@/entities/floorplan";

interface BatchResult {
  layoutKey: string;
  sourcePdf: string;
  sourcePage: number;
  image2dUrl: string;
  calibratedMmPerPx: number | null;
  status: "draft" | "blocked" | "failed";
  result?: NormalizeResult;
  /** 추출 중간 통계 — 벽이 0개로 나올 때 어느 단계에서 사라졌는지 본다 */
  geometry?: {
    crop: { x: number; y: number; width: number; height: number };
    working: { width: number; height: number; mmPerPx: number };
    segments: number;
    regions: number;
    /** 검출된 세그먼트의 길이·두께(mm) — 조립 필터(두께 60~400·길이 500)에 왜 걸렸는지 본다 */
    segmentsMm: { lengthMm: number; thicknessMm: number }[];
  };
  error?: string;
}

interface Props {
  /** 지정하면 이 layoutKey만 다시 돈다(개별 재검토용) */
  only?: string | null;
}

// 한 바퀴에 20분 넘게 걸리는데 소스 저장(Fast Refresh) 한 번에 다 날아가서, 건마다 브라우저에 남기고 이어서 돈다
const storageKey = (only: string | null) =>
  `zipboda:batch-report:${only ?? "all"}`;

function readSaved(only: string | null): BatchResult[] {
  try {
    const raw = window.localStorage.getItem(storageKey(only));
    return raw ? (JSON.parse(raw) as BatchResult[]) : [];
  } catch {
    return [];
  }
}

function writeSaved(only: string | null, results: BatchResult[]) {
  try {
    window.localStorage.setItem(storageKey(only), JSON.stringify(results));
  } catch {
    // 저장 공간이 없으면 화면 상태로만 진행한다
  }
}

export function BatchExtraction({ only = null }: Props) {
  const [results, setResults] = useState<BatchResult[]>([]);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState("");
  useEffect(() => {
    setResults(readSaved(only));
  }, [only]);
  const targets = HOUSING_SOURCE_DATA.flatMap((property) =>
    property.layouts
      .filter((layout) => only === null || layout.layoutKey === only)
      .map((layout) => ({ property, layout })),
  );
  const reset = () => {
    writeSaved(only, []);
    setResults([]);
  };
  const run = async () => {
    setRunning(true);
    let done = readSaved(only);
    try {
      for (const { property, layout } of targets) {
        if (done.some((entry) => entry.layoutKey === layout.layoutKey))
          continue;
        {
          setCurrent(layout.layoutKey);
          const entry: BatchResult = {
            layoutKey: layout.layoutKey,
            sourcePdf: property.sourcePdf,
            sourcePage: layout.page,
            image2dUrl: layout.image2dUrl,
            calibratedMmPerPx: layout.mmPerPx,
            status: "blocked",
          };
          if (layout.mmPerPx === null) {
            entry.error = "실측 스케일 근거 없음";
          } else {
            try {
              const image = new Image();
              image.src = layout.image2dUrl;
              await image.decode();
              const output = await extractFloorplan(image, {
                calibratedMmPerPx: layout.mmPerPx,
                exclusiveAreaM2: layout.exclusiveAreaM2 ?? undefined,
              });
              entry.result = output.result;
              const { crop, working, segments, regions } = output.geometry;
              const toMm = (px: number) => Math.round(px * working.mmPerPx);
              entry.geometry = {
                crop,
                working: {
                  width: working.width,
                  height: working.height,
                  mmPerPx: working.mmPerPx,
                },
                segments: segments.length,
                regions: regions.length,
                segmentsMm: segments.map((s) => ({
                  lengthMm: toMm(Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y)),
                  thicknessMm: toMm(s.thicknessPx),
                })),
              };
              entry.status = "draft";
            } catch (error) {
              entry.status = "failed";
              entry.error =
                error instanceof Error ? error.message : String(error);
            }
          }
          done = [...done, entry];
          writeSaved(only, done);
          setResults(done);
        }
      }
    } finally {
      setRunning(false);
      setCurrent("");
    }
  };
  return (
    <main className="p-4">
      <h1>현황도 일괄 추출 · 개발용{only ? ` · ${only}` : ""}</h1>
      <p>초안은 검수 후에만 서비스 모델로 등록합니다.</p>
      <button disabled={running} onClick={() => void run()}>
        일괄 추출 시작
      </button>
      <button disabled={running} onClick={reset}>
        저장된 결과 지우기
      </button>
      <p role="status" data-total={targets.length} data-done={results.length}>
        {running ? current : "대기"} · {results.length}/{targets.length}건
      </p>
      <textarea
        aria-label="추출 보고서"
        readOnly
        value={JSON.stringify(results)}
        className="h-96 w-full"
      />
    </main>
  );
}
