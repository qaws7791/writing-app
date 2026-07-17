# 아키텍처 개요

이 문서는 writing learning platform의 현재 구조를 빠르게 파악하기 위한 living guide다. 구조가 바뀌면 함께 갱신한다.

현재 workspace의 정확한 경로는 `apps/admin`, `apps/api`, `apps/storybook`, `apps/web`, `packages/config`, `packages/contracts`, `packages/core`, `packages/db`, `packages/env`, `packages/http-client`, `packages/repository-tooling`, `packages/resource-document`, `packages/ui`다.

## 프로젝트 구조

```text
[project root]/
├── apps/
│   ├── web/        # Next.js 16 - 학습자 플랫폼
│   ├── api/        # Hono - learner/admin Host sub-app을 가진 단일 API
│   ├── admin/      # Next.js 16 - 관리자 운영 대시보드
│   ├── admin-api/  # Hono - parity·로컬 개발·명시적 rollback legacy API
│   └── storybook/  # UI 컴포넌트 개발 환경
├── packages/
│   ├── ui/      # 공유 UI 프리미티브와 순수 도메인 프레젠테이션
│   ├── config/  # 공유 TypeScript 설정
│   ├── contracts/ # 학습자·관리자 HTTP DTO와 Zod 계약
│   ├── db/      # Drizzle schema, migration, seed, db client
│   ├── hono/    # Hono OpenAPI route, validation, error handling 표준 패키지
│   ├── http-client/ # HTTP transport result와 네트워크 오류 모델
│   ├── logger/  # pino logger와 요청 로그 helper
│   ├── resource-document/ # Lexical node와 GFM Markdown 변환·검증 계약
│   ├── env/     # 환경 변수 parsing helper
│   └── core/    # shared kernel, module facade, domain, use case, port와 전환 seam
└── docs/       # product, design, engineering 기준 문서
```

## 공통 기술

- frontend: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, `@workspace/ui`
- backend: Hono, OpenAPI 3.1
- auth: Better Auth
- database: Drizzle with SQLite
- logging: pino with pino-pretty
- rich text editing: Lexical 0.46.0과 GFM Markdown
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

학습자와 관리자 Host를 분리하는 Hono API 서버다.

- port: `4000`
- auth: learner/admin Better Auth table·cookie·origin·session resolver를 Host별로 분리한다.
- database: SQLite 파일을 사용한다.
- 주요 기능:
  - 콘텐츠 조회
  - 학습자 인증과 세션 조회
  - 학습 진행과 답변 저장
  - 프로필과 연속 학습일 계산
  - AI 피드백 생성과 결과 저장
  - 관리자 인증, content·identity·dashboard/analytics·settings·AI chat·resource library route
- 구조:
  - `src/http`는 strict Host dispatcher와 learner/admin Hono sub-app 조립, OpenAPI 문서 생성을 담당한다.
  - `src/context`는 request-scoped dependency와 Hono env 타입을 정의한다.
  - `src/adapters/learning`은 learner SQL row gathering, persisted JSON decode, cursor의 Drizzle predicate 변환과 transition transaction을 소유한다. typed row bundle·decoder, core의 순수 cursor 조건·course/progress projection, HTTP mapping과 공개 presenter는 서로 분리한다.
  - `src/middleware`는 CORS, 인증, 요청 context 설치 같은 transport middleware만 둔다.
  - `src/modules/*`는 capability-local HTTP surface module이다. 관리자 capability는 route, schema, composition과 app-owned adapter를 같은 실행 경계에 둔다.
  - `src/errors/map-core-error.ts`만 core Result error를 HTTP `AppError`로 변환한다.

### admin

관리자용 운영 대시보드다.

- port: `3001`
- auth: Better Auth 기반 ID/password
- backend: admin public Host의 `apps/api` 관리자 sub-app
- layout: 왼쪽 사이드바 기반 대시보드
- 주요 기능:
  - 대시보드 지표와 최근 활동 조회
  - 콘텐츠 검색, 생성, 보관, 미리보기
  - 사용자 검색, 상태 변경, 삭제 요청 처리
  - 분석과 운영 설정 관리
  - 최대 3단계 자료 트리, GFM WYSIWYG 편집, 명시적 저장과 휴지통 복원

저장소 Compose/Caddy 구성은 admin public Host와 admin SSR 내부 alias를 `apps/api:4000`으로 보낸다. MTA-40 source 구성·정적 계약과 target E2E 재배선은 구현됐고 `ENABLE_TEST_AUTH=true` 3개 E2E가 통과했다. 실제 Docker/production 적용과 관찰은 저장소 source만으로 확인할 수 없으며 MTA-40의 운영 검증 대상이다.

### admin-api (legacy)

