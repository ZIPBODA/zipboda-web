/** zipboda-api API-031 평면도 상세 응답 원본 */
export interface FloorplanDetailDto {
  id: string;
  size: string | null;
  type: string | null;
  floor: string | null;
  unitNumber: string | null;
  exclusiveArea: number | null;
  image2dUrl: string | null;
  has2d: boolean;
  has3d: boolean;
  complexName: string;
  /** 이 도면을 보여 주는 공고 칸. 보여 줄 칸이 없으면 null */
  subscriptionId: string | null;
}
