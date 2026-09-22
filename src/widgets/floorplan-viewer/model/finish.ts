import type { Texture } from "three";
import type { FINISH_ATLAS_REGIONS } from "../config/finishAtlas";

export type FinishKind = keyof typeof FINISH_ATLAS_REGIONS;
export type FinishTextures = Record<FinishKind, Texture | null>;