관리자 API의 parity·로컬 개발·명시적 rollback용 Hono runtime이다.

- port: `4001`
- auth: 관리자 전용 Better Auth 테이블
- database: 플랫폼과 같은 SQLite 파일을 사용하되 관리자 인증 테이블은 `admin_*`로 분리한다.
- 유지 기능:
  - target route와의 capability parity·rollback 비교
  - MTA-41 전의 관리자 계정 seed, 인증 감사와 세션 폐기 script

### storybook

공유 UI 컴포넌트를 독립적으로 확인하는 개발 환경이다.

## 패키지

### ui

`packages/ui`는 shadcn 기반 공유 UI 컴포넌트와 디자인 시스템을 제공한다.

### config

`packages/config`는 workspace에서 공유하는 TypeScript 설정을 제공한다.

### core

`packages/core`는 프레임워크와 HTTP transport에 의존하지 않는 비즈니스 로직 패키지다. 실행 앱 composition이 core의 port·use case와 app-owned adapter·DB primitive를 연결한다. `apps/api`가 learner/admin SQLite lifecycle과 concrete adapter를 소유하고 core에는 module facade, domain 규칙, use case와 application port만 남는다.

core 내부 source는 `shared`와 `modules`로 나눈다. `shared`는 실제 여러 capability가 사용하는 Result 같은 공통 값을 제공한다. `modules/*/api/index.ts`는 실행 앱이 사용할 좁은 public facade이며, `domain`과 `application` 구현은 이 facade 뒤에 둔다. core source와 manifest는 DB·ORM·인증 SDK·provider SDK·Hono·Next.js·React에 의존하지 않고 concrete infrastructure와 composition은 실행 앱 경계에 둔다.

core가 learning/admin contract에서 재사용할 수 있는 경로는 `learning/{step-data,read-data}`와 `admin/{content-data,identity-data,dashboard-analytics-data,settings-data,ai-chat-data,resource-library-data}` 8개뿐이다. 이는 HTTP body·query·page·response·error·SSE wire가 아니라 canonical/application data 경계다. test를 포함한 root architecture inventory와 Oxlint가 exact allowlist를 독립 적용하고, broad·legacy import/re-export와 정적 target을 증명할 수 없는 computed dynamic import를 allowance 없이 실패시킨다. 새 canonical entrypoint를 추가할 때 guard와 문서를 명시적으로 갱신해야 하는 비용은 있지만 transport 경계가 암묵적으로 넓어지는 것을 막는다.

학습 read application은 decoded keyset cursor의 primary type·방향과 course/progress projection을 결정적 순수 함수로 소유한다. app-local adapter가 Drizzle column·predicate와 `Date` 변환을 맡으므로 core에는 SQL builder나 DB schema type이 들어오지 않는다.

학습자 API는 core 내부 파일 구조에 직접 묶이지 않도록 `@workspace/core/{auth,content,learning,ai-feedback}` canonical Interface만 import한다. app-local `learner-api-core.ts`가 이 facade의 공개 factory·port와 app-owned adapter를 직접 조립한다. `modules/*`, `shared/*`, repository Implementation, bootstrap과 root barrel은 export map에 노출하지 않는다.

자료실의 tree/document/search/asset port, use case와 순수 정책은 `packages/core/src/modules/resource-library`에 있고 target Drizzle 구현·R2 asset store와 SQLite 통합 테스트는 `apps/api/src/adapters/resource-library` 및 `apps/api/src/resource-assets`가 소유한다. app-local composition이 adapter와 core use case를 직접 조립한다. 문서 조회는 현재 Markdown과 강한 ETag를 반환하고, 저장은 `If-Match`가 현재 버전과 일치할 때만 제목·Markdown·FTS·수정 메타데이터·버전 증가를 하나의 SQLite transaction에서 확정한다. 트리 생성과 이동은 이름 고유성, 순환과 최대 3단계 깊이를 같은 저장 경계에서 검증한다.

관리자 course/content reset·identity·dashboard·analytics·settings·AI chat Drizzle adapter와 실제 SQLite 특성 테스트도 target `apps/api/src/adapters`와 capability-local composition이 소유한다. `apps/api/src/composition/admin-route-composition.ts`는 immutable registry 순서로 여섯 route group을 조립하고, 각 capability는 자기 adapter를 직접 만든다. identity adapter는 admin-owned 조회 reader와 auth-owned 상태 변경·soft-delete mutation port를 함께 구현하지만 app composition과 route dependency는 두 경계를 분리한다. core에는 관리자 concrete/application aggregate나 query forwarding use case, API bootstrap이 없다. package-interface 검사는 제거된 `AdminRepository`·`AdminService` 계열과 forwarding 파일·symbol 재도입을 거부한다.

