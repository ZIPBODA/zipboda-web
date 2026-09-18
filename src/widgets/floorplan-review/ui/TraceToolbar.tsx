"use client";

import type { Dispatch } from "react";
import { OPENING_PRESETS, type OpeningPreset, type TraceAction, type TraceTool } from "@/features/floorplan-trace";
import { TOOL_LABELS } from "../config/constants";

interface Props {
  tool: TraceTool;
  openingPreset: OpeningPreset;
  drawBoundary: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  dispatch: Dispatch<TraceAction>;
}

const TOOLS: TraceTool[] = ["select", "wall", "label", "opening", "calibrate"];

export function TraceToolbar({ tool, openingPreset, drawBoundary, canUndo, canRedo, hasSelection, dispatch }: Props) {
  const setPreset = (type: OpeningPreset["type"]) => dispatch({ type: "SET_OPENING_PRESET", preset: { type, widthMm: OPENING_PRESETS[type] } });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="도구" className="flex overflow-hidden rounded border border-line">
        {TOOLS.map((candidate) => {
          const { label, key } = TOOL_LABELS[candidate];
          const active = candidate === tool;
          return (
            <button
              key={candidate}
              type="button"
              aria-pressed={active}
              title={TOOL_LABELS[candidate].hint}
              onClick={() => dispatch({ type: "SET_TOOL", tool: candidate })}
              className={`px-2.5 py-1 text-xs font-medium ${active ? "bg-brand text-brand-on" : "bg-white text-fg-heading"}`}
            >
              {label} <span className="text-2xsmall opacity-70">{key}</span>
            </button>
          );
        })}
      </div>

      <div role="group" aria-label="벽 종류" className="flex overflow-hidden rounded border border-line">
        {[false, true].map((boundary) => (
          <button
            key={String(boundary)}
            type="button"
            aria-pressed={drawBoundary === boundary}
            title={boundary ? "방만 가르고 3D 벽으로 세우지 않는 선(주방↔거실 바닥 경계). B로 전환" : "실제 벽. B로 전환"}
            onClick={() => dispatch({ type: "SET_DRAW_BOUNDARY", value: boundary })}
            className={`px-2.5 py-1 text-xs font-medium ${drawBoundary === boundary ? "bg-fg-heading text-white" : "bg-white text-fg-heading"}`}
          >
            {boundary ? "경계선" : "벽"}
          </button>
        ))}
      </div>

      <div role="group" aria-label="개구부 종류" className="flex overflow-hidden rounded border border-line">
        {(["door", "window"] as const).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={openingPreset.type === type}
            onClick={() => setPreset(type)}
            className={`px-2.5 py-1 text-xs font-medium ${openingPreset.type === type ? "bg-fg-heading text-white" : "bg-white text-fg-heading"}`}
          >
            {type === "door" ? "문" : "창"} {OPENING_PRESETS[type]}
          </button>
        ))}
      </div>

      <button type="button" disabled={!canUndo} onClick={() => dispatch({ type: "UNDO" })} className="rounded border border-line px-2.5 py-1 text-xs disabled:opacity-40">
        되돌리기
      </button>
      <button type="button" disabled={!canRedo} onClick={() => dispatch({ type: "REDO" })} className="rounded border border-line px-2.5 py-1 text-xs disabled:opacity-40">
        다시 실행
      </button>
      <button
        type="button"
        disabled={!hasSelection}
        onClick={() => dispatch({ type: "DELETE_SELECTION" })}
        className="rounded border border-status-error/40 px-2.5 py-1 text-xs text-status-error disabled:opacity-40"
      >
        삭제
      </button>
      <span className="text-2xsmall text-fg-muted">{TOOL_LABELS[tool].hint}</span>
    </div>
  );
}
