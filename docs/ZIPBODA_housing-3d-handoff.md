# 집보다 — 현황도 3D 전환 인수인계

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 집보다 현황도 3D 전환 인수인계 |
| 버전 | v1.3.0 |
| 작성일 | 2026-09-18 |
| 기반 문서 | docs/ZIPBODA_codex-context.md, docs/ZIPBODA_codex-workflow.md, AGENTS.md, src/shared/api/housing-data/catalog.json, data/housing-extraction/validation.json, CLAUDE.md |

### 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0.0 | 2026-09-18 | Claude | 현황도 → 2D 모델 → Three.js 3D 전환 작업 결과, 등록 모델 6건, 남은 60건 분류와 재개 절차 작성 |
| v1.1.0 | 2026-09-18 | Codex | 독립 트레이싱 5건 추가 등록, 송파 304호 초안 보류, 평형·탭 스크롤 유지 수정, 재현 가능한 원본·브라우저 검증 도구 추가 |
| v1.2.0 | 2026-09-18 | Claude | 강남개포 2~3층 302·303·304호 등록(총 14건), 방 이름 타입 위반 수정, 경계선 격자 정렬 규칙 기록, 송파 304호 치수 근거 보강 |
| v1.3.0 | 2026-09-18 | Claude | 송파오금 6개 평형 등록(총 20건), 등록 누락 2건 재등록, 같은 타입 평형의 크롭별 실측 환산 도구 추가 |

---

## 2. 작업 범위와 현재 상태

LH·SH 현황도에서 뽑은 2D 평면 데이터를 `FloorplanModel2D`로 만들어 기존 Three.js·R3F 뷰어에서 3인칭·1인칭으로 볼 수 있게 하는 작업이다. v1.1에서는 상세 화면의 평형·탭 전환 시 스크롤 유지도 수정했다. 3D 엔진과 UI 디자인은 유지했다.

| 항목 | 값 |
|------|-----|
| 카탈로그 layout | 66 (9개 주택) |
| 3D 노출 layout | 20 |
| 자동 추출 초안 중 승격 기준 통과 | 0 |
| 남은 layout | 46 (자동 추출 기준 needs-review 18, blocked 28) |

운영 빌드에서 3D는 `REVIEWED_MODELS`에 등록된 layout에만 켜진다. 나머지는 2D 크롭만 제공한다. 이 정책은 `src/widgets/floorplan-viewer/lib/reviewedModels.test.ts`가 고정한다.

---

## 3. 파이프라인과 명령

```
PDF(public/reference)
  → scripts/prepare-housing-sources.py            크롭 PNG + catalog.json(mmPerPx)
  → /dev/floorplan-review?batch=1                 브라우저 일괄 추출 → data/housing-extraction/report.json
  → scripts/validate-housing-drafts.ts            승격 판정·원인 분류 → data/housing-extraction/validation.json
  → scripts/trace-housing-layout.ts               실측 명세(JSON) → FloorplanModel2D
  → scripts/promote-housing-models.ts             재판정 후 등록 → entities/floorplan/api/models/
  → HOUSING_FLOORPLANS.model2d / has3d → buildScene → Scene3D
```

TypeScript 스크립트는 `@/` 별칭 해석을 위해 래퍼로 실행한다.

```bash
node scripts/run-ts.cjs scripts/validate-housing-drafts.ts
node scripts/run-ts.cjs scripts/trace-housing-layout.ts <spec.json>
node scripts/run-ts.cjs scripts/promote-housing-models.ts --layout <key> --from <model.json> \
  --method traced --reviewer "<이름>" --origin <x,y> --note "<근거>"
node scripts/run-ts.cjs scripts/promote-housing-models.ts --reindex   # index.ts만 재생성
```

트레이싱 명세 형식은 모두 mm이고 크롭 이미지 좌상단이 원점이다. 방 폴리곤은 적지 않는다. 벽에서 자동으로 도출된다.

```json
{
  "layoutKey": "songpa-ogeum-2-3-01",
  "walls": [{ "a": [1495, 87], "b": [7074, 87], "thicknessMm": 200 }],
  "labels": [{ "at": [4500, 2500], "label": "거실" }],
  "openings": [{ "wall": 5, "alongMm": 833, "type": "door", "widthMm": 900 }],
  "dimensionChains": [{ "axis": "x", "values": [1800, 5100] }]
}
```

---

