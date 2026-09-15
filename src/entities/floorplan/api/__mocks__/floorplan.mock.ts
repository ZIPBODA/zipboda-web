import type { Floorplan, FloorplanModel2D } from "../../model/types";
import extractedModel from "./fp-test2.model2d.json";

/**
 * 도면 이미지 → 2D 모델은 사람이 옮겨 적지 않는다. 아래 모델은 추출 파이프라인이
 * public/mock/test2.jpg(LH 33㎡)로 만든 결과를 그대로 저장한 것이다.
 * 재생성: /dev/floorplan-review 에서 해당 이미지로 추출 → 모델 JSON 저장.
 *
 * 계획서대로 뷰어는 저장된 모델만 읽는다(추출 WASM을 뷰어 번들에 싣지 않는다).
 * TODO(API-031): 실 API 연동 시 이 파일을 제거하고 저장된 모델을 서버에서 받는다(A1).
 */
const FP_TEST2_MODEL = extractedModel as FloorplanModel2D;

// figma 135:5097 평면도 방별 치수. TODO(API-031): 실 API 연동 시 mock 전량 제거(A1)
export const MOCK_FLOORPLANS: Floorplan[] = [
  {
    id: "fp-84a",
    subscriptionId: "1",
    size: 84,
    type: "A",
    has3d: true,
    image2dUrl: "/mock/floorplans/fp-test2.png",
    rooms: [
      { name: "거실 / 식당", dimensions: "5.2 × 4.8m", area: "24.96㎡" },
      { name: "안방", dimensions: "5.2 × 3.7m", area: "19.24㎡" },
      { name: "주방", dimensions: "5.4 × 3.2m", area: "17.28㎡" },
      { name: "침실 2", dimensions: "3.1 × 3.2m", area: "9.92㎡" },
      { name: "침실 3", dimensions: "5.4 × 2.0m", area: "10.80㎡" },
      { name: "욕실 ×2", dimensions: "2.2 × 2.0m", area: "8.80㎡" }
    ],
    model2d: FP_TEST2_MODEL
  }
];
