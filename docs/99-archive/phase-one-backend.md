# Phase 1 Backend Plan

## Summary

- `apps/api`는 Hono 기반 Phase 1 백엔드 서버를 제공한다.
- 저장소는 SQLite를 사용하고, Tiptap 문서는 HTML 없이 Drizzle ORM의 SQLite JSON text 컬럼으로 저장한다.
- 인증은 개발용 단일 사용자 세션으로 고정한다.

## Runtime

- Bun: `1.3.10`
- Node: `20.x`
- Database: SQLite

## Packages

- `@workspace/domain`: 브랜드 타입, 도메인 엔터티, 저장 포트, Tiptap 문서 타입
- `@workspace/application`: 홈/글감/글 유스케이스
- `@workspace/db`: Drizzle 스키마, migration, seed, 저장소 구현
- `apps/api`: 라우트, 검증, 응답 매핑, 개발용 인증 미들웨어

## HTTP API

- `GET /health`
- `GET /home`
- `GET /prompts`
- `GET /prompts/:promptId`
- `PUT /prompts/:promptId/save`
- `DELETE /prompts/:promptId/save`
- `GET /writings`
- `POST /writings`
- `GET /writings/:writingId`
- `PATCH /writings/:writingId`
- `DELETE /writings/:writingId`

## Storage Rules

- `writings.body_json`에는 Tiptap JSON 문서를 저장한다.
- `writings.body_plain_text`, `character_count`, `word_count`는 저장 시점에 파생값으로 갱신한다.
- 추천 글감과 탐색 글감은 seed 데이터로 관리한다.

## Local Commands

- `bun --filter api dev`
- `bun --filter api test`
- `bun --filter api seed`
- `bun --filter api db:reset`

## Notes

- API prefix `/v1`는 사용하지 않는다.
- 글감 운영 CRUD, 실제 인증, AI 기능은 Phase 1 범위에 포함하지 않는다.
