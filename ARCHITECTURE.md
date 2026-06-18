# 아키텍처 개요

이 문서는 writing learning platform의 현재 구조를 빠르게 파악하기 위한 living guide다. 구조가 바뀌면 함께 갱신한다.

## 프로젝트 구조

```text
[project root]/
├── apps/
│   ├── web/        # Next.js 16 - 학습자 플랫폼
│   ├── api/        # Hono - 학습자 플랫폼 API
│   ├── admin/      # Next.js 16 - 관리자 운영 대시보드
│   ├── admin-api/  # Hono - 관리자 API
│   └── storybook/  # UI 컴포넌트 개발 환경
├── packages/
│   ├── ui/      # 공유 UI 컴포넌트와 디자인 시스템
│   ├── db/      # Drizzle schema, migration, seed, db client
│   ├── hono/    # Hono OpenAPI route, validation, error handling 표준 패키지
│   ├── logger/  # pino logger와 요청 로그 helper
│   ├── env/     # 환경 변수 parsing helper
│   └── core/    # 공유 DTO, Zod schema, domain service, repository 구현
└── docs/       # 한국어 결정 기록과 OpenAPI 정적 계약 파일
```

## 공통 기술

- frontend: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, `@workspace/ui`
- backend: Hono, OpenAPI 3.1
- auth: Better Auth
- database: Drizzle with SQLite
- logging: pino with pino-pretty
- package manager: Bun monorepo

## 앱

### web

학습자가 사용하는 학습 플랫폼이다.

- port: `3000`
- auth: Better Auth 기반 Google 단일 로그인
- backend: `apps/api`
- 주요 기능:
  - 공개 랜딩과 Google 로그인
  - 학습 홈과 연속 학습일 표시
  - 공개 콘텐츠 조회와 코스 카테고리 탐색
  - 코스 상세, 유닛별 커리큘럼, 레슨 잠금 상태 표시
  - 학습 진행 저장
  - 레슨 답변 저장
  - OpenAI 기반 AI 피드백
  - 프로필과 전체 진도 표시

### api

학습자 플랫폼용 Hono API 서버다.

- port: `4000`
- auth: 플랫폼 Better Auth 테이블
- database: SQLite 파일을 사용한다.
- 주요 기능:
  - 콘텐츠 조회
  - 학습자 인증과 세션 조회
  - 학습 진행과 답변 저장
  - 프로필과 연속 학습일 계산
  - AI 피드백 생성과 결과 저장
- 구조:
  - `src/http`는 `@workspace/hono` 기반 앱 조립과 OpenAPI 문서 생성을 담당한다.
  - `src/context`는 request-scoped dependency와 Hono env 타입을 정의한다.
  - `src/middleware`는 CORS, 인증, 요청 context 설치 같은 transport middleware만 둔다.
  - `src/modules/*`는 비즈니스 모듈이 아니라 HTTP surface module이며 route, schema, presenter만 포함한다.
  - `src/errors/map-core-error.ts`만 core Result error를 HTTP `AppError`로 변환한다.

### admin

관리자용 운영 대시보드다.

- port: `3001`
- auth: Better Auth 기반 ID/password
- backend: `apps/admin-api`
- layout: 왼쪽 사이드바 기반 대시보드
- 주요 기능:
  - 대시보드 지표와 최근 활동 조회
  - 콘텐츠 검색, 생성, 보관, 편집
  - 사용자 검색, 상태 변경, 삭제 요청 처리
  - 분석과 운영 설정 관리

### admin-api

관리자용 Hono API 서버다.

- port: `4001`
- auth: 관리자 전용 Better Auth 테이블
- database: 플랫폼과 같은 SQLite 파일을 사용하되 관리자 인증 테이블은 `admin_*`로 분리한다.
- 주요 기능:
  - 관리자 인증
  - 코스-유닛-레슨-스텝 계층형 조회와 편집
  - 사용자 목록, 상세, 상태 변경, 삭제 상태 전환
  - 대시보드, 분석, 운영 설정
  - 최초 관리자 계정 seed

### storybook

공유 UI 컴포넌트를 독립적으로 확인하는 개발 환경이다.

## 패키지

### ui

`packages/ui`는 shadcn 기반 공유 UI 컴포넌트와 디자인 시스템을 제공한다.

### core

`packages/core`는 프레임워크와 HTTP transport에 의존하지 않는 DTO, Zod schema, 브랜드 ID, domain service, repository port와 구현, 학습자 API 런타임 조립을 제공한다. 학습자 API 방향은 `apps/api -> packages/core -> packages/db`이며, core는 DB primitive를 사용해 유스케이스와 트랜잭션 경계를 소유한다.

학습자 API는 core 내부 파일 구조에 직접 묶이지 않도록 `@workspace/core/modules/{auth,content,learning,ai-feedback,learner-api}` public facade만 import한다.

### hono

`packages/hono`는 Hono 기반 API 앱의 반복되는 transport 표준을 제공한다. 앱 생성, OpenAPI route 정의, Env 고정 route builder, Zod validation hook, `AppError`, 404와 공통 error handler를 담당한다. 에러 wire contract는 `{ code, message, errors? }`다.

### db

`packages/db`는 Drizzle SQLite 기반 schema, migration, seed data, database client 생성을 제공한다. `packages/db`는 `packages/core`를 import하지 않는 저수준 영속성 패키지다.

### env

`packages/env`는 앱별 환경 변수 schema를 안전하게 parsing하기 위한 공통 helper를 제공한다. 앱별 의미 변환은 각 앱 내부에서 담당한다.

### logger

`packages/logger`는 API 런타임에서 공유하는 pino logger와 요청 로그 필드 helper를 제공한다.

## 런타임 분리

학습자 플랫폼과 어드민은 프론트엔드와 백엔드를 모두 별도 앱으로 실행한다. `apps/admin`과 `apps/admin-api`가 실행되지 않아도 `apps/web`과 `apps/api`의 학습자 기능은 정상 동작해야 한다.

공유 DB는 사용하지만 인증 테이블은 플랫폼용 `user`, `session`, `account`, `verification`과 관리자용 `admin_user`, `admin_session`, `admin_account`, `admin_verification`으로 분리한다.

## Kwep 피벗 경계

`Kwep/`는 요구사항과 seed 콘텐츠를 읽는 기준으로만 둔다. 제품 런타임은 현재 monorepo의 Next.js, Hono, Better Auth, Drizzle, OpenAPI 경계를 사용하며 `Kwep` 구현 파일을 import하지 않는다.

콘텐츠 구조는 `Course -> Unit -> Lesson -> Step`으로 표현한다. Kwep seed는 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝을 새 DB baseline seed로 제공한다.

DB migration은 기존 schema를 누적 보정하지 않고 `0000-kwep-baseline.sql` 기준으로 재정의한다. 운영 데이터 이전이 필요해지는 시점에는 별도 데이터 이전 계획을 작성한다.

현재 피벗 reset 단계에서는 `apps/*/src`와 `packages/*/src`의 제품 구현을 제거하고, `apps/storybook/src`와 각 package 설정 파일만 남긴다. 새 source root는 후속 Task에서 Kwep baseline 구현 파일을 만들 때 다시 생성한다.

## 배포

- Ubuntu server와 systemd로 프로세스를 관리한다.
- Caddy로 reverse proxy와 TLS를 담당한다.
- SQLite backup 전략으로 데이터 내구성을 보장한다.
