"use client";

import { useState, type Dispatch } from "react";
import type { NormalizeResult } from "@/entities/floorplan";
import {
  BOUNDARY_THICKNESS_MM,
  CALIBRATION_POINTS,
  TRACE_FILE_VERSION,
  sanitizeFileName,
  serializeTraceFile,
  wallLengthMm,
  type DerivedLayout,
  type TraceAction,
  type TraceDocument,
  type TraceUiState
} from "@/features/floorplan-trace";
import { MODEL_FILE_SUFFIX, PERCENT, TRACE_FILE_SUFFIX, WALL_THICKNESS_OPTIONS } from "../config/constants";

interface Props {
  document: TraceDocument;
  ui: TraceUiState;
  layout: DerivedLayout;
  normalized: NormalizeResult | null;
  /** 저장 파일 이름의 바탕이 되는 도면 이름 */
  name: string;
  imageUrl: string;
  onNameChange: (name: string) => void;
  onOpenTraceFile: (file: File) => void;
  dispatch: Dispatch<TraceAction>;
}

const parseOptionalNumber = (value: string): number | undefined => {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) && n > 0 ? n : undefined;
};

function download(text: string, fileName: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // 클릭 직후 해제하면 다운로드가 시작되기 전에 주소가 사라지는 브라우저가 있다
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function TraceSidePanel({ document, ui, layout, normalized, name, imageUrl, onNameChange, onOpenTraceFile, dispatch }: Props) {
  const model = normalized?.model ?? null;
  const exportJson = model ? JSON.stringify(model, null, 2) : "";
  const fileBase = sanitizeFileName(name);

  // 검수 통과한 모델은 저장소 자산으로 쓰고(뷰어는 저장된 모델만 읽는다), 편집 문서는 나중에 다시 고치려고 따로 남긴다
  const downloadModel = () => model && download(JSON.stringify(model, null, 2), fileBase + MODEL_FILE_SUFFIX);
  const downloadTrace = () => download(serializeTraceFile({ version: TRACE_FILE_VERSION, name, imageUrl, document }), fileBase + TRACE_FILE_SUFFIX);

  return (
    <section className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <ScaleSection document={document} ui={ui} dispatch={dispatch} />
        <PrintedSection document={document} dispatch={dispatch} />
        <SelectionSection document={document} ui={ui} dispatch={dispatch} />
        <StatusSection document={document} layout={layout} normalized={normalized} />
      </div>
      <div className="rounded border border-line p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1">
            도면 이름
            <input value={name} onChange={(e) => onNameChange(e.target.value)} className="w-36 rounded border border-line px-2 py-1" placeholder="fp-test2" />
          </label>
          <button type="button" onClick={downloadTrace} className="rounded border border-line px-2.5 py-1 font-medium text-fg-heading">
            작업 저장
          </button>
          <label className="cursor-pointer rounded border border-line px-2.5 py-1 font-medium text-fg-heading">
            작업 열기
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onOpenTraceFile(file);
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" disabled={!model} onClick={downloadModel} className="rounded border border-line px-2.5 py-1 font-medium text-fg-heading disabled:opacity-40">
            모델 저장
          </button>
        </div>
        <div className="mt-1 text-2xsmall text-fg-muted">
          {fileBase}
          {TRACE_FILE_SUFFIX} · {fileBase}
          {MODEL_FILE_SUFFIX}
        </div>
        <div className="mt-2 font-semibold text-fg-heading">모델 JSON (FloorplanModel2D)</div>
        <textarea readOnly value={exportJson} className="mt-2 h-72 w-full rounded border border-line p-2 font-mono text-xs" />
      </div>
    </section>
  );
}

function ScaleSection({ document, ui, dispatch }: Pick<Props, "document" | "ui" | "dispatch">) {
  const [distance, setDistance] = useState("");
  const [mmPerPx, setMmPerPx] = useState("");
  const ready = ui.calibratePoints.length === CALIBRATION_POINTS;
  const calibration = document.calibration;
  return (
    <div className="rounded border border-line p-3">
      <div className="font-semibold text-fg-heading">스케일</div>
      <div className="mt-1 text-fg-muted">
        {calibration ? `${calibration.mmPerPx.toFixed(3)} mm/px (${calibration.source})` : "미설정 — 스케일 도구(C)로 인쇄 치수 양 끝을 클릭하세요"}
      </div>
      {ui.tool === "calibrate" && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-fg-muted">
            점 {ui.calibratePoints.length}/{CALIBRATION_POINTS}
          </span>
          <input value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="실측 거리(mm)" className="w-28 rounded border border-line px-2 py-1" />
          <button
            type="button"
            disabled={!ready || !parseOptionalNumber(distance)}
            onClick={() => {
              const distanceMm = parseOptionalNumber(distance);
              if (distanceMm) dispatch({ type: "COMMIT_CALIBRATION", distanceMm });
            }}
            className="rounded bg-brand px-2.5 py-1 font-bold text-brand-on disabled:opacity-50"
          >
            적용
          </button>
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <input value={mmPerPx} onChange={(e) => setMmPerPx(e.target.value)} placeholder="mm/px 직접 입력" className="w-28 rounded border border-line px-2 py-1" />
        <button
          type="button"
          disabled={!parseOptionalNumber(mmPerPx)}
          onClick={() => {
            const value = parseOptionalNumber(mmPerPx);
            if (value) dispatch({ type: "SET_SCALE", mmPerPx: value });
          }}
          className="rounded border border-line px-2.5 py-1 disabled:opacity-40"
        >
          설정
        </button>
      </div>
    </div>
  );
}

function PrintedSection({ document, dispatch }: Pick<Props, "document" | "dispatch">) {
  const chains = document.printed.dimensionChains;
  const chainValue = (axis: "x" | "z") => chains.find((chain) => chain.axis === axis)?.values.join(" ") ?? "";
  const setChain = (axis: "x" | "z", text: string) => {
    const values = text
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    const others = chains.filter((chain) => chain.axis !== axis);
    dispatch({ type: "SET_PRINTED", patch: { dimensionChains: values.length > 0 ? [...others, { axis, values }] : others } });
  };
  return (
    <div className="rounded border border-line p-3">
      <div className="font-semibold text-fg-heading">인쇄 정보(검증용, 선택)</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          전용면적(㎡)
          <input
            value={document.printed.exclusiveAreaM2 ?? ""}
            onChange={(e) => dispatch({ type: "SET_PRINTED", patch: { exclusiveAreaM2: parseOptionalNumber(e.target.value) } })}
            className="w-20 rounded border border-line px-2 py-1"
            placeholder="33.56"
          />
        </label>
        {/* key로 문서가 바뀔 때 입력값을 새로 받는다 — 자동 초안이 읽어 온 치수가 빈 칸으로 남아 포커스만 줘도 지워지던 문제 */}
        <label className="flex items-center gap-1">
          가로 치수(mm)
          <input
            key={`x:${chainValue("x")}`}
            defaultValue={chainValue("x")}
            onBlur={(e) => setChain("x", e.target.value)}
            className="w-32 rounded border border-line px-2 py-1"
            placeholder="1100 1670 1730"
          />
        </label>
        <label className="flex items-center gap-1">
          세로 치수(mm)
          <input
            key={`z:${chainValue("z")}`}
            defaultValue={chainValue("z")}
            onBlur={(e) => setChain("z", e.target.value)}
            className="w-32 rounded border border-line px-2 py-1"
            placeholder="7200"
          />
        </label>
      </div>
    </div>
  );
}

function SelectionSection({ document, ui, dispatch }: Pick<Props, "document" | "ui" | "dispatch">) {
  const { selection } = ui;
  if (!selection) return null;
  if (selection.kind === "wall") {
    const wall = document.walls.find((candidate) => candidate.id === selection.id);
    if (!wall) return null;
    return (
      <div className="rounded border border-line p-3">
        <div className="font-semibold text-fg-heading">선택한 벽 · 길이 {Math.round(wallLengthMm(wall))}mm</div>
        <div className="mt-2 flex items-center gap-2">
          두께
          {WALL_THICKNESS_OPTIONS.map((thicknessMm) => (
            <button
              key={thicknessMm}
              type="button"
              onClick={() => dispatch({ type: "UPDATE_WALL", id: wall.id, patch: { thicknessMm } })}
              className={`rounded px-2 py-0.5 text-xs ${wall.thicknessMm === thicknessMm ? "bg-brand text-brand-on" : "border border-line"}`}
            >
              {thicknessMm}
            </button>
          ))}
          <button
            type="button"
            onClick={() => dispatch({ type: "UPDATE_WALL", id: wall.id, patch: { thicknessMm: undefined } })}
            className={`rounded px-2 py-0.5 text-xs ${wall.thicknessMm === undefined ? "bg-brand text-brand-on" : "border border-line"}`}
          >
            자동
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "UPDATE_WALL", id: wall.id, patch: { thicknessMm: BOUNDARY_THICKNESS_MM } })}
            className={`rounded px-2 py-0.5 text-xs ${wall.thicknessMm === BOUNDARY_THICKNESS_MM ? "bg-brand text-brand-on" : "border border-line"}`}
          >
            경계선
          </button>
        </div>
      </div>
    );
  }
  const opening = document.openings.find((candidate) => candidate.id === selection.id);
  if (!opening) return null;
  return (
    <div className="rounded border border-line p-3">
      <div className="font-semibold text-fg-heading">선택한 개구부</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(["door", "window"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => dispatch({ type: "UPDATE_OPENING", id: opening.id, patch: { type } })}
            className={`rounded px-2 py-0.5 text-xs ${opening.type === type ? "bg-brand text-brand-on" : "border border-line"}`}
          >
            {type === "door" ? "문" : "창"}
          </button>
        ))}
        {/* 빈 칸은 Number("")=0이 되어 개구부가 폭 0으로 찌그러지고, 다음 스케일 변경에서 조용히 사라진다 */}
        <label className="flex items-center gap-1">
          폭(mm)
          <input
            type="number"
            value={opening.widthMm}
            onChange={(e) => {
              const widthMm = Number(e.target.value);
              if (Number.isFinite(widthMm) && widthMm > 0) dispatch({ type: "UPDATE_OPENING", id: opening.id, patch: { widthMm } });
            }}
            className="w-20 rounded border border-line px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-1">
          시작 위치(mm)
          <input
            type="number"
            value={opening.offsetMm}
            onChange={(e) => {
              const offsetMm = Number(e.target.value);
              if (e.target.value.trim() !== "" && Number.isFinite(offsetMm) && offsetMm >= 0) dispatch({ type: "UPDATE_OPENING", id: opening.id, patch: { offsetMm } });
            }}
            className="w-20 rounded border border-line px-2 py-1"
          />
        </label>
      </div>
    </div>
  );
}

