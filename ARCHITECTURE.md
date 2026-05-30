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
│   ├── db/      # Drizzle schema, migration, repository, db client
│   ├── logger/  # pino logger와 요청 로그 helper
│   ├── env/     # 환경 변수 parsing helper
│   └── core/    # 공유 DTO, Zod schema, domain service, port
└── docs/       # 한국어 결정 기록과 OpenAPI 정적 계약 파일
```

## 공통 기술

- frontend: Next.js 16 App Router
- backend: Hono, OpenAPI 3.1
- auth: Better Auth
- database: Drizzle with SQLite
- logging: pino with pino-pretty
- package manager: Bun monorepo

## 앱

### web

학습자가 사용하는 학습 플랫폼이다.

- port: `3000`
- auth: Better Auth 기반 email/password + Google
- backend: `apps/api`
- 주요 기능:
  - 공개 콘텐츠 조회
  - 학습 진행 저장
  - 레슨 답변 저장
  - OpenAI 기반 AI 피드백

### api

학습자 플랫폼용 Hono API 서버다.

- port: `4000`
- auth: 플랫폼 Better Auth 테이블
- database: SQLite 파일을 사용한다.
- 주요 기능:
  - 콘텐츠 조회
  - 학습자 인증과 세션 조회
  - 학습 진행과 답변 저장
  - AI 피드백 생성과 결과 저장

### admin

관리자용 운영 대시보드다.

- port: `3001`
- auth: Better Auth 기반 ID/password
- backend: `apps/admin-api`
- layout: 왼쪽 사이드바 기반 대시보드
- 1차 기능:
  - 코스-챕터-레슨 계층형 조회
  - 사용자 기본 정보 조회

### admin-api

관리자용 Hono API 서버다.

- port: `4001`
- auth: 관리자 전용 Better Auth 테이블
- database: 플랫폼과 같은 SQLite 파일을 사용하되 관리자 인증 테이블은 `admin_*`로 분리한다.
- 주요 기능:
  - 관리자 인증
  - 코스-챕터-레슨 계층형 조회
  - 사용자 기본 정보 조회
  - 최초 관리자 계정 seed

### storybook

공유 UI 컴포넌트를 독립적으로 확인하는 개발 환경이다.

## 패키지

### ui

`packages/ui`는 shadcn 기반 공유 UI 컴포넌트와 디자인 시스템을 제공한다.

### core

`packages/core`는 프레임워크와 데이터베이스 구현에 의존하지 않는 DTO, Zod schema, 브랜드 ID, repository port, domain service를 제공한다.

### db

`packages/db`는 Drizzle SQLite 기반 schema, migration, seed data, repository 구현, database client 생성을 제공한다.

### env

`packages/env`는 앱별 환경 변수 schema를 안전하게 parsing하기 위한 공통 helper를 제공한다. 앱별 의미 변환은 각 앱 내부에서 담당한다.

### logger

`packages/logger`는 API 런타임에서 공유하는 pino logger와 요청 로그 필드 helper를 제공한다.

## 런타임 분리

학습자 플랫폼과 어드민은 프론트엔드와 백엔드를 모두 별도 앱으로 실행한다. `apps/admin`과 `apps/admin-api`가 실행되지 않아도 `apps/web`과 `apps/api`의 학습자 기능은 정상 동작해야 한다.

공유 DB는 사용하지만 인증 테이블은 플랫폼용 `user`, `session`, `account`, `verification`과 관리자용 `admin_user`, `admin_session`, `admin_account`, `admin_verification`으로 분리한다.

## 배포

- Ubuntu server와 systemd로 프로세스를 관리한다.
- Caddy로 reverse proxy와 TLS를 담당한다.
- SQLite backup 전략으로 데이터 내구성을 보장한다.
