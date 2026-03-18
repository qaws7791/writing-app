프로젝트 세팅을 위한 계획 문서

## 라이브러리 사용

인증: better-auth
데이터베이스: drizzle-orm, bun:sqlite(wal mode), litestream(for backup)
API: hono, @hono/zod-openapi + openapi-typescript + openapi-fetch
API Docs: @scalar/hono-api-reference
웹: nextjs
코드젠: <https://turborepo.dev/docs/guides/generating-code>

## 모노레포 구성

데이터베이스: packages/db
API: apps/api
Web: apps/web
UI: packages/ui
