import type { RoomLabel } from "@/entities/floorplan";

export const FINISH_ATLAS_URL = "/textures/RaenuabInternal_1K.png";
export const FINISH_ATLAS_SIZE = 1024;

// 원본 아틀라스의 이웃 재질·빈 영역을 제외한다. tileM은 이번 미리보기의 시각적 기준이다.
export const FINISH_ATLAS_REGIONS = {
  wallpaper: { x: 514, y: 258, width: 252, height: 252, tileM: 1 },
  flooring: { x: 0, y: 0, width: 512, height: 500, tileM: 2.4 },
  tile: { x: 768, y: 512, width: 256, height: 256, tileM: 2.4 },
  bathroomTile: { x: 512, y: 0, width: 512, height: 256, tileM: 4.8 },
  concrete: { x: 0, y: 512, width: 512, height: 512, tileM: 2 }
} as const;

export const ROOM_FINISH: Record<RoomLabel, keyof typeof FINISH_ATLAS_REGIONS> = {
  거실: "flooring", 침실: "flooring", 주방: "flooring", 식당: "flooring",
  욕실: "bathroomTile", 현관: "tile", 발코니: "concrete", 반침: "flooring",
  드레스룸: "flooring", 기타: "flooring"
};
