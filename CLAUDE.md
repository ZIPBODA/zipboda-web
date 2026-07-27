# 집보다(Zipboda) Web — 프로젝트 가이드

집보다 **사용자 PC 웹**. LH·SH·GH·IH 공공 청약 정보 + 평면도(2D)·WebGL 3D 집구경(1·3인칭) + 영감·쇼룸·가점·커뮤니티·마이, 2차 가구 커머스.

## 스택
- React + **Next.js(App Router)** + TypeScript, **Feature-Sliced Design**
- 서버 상태 TanStack Query, 응답 엔벌로프 `{success, data, error}`
- 3D: three.js + glTF/GLB. 렌더링: 청약 목록/상세 SSR·ISR, 뷰어/마이/커머스 CSR
- 공유: pnpm workspace `@zipboda/shared`(zipboda-app과 API 타입·훅 공유)

## 산출물 단일 진실원(Source of Truth)
요구사항/화면/API xlsx 3종은 **본 저장소 `docs/`에서 대표 관리**한다(app/api/admin은 개발계획서 md만 보유). 변경 시 본 저장소에서 수정한다.

## 규칙 (반드시 준수)
@.claude/rules/frontend-rule.md
@.claude/rules/frontend-architecture.md
@.claude/rules/code-organization.md
@.claude/rules/contributing-role.md
@.claude/rules/document-template-rule.md
@.claude/rules/phase-review-rule.md
@.claude/rules/test-guide.md
@.claude/rules/unclear-rule.md

## 보안
- 비밀값은 `.env`(gitignore)에만. `.mcp.json`은 `${FIGMA_API_KEY}` 참조. 실제 토큰 커밋 금지.