## 4. 완료한 작업

### 4.1 등록한 3D 모델 6건

최초 등록한 6건이다. 모두 PDF 인쇄 치수선을 실측해 트레이싱했고, 등록 시점에 승격 기준을 다시 통과했다. 정규화 검증 점수 1.00, 스케일 출처 `dimension-chain`, 씬 검증 지적 0건이다. 검증 점수는 실측 정확도 100%를 뜻하지 않는다.

| layoutKey | 주택 | 근거 |
|---|---|---|
| gangnam-gaepo-2-3-01 | 강남개포 | 치수 2,300+2,200 / 4,400+1,700+1,300. 보정값 오류 수정(아래 4.3) |
| songpa-ogeum-2-3-01 | 송파오금 | 치수 1,800+5,100 |
| gwanak-sillim-2-3-01 | 관악신림 | 치수 3,400 / 4,500+1,200 |
| dobong-banghak-2-3-01 | 도봉방학 | 치수 1,200+2,500+1,450 |
| gangseo-hwagok-2-201 | 강서화곡 | 치수 1,800+1,425 |
| jungnang-myeonmok-2-3-01 | 중랑면목 | 치수 3,150 / 1,200+4,650 |

검증 방법은 세 가지다. 크롭 이미지 위 오버레이 눈검사, `evaluateModelFor3d` 통과, 헤드리스 브라우저에서 3인칭·1인칭 렌더 확인(콘솔 오류 0).

### 4.2 코드 변경

- **승격 게이트** `src/widgets/floorplan-viewer/lib/reviewGate.ts`. 정규화 결함, 신뢰도 0.85 미만, 벽 4개 미만, 문 없음, 면적 편차 5% 초과, 씬 결함을 사유로 모아 `reviewed | needs-review | blocked`를 판정한다. 새 기하 규칙을 만들지 않고 기존 `normalizeModel`과 씬 검증을 합쳐 쓴다.
- **씬 검증** `src/widgets/floorplan-viewer/lib/validateScene.ts`. `buildScene` 결과에서 비유한 좌표, 벽·바닥 퇴화, 스폰이 바닥 밖이거나 벽 속, 비정상 경계를 잡는다.
- **면적 판정** `src/entities/floorplan/lib/normalize.ts`의 `exclusiveAreaBounds`, `exclusiveAreaDeviation`. 전용면적 산정 기준이 도면마다 벽 중심선이거나 안목치수라, 인쇄 면적이 두 환산값 사이면 정합으로 본다. 게이트와 정규화가 같은 함수를 쓴다.
- **트레이서** `assembleTraceModel`에서 사람이 이름을 붙인 1.5㎡ 이하 공간은 방으로 남긴다. 이름 없는 PS만 제외한다.
- **출처 기록** `src/entities/floorplan/api/models/reviewed.json`과 `REVIEWED_MODEL_MANIFEST`. layout별 방법, 검토자, 일시, 근거, 크롭 원점을 남긴다.
- **개발 검수 화면** `/dev/floorplan-review?layout=<layoutKey>`. 2D 원본, 모델 오버레이, 3D 미리보기를 나란히 놓고 property·전용면적·스케일 출처·원천 이슈·검수 상태·플래그·판정 사유를 보여준다. 미등록 layout은 이 화면에서 초안 추출을 돌릴 수 있다.
- **일괄 추출 화면** 건별로 브라우저 저장소에 결과를 남겨, 소스 저장으로 화면이 새로 고쳐져도 이어서 돈다. 66건 한 바퀴에 20~30분 걸린다.

### 4.3 데이터 수정

- 강남개포 2~3층 보정값을 `[3000, 90]`에서 `[3000, 86]`으로 고쳤다. 인쇄 치수 2,300+2,200=4,500과 크롭 실측이 4.6% 어긋나 있었다. `scripts/prepare-housing-sources.py`와 `catalog.json` 양쪽에 반영했다.
- 성동용답 3건에 원천 이슈를 기록했다. 치수 체인과 크롭 실측 외곽이 2~4% 불일치한다.

### 4.4 검증 결과

타입체크 통과, 린트 통과(개발 화면 `<img>` 경고 2건, 오류 0), 테스트 71파일 472건 통과, `next build` 성공(개발 라우트 미포함).

---

### 4.5 2026-09-18 Codex 후속 작업

