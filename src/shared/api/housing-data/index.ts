import catalog from "./catalog.json";

/**
 * 서울 LH 현황도에서 뽑은 도면 자산(호별 도면 이미지·자르기 영역·축척). 공고·단지 정보는 API가 주고,
 * 도면 이미지·3D 모델은 관리자 업로드(S4 API-122) 전까지 여기서 읽는다. id는 API 단지 id, layoutKey는 API 도면 id와 같다
 */
export const HOUSING_SOURCE_DATA = catalog;