### API transport platform

`apps/api/src/http/platform`은 Hono 기반 API 앱의 transport 표준을 제공한다. 앱 생성, OpenAPI route 정의, Env 고정 route builder, Zod validation hook, 공통 오류·404 처리, request security와 logging middleware를 담당한다. 단일 runtime consumer에 가까운 책임을 두어 별도 workspace 의존과 호환 표면을 만들지 않는다.

### http-client

`packages/http-client`는 web과 admin HTTP adapter가 공유하는 result shape와 네트워크 오류 모델을 제공한다.

### db

`packages/db`는 Drizzle SQLite 기반 schema, migration, seed data, database client 생성을 제공한다. `packages/db`는 `packages/core`를 import하지 않는 저수준 영속성 패키지다.

### env

`packages/env`는 앱별 환경 변수 schema를 안전하게 parsing하기 위한 공통 helper를 제공한다. 앱별 의미 변환은 각 앱 내부에서 담당한다.

### API observability

`apps/api/src/observability`는 Pino logger, 요청 로그 필드와 security audit event를 제공한다. transport middleware는 `apps/api/src/http/platform`이 이 경계를 소비한다.

### resource-document

`packages/resource-document`는 브라우저와 headless 서버가 공유하는 Lexical node와 정규 GFM AST import/export·검증을 제공한다. GFM으로 의미 보존할 수 없는 상태는 기존 Markdown을 덮어쓰기 전에 거부한다.

`packages/repository-tooling`은 앱과 패키지의 source inventory, TypeScript import·re-export·dynamic import·type-only reference 파싱, alias와 package export 해석, cycle chain과 architecture 정책 matcher를 제공한다. 제품 runtime은 이 패키지에 의존하지 않고 architecture test와 root quality tooling만 사용한다.

## 런타임 분리

학습자 플랫폼과 어드민은 프론트엔드를 별도 앱으로 실행한다. backend는 하나의 `apps/api` process 안에서 strict Host dispatcher 아래 learner/admin Hono sub-app을 실행한다.

공유 DB는 사용하지만 인증 테이블은 플랫폼용 `user`, `session`, `account`, `verification`과 관리자용 `admin_user`, `admin_session`, `admin_account`, `admin_verification`으로 분리한다.

## 현재 제품 경계

제품 런타임은 현재 monorepo의 Next.js, Hono, Better Auth, Drizzle, OpenAPI 경계를 사용하며 레거시 실험 디렉터리의 구현 파일을 import하지 않는다.

콘텐츠 구조는 `Course -> Unit -> Lesson -> Step`으로 표현한다. 기준 콘텐츠 seed는 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝을 새 DB baseline seed로 제공한다.

DB migration은 기존 schema를 누적 보정하지 않고 `0000-writing-app-baseline.sql` 기준으로 재정의한다. 운영 데이터 이전이 필요해지는 시점에는 별도 데이터 이전 계획을 작성한다.

현재 제품 구현은 `apps/*/src`와 `packages/*/src`에 유지한다. 오래된 reset 단계 문구는 현재 구조의 기준으로 사용하지 않는다.

## 배포

- Ubuntu 24.04 LTS 단일 서버에서 Docker Compose로 컨테이너를 관리한다.
- Cloudflare Tunnel만 외부 연결을 만들고 Caddy는 내부 HTTP reverse proxy를 담당한다.
- 외부 DNS, CDN, TLS 종료는 Cloudflare가 담당하며 애플리케이션 port는 호스트에 공개하지 않는다.
- Litestream이 로컬 SQLite WAL을 Cloudflare R2에 연속 복제한다.
- Ansible이 Docker 호스트 bootstrap, 설정 배치, migration, 기동, 검증, 코드 롤백과 DB 복구를 자동화한다.
- 저장소 Compose·Caddy는 두 public API Host를 `apps/api:4000`으로 target한다. Caddy 관리 API는 container loopback `127.0.0.1:2019`에만 bind하고 host에는 노출하지 않는다. Ansible은 배포 변경마다 image pull 직후 현재 Caddy image·env·설정 조합을 stateful 단계 전에 별도 validate한다. Caddyfile은 단일 file bind mount이므로 원자적 파일 교체 뒤 기존 container가 이전 inode를 계속 볼 수 있어, 파일이 바뀌면 reload하지 않고 Caddy service만 force recreate해 새 mount와 health를 확인한다. production parser는 주어진 cookie domain이 frontend 소비·API 발급 origin의 공통 parent인지 검증하고, role은 네 public Host 충돌과 비어 있는 공통 parent cookie domain을 fail-fast한다. 이는 source 구성의 검증된 사실이며, 실제 production 적용·관찰·rollback rehearsal은 별도 운영 증거가 필요하다.