다음 5건을 각 원본 PDF의 치수·벽·개구부로 독립 트레이싱했다. 기존 모델을 반전하거나 면적만 바꾸어 복제하지 않았다. 원본 크롭 위 오버레이를 확인하고 승격 게이트를 다시 통과한 모델을 등록했다.

| layoutKey | 확인한 인쇄 치수(mm) | 추가 확인 |
|---|---|---|
| dobong-banghak-2-3-02 | x: 1100+1800+700, z: 1200+2550+1450 | 202호 욕실·발코니·현관문 |
| gangseo-hwagok-2-203 | x: 1100+2200, z: 1050+3700 | 203호 보일러실·욕실·문·창 |
| gwanak-sillim-2-3-03 | x: 3300, z: 4500+1200 | 나형 3호 욕실·발코니·문·창 |
| gangnam-gaepo-4-402 | x: 6000+2200 | 402호 보일러실·욕실·현관 옆 PS 벽 |
| jungnang-myeonmok-2-3-03 | x: 3050, z: 4800+1200 | 3호 욕실·발코니·현관문 |

`data/housing-traces/`에 이번 6건의 명세와 생성 모델, `review.json`에 PDF 해시·페이지·검토 결과를 보관한다. 최초 등록 6건의 명세도 `C:/tmp/zb-specs`에서 복사해 보존했다. 여섯 번째 신규 명세인 `songpa-ogeum-2-3-04`는 z축 인쇄 합 3300mm와 정규화 외곽 3400mm가 달라 **needs-review**로 남겼다. 보정값이나 검증 임계값을 통과 목적으로 바꾸지 않았다. `data/housing-extraction/validation.json`은 자동 추출 초안을 판정하므로 이 수기 초안의 판정은 `data/housing-traces/review.json`을 함께 확인한다.

재현 도구:

```bash
python scripts/housing-evidence.py <layoutKey> --pad 100
python scripts/housing-evidence.py <layoutKey> --model <model.json> --origin <x,y>
node scripts/verify-housing-browser.cjs <layoutKey> [<layoutKey> ...]
```

PDF 도구는 PyMuPDF·Pillow가 필요하며, 기존 `tmp/pdf-tools` 설치 경로도 읽는다. 브라우저 도구는 3001의 현재 프로젝트 dev 서버와 9222의 Chrome CDP에 연결해 독립 탭을 열고 끝나면 해당 탭만 닫는다. 검증 이미지·결과는 `tmp/housing-review/`에 저장한다. 외부 `C:/tmp` 경로에 쓰지 않는다.

검증 결과는 아래 §9에 기록한다.

---

### 4.6 2026-09-18 Claude 후속 작업

강남개포 2~3층의 남은 세 평형을 각각 원본 치수와 크롭 벽 중심선으로 독립 트레이싱해 등록했다. 같은 층 도면이지만 거울상 복제를 하지 않고 평형마다 벽·개구부를 따로 실측했다.

| layoutKey | 확인한 인쇄 치수(mm) | 추가 확인 |
|---|---|---|
| gangnam-gaepo-2-3-02 | x: 3000+1300+2800 | 침실·보일러실·욕실·현관, 상단 창 2개와 좌측 창 |
| gangnam-gaepo-2-3-03 | x: 2800+1300+3000 | 침실·보일러실·욕실·현관, 상단 창 2개와 우측 창 |
| gangnam-gaepo-2-3-04 | x: 2200+2300, z: 4400+1700+1300 | 현관·욕실·보일러실, 좌측 외벽 현관문 탐침(3016~4104) |

이 과정에서 세 가지를 바로잡았다.

- **방 이름 타입 위반**: v1.1에서 등록한 `gangnam-gaepo-4-402`, `gangseo-hwagok-2-203`과 명세 `songpa-ogeum-2-3-04`가 `RoomLabel`에 없는 `보일러실`을 쓰고 있었다. 모델 JSON은 `as FloorplanModel2D`로 단언해 읽어 타입 검사가 잡지 못한다. 열거형에 있는 `기타`로 바꾸고 모델을 다시 생성했다. 새로 만든 세 건도 같은 규칙을 따른다.
- **경계선 격자 정렬**: 두께 0 경계선은 **모델 좌표(크롭 좌표 − 외곽 최소점)가 50mm 격자에 맞아야** 한다. 어긋나면 래스터에서 50mm 폭의 빈 띠가 생겨 두 방의 경계가 같은 선에 놓이지 않고, 개방 경계 판정이 실패해 `unreachable-room`이 뜬다. 302호에서 처음 확인했고 5000mm로 옮겨 해결했다.
- **송파 304호 치수 근거**: 인쇄 z 체인(700+2600=3300)과 크롭 벽 중심선 실측(상단 띠 중심 152mm, 하단 띠 중심 3521mm → 3369mm)이 69mm 어긋난다. x 체인(5300+2100)과 면적은 맞으므로 기하 오류가 아니라 z 체인이 외곽과 다른 기준선을 잰 것으로 보이지만, 근거를 더 확인하기 전까지 체인을 지우지 않고 **needs-review로 유지**했다.

