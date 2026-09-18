# 집보다 Web — Codex 작업 지침

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 집보다 Web Codex 작업 지침 |
| 버전 | v1.0.0 |
| 작성일 | 2026-09-17 |
| 기반 문서 | CLAUDE.md, .claude/rules/frontend.rule.md, .claude/rules/document-template.rule.md, .claude/rules/contributing-role.rule.md, docs/ZIPBODA_codex-context.md, docs/ZIPBODA_codex-workflow.md |

### 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0.0 | 2026-09-17 | Codex | PC·Mobile 반응형 범위, Claude 규칙 11종 연결, Codex 실행·모델 선택·검증 기준 작성 |

---

## 2. 적용 범위와 시작 절차

- 현재 작업 대상은 **이 저장소의 PC·Mobile 반응형 웹**이다. 모바일 웹과 별도 `zipboda-app` 네이티브 앱을 구분한다. 관리자·백엔드·네이티브 앱·결제 연동으로 작업을 임의 확대하지 않는다.
- 한국어로 소통한다. 사용자 요청과 현재 코드를 기준으로 작업하며, 오래된 계획서의 미구현 표기를 현재 상태로 단정하지 않는다.
- 새 작업에서는 [서비스 맥락](docs/ZIPBODA_codex-context.md)과 [Codex 실행 규칙](docs/ZIPBODA_codex-workflow.md)을 먼저 읽는다. 이 기록은 재사용할 프로젝트 지식이며 모델의 영구 학습을 의미하지 않는다.
- `git status --short`, 현재 브랜치, 작업 대상 파일을 확인한다. 사용자의 기존 변경과 미추적 파일을 보존한다.
- 변경 전에 아래 기여 규칙을 읽고 작업 브랜치를 만든다. 이미 해당 작업용 브랜치라면 이어서 사용한다. `main` 직접 커밋 금지.
- 시스템·개발자 지시와 사용자 직접 지시가 저장소 문서보다 우선한다. 그 범위 안에서 절대 규칙 → 프로젝트 보완 규칙 → 일반 컨벤션 순으로 적용한다.

## 3. 상황별 규칙 로딩

`.claude/rules`를 공통 규칙의 원본으로 유지한다. 아래 파일은 Codex에도 적용하며 **해당 작업 전에 원문을 읽는다**. 전부를 매번 로드하거나 별도 복사본을 만들어 두 벌로 관리하지 않는다. 규칙의 Claude 전용 도구명은 현재 사용 가능한 동등 도구로 대응하되, 사용할 수 없는 검증을 수행했다고 보고하지 않는다.

| 상황 | 먼저 읽을 파일 |
|------|----------------|
| 모든 파일 변경 전, 브랜치·커밋·PR | [.claude/rules/contributing-role.rule.md](.claude/rules/contributing-role.rule.md) |
| TS/TSX 작성·수정 | [.claude/rules/frontend.rule.md](.claude/rules/frontend.rule.md), [.claude/rules/code-organization.rule.md](.claude/rules/code-organization.rule.md) |
| 폴더·레이어·slice 배치 | [.claude/rules/frontend-architecture.rule.md](.claude/rules/frontend-architecture.rule.md) |
| 주석 작성·정리 | [.claude/rules/code-comments.rule.md](.claude/rules/code-comments.rule.md) |
| Figma 기반 UI 구현 | [.claude/rules/figma-implementation.rule.md](.claude/rules/figma-implementation.rule.md) |
| UI 변경 후 검증 | [.claude/rules/visual-verification.rule.md](.claude/rules/visual-verification.rule.md) |
| 기능·버그 수정 검증, 테스트 작성 | [.claude/rules/test-guide.rule.md](.claude/rules/test-guide.rule.md) |
| 마크다운 작성·수정 | [.claude/rules/document-template.rule.md](.claude/rules/document-template.rule.md) |
| Phase·스테이지 완료 판정 | [.claude/rules/phase-review.rule.md](.claude/rules/phase-review.rule.md) |
| 요구사항·디자인의 모호함이 구현 결정을 막음 | [.claude/rules/unclear.rule.md](.claude/rules/unclear.rule.md) |

