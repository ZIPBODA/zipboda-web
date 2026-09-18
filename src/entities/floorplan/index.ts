export { getFloorplan } from "./api/getFloorplan";
export { HOUSING_FLOORPLANS } from "./api/housingFloorplans";
export { REVIEWED_MODELS, REVIEWED_MODEL_MANIFEST } from "./api/models";
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
  REACHABILITY_EXEMPT_UNLABELED_MAX_M2,
  NORMALIZE_GRID_MM,
  POINT_MERGE_TOLERANCE_MM,
  ROOM_MIN_AREA_RATIO,
  DOUGLAS_PEUCKER_EPSILON_PX,
  AREA_TOLERANCE,
  AUTO_ACCEPT_CONFIDENCE
} from "./config/constants";
export { resolveCollision, distanceToSegment, COLLISION_MIN_DISTANCE_M, type SceneSegment } from "./lib/scene";
export { findRoomRegions, labelRoomRegions, interiorRegions } from "./lib/roomRegions";
export { traceRegionOutline, type RegionTest } from "./lib/regionOutline";
export { simplifyPolyline } from "./lib/douglasPeucker";
export { pointInPolygon, polygonCentroid, polygonInteriorPoint, cleanOrthogonalPolygon } from "./lib/polygon";
export {
  normalizeModel,
  snapToGrid,
  snapPolygonOrthogonal,
  dedupePolygon,
  polygonAreaMm2,
  polygonAreaM2,
  polygonBBox,
  wallLength,
  exclusiveAreaBounds,
  exclusiveAreaDeviation,
  type ExclusiveAreaBounds,
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
  ReviewedModelEntry,
  Floorplan,
  FloorplanShowcase,
  FloorplanRoom,
  FloorplanViewMode,
  Viewpoint,
  PointMm,
  PointPx,
  MaskImage,
  RoomRegion,
  LabeledRegions,
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
