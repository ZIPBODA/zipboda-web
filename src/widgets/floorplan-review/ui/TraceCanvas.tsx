"use client";

import type { Dispatch, PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { PointMm, PointPx, RoomLabel } from "@/entities/floorplan";
import type { CropRect } from "@/features/floorplan-extract";
import {
  isBoundary,
  pointOnWall,
  roomAt,
  type DerivedLayout,
  type LabeledRoom,
  type PointerSample,
  type Projection,
  type TraceAction,
  type TraceDocument,
  type TraceUiState,
  type TraceWall
} from "@/features/floorplan-trace";
import { HANDLE_RADIUS_PX, HIT_RADIUS_PX, OPENING_MARKER_RADIUS_PX, OVERLAY_COLOR, OVERLAY_LABEL_FONT_PX, OVERLAY_STROKE_PX, PERCENT } from "../config/constants";
import { RoomLabelPicker } from "./RoomLabelPicker";

interface Props {
  imageUrl: string;
  imageRef: RefObject<HTMLImageElement>;
  natural: { w: number; h: number } | null;
  onImageLoad: (size: { w: number; h: number }) => void;
  document: TraceDocument;
  ui: TraceUiState;
  projection: Projection | null;
  layout: DerivedLayout;
  rooms: LabeledRoom[];
  perRoomConfidence: Record<string, number>;
  /** 자동 초안이 읽은 영역(유닛 크롭·치수 띠) — 초안이 어디서 왔는지 보여준다 */
  draftRects: CropRect[];
  /** 화면 배율. 좌표 변환은 SVG의 화면 행렬로 하므로 어떤 배율에서도 이미지 px가 나온다 */
  zoom: number;
  dispatch: Dispatch<TraceAction>;
}

const PRIMARY_BUTTON = 0;

// 도면 이미지 위에 벽·방·문을 그리고 포인터 입력을 mm 좌표로 바꿔 편집 상태에 넘기는 캔버스
export function TraceCanvas({ imageUrl, imageRef, natural, onImageLoad, document, ui, projection, layout, rooms, perRoomConfidence, draftRects, zoom, dispatch }: Props) {
  const mmPerPx = document.calibration?.mmPerPx ?? 0;

  const sampleFrom = (event: ReactPointerEvent<SVGSVGElement>): PointerSample | null => {
    const ctm = event.currentTarget.getScreenCTM();
    if (!ctm) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    const px: PointPx = { x: point.x, y: point.y };
    return { px, mm: projection ? projection.toMm(px) : null, toleranceMm: HIT_RADIUS_PX * mmPerPx };
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== PRIMARY_BUTTON) return;
    const at = sampleFrom(event);
    if (!at) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dispatch({ type: "POINTER_DOWN", at });
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const at = sampleFrom(event);
    if (at) dispatch({ type: "POINTER_MOVE", at });
  };
  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== PRIMARY_BUTTON) return;
    const at = sampleFrom(event);
    if (at) dispatch({ type: "POINTER_UP", at });
  };

  const toPx = projection?.toPx ?? null;
  const pickerRoom = ui.labelPickerAt ? roomAt(rooms, ui.labelPickerAt) : null;
  const pickerPx = ui.labelPickerAt && toPx ? toPx(ui.labelPickerAt) : null;
  const wallsById = new Map(document.walls.map((wall) => [wall.id, wall]));
  const ghost = toPx ? dragGhost(document, ui) : null;
  const cursor = ui.tool === "select" ? "default" : "crosshair";

  const scaled = natural ? { width: natural.w * zoom, height: natural.h * zoom } : undefined;

  return (
    <div className="relative" style={scaled}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="평면도"
        crossOrigin="anonymous"
        onLoad={(e) => onImageLoad({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        className="block max-w-none origin-top-left select-none"
        style={{ transform: `scale(${zoom})` }}
        draggable={false}
      />
      {natural && (
        <svg
          width={natural.w}
          height={natural.h}
          className="absolute left-0 top-0 origin-top-left"
          style={{ touchAction: "none", cursor, transform: `scale(${zoom})` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          // 터치·펜에서는 pointerup 대신 pointercancel이 온다. 안 받으면 드래그 상태가 남아 버튼을 뗀 뒤에도 벽이 따라다닌다
          onPointerCancel={() => dispatch({ type: "CANCEL" })}
          onDoubleClick={() => dispatch({ type: "CANCEL" })}
          onContextMenu={(e) => {
            e.preventDefault();
            dispatch({ type: "CANCEL" });
          }}
        >
          {draftRects.map((rect, i) => (
            <rect key={`draft-${i}`} x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="none" stroke={OVERLAY_COLOR.crop} strokeWidth={OVERLAY_STROKE_PX.crop} strokeDasharray="6 4" />
          ))}

          {toPx &&
            rooms.map((room) => {
              const pts = room.polygon.map(toPx);
              const center = toPx(room.labelAt);
              const confidence = Math.round((perRoomConfidence[room.key] ?? 0) * PERCENT);
              return (
                <g key={room.key}>
                  <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={OVERLAY_COLOR.roomFill} stroke={OVERLAY_COLOR.room} strokeWidth={OVERLAY_STROKE_PX.room} />
                  <text x={center.x} y={center.y} fontSize={OVERLAY_LABEL_FONT_PX} fontWeight={700} textAnchor="middle" fill={OVERLAY_COLOR.label}>
                    {room.label} {room.areaM2.toFixed(1)}㎡ {confidence}%
                  </text>
                </g>
              );
            })}

          {toPx &&
            document.walls.map((wall) => {
              const a = toPx(wall.a);
              const b = toPx(wall.b);
              const exterior = layout.exteriorWallIds.has(wall.id);
              const boundary = isBoundary(wall);
              const selected = ui.selection?.kind === "wall" && ui.selection.id === wall.id;
              return (
                <g key={wall.id}>
                  {selected && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={OVERLAY_COLOR.selection} strokeWidth={OVERLAY_STROKE_PX.selection} strokeOpacity={0.5} />}
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={boundary ? OVERLAY_COLOR.boundary : exterior ? OVERLAY_COLOR.exteriorWall : OVERLAY_COLOR.interiorWall}
                    strokeWidth={boundary ? OVERLAY_STROKE_PX.boundary : exterior ? OVERLAY_STROKE_PX.exteriorWall : OVERLAY_STROKE_PX.interiorWall}
                    strokeDasharray={boundary ? "8 6" : undefined}
                  />
                  {ui.tool === "select" &&
                    [a, b].map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={HANDLE_RADIUS_PX} fill={OVERLAY_COLOR.handle} stroke={OVERLAY_COLOR.interiorWall} strokeWidth={1.5} />
                    ))}
                </g>
              );
            })}

          {toPx &&
            document.openings.map((opening) => {
              const wall = wallsById.get(opening.wallId);
              if (!wall) return null;
              const s0 = toPx(pointOnWall(wall, opening.offsetMm));
              const s1 = toPx(pointOnWall(wall, opening.offsetMm + opening.widthMm));
              const center = toPx(pointOnWall(wall, opening.offsetMm + opening.widthMm / 2));
              const color = opening.type === "door" ? OVERLAY_COLOR.door : OVERLAY_COLOR.window;
              const selected = ui.selection?.kind === "opening" && ui.selection.id === opening.id;
              return (
                <g key={opening.id}>
                  <line x1={s0.x} y1={s0.y} x2={s1.x} y2={s1.y} stroke={color} strokeWidth={OVERLAY_STROKE_PX.opening} strokeLinecap="round" />
                  <circle cx={center.x} cy={center.y} r={OPENING_MARKER_RADIUS_PX} fill={OVERLAY_COLOR.handle} stroke={selected ? OVERLAY_COLOR.selection : color} strokeWidth={2} />
                </g>
              );
            })}

          {toPx &&
            layout.openEndpoints.map((p, i) => {
              const px = toPx(p);
              return <circle key={`open-${i}`} cx={px.x} cy={px.y} r={HANDLE_RADIUS_PX + 2} fill="none" stroke={OVERLAY_COLOR.openEndpoint} strokeWidth={2} />;
            })}

          {toPx &&
            document.labelAnchors.map((anchor) => {
              const px = toPx(anchor.at);
              return <circle key={anchor.id} cx={px.x} cy={px.y} r={3} fill={OVERLAY_COLOR.anchor} />;
            })}

          {toPx && ui.wallDraft && <DraftLine a={toPx(ui.wallDraft.start)} b={toPx(ui.wallDraft.current)} />}
          {toPx && ghost && <DraftLine a={toPx(ghost.a)} b={toPx(ghost.b)} />}

          {ui.calibratePoints.map((p, i) => (
            <g key={`cal-${i}`}>
              <line x1={p.x - HIT_RADIUS_PX} y1={p.y} x2={p.x + HIT_RADIUS_PX} y2={p.y} stroke={OVERLAY_COLOR.calibrate} strokeWidth={2} />
              <line x1={p.x} y1={p.y - HIT_RADIUS_PX} x2={p.x} y2={p.y + HIT_RADIUS_PX} stroke={OVERLAY_COLOR.calibrate} strokeWidth={2} />
            </g>
          ))}
          {ui.calibratePoints.length === 2 && (
            <line
              x1={ui.calibratePoints[0].x}
              y1={ui.calibratePoints[0].y}
              x2={ui.calibratePoints[1].x}
              y2={ui.calibratePoints[1].y}
              stroke={OVERLAY_COLOR.calibrate}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
        </svg>
      )}

      {pickerPx && ui.labelPickerAt && (
        <div className="absolute z-10" style={{ left: pickerPx.x * zoom, top: pickerPx.y * zoom }}>
          {pickerRoom ? (
            <RoomLabelPicker
              current={pickerRoom.label}
              onPick={(label: RoomLabel) => dispatch({ type: "SET_LABEL", at: ui.labelPickerAt as PointMm, label, roomPolygon: pickerRoom.polygon })}
              onClose={() => dispatch({ type: "CANCEL" })}
            />
          ) : (
            <div className="rounded border border-line bg-white px-2 py-1 text-xs text-fg-muted shadow-md">닫힌 방 안을 클릭해 주세요</div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftLine({ a, b }: { a: PointPx; b: PointPx }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={OVERLAY_COLOR.draft} strokeWidth={OVERLAY_STROKE_PX.draft} strokeDasharray="6 4" />;
}

/** 드래그 중 미리보기 — 문서는 놓을 때만 바뀌므로 화면에서만 옮겨 보인다 */
function dragGhost(document: TraceDocument, ui: TraceUiState): Pick<TraceWall, "a" | "b"> | null {
  const { drag } = ui;
  if (!drag || drag.kind === "opening") return null;
  const wall = document.walls.find((candidate) => candidate.id === drag.id);
  if (!wall) return null;
  const delta = { x: drag.to.x - drag.from.x, z: drag.to.z - drag.from.z };
  if (drag.kind === "wall") {
    return { a: { x: wall.a.x + delta.x, z: wall.a.z + delta.z }, b: { x: wall.b.x + delta.x, z: wall.b.z + delta.z } };
  }
  const horizontal = wall.a.z === wall.b.z;
  const moved = horizontal ? { x: wall[drag.end].x + delta.x, z: wall.a.z } : { x: wall.a.x, z: wall[drag.end].z + delta.z };
  return { ...wall, [drag.end]: moved };
}
