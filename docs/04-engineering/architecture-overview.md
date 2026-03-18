# Architecture Overview

## 현재 저장소 기준

이 저장소는 Bun과 Turborepo 기반 모노레포입니다.

- `apps/web`: Next.js 16 기반 프런트엔드
- `apps/api`: Hono 기반 API 서버
- `apps/storybook`: UI 워크벤치
- `packages/ui`: 공용 UI 컴포넌트 패키지
- `packages/eslint-config`: ESLint 설정 패키지
- `packages/typescript-config`: TypeScript 설정 패키지

## 경계 원칙

- 앱은 패키지를 소비한다.
- UI 패키지는 프레젠테이션 책임만 가진다.
- 공용 설정 패키지는 lint, typecheck 기준을 제공한다.
- 구현 경계는 문서 경계와 일치해야 한다.

## 현재와 계획의 구분

현재 저장소에는 Next.js, Hono, Storybook, UI 패키지, 공용 설정 패키지가 존재합니다. 다음 기술 선택은 기존 기획 문서에서 제안되었지만 아직 구현 여부를 확정할 단계는 아닙니다.

- 인증: better-auth
- 데이터베이스: drizzle-orm, bun:sqlite, litestream
- API 타입 연계: `@hono/zod-openapi`, `openapi-typescript`, `openapi-fetch`
- API 문서: `@scalar/hono-api-reference`

이 문서에서는 구현된 사실과 예정된 방향을 분리해서 기록합니다.
