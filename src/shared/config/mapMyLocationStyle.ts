import { ZbStatusInfo } from "./tokens";

/**
 * 휴대폰이 알려준 위치 오차 반경. 그 안의 지도와 공고가 비쳐 보이도록 옅게 칠한다
 * (배경 불투명 원칙의 예외 — 사용자가 '옅은 파란 원'으로 정했다).
 */
export const MAP_ACCURACY_CIRCLE_STYLE = {
  strokeWeight: 1,
  strokeColor: ZbStatusInfo,
  strokeOpacity: 0.4,
  fillColor: ZbStatusInfo,
  fillOpacity: 0.12
} as const;
