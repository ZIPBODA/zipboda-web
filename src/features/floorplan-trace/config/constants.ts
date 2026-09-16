import { NORMALIZE_GRID_MM, type RoomLabel } from "@/entities/floorplan";
import type { OpeningPreset, TraceTool } from "../model/types";

/**
 * 방 도출용 래스터 해상도(mm/px) = 스냅 격자의 절반.
 * 격자 위 벽 좌표가 정확히 픽셀 중심에 떨어지고, 방 윤곽(픽셀 모서리 ±12.5mm)은 격자 스냅으로 중심선 좌표를 되찾는다
 */
export const RASTER_MM_PER_PX = NORMALIZE_GRID_MM / 2;
/** 바깥 배경이 항상 테두리에 닿는 한 덩어리가 되도록 벽 bbox 둘레에 두는 여백(px) */
export const RASTER_MARGIN_PX = 2;
/**
 * 방을 도출할 래스터의 셀 상한(50m×50m). 넘으면 방을 내지 않는다.
 * 스케일을 잘못 입력하면 벽 좌표가 수십 배로 커지는데, 상한이 없으면 렌더 도중 수 GB를 잡다 탭이 죽는다
 */
export const MAX_RASTER_CELLS = 4_000_000;
/** 이보다 작은 닫힌 공간은 방이 아니라 벽 사이 틈이다 */
export const MIN_ROOM_M2 = 0.3;
/** 이보다 짧은 드래그는 벽이 아니라 클릭이다 */
export const MIN_WALL_LENGTH_MM = 100;
export const TRACE_EXTERIOR_WALL_MM = 150;
export const TRACE_INTERIOR_WALL_MM = 100;
/** 두께 0인 벽 = 경계선. 방을 가르지만(주방↔거실 바닥 마감 경계) 3D 벽으로는 세우지 않는다 */
export const BOUNDARY_THICKNESS_MM = 0;
/** 초안 방 폴리곤에서 경계선을 만들 때 이보다 짧은 변은 계단형 잡음이다 */
export const MIN_BOUNDARY_EDGE_MM = 300;
export const OPENING_PRESETS: Record<OpeningPreset["type"], number> = { door: 900, window: 1500 };
export const DEFAULT_OPENING_PRESET: OpeningPreset = { type: "door", widthMm: OPENING_PRESETS.door };
/**
 * 자동 초안의 벽 끝점이 이 거리 안에서 다른 벽에 못 미치면 닿게 늘린다.
 * 추출된 벽은 상대 벽의 면에서 끝나 중심선까지 두께 절반(외벽 최대 150mm)이 비고, 격자 스냅이 50mm를 더 벌린다.
 * 문 폭(600mm)보다는 작아야 개구부를 벽으로 메우지 않는다
 */
export const DRAFT_HEAL_TOLERANCE_MM = 200;
export const HISTORY_LIMIT = 100;
export const MANUAL_ROOM_CONFIDENCE = 1;
export const UNLABELED_ROOM_CONFIDENCE = 0.5;
export const ROOM_LABEL_OPTIONS: readonly RoomLabel[] = ["현관", "욕실", "주방", "식당", "거실", "침실", "발코니", "반침", "드레스룸", "기타"];
export const TOOL_SHORTCUTS: Record<string, TraceTool> = { v: "select", w: "wall", l: "label", o: "opening", c: "calibrate" };
export const BOUNDARY_TOGGLE_KEY = "b";
/** 작업 파일 형식 번호. 문서 모양이 바뀌면 올려서 옛 파일을 조용히 잘못 읽지 않게 한다 */
export const TRACE_FILE_VERSION = 1;
export const DEFAULT_TRACE_NAME = "floorplan";
export const CALIBRATION_POINTS = 2;
