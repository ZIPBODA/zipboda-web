import { ZbBrandPrimary, ZbBrandOnPrimary, ZbRadiusFull, ZbSpace14, ZbSpace4, ZbFontSize14, ZbFontWeightBold } from "./tokens";

/**
 * 숫자 배지. 자릿수가 늘어도 글자가 잘리지 않도록 너비를 고정하지 않고 최소 너비와 좌우 여백으로 늘린다.
 * 카카오는 이 객체를 묶음 표시 div의 인라인 스타일로 그대로 넣는다.
 */
export const MAP_CLUSTER_STYLE = {
  minWidth: ZbSpace14,
  height: ZbSpace14,
  lineHeight: ZbSpace14,
  padding: `0 ${ZbSpace4}`,
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  borderRadius: ZbRadiusFull,
  background: ZbBrandPrimary,
  color: ZbBrandOnPrimary,
  textAlign: "center",
  fontSize: ZbFontSize14,
  fontWeight: String(ZbFontWeightBold)
};
