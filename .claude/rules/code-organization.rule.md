# 코드 구조 전략 — 상수 & 타입 관리 (Zipboda / FSD 정합)

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 코드 구조 전략 — 상수 & 타입 관리 |
| 버전 | v2.0.0 |
| 작성일 | 2026-07-27 |
| 기반 문서 | .claude/rules/frontend-architecture.rule.md |

### 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0.0 | 2026-07-27 | — | (구) `features/`·`lib/constants.ts`·`types/*` 구조 기반 — FSD와 상충 |
| v2.0.0 | 2026-07-27 | Claude | 전면 개정 — FSD(entities/shared) 구조와 정합되도록 상수·타입 배치 재정의 |

---

## 2. 원칙

`frontend-architecture.rule.md`의 FSD를 **단일 기준**으로 삼는다. 상수·타입은 별도의 전역 `lib/`·`types/` 디렉터리로 분리하지 않고 **FSD 레이어/세그먼트에 귀속**시킨다(이전 버전의 `lib/constants.ts`·`types/server.ts` 전역 분리 방식은 폐기).

---

## 3. 상수 배치

| 분류 | 위치 | 예시 |
|------|------|------|
| **공통 상수**(2개 이상 slice·앱 전역) | `shared/config/constants.ts` | `ROWS_PER_PAGE`, `DAY_NAMES_SHORT` |
| **도메인 상수**(특정 slice 전용) | `entities|features/<slice>/config/constants.ts` | `SUBSCRIPTION_STATUS_LABELS`, `AGENCY_CODE` |

### 배치 원칙
1. 컴포넌트/페이지 파일에 상수를 인라인 선언하지 않는다(해당 `config/constants.ts`로).
2. `lib/`(순수 함수) 세그먼트에 상수를 섞지 않는다.
3. 동일 값이 2개 이상 slice에서 쓰이면 `shared/config`로 올린다.

### 네이밍
`UPPER_SNAKE_CASE` / 배열 복수형 / 매핑 `_MAP`·`_LABEL`·`_BADGE` / 옵션 배열 `_OPTIONS` / 리터럴 타입 필요 시 `as const`.

### 허용 예외
- 컴포넌트 내부 전용 스타일/컬럼 정의 배열(UI 로직의 일부) · 테스트 mock 데이터.

---

## 4. 타입 배치 (FSD + API 추상화)

| 타입 종류 | 위치 | Import 허용 |
|-----------|------|-------------|
| 서버 원본(백엔드 JSON 1:1) | `entities/<slice>/api/*.dto.ts` (또는 `@zipboda/shared`의 서버 타입) | 해당 slice `api/`, 테스트 |
| UI 비즈니스 모델(안정 계약) | `entities/<slice>/model/types.ts` | 모든 상위 레이어 |
| API Request/Response·오류코드 | `shared/api/types.ts` (`@zipboda/shared` 공유) | 모든 계층 |

- 백엔드 변경 파급을 줄이기 위해 `api/` 세그먼트의 **mapper**로 서버 DTO → UI 모델을 변환한다. 컴포넌트는 UI 모델(`model/types.ts`)에만 의존.
- web/app은 서버 타입·API 훅을 `@zipboda/shared`로 공유(중복 방지).

---

## 5. 인라인 상수 금지
컴포넌트/페이지 최상단 `const FOO = ...` 금지(위 §3 예외 제외). 사유: 중복 방지·변경 영향 파악·관심사 분리.
