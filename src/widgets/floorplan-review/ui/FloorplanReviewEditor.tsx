"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FloorplanModel2D } from "@/entities/floorplan";
import { extractFloorplan, type CropRect, type ExtractProgress } from "@/features/floorplan-extract";
import {
  BOUNDARY_TOGGLE_KEY,
  OPENING_PRESETS,
  TOOL_SHORTCUTS,
  defaultNameFromImage,
  documentFromModel,
  emptyDocument,
  parseTraceFile,
  useTraceEditor
} from "@/features/floorplan-trace";
import { DEFAULT_IMAGE_URL, MAX_ZOOM, MIN_ZOOM, PERCENT, STAGE_LABELS, ZOOM_STEPS } from "../config/constants";
import { TraceCanvas } from "./TraceCanvas";
import { TraceSidePanel } from "./TraceSidePanel";
import { TraceToolbar } from "./TraceToolbar";

interface Props {
  /** 편집 중인 모델이 바뀔 때마다 알림(없으면 null) — 상위(app)가 3D 미리보기 등을 조합 */
  onModelChange?: (model: FloorplanModel2D | null) => void;
  /** 결과 섹션 옆에 붙일 미리보기 슬롯(위젯 간 직접 의존 대신 composition) */
  preview?: ReactNode;
  /** 이미지 로드 직후 자동 초안을 한 번 실행(dev 검증 자동화용) */
  autoRun?: boolean;
}

const isTypingTarget = (target: EventTarget | null) => target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