## 4. 프로젝트 핵심 기준

- Next.js 14 App Router·React 18·TypeScript·Tailwind 3·FSD. 실제 의존성과 명령은 `package.json` 및 lockfile에서 확인한다.
- FSD 상위 → 하위 의존, 같은 레이어의 다른 slice 참조 금지, slice 외부에서는 `index.ts` public API 사용. 공통 UI는 `@/shared/ui`, 상수는 해당 slice의 `config`, 도메인 타입은 `model`에 둔다.
- 디자인은 `@zipboda/tokens` preset과 공유 UI를 재사용한다. 임의 색·간격·문구·항목 수·인터랙션 변경 금지. 출처 Figma node-id를 유지한다.
- 현재 반응형 기준은 기본 Mobile, `md:`부터 PC(768px 이상)다. 구성이 다른 홈처럼 별도 컴포넌트가 필요한 경우 기존 분기를 존중한다. 전체 화면을 일괄 재구성하지 않는다.
- Figma fileKey는 `eQbErccR3ilS8Ri6EKBBD0`. `docs/ZIPBODA_nodeId.md`, `docs/ZIPBODA_design_nodeId.md`와 코드의 출처를 대조하고 구현 직전 실제 노드를 확인한다. 구 색인의 네이티브 Mobile 디자인과 반응형 웹 디자인을 혼용하지 않는다.
- 요구사항·화면·인터페이스 정의서 xlsx 3종 및 디자인시스템 정본은 `docs/`에 있다. 현재 화면 단계에서는 백엔드 상세 설계·매핑으로 범위를 확대하지 않는다(A4). 실제 연동 요청 시에만 계약을 확인하고 해당 Mock·폴백을 같은 변경에서 제거한다(A1~A3).
- 기존 코드에 있는 임의 값·Mock은 새 예외의 근거가 아니다. 관련 없는 기존 위반을 이번 작업에 끼워 넣어 수정하지 않는다.

## 5. 실행·검증·모델 선택

- `pnpm dev`와 `pnpm start`의 현재 지정 포트는 **3001**이다. 구 규칙의 3000을 복사하지 말고 실행 스크립트와 실제 서버 주소를 확인한다. 프로젝트 dev 서버는 하나만 운영하고, 다른 작업의 프로세스를 일괄 종료하지 않는다.
- 코드 변경에는 `pnpm typecheck`, `pnpm lint`, 관련 테스트를 적용한다. UI 구현 완료/Phase 검토에는 원본 규칙의 전체 테스트·빌드·렌더 검증도 수행한다. 문서만 변경한 경우 경로·규칙 누락·내용 정합성·diff를 확인한다.
- UI는 360·768·1280px와 경계 767/768px에서 검증한다. 스크린샷을 우선하고, 서빙 DOM/CSS만 확인했으면 그 한계를 보고한다. 정적 검사만으로 시각 검증 완료를 선언하지 않는다.
- 작업 난이도에 따라 모델·추론 강도를 선택하는 기준은 [Codex 실행 규칙 §3](docs/ZIPBODA_codex-workflow.md#3-작업별-모델과-추론-강도)을 따른다. 실제 전환 기능이 없으면 변경했다고 말하지 않는다. 설정 파일에 지침을 적는 것만으로 실행 중 모델이 바뀌지 않는다.
- 비밀값을 출력·커밋하지 않는다. `.env*`, `.npmrc`, `.mcp.json`, 개인 설정을 무분별하게 열거나 일괄 스테이징하지 않는다. 변경 파일만 명시적으로 다룬다.
- 최종 보고에는 변경 결과·검증 결과·미확인 사항을 구분한다. UI 작업은 검증 브랜치·주소·포트도 포함한다.
