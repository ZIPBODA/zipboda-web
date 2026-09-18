// 이 파일은 scripts/promote-housing-models.ts가 생성한다. 손으로 고치지 말고 스크립트로 등록·해제한다.
import type { FloorplanModel2D, ReviewedModelEntry } from "../../model/types";
import manifest from "./reviewed.json";
import m_dobong_banghak_2_3_01 from "./dobong-banghak-2-3-01.model2d.json";
import m_dobong_banghak_2_3_02 from "./dobong-banghak-2-3-02.model2d.json";
import m_gangnam_gaepo_2_3_01 from "./gangnam-gaepo-2-3-01.model2d.json";
import m_gangnam_gaepo_2_3_02 from "./gangnam-gaepo-2-3-02.model2d.json";
import m_gangnam_gaepo_2_3_03 from "./gangnam-gaepo-2-3-03.model2d.json";
import m_gangnam_gaepo_2_3_04 from "./gangnam-gaepo-2-3-04.model2d.json";
import m_gangnam_gaepo_4_402 from "./gangnam-gaepo-4-402.model2d.json";
import m_gangseo_hwagok_2_201 from "./gangseo-hwagok-2-201.model2d.json";
import m_gangseo_hwagok_2_203 from "./gangseo-hwagok-2-203.model2d.json";
import m_gwanak_sillim_2_3_01 from "./gwanak-sillim-2-3-01.model2d.json";
import m_gwanak_sillim_2_3_03 from "./gwanak-sillim-2-3-03.model2d.json";
import m_jungnang_myeonmok_2_3_01 from "./jungnang-myeonmok-2-3-01.model2d.json";
import m_jungnang_myeonmok_2_3_03 from "./jungnang-myeonmok-2-3-03.model2d.json";
import m_songpa_ogeum_2_3_01 from "./songpa-ogeum-2-3-01.model2d.json";
import m_songpa_ogeum_2_3_02 from "./songpa-ogeum-2-3-02.model2d.json";
import m_songpa_ogeum_2_3_03 from "./songpa-ogeum-2-3-03.model2d.json";
import m_songpa_ogeum_4_401 from "./songpa-ogeum-4-401.model2d.json";
import m_songpa_ogeum_4_402 from "./songpa-ogeum-4-402.model2d.json";
import m_songpa_ogeum_5_501 from "./songpa-ogeum-5-501.model2d.json";
import m_songpa_ogeum_5_502 from "./songpa-ogeum-5-502.model2d.json";

/** 검수를 통과해 3D로 내보내는 모델. 여기 없는 layout은 2D만 제공한다 */
export const REVIEWED_MODELS: Record<string, FloorplanModel2D> = {
  "dobong-banghak-2-3-01": m_dobong_banghak_2_3_01 as FloorplanModel2D,
  "dobong-banghak-2-3-02": m_dobong_banghak_2_3_02 as FloorplanModel2D,
  "gangnam-gaepo-2-3-01": m_gangnam_gaepo_2_3_01 as FloorplanModel2D,
  "gangnam-gaepo-2-3-02": m_gangnam_gaepo_2_3_02 as FloorplanModel2D,
  "gangnam-gaepo-2-3-03": m_gangnam_gaepo_2_3_03 as FloorplanModel2D,
  "gangnam-gaepo-2-3-04": m_gangnam_gaepo_2_3_04 as FloorplanModel2D,
  "gangnam-gaepo-4-402": m_gangnam_gaepo_4_402 as FloorplanModel2D,
  "gangseo-hwagok-2-201": m_gangseo_hwagok_2_201 as FloorplanModel2D,
  "gangseo-hwagok-2-203": m_gangseo_hwagok_2_203 as FloorplanModel2D,
  "gwanak-sillim-2-3-01": m_gwanak_sillim_2_3_01 as FloorplanModel2D,
  "gwanak-sillim-2-3-03": m_gwanak_sillim_2_3_03 as FloorplanModel2D,
  "jungnang-myeonmok-2-3-01": m_jungnang_myeonmok_2_3_01 as FloorplanModel2D,
  "jungnang-myeonmok-2-3-03": m_jungnang_myeonmok_2_3_03 as FloorplanModel2D,
  "songpa-ogeum-2-3-01": m_songpa_ogeum_2_3_01 as FloorplanModel2D,
  "songpa-ogeum-2-3-02": m_songpa_ogeum_2_3_02 as FloorplanModel2D,
  "songpa-ogeum-2-3-03": m_songpa_ogeum_2_3_03 as FloorplanModel2D,
  "songpa-ogeum-4-401": m_songpa_ogeum_4_401 as FloorplanModel2D,
  "songpa-ogeum-4-402": m_songpa_ogeum_4_402 as FloorplanModel2D,
  "songpa-ogeum-5-501": m_songpa_ogeum_5_501 as FloorplanModel2D,
  "songpa-ogeum-5-502": m_songpa_ogeum_5_502 as FloorplanModel2D,
};

/** 검수 모델의 출처·방법·크롭 원점 — 개발 검수 화면이 2D 위에 모델을 겹칠 때 쓴다 */
export const REVIEWED_MODEL_MANIFEST = manifest as ReviewedModelEntry[];
