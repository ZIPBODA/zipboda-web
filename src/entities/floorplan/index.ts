export { getFloorplan } from "./api/getFloorplan";
export { getFeaturedFloorplans } from "./api/getFeaturedFloorplans";
export { RoomSpecGrid } from "./ui/RoomSpecGrid";
export { FloorplanShowcaseCard } from "./ui/FloorplanShowcaseCard";
export {
  VIEW_MODES,
  DEFAULT_VIEW_MODE,
  VIEWPOINTS,
  DEFAULT_VIEWPOINT,
  CEILING_HEIGHT_M,
  WALL_THICKNESS_M,
  EYE_HEIGHT_M,
  WALK_SPEED_MPS,
  CAMERA_FOV,
  COLLISION_PADDING_M,
  DOOR_HEIGHT_M,
  WINDOW_SILL_M,
  WINDOW_TOP_M,
  MM_PER_M,
  ENTRANCE_LABEL,
  REACHABILITY_EXEMPT_UNLABELED_MAX_M2
} from "./config/constants";
export { resolveCollision, type SceneSegment } from "./lib/scene";
export {
  normalizeModel,
  snapToGrid,
  snapPolygonOrthogonal,
  dedupePolygon,
  polygonAreaMm2,
  polygonAreaM2,
  polygonBBox,
  wallLength,
  mergeCollinearWalls,
  validateScale,
  validateArea,
  validateTiling,
  rectilinearIntersectionArea,
  validateOpenings,
  checkReachability,
  computeConfidence,
  type BBox
} from "./lib/normalize";
export type {
  Floorplan,
  FloorplanShowcase,
  FloorplanRoom,
  FloorplanViewMode,
  Viewpoint,
  PointMm,
  RoomLabel,
  Room2D,
  Wall2D,
  OpeningType,
  Opening2D,
  FixtureType,
  Fixture2D,
  DimensionChain,
  ScaleSource,
  FloorplanModel2D,
  NormalizeFlagCode,
  NormalizeFlag,
  NormalizeResult
} from "./model/types";