---

### 4.7 2026-09-18 송파오금동 일괄 작업

사용자가 정한 우선순위에 따라 송파오금동 미착수 7건 중 6건을 등록했다. 송파는 벽을 굵은 검정 면으로 칠해 크롭에서 벽 중심선을 그대로 읽을 수 있고, 인쇄 치수 체인도 선명하다.

| layoutKey | 방법 | 근거 |
|---|---|---|
| songpa-ogeum-2-3-02 | 크롭 직접 실측 | 치수 1800+5100(x), 굵은 벽 선 10개 |
| songpa-ogeum-4-402 | 302호 타입, 크롭별 환산 | 402호 크롭 실측선 10개, 잔차 최대 14mm |
| songpa-ogeum-5-502 | 302호 타입, 크롭별 환산 | 3쪽 502호 실측선 10개, 잔차 최대 14mm |
| songpa-ogeum-4-401 | 301호 타입, 크롭별 환산 | 401호 실측선 8개, 잔차 최대 6mm |
| songpa-ogeum-5-501 | 301호 타입, 크롭별 환산 | 3쪽 501호 실측선 8개, 잔차 최대 4mm |
| songpa-ogeum-2-3-03 | 크롭 직접 실측 | 외곽 8선·내벽 2선, 현관은 PDF 문 호 위치 |

같은 타입이 층을 바꿔 반복되는 경우에도 기존 모델을 복사하지 않았다. `C:/tmp/fitspec.py`가 대상 크롭에서 굵은 벽 런을 다시 찾아 축별 1차식(배율·오프셋)을 최소제곱으로 맞추고, 짝지은 선의 잔차를 함께 출력한다. 잔차가 크면 같은 타입이 아니므로 직접 실측한다. 6건 모두 오버레이 눈검사를 거쳤다.

크롭 마스크가 복도 쪽 벽을 잘라 현관문이 보이지 않는 평형이 있다. 그 경우 원본 PDF에서 문 호의 위치를 읽어 배치하고 근거를 등록 기록에 남겼다.

v1.2에서 명세만 고치고 재등록을 빠뜨려 `gangnam-gaepo-4-402`와 `gangseo-hwagok-2-203`이 타입에 없는 방 이름을 그대로 들고 있었다. 두 건을 다시 등록했고, 지금은 등록 모델과 명세 전체에서 타입 위반이 0건이다.

**남은 송파 1건**: `songpa-ogeum-4-403`은 크롭 마스크 안에 베란다(6.22㎡)가 함께 들어 있어 거주 공간과의 경계를 크롭만으로 확정하지 못했다. 외곽 실측 면적 31.2㎡는 전용 24.585 + 베란다 6.22와 맞지만, 어느 구역이 베란다인지 원본에서 다시 확인해야 한다.

---

## 5. 변경 파일

### 5.1 이번 작업에서 추가

```
scripts/run-ts.cjs
scripts/validate-housing-drafts.ts
scripts/promote-housing-models.ts
scripts/trace-housing-layout.ts
src/entities/floorplan/api/models/          6개 model2d.json + reviewed.json + index.ts(생성물)
src/widgets/floorplan-viewer/lib/reviewGate.ts (+ .test.ts)
src/widgets/floorplan-viewer/lib/validateScene.ts (+ .test.ts)
src/widgets/floorplan-viewer/lib/reviewedModels.test.ts
src/app/dev/floorplan-review/LayoutQa.tsx
src/app/dev/floorplan-review/layoutQa.constants.ts
data/housing-extraction/validation.json
docs/ZIPBODA_housing-3d-handoff.md
```

### 5.2 이번 작업에서 수정