// 도면 이미지 위에 벽을 그려(또는 자동 초안을 고쳐) 2D 모델을 만들고 3D로 확인·저장하는 검수 화면(dev)
export function FloorplanReviewEditor({ onModelChange, preview, autoRun = false }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE_URL);
  const [urlDraft, setUrlDraft] = useState(DEFAULT_IMAGE_URL);
  const [name, setName] = useState(() => defaultNameFromImage(DEFAULT_IMAGE_URL));
  const objectUrlRef = useRef<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [progress, setProgress] = useState<ExtractProgress | null>(null);
  const [draftRects, setDraftRects] = useState<CropRect[]>([]);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const editor = useTraceEditor();
  const { document, ui, dispatch } = editor;

  // 큰 스캔(2,000px대)은 컨테이너를 넘치므로 처음엔 폭에 맞춰 보여 준다
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!natural || !viewport) return;
    setZoom(Math.max(MIN_ZOOM, Math.min(1, viewport.clientWidth / natural.w)));
  }, [natural]);
  const stepZoom = (direction: 1 | -1) =>
    setZoom((current) => {
      const next = direction > 0 ? ZOOM_STEPS.find((step) => step > current + 0.001) : [...ZOOM_STEPS].reverse().find((step) => step < current - 0.001);
      return next ?? (direction > 0 ? MAX_ZOOM : MIN_ZOOM);
    });

  const runDraft = async () => {
    const image = imageRef.current;
    if (!image || !natural) return;
    if (document.walls.length > 0 && !window.confirm("그린 벽을 지우고 자동 초안으로 바꿀까요?")) return;
    setRunning(true);
    setError("");
    try {
      const result = await extractFloorplan(image, { exclusiveAreaM2: document.printed.exclusiveAreaM2, onProgress: setProgress });
      const { crop } = result.geometry;
      setDraftRects([crop, result.dimension.band]);
      dispatch({ type: "LOAD_DOCUMENT", document: documentFromModel(result.result.model, { x: crop.x, y: crop.y }) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  // 캐시된 이미지는 React가 붙기 전에 로드가 끝나 onLoad가 오지 않는다 — 완료 상태를 직접 확인해 버튼이 잠기지 않게 한다
  useEffect(() => {
    const image = imageRef.current;
    if (!image || !image.complete || image.naturalWidth === 0) return;
    setNatural({ w: image.naturalWidth, h: image.naturalHeight });
  }, [imageUrl]);

  const runRef = useRef(runDraft);
  runRef.current = runDraft;
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (!autoRun || autoRanRef.current || natural === null) return;
    autoRanRef.current = true;
    void runRef.current();
  }, [autoRun, natural]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "REDO" : "UNDO" });
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "y") {
        event.preventDefault();
        dispatch({ type: "REDO" });
        return;
      }
      // Ctrl+C·Ctrl+V가 도구를 바꿔 그리던 벽·스케일 점을 날리지 않게 한다
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") dispatch({ type: "CANCEL" });
      else if (event.key === "Delete" || event.key === "Backspace") dispatch({ type: "DELETE_SELECTION" });
      else if (key === "d") {
        const type = ui.openingPreset.type === "door" ? "window" : "door";
        dispatch({ type: "SET_OPENING_PRESET", preset: { type, widthMm: OPENING_PRESETS[type] } });
      } else if (key === BOUNDARY_TOGGLE_KEY) dispatch({ type: "SET_DRAW_BOUNDARY", value: !ui.drawBoundary });
      else if (TOOL_SHORTCUTS[key]) dispatch({ type: "SET_TOOL", tool: TOOL_SHORTCUTS[key] });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, ui.openingPreset.type, ui.drawBoundary]);

  const model = editor.normalized?.model ?? null;
  useEffect(() => {
    onModelChange?.(model);
  }, [model, onModelChange]);

  const applyImage = (url: string) => {
    if (objectUrlRef.current && objectUrlRef.current !== url) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url.startsWith("blob:") ? url : null;
    setImageUrl(url);
    setUrlDraft(url);
    setNatural(null);
    setDraftRects([]);
    setError("");
  };

  // 다른 도면으로 바꾸면 이전 도면의 벽·스케일은 새 이미지 위에서 엉뚱한 자리에 놓인다 — 문서를 비우고 시작한다
  const changeImage = (url: string, fileName?: string) => {
    if (url === imageUrl) return;
    if (document.walls.length > 0 && !window.confirm("그린 벽을 지우고 다른 도면을 열까요?")) {
      setUrlDraft(imageUrl);
      return;
    }
    applyImage(url);
    setName(defaultNameFromImage(fileName ?? url));
    dispatch({ type: "LOAD_DOCUMENT", document: emptyDocument() });
  };

  const openTraceFile = async (file: File) => {
    if (document.walls.length > 0 && !window.confirm("그린 벽을 지우고 저장한 작업을 열까요?")) return;
    try {
      const saved = parseTraceFile(await file.text());
      // blob 주소는 다시 열 수 없다 — 그 경우 이미지는 그대로 두고 편집 내용만 되살린다
      const canReopen = saved.imageUrl !== "" && !saved.imageUrl.startsWith("blob:") && saved.imageUrl !== imageUrl;
      if (canReopen) applyImage(saved.imageUrl);
      if (saved.name !== "") setName(saved.name);
      dispatch({ type: "LOAD_DOCUMENT", document: saved.document });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-4 text-sm text-fg-strong">
      <h1 className="text-h2 font-bold text-fg-heading">평면도 트레이싱 검수 (dev)</h1>
      <p className="mt-1 text-fg-muted">도면 이미지 위에 벽을 그리거나 자동 초안을 고쳐 → 방·문 확정 → 3D 확인 → 모델 JSON 저장</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onBlur={() => changeImage(urlDraft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") changeImage(urlDraft);
          }}
          className="w-72 rounded border border-line px-2 py-1"
          placeholder="이미지 경로/URL (Enter로 열기)"
        />
        <label className="rounded border border-line px-2.5 py-1">
          파일 열기
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) changeImage(URL.createObjectURL(file), file.name);
            }}
          />
        </label>
        <button type="button" onClick={runDraft} disabled={running || !natural} className="rounded bg-brand px-3 py-1 font-bold text-brand-on disabled:opacity-50">
          {running ? "초안 추출 중…" : "자동 초안"}
        </button>
        {progress && running && (
          <span className="text-fg-muted">
            {STAGE_LABELS[progress.stage]} · {Math.round(progress.ratio * PERCENT)}%
          </span>
        )}
      </div>
      {error && <div className="mt-2 rounded border border-status-error/40 bg-surface-secondary px-3 py-2 text-status-error">{error}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TraceToolbar
          tool={ui.tool}
          openingPreset={ui.openingPreset}
          drawBoundary={ui.drawBoundary}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          hasSelection={ui.selection !== null}
          dispatch={dispatch}
        />
        <div role="group" aria-label="확대" className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => stepZoom(-1)} className="rounded border border-line px-2 py-1 text-xs">
            −
          </button>
          <span className="w-12 text-center text-xs text-fg-muted">{Math.round(zoom * PERCENT)}%</span>
          <button type="button" onClick={() => stepZoom(1)} className="rounded border border-line px-2 py-1 text-xs">
            +
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="mt-2 max-h-[80vh] overflow-auto rounded border border-line">
        <TraceCanvas
          zoom={zoom}
          imageUrl={imageUrl}
          imageRef={imageRef}
          natural={natural}
          onImageLoad={setNatural}
          document={document}
          ui={ui}
          projection={editor.projection}
          layout={editor.layout}
          rooms={editor.rooms}
          perRoomConfidence={model?.confidence.perRoom ?? {}}
          draftRects={draftRects}
          dispatch={dispatch}
        />
      </div>

      <div className="mt-4">
        <TraceSidePanel
          document={document}
          ui={ui}
          layout={editor.layout}
          normalized={editor.normalized}
          name={name}
          imageUrl={imageUrl}
          onNameChange={setName}
          onOpenTraceFile={(file) => void openTraceFile(file)}
          dispatch={dispatch}
        />
      </div>

      {preview && (
        <div className="relative mt-3 h-80 overflow-hidden rounded border border-line">
          <div className="absolute left-3 top-3 z-10 rounded bg-black/60 px-2 py-1 text-2xsmall font-semibold text-white">3D 미리보기(3인칭)</div>
          {preview}
        </div>
      )}
    </main>
  );
}
