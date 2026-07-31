# 집보다(Zipboda) Web — 프로젝트 가이드

집보다 **사용자 PC 웹**. LH·SH·GH·IH 공공 청약 정보 + 평면도(2D)·WebGL 3D 집구경(1·3인칭) + 영감·쇼룸·가점·커뮤니티·마이, 2차 가구 커머스.

## 스택
- React + **Next.js(App Router)** + TypeScript, **Feature-Sliced Design**
- 서버 상태 TanStack Query, 응답 엔벌로프 `{success, data, error}`
- 스타일: **Tailwind** + `@zipboda/tokens` preset + `@zipboda/ui`(공유 컴포넌트)
- 3D: three.js + glTF/GLB. 렌더링: 청약 목록/상세 SSR·ISR, 뷰어/마이/커머스 CSR
- 공유: `@zipboda/tokens`·`ui`·`ui-core`(GitHub Packages) · `@zipboda/shared`(API 타입·훅)

## 산출물 단일 진실원(Source of Truth)
요구사항/화면/API xlsx 3종·디자인시스템 문서는 **본 저장소 `docs/`에서 대표 관리**한다(app/api/admin은 개발계획서 md만 보유). 변경 시 본 저장소에서 수정한다.

## 규칙 — 해당 상황에서만 읽어 적용
> 규칙은 **항상 로드하지 않는다.** 아래 "상황"에 해당하는 작업을 할 때 그 규칙 파일을 **먼저 열어(Read) 읽고 준수**한다. 해당 없으면 읽지 않는다.

| 상황(트리거) | 읽을 규칙 파일 |
|---|---|
| 프론트엔드 코드(TS/TSX) 작성·수정 | `.claude/rules/frontend.rule.md` · `.claude/rules/code-organization.rule.md` |
| 코드 주석 작성·정리 | `.claude/rules/code-comments.rule.md` |
| 폴더/레이어(FSD) 구조·slice 배치 결정 | `.claude/rules/frontend-architecture.rule.md` |
| Figma node-id로 UI 컴포넌트/화면 구현 | `.claude/rules/figma-implementation.rule.md` |
| UI 화면/컴포넌트 구현·수정 후 시각 검증 | `.claude/rules/visual-verification.rule.md` |
| 커밋·브랜치·PR 진행 | `.claude/rules/contributing-role.rule.md` |
| 마크다운 문서(.md) 작성·수정 | `.claude/rules/document-template.rule.md` |
| 스테이지/Phase 완료 검토 | `.claude/rules/phase-review.rule.md` |
| 테스트 작성·구현 후 검증 | `.claude/rules/test-guide.rule.md` |
| 지시가 모호/검증 불가할 때 | `.claude/rules/unclear.rule.md` |

## 보안
- 비밀값은 `.env`(gitignore)에만. `.mcp.json`·`.npmrc`는 `${ENV}` 참조. 실제 토큰 커밋 금지.