```
src/entities/floorplan/lib/normalize.ts          면적 구간 판정, 돌기 폴리곤 정리
src/entities/floorplan/lib/polygon.ts            cleanOrthogonalPolygon 이전
src/entities/floorplan/lib/scene.ts              distanceToSegment, 충돌 최소거리 상수
src/entities/floorplan/model/types.ts            ReviewedModelEntry
src/entities/floorplan/index.ts                  공개 API 추가
src/features/floorplan-trace/lib/assembleTraceModel.ts
src/features/floorplan-trace/lib/deriveLayout.ts (lib/cleanPolygon.ts 삭제)
src/widgets/floorplan-viewer/config/constants.ts 승격 임계값
src/widgets/floorplan-viewer/index.ts            공개 API 추가
src/app/dev/floorplan-review/BatchExtraction.tsx 이어 돌기, 진단 통계
src/app/dev/floorplan-review/ReviewWithPreview.tsx
src/shared/api/housing-data/catalog.json         강남 보정값, 용답 이슈
scripts/prepare-housing-sources.py               위와 동일 반영
data/housing-extraction/report.json              66건 재추출
```

`git status`의 나머지 변경(청약 상세·목록·가점 화면, `extractFloorplan.ts`, `getFloorplan.ts`, `AGENTS.md`, `public/housing`, `public/reference`, `tmp/`)은 이전 Codex 작업분이며 이번에 건드리지 않았다.

### 5.3 v1.1 후속 작업 변경

- `src/widgets/subscription-detail/ui/DetailInfoPanel.tsx`, `MobileSubscriptionDetail.tsx`: 평형·탭 링크 스크롤 유지.
- `vitest.setup.ts`: Next Link 전용 `scroll` prop을 테스트 DOM에 전달하지 않도록 대역 보완.
- `src/entities/floorplan/api/models/`: 모델 5건, 등록 목록·출처 갱신.
- `data/housing-traces/`: 12건의 트레이싱 명세, 신규 생성 모델 6건, 원본 검토 및 브라우저 검증 결과.
- `scripts/housing-evidence.py`, `scripts/verify-housing-browser.cjs`: 원본·오버레이·반응형 탐색·3D 렌더 검증 도구.
- `data/housing-extraction/validation.json`, 본 문서: 등록 11건과 남은 55건 현황 갱신.

### 5.4 v1.2 후속 작업 변경

- `data/housing-traces/`: 강남개포 302·303·304호 명세와 모델 3건 추가.
- `src/entities/floorplan/api/models/`: 모델 3건 추가, `gangnam-gaepo-4-402`·`gangseo-hwagok-2-203` 방 이름 수정, 등록 목록·출처 갱신.
- `data/housing-extraction/validation.json`, 본 문서: 등록 14건과 남은 52건 현황 갱신.

---

## 6. 남은 작업

### 6.1 3D layout 확장 (46건)

| property | 총 | 3D | 미등록 needs-review | 미등록 blocked | 남은 것의 성격 |
|---|---|---|---|---|---|
| songpa-ogeum | 10 | 7 | 2 | 1 | 403호(베란다 분리 확인 필요), 304호(치수 기준 불일치), 503호(대각 외벽) |
| gangnam-gaepo | 9 | 5 | 4 | 0 | 4층 401·403호, 5층 501호 미착수, 502호 원천 미확정 |
| gangseo-hwagok | 9 | 2 | 3 | 4 | 7건 미착수 |
| gwanak-sillim | 8 | 2 | 5 | 1 | 6건 미착수 |
| dobong-banghak | 6 | 2 | 2 | 2 | 4건 미착수 |
| jungnang-myeonmok | 7 | 2 | 2 | 3 | 3건 미착수, 4층 2건 원천 미확정 |
| seocho-iris | 14 | 0 | 0 | 14 | 실측 근거 없음 |
| seongdong-yongdap | 3 | 0 | 0 | 3 | 회전·저해상 스캔 |
| jungnang-muk | 0 | 0 | 0 | 0 | layout 없음 |

layout별 상세 사유는 `data/housing-extraction/validation.json`의 `cause`, `draftReasons`에 있다. 확장은 §3의 트레이싱 절차를 layout마다 반복한다. 한 건당 치수 확인, 명세 작성, 오버레이 눈검사가 필요하다.

수용 기준은 `evaluateModelFor3d`가 `reviewed`를 돌려주고, 오버레이가 크롭의 벽·방·문 위치와 맞고, 3D와 1인칭이 콘솔 오류 없이 뜨는 것이다.

