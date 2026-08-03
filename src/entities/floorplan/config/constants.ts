import type { FloorplanViewMode, Viewpoint } from "../model/types";

export const VIEW_MODES: readonly FloorplanViewMode[] = ["2D", "3D"] as const;
export const DEFAULT_VIEW_MODE: FloorplanViewMode = "2D";

// ITF-013 시점(3D 뷰어)
export const VIEWPOINTS: readonly Viewpoint[] = ["1인칭", "3인칭"] as const;
export const DEFAULT_VIEWPOINT: Viewpoint = "1인칭";
