import { AREA_DISPLAY_DECIMALS, SIZE_CHIP_LIMIT } from "../config/constants";

export const formatAreaValue = (area: number): string => String(Number(area.toFixed(AREA_DISPLAY_DECIMALS)));

export const formatArea = (area: number): string => `${formatAreaValue(area)}㎡`;

/** 반올림해 같아진 면적은 하나로 보이고, 넘치는 칩은 '+n' 하나로 줄인다 */
export const sizeChipLabelsOf = (sizes: readonly number[]): string[] => {
  const labels = [...new Set(sizes.map(formatArea))];
  if (labels.length <= SIZE_CHIP_LIMIT) return labels;
  return [...labels.slice(0, SIZE_CHIP_LIMIT), `+${labels.length - SIZE_CHIP_LIMIT}`];
};