### 6.2 손댈 수 없는 원천 (사용자 확인 필요)

- **서초 아이리스 14건**: 전용면적과 실측 치수가 도면에 없다. 스케일 근거가 생기기 전에는 2D 전용이다.
- **성동 용답동 3건**: 치수 체인과 실측 외곽이 2~4% 어긋나고 회전·저해상 스캔이다. 벽 위치 ±100mm를 보장할 수 없다.
- **중랑 묵동**: 사용자 주소(묵동 245-39)와 PDF 본문(묵동 173-27)이 다르다. layout 0건.
- **강남 5층 502호 / 면목 401·402호 / 송파 503호**: 도면과 면적표의 호수·색상 대응이 확정되지 않았거나 외벽이 대각이다. 추측하지 말고 `needs-review`로 둔다.

### 6.3 자동 추출 개선 (선택)

현황도 벽이 해치(빗금)라 잉크 기반 두께 측정이 12~36mm로 나오고, 벽 판정 기준 60mm에 못 미쳐 버려진다. 이것이 `wall-extraction` 23건의 원인이다. 채도 기반 완화를 시도했으나 기존 `fp-test2` 회귀가 생겨 되돌렸다(방 7→6, 벽 22→24). 해치 영역을 먼저 메운 뒤 두께를 재는 접근이 남아 있다.

`geometry` 17건은 래스터 외곽의 자기교차다. `cleanOrthogonalPolygon`으로 상당수 줄였으나 남은 건은 방 영역이 끊겨 생긴다.

### 6.4 미해결 UI 결함

평형·탭 전환 스크롤 튐은 수정했다. `DetailInfoPanel.tsx`의 평형 링크와 `MobileSubscriptionDetail.tsx`의 평형·탭 링크에 `scroll={false}`를 적용했다. 360·767·768·1280px 평형 전환, 360·767px 모바일 탭 전환에서 스크롤 좌표 유지와 문서 리로드 없음이 확인됐다.

768px에서 페이지 scrollWidth가 827px인 기존 가로 넘침을 발견했다. 스크린샷에서 공통 헤더 오른쪽 액션 영역이 잘린다. 공통 헤더는 이번 변경 대상에 포함하지 않았으며 별도 반응형 검토가 남았다.

상세 페이지가 동적 서버 컴포넌트라 평형 전환마다 트리 전체가 교체되어 평면도 뷰어가 다시 마운트된다. 이것까지 없애려면 평형 선택을 클라이언트 상태로 옮겨야 하는데, URL을 상태로 쓰는 현재 규칙과 충돌하므로 사용자 결정이 필요하다.

### 6.5 정리할 것

- 커밋과 푸시는 사용자 승인 전이라 하지 않았다. 스테이징 시 `.mcp.json`, `.npmrc`, `public/mock/temp.png`, `public/mock/*.pdf`는 제외한다. `git add -A`를 쓰지 않는다.
- 원본 치수선·오버레이 렌더와 브라우저 검증은 `scripts/housing-evidence.py`, `scripts/verify-housing-browser.cjs`로 재현할 수 있다. 최초 6건 명세는 `data/housing-traces/`에도 복사했다. 기존 `C:/tmp` 도구와 원본은 보존했다. 눈금 탐침·배치 보조 도구는 아직 외부 경로에 있다.

---

## 7. 금지 사항

사용자가 명시한 제약이다.

- 검토 없이 초안을 `reviewed`로 바꾸지 않는다.
- PDF를 보지 않고 벽 좌표를 추측하지 않는다.
- 기존 `fp-test2` 기하를 복사하거나, 같은 기하를 여러 주택에 재사용하거나, 면적만 바꿔 복제하지 않는다.
- 수작업 mesh, 외부 모델링 결과물, 가짜 방·벽·개구부를 만들지 않는다.
- 새 3D 엔진을 도입하지 않고, 청약 상세 데이터를 보강하지 않으며, 관련 없는 리팩터링을 하지 않는다.

---

## 8. 실행 환경

