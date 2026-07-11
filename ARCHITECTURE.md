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
│   ├── ui/      # 공유 UI 프리미티브와 순수 도메인 프레젠테이션
│   ├── config/  # 공유 TypeScript 설정
│   ├── db/      # Drizzle schema, migration, seed, db client
│   ├── hono/    # Hono OpenAPI route, validation, error handling 표준 패키지
│   ├── http-client/ # HTTP transport result와 네트워크 오류 모델
│   ├── logger/  # pino logger와 요청 로그 helper
│   ├── resource-document/ # Lexical GFM 문서 계약과 Yjs 투영
│   ├── env/     # 환경 변수 parsing helper
│   └── core/    # shared kernel, module facade, usecase, repository adapter, composition root
└── docs/       # product, design, engineering 기준 문서
```

## 공통 기술

- frontend: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, `@workspace/ui`
- backend: Hono, OpenAPI 3.1
- auth: Better Auth
- database: Drizzle with SQLite
- logging: pino with pino-pretty
- rich text collaboration: Lexical 0.46.0, Yjs 13
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
  - 콘텐츠 검색, 생성, 보관, 미리보기
  - 사용자 검색, 상태 변경, 삭제 요청 처리
  - 분석과 운영 설정 관리
  - 무제한 자료 트리, GFM WYSIWYG 편집, 실시간 공동 편집과 휴지통 복원

### admin-api

관리자용 Hono API 서버다.

- port: `4001`
- auth: 관리자 전용 Better Auth 테이블
- database: 플랫폼과 같은 SQLite 파일을 사용하되 관리자 인증 테이블은 `admin_*`로 분리한다.
- 주요 기능:
  - 관리자 인증
  - 코스-유닛-레슨-스텝 계층형 조회와 코스 보관
  - 사용자 목록, 상세, 상태 변경, 삭제 상태 전환
  - 대시보드, 분석, 운영 설정
  - 자료 트리·검색·Markdown 가져오기/내보내기·Yjs HTTP transaction REST와 작업 공간 사건 WebSocket
  - 최초 관리자 계정 seed

### storybook

공유 UI 컴포넌트를 독립적으로 확인하는 개발 환경이다.

## 패키지

### ui

`packages/ui`는 shadcn 기반 공유 UI 컴포넌트와 디자인 시스템을 제공한다.

### config

`packages/config`는 workspace에서 공유하는 TypeScript 설정을 제공한다.

### core

`packages/core`는 프레임워크와 HTTP transport에 의존하지 않는 비즈니스 로직 패키지다. 학습자 API 방향은 `apps/api -> packages/core -> packages/db`이며, core는 module facade, domain 규칙, usecase, repository port와 adapter, 학습자 API 런타임 조립을 소유한다.

core 내부는 `shared`, `modules`, `composition`으로 나눈다. `shared`는 Result, 공통 오류, status kernel처럼 실제 런타임에서 쓰는 공통 값을 제공한다. `modules/*/api/index.ts`는 Hono와 다른 module이 사용할 좁은 public facade이며, `domain`, `application`, `infrastructure` 구현은 이 facade 뒤에 둔다. `composition`은 학습자 API 런타임 bootstrap을 담당한다.

학습자 API는 core 내부 파일 구조에 직접 묶이지 않도록 `@workspace/core/modules/{auth,content,learning,ai-feedback,learner-api}` public facade만 import한다. 기존 `@workspace/core/{admin,auth,content,learning,ai-feedback,status}` public import는 source shim이 아니라 package export map으로 새 `modules`와 `shared` 위치에 직접 연결한다.

자료실은 `packages/core/src/modules/resource-library`의 tree/document/search/document-sync use case와 repository 경계로 분리한다. 트리 구조 명령은 expected revision과 SQLite transaction으로 직렬화하고 본문 Yjs update는 멱등 HTTP transaction이 snapshot·Markdown·FTS·수정 메타데이터를 하나의 영속화 경계에서 갱신한다.

### hono

`packages/hono`는 Hono 기반 API 앱의 반복되는 transport 표준을 제공한다. 앱 생성, OpenAPI route 정의, Env 고정 route builder, Zod validation hook, `AppError`, 404와 공통 error handler를 담당한다. 에러 wire contract는 `{ code, message, errors? }`다.

### http-client

`packages/http-client`는 web과 admin HTTP adapter가 공유하는 result shape와 네트워크 오류 모델을 제공한다.

### db

`packages/db`는 Drizzle SQLite 기반 schema, migration, seed data, database client 생성을 제공한다. `packages/db`는 `packages/core`를 import하지 않는 저수준 영속성 패키지다.

### env

`packages/env`는 앱별 환경 변수 schema를 안전하게 parsing하기 위한 공통 helper를 제공한다. 앱별 의미 변환은 각 앱 내부에서 담당한다.

### logger

`packages/logger`는 API 런타임에서 공유하는 pino logger와 요청 로그 필드 helper를 제공한다.

### resource-document

`packages/resource-document`는 브라우저와 headless 서버가 공유하는 Lexical node, 정규 GFM AST import/export·검증, Yjs snapshot projection을 제공한다. GFM으로 의미 보존할 수 없는 상태는 기존 Markdown을 덮어쓰기 전에 거부한다.

## 런타임 분리

학습자 플랫폼과 어드민은 프론트엔드와 백엔드를 모두 별도 앱으로 실행한다. `apps/admin`과 `apps/admin-api`가 실행되지 않아도 `apps/web`과 `apps/api`의 학습자 기능은 정상 동작해야 한다.

공유 DB는 사용하지만 인증 테이블은 플랫폼용 `user`, `session`, `account`, `verification`과 관리자용 `admin_user`, `admin_session`, `admin_account`, `admin_verification`으로 분리한다.

## 현재 제품 경계

제품 런타임은 현재 monorepo의 Next.js, Hono, Better Auth, Drizzle, OpenAPI 경계를 사용하며 레거시 실험 디렉터리의 구현 파일을 import하지 않는다.

콘텐츠 구조는 `Course -> Unit -> Lesson -> Step`으로 표현한다. 기준 콘텐츠 seed는 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝을 새 DB baseline seed로 제공한다.

DB migration은 기존 schema를 누적 보정하지 않고 `0000-writing-app-baseline.sql` 기준으로 재정의한다. 운영 데이터 이전이 필요해지는 시점에는 별도 데이터 이전 계획을 작성한다.

현재 제품 구현은 `apps/*/src`와 `packages/*/src`에 유지한다. 오래된 reset 단계 문구는 현재 구조의 기준으로 사용하지 않는다.

## 배포

- Ubuntu server와 systemd로 프로세스를 관리한다.
- Caddy로 reverse proxy와 TLS를 담당한다.
- SQLite backup 전략으로 데이터 내구성을 보장한다.
