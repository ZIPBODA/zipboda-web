# 프론트엔드 폴더 구조 — Feature-Sliced Design (Zipboda)

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 프론트엔드 폴더 구조 — Feature-Sliced Design |
| 버전 | v2.0.0 |
| 작성일 | 2026-07-27 |
| 기반 문서 | https://feature-sliced.design (외부 표준) |

### 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0.0 | 2026-07-27 | — | (구) 타 프로젝트 예시 기반(외부 스택 명칭 포함) |
| v2.0.0 | 2026-07-27 | Claude | 전면 개정 — Zipboda 실제 스택(web=Next.js, app=RN+Expo, admin=Vite)·도메인(청약/평면도/집구경/커머스 등)으로 재작성 |

---

## 2. 적용 범위

Zipboda 프론트엔드 3개 저장소에 동일 FSD 규칙 적용: **zipboda-web(Next.js)**, **zipboda-app(RN+Expo)**, **zipboda-admin(Vite)**. 저장소 간 컨텍스트 스위칭 비용을 낮추고, 공통 도메인 모델을 `@zipboda/shared`로 공유한다.

---

## 3. 레이어 계층 — 위→아래로만 의존

| 레이어 | 역할 |
|---|---|
| `app/` | 앱 초기화·프로바이더·라우팅(next app router / expo-router / vite router) |
| `pages/`(또는 routes) | 라우트 단위 화면 컴포지션 |
| `widgets/` | 큰 UI 블록(청약 목록·평면도 뷰어 패널 등) |
| `features/` | 사용자 상호작용 단위(청약 신청·가점 계산·장바구니 담기 등) |
| `entities/` | 비즈니스 도메인 모델(subscription·floorplan·inspiration·showroom·product·user 등) |
| `shared/` | 재사용 UI 키트·lib·api client·config(디자인 토큰) |

### 의존 규칙
- 상위 → 하위만 import(단방향), 같은 레이어 slice 간 import 금지, 순환 금지(DAG).
- `shared/`는 어떤 레이어도 import하지 않는다.

---

## 4. Zipboda 도메인 slice (entities 예)

`subscription`(청약 공고) · `floorplan`(평면도/3D 자산) · `inspiration`(집구경) · `showroom` · `application`(청약 신청) · `score`(가점) · `community` · `product`·`cart`·`order`(2차) · `user`.

## 5. Segment (slice 내부)

```
entities/subscription/
├── ui/       SubscriptionCard.tsx, AgencyBadge.tsx
├── model/    types.ts, store.ts, selectors.ts
├── api/      useSubscriptionsQuery.ts (TanStack Query)
├── lib/      formatDday.ts
├── config/   constants.ts   ← 도메인 상수(예: STATUS_LABELS)
└── index.ts  ★ Public API (배럴 export)
```

| Segment | 역할 |
|---|---|
| `ui/` | 컴포넌트 |
| `model/` | 상태·타입·selector |
| `api/` | 서버 통신(TanStack Query 훅, 응답 `{success,data,error}` 소비) |
| `lib/` | 순수 함수 |
| `config/` | 상수·환경 설정 |

> 상수·타입의 배치 상세는 `code-organization.md`를 따른다(공통 상수는 `shared/config`, 도메인 상수는 각 slice `config/`).

---

## 6. Public API 규칙
- 각 slice는 `index.ts`에서만 export. 외부는 `@/entities/subscription`처럼 slice 루트 경로 사용. 내부 파일 직접 import 금지. ESLint로 강제 권장.

## 7. 저장소별 차이(스택 매핑)
| | web | app | admin |
|---|---|---|---|
| 라우팅 | Next.js App Router(SSR/ISR) | expo-router | Vite Router(SPA) |
| 3D | three.js | expo-gl + three.js | (뷰어 미포함, 자산 관리 UI) |
| 렌더 | 목록/상세 SSR·뷰어 CSR | 네이티브 | SPA |

FSD 레이어·segment·Public API 규칙은 3개 저장소 공통.

## 8. 안티 패턴 (즉시 거절)
- 같은 레이어 horizontal import(features↔features 등)
- `entities → features` 역방향 import
- `shared/`가 상위 레이어 참조
- slice 내부 파일 직접 import
- 한 slice에 도메인 2개(`entities/subscription-and-floorplan`)

## 9. 점검 체크리스트(PR 전)
- [ ] 새 파일이 정확한 레이어에 있는가
- [ ] 같은 레이어 slice import 없음 / 외부 참조는 index.ts 경유
- [ ] `shared/`가 상위 레이어 미참조 / slice 단일 도메인