function StatusSection({ document, layout, normalized }: Pick<Props, "document" | "layout" | "normalized">) {
  const doors = document.openings.filter((o) => o.type === "door").length;
  const windows = document.openings.length - doors;
  return (
    <div className="rounded border border-line p-3">
      <div className="flex items-center gap-2">
        {normalized ? (
          <>
            <span className="font-semibold text-fg-heading">신뢰도 {Math.round(normalized.confidence * PERCENT)}%</span>
            <span className={`rounded px-2 py-0.5 text-2xsmall font-bold ${normalized.autoAccept ? "bg-status-success text-fg-ondark" : "bg-brand text-brand-on"}`}>
              {normalized.autoAccept ? "자동 확정" : "검수 필요"}
            </span>
          </>
        ) : (
          <span className="font-semibold text-fg-heading">모델 없음</span>
        )}
      </div>
      <div className="mt-1 text-fg-muted">
        방 {layout.rooms.length} · 벽 {document.walls.length} · 문 {doors} · 창 {windows}
      </div>
      {layout.openEndpoints.length > 0 && <div className="mt-1 text-status-error">닫히지 않은 끝점 {layout.openEndpoints.length}개 — 빨간 원을 다른 벽에 붙이세요</div>}
      <ul className="mt-2 flex flex-col gap-1">
        {normalized?.flags.length === 0 && <li className="text-fg-muted">검증 플래그 없음</li>}
        {normalized?.flags.map((flag, i) => (
          <li key={`${flag.code}-${i}`} className="text-fg-body">
            <span className="font-mono text-2xsmall text-status-error">{flag.code}</span> {flag.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