| 항목 | 값 |
|------|-----|
| dev 서버 | 3001 고정. 3000은 다른 프로젝트 서버라 종료하지 않는다 |
| 빌드 | `BUILD_DIST_DIR=.next-build pnpm build` 후 `tsconfig.json` 되돌리고 `.next-build` 삭제 |
| 시각 검증 | Playwright 없음. 헤드리스 Chrome + CDP(9222), SwiftShader 플래그로 WebGL 렌더 |
| 게이트 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` |

---

## 9. v1.1 검증 결과와 한계

검증 브랜치는 `fix/floorplan-engine-integrity`, 브라우저 주소는 `http://localhost:3001`이다. 해당 프로젝트의 기존 단일 서버에서 새 모델과 스크롤 동작을 확인했다.

| 검사 | 결과 |
|---|---|
| `pnpm typecheck` | 통과 |
| `pnpm lint` | 오류 0, 기존 개발 검수 화면 `<img>` 경고 2건 |
| `pnpm test` | 71파일 492건 통과 |
| Link 대역 보완 후 관련 테스트 | 5파일 13건 통과, scroll DOM 경고 해소 |
| 운영 빌드 | `BUILD_DIST_DIR=.next-housing-check pnpm build` 성공, 개발 라우트 미포함 |
| 평형 전환 | 360·767·768·1280px에서 스크롤 좌표 동일, 문서 리로드 없음 |
| 모바일 탭 전환 | 360·767px에서 스크롤 좌표 동일 |
| 신규 모델 3D | 5건 × 360·1280px × 3인칭·1인칭 = 20회 렌더, 콘솔 오류 0 |
| 반응형 한계 | 768px에서 기존 공통 헤더를 포함한 페이지 가로 넘침 59px |

빌드가 추가한 `tsconfig.json` include와 임시 빌드 디렉터리는 검증 후 복구·정리했다. 기존 `.next` dev 출력과 다른 서버는 종료하지 않았다. 샌드박스에서 빌드 워커 생성이 차단되어 승인된 실행으로 재검증했다.

브라우저 검사 결과는 `data/housing-traces/browser-validation.json`, 스크린샷은 `tmp/housing-review/browser/`에 있다. 이번 검증은 초기 3D 렌더와 시점 진입을 확인한 것이다. 모든 방의 실제 입력 이동·충돌 경로와 실기기 FPS는 측정하지 않았다. 기존 씬·충돌 관련 단위 테스트는 전체 테스트에 포함된다.

미등록 55건의 확장은 계속 남아 있다. 그중 서초·성동 17건과 §6.2의 호수·주소 대응 문제는 추가 원천 근거 없이 확정하지 않는다. 송파 304호 수기 초안은 래스터 정규화 경계와 치수선의 차이를 추가 확인해야 한다. 커밋·푸시는 수행하지 않았다.

---

## 10. v1.2 검증 결과와 한계

| 검사 | 결과 |
|---|---|
| `pnpm typecheck` | 통과 |
| `pnpm lint` | 오류 0, 기존 개발 검수 화면 `<img>` 경고 2건 |
| `pnpm test` | 71파일 504건 통과 |
| 운영 빌드 | `BUILD_DIST_DIR=.next-housing-check pnpm build` 성공, 개발 라우트 미포함, `tsconfig.json`·임시 디렉터리 복구 |
| 신규 모델 오버레이 | 302·303·304호 크롭 위 방·벽·개구부 위치 눈검사 |
| 신규 모델 3D | `scripts/verify-housing-browser.cjs`로 3건 × 360·1280px × 3인칭·1인칭 = 12회 렌더, 반응형 탐색 4건 모두 통과 |
| 승격 기준 재판정 | 등록 14건 모두 `reviewed`, 정규화 검증 점수 1.00 |

한계는 v1.1과 같다. 초기 렌더와 시점 진입만 확인했고 모든 방의 실제 입력 이동과 실기기 FPS는 측정하지 않았다. 강남개포 4층·5층 4개 평형은 아직 착수하지 않았다. 커밋·푸시는 수행하지 않았다.

---

## 11. v1.3 검증 결과

| 검사 | 결과 |
|---|---|
| `pnpm typecheck` | 통과 |
| `pnpm test` | 71파일 528건 통과 |
| 운영 빌드 | `BUILD_DIST_DIR=.next-songpa-check pnpm build` 성공, tsconfig·임시 디렉터리 복구 |
| 신규 6건 오버레이 | 크롭 위 방·벽·개구부 위치 눈검사 |
| 신규 6건 3D | 6건 × 360·1280px × 3인칭·1인칭 = 24회 렌더, 반응형 탐색 4건 통과 |
| 등록 전체 재판정 | 20건 모두 `reviewed` |

