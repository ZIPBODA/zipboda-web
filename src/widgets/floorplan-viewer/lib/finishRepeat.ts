import { FINISH_ATLAS_REGIONS } from "../config/finishAtlas";
import type { FinishKind } from "../model/finish";
import type { TextureRepeat } from "./textureRepeat";

export function finishRepeat(kind: FinishKind, widthM = 1, heightM = 1): TextureRepeat {
  const region = FINISH_ATLAS_REGIONS[kind];
  return { x: widthM / region.tileM, y: heightM / (region.tileM * region.height / region.width) };
}
