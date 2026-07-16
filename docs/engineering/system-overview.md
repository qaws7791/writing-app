# 시스템 개요

이 문서는 writing-app의 엔지니어링 관점 시스템 구조, 서비스 경계, 배포 인프라를 설명하는 단일 진실 원천이다.

## 기준

- 기준일: 2026-06-25
- 기준 소스: 현재 코드베이스의 `apps/*`, `packages/*`, 루트 설정, 기존 `docs` 문서
- 제외: 레거시 실험 디렉터리의 구현 파일. 제품 런타임은 해당 디렉터리를 import하지 않는다.

## 시스템 목적

writing-app은 한국어 글쓰기 학습 플랫폼이다. 학습자는 코스를 탐색하고 step 기반 레슨을 수행하며 진행률, 답변, AI 코칭 결과를 저장한다. 운영자는 별도 어드민에서 콘텐츠, 사용자, 분석, 운영 설정을 관리한다.

## C4 Model

### 수준 1. 시스템 맥락

```mermaid
flowchart LR
  learner["학습자"] --> web["학습자 웹 apps/web"]
  admin["운영자/소유자 관리자"] --> adminWeb["어드민 웹 apps/admin"]
  web --> api["학습자 API apps/api"]
  adminWeb --> adminApi["어드민 API apps/admin-api"]
  api --> google["Google OAuth"]
  api --> openai["OpenAI Responses API"]
  adminApi --> mastra["Mastra 관리자 AI 에이전트"]
  mastra --> openai
  api --> db["SQLite data/api.sqlite"]
  adminApi --> db
```

### 수준 2. 컨테이너

```mermaid
flowchart TB
  subgraph frontend["프론트엔드"]
    web["apps/web\nNext.js 16 App Router"]
    admin["apps/admin\nNext.js 16 App Router"]
    storybook["apps/storybook\nUI 개발 환경"]
  end

  subgraph backend["백엔드"]
    api["apps/api\nHono 학습자 API"]
    adminApi["apps/admin-api\nHono 어드민 API"]
  end

  subgraph packages["워크스페이스 패키지"]
    core["packages/core\n도메인, 유스케이스, repository 구현"]
    dbpkg["packages/db\nDrizzle schema, migration, seed, SQLite client"]
    ui["packages/ui\n공유 UI"]
    config["packages/config\n공유 TypeScript 설정"]
    hono["packages/hono\nHono route/error 표준"]
    env["packages/env\n환경 변수 파싱과 로컬 기본값"]
    logger["packages/logger\nPino와 요청 로그"]
    httpClient["packages/http-client\nHTTP 결과 모델"]
    resourceDocument["packages/resource-document\nLexical GFM·Yjs 문서 계약"]
  end

  web --> ui
  web --> httpClient
  web --> api
  admin --> ui
  admin --> httpClient
  admin --> adminApi
  api --> hono
  api --> logger
  api --> env
  api --> core
  adminApi --> logger
  adminApi --> env
  adminApi --> core
  adminApi --> dbpkg
  core --> dbpkg
```

## 서비스 경계

| 경계                         | 책임                                                                             | 금지                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/web`                   | 학습자 화면, 인증 시작, API 포트 호출, API DTO mapper                            | DB 직접 접근, 레거시 실험 디렉터리 import, API 응답을 화면에 그대로 전달 |
| `apps/api`                   | 학습자 HTTP transport, Hono route, CORS, 인증 세션 확인, OpenAPI 생성, core 호출 | `@workspace/db`와 Drizzle 직접 import                                    |
| `apps/admin`                 | 관리자 화면, 관리자 로그인, 어드민 API 포트 호출                                 | 학습자 API 호출, DB 직접 접근                                            |
| `apps/admin-api`             | 관리자 HTTP transport, 관리자 인증, 권한 guard, 운영 API                         | 학습자 웹 세션/쿠키와 혼용                                               |
| `packages/core`              | 도메인 DTO, 브랜드 타입, 상태 정책, 유스케이스, repository 구현, 학습자 API 조립 | HTTP transport 의존                                                      |
| `packages/db`                | SQLite client, Drizzle schema, migration, seed, persisted 값                     | `@workspace/core` import                                                 |
| `packages/ui`                | 공유 UI primitive, 순수 도메인 프레젠테이션, 스타일                              | 앱별 데이터 조회, 채점/세션, 라우팅 정책, API 호출                       |
| `packages/config`            | 공유 TypeScript 설정                                                             | 런타임 코드와 도메인 로직                                                |
| `packages/hono`              | Hono route, validation, error handling 표준                                      | 도메인 정책 소유                                                         |
| `packages/env`               | 환경 변수 파싱과 로컬 기본값                                                     | 앱별 의미 변환                                                           |
| `packages/logger`            | pino logger와 요청 로그 middleware                                               | 비즈니스 이벤트 저장                                                     |
| `packages/http-client`       | HTTP result shape와 네트워크 오류 모델                                           | 앱별 사용자 메시지와 인증 정책                                           |
| `packages/resource-document` | Lexical node, GFM AST mapper, Markdown 검증, Yjs snapshot 투영                   | React UI, API 호출, DB 영속화, 폴더·트리 정책                            |

## 런타임 의존성 방향

학습자 API의 핵심 방향은 다음과 같다.

```text
apps/api -> packages/core -> packages/db
```

이 방향은 `scripts/oxlint/workspace-rules.mjs`의 `workspace/no-invalid-workspace-dependency` 규칙으로 강제한다.

`apps/admin-api/src/admin-runtime.ts`는 SQLite client를 한 번 생성해 Better Auth와 core 조립에 같은 connection을 전달하고, 조립 실패와 프로세스 종료에서 close-once 수명주기를 소유한다. `@workspace/core/admin-api-core` composition Module은 주입된 database handle로 관리자·자료실 repository Implementation과 기능별 use case만 조립하며 concrete DB client를 반환하지 않는다. 어드민 use case 구현은 `packages/core/modules/admin/application/use-cases`에 dashboard, analytics, course, user, settings, content reset 기능별 파일로 둔다.
`packages/core`의 module public facade는 domain/application 계약을 노출하고, Drizzle·Better Auth·OpenAI 같은 infrastructure 어댑터는 composition 또는 명시적인 adapter subpath에서만 직접 의존한다.
`packages/core` 내부 Implementation은 package `imports`의 `#/*` private alias로 필요한 domain·application port·use-case 선언 파일을 직접 import한다. 자기 공개 Interface 역참조와 외부의 Implementation deep import는 package Interface architecture 검사에서 차단한다.
학습자·관리자 request/response DTO와 Zod schema는 `packages/contracts`가 원본으로 소유한다. `*Request`, query와 header는 transport에서 검증하고, 변경 route는 검증된 값을 별도 application command로 명시적으로 구성한다. core use case와 repository port는 HTTP request 타입을 입력으로 사용하지 않는다. 브랜드 ID, 상태 값과 안정적인 조회 projection은 변경 이유가 같으면 공유한다. 이 결정은 ADR-0009를 따른다.
매칭 스텝의 presentation choice id, deterministic shuffle, selection map은 `packages/ui`의 lesson match 컴포넌트 내부 util이 소유한다. 답안 payload 조립과 채점 정책은 `apps/web/src/features/lessons`가 소유한다. `packages/contracts`는 학습 DTO schema만 노출하고, core는 웹 UI 상호작용 모델을 재수출하지 않는다.
Learning domain이 content DTO나 content id 타입을 참조해야 할 때는 content module facade가 아니라 `@workspace/contracts/content` 경계를 사용한다. content application service가 learning progress helper를 호출하는 방향은 허용하지만, learning domain이 content module public facade를 되물어 module facade 순환을 만들지 않는다.

## 현재 앱 라우트

### 학습자 웹

- `/`: 랜딩
- `/login`: Google 로그인 화면
- `/app`: 학습 홈
- `/app/courses`: 코스 목록
- `/app/courses/[id]`: 코스 상세
- `/app/lesson?lesson_id=...`: 레슨 진행
- `/app/profile`: 프로필

학습자 웹의 server route는 `ApiResult`에서 직접 분기한다. 인증 실패는 로그인 redirect, not-found는 route별 notFound 또는 notice, 네트워크·서버 실패는 `AppRouteNotice`로 처리하며, empty state는 성공 응답의 빈 값일 때만 화면 컴포넌트가 다룬다. 앱 홈 route는 profile과 progress를 모두 필수 데이터로 보고, 둘 중 하나의 API 실패도 빈 홈이나 부분 홈으로 변환하지 않는다. 코스 목록 화면은 API 실패를 빈 목록으로 변환하지 않고, 성공 응답의 빈 목록만 별도 empty state로 렌더링한다. 프로필 route는 세션 부재나 API 401만 로그인 이동으로 처리하고, 프로필 API의 네트워크·서버 실패는 장애 notice로 유지한다.

### 어드민 웹

- `/login`: 관리자 로그인
- `/`: 어드민 기본 화면
- `/courses`: 코스 목록
- `/courses/[id]`: 코스 상세/편집 화면
- `/users`: 사용자 목록
- `/users/[id]`: 사용자 상세
- `/analytics`: 분석
- `/settings`: 운영 설정
- `/resources`: 관리자 자료실
- `/chat`: 관리자 AI 채팅

## API 런타임

학습자 API는 `apps/api/src/main.ts`에서 `createLearnerApiCore()`를 통해 core 서비스를 조립하고 Hono 앱에 주입한다. 요청 context의 route 서비스 의존성은 route 등록과 같은 app 조립 경계에서 required로 제공하며, 테스트는 사용하지 않는 서비스를 명시적 failing fake로 채운다. `apps/api/src/routes/index.ts`는 typed route 배열과 auth proxy, `/openapi` bootstrap 등록을 함께 소유한다. 학습자 HTTP 경계는 `@workspace/contracts/learning`의 strict Zod schema와 추론 타입을 직접 사용한다. OpenAPI 문서는 실제 등록 route에서 `/openapi`로만 생성하며 정적 JSON과 generated TypeScript 타입은 추적하지 않는다. `apps/api/src/http/learner-response.ts`는 성공 응답 runtime 검증을, `learner-error-response.ts`는 canonical 오류와 request ID 정규화를 담당한다.
learner route handler는 typed route가 검증한 transport 입력을 읽고, request context의 use case를 호출한 뒤 성공 응답만 mapping한다. core result의 오류 정규화는 `apps/api/src/errors/map-core-error.ts`의 `unwrapApiCoreResult()`가 담당한다.

콘텐츠 조회는 core의 공통 content reader가 repository 조회, DTO 검증, not-found result를 담당한다. `LearnerContentService`는 이 조회 결과에 학습자 진행률을 합성하는 책임만 추가한다.
학습 step 채점은 `packages/core/src/modules/learning/domain/step-grading-policy.ts`가 소유한다. learner transition service와 repository는 고정 curriculum version, 잠금, 순서, 답안·진행·완료·활동일의 원자적 저장을 조정한다.
AI 피드백 전이 service는 고정 version의 선행 WRITE 답안을 준비하고, 시도 한도·prompt 기반 provider 호출·결과 저장은 AI feedback attempt coordinator와 learner transition repository를 통해 조정한다.

어드민 API는 `apps/admin-api/src/admin-runtime.ts`에서 SQLite DB, Better Auth, 관리자 세션 resolver와 core service를 조립하고 `main.ts`가 요청 로거, WebSocket과 서버 수명을 연결한다. Route는 `@workspace/hono/core`의 typed route definition으로 등록하고, request/query/body wire contract는 `packages/contracts/admin`을 직접 참조한다. 관리자 세션과 owner 권한은 route middleware가 `AppError` 기반 표준 오류로 변환하며, `/openapi`는 등록된 typed route에서 OpenAPI 3.1 문서를 생성한다.
관리자 자료실과 관리자 AI 채팅은 어드민 API 경계에 속한다. 자료실 구조 명령과 조회·검색·가져오기·내보내기, 본문 Yjs transaction은 REST를 사용하고 작업 공간 WebSocket은 구조 변경·문서 version 알림만 전달한다. AI 채팅은 `admin_ai_chat_conversations`, `admin_ai_chat_messages`에 대화 내역을 저장하고, `apps/admin-api`에 내장한 Mastra `admin-content-agent`를 Hono route에서 호출해 `chunk`, `done`, `error` SSE 이벤트로 응답한다. Mastra Memory는 사용하지 않고 저장된 메시지를 프롬프트 컨텍스트로 구성한다.

`packages/resource-document`는 브라우저·headless 서버 공용 Lexical 0.46.0 node, 정규 GFM AST import/export와 검증, Yjs snapshot 적용·투영을 제공한다. `/resources/events`는 작업 공간 수명의 지속 연결에서 활성 문서 구독과 heartbeat를 받고, 문서별 version·무효화 사건을 구독자에게만 전달하며 관리자 ID 기준 활성 편집자 수를 계산한다. `ResourceWorkspaceSync`는 서버 snapshot으로 문서별 Y.Doc을 초기화하고 HTTP transaction 저장, 최근 update pull, snapshot fallback과 승인 대기 cache를 관리한다. 활성 문서 route는 메타데이터와 `stateVersion`만 반환하고 본문은 sync snapshot에서 초기화하며, 휴지통 읽기와 내보내기만 durable Markdown을 조회한다. 서버의 문서별 operation coordinator는 본문 저장·sync 조회·내보내기·휴지통 이동을 직렬화하고 다른 문서의 실패와 지연을 격리한다. production 편집기는 이 작업 공간 lease만 사용하며 문서별 Yjs room과 전용 WebSocket endpoint는 제거됐다. `apps/admin` 자료실은 reui 기반 지연 로딩 트리와 Lexical WYSIWYG 편집기, 슬래시 메뉴, 블록 이동, 선택 서식 도구, 재연결 병합과 동기화 상태를 제공한다.
어드민 코스 편집기는 root에 `course-editor-shell.tsx` entrypoint만 두고, 레슨/스텝 편집 작업 화면은 `workspace/`, 학습자 표시 확인은 `preview/`, 스텝 타입별 폼은 `step-forms/` 아래에 둔다. step form 의존 방향은 `step-forms/step-form-registry.tsx -> step-forms/index.ts -> step-forms/* -> step-forms/shared/step-form-contract.tsx`이다. 개별 step form은 registry를 import하지 않고, registry는 개별 form 파일이나 shared shell을 직접 import하지 않는다.

`packages/core`의 공개 표면은 실제 런타임에서 쓰이는 module API, learner API bootstrap, result/errors/kernel 같은 공통 값으로 제한한다. request context, event bus, unit of work, container wiring처럼 아직 use case에 연결되지 않은 scaffold는 도입 시점까지 공개하지 않는다.

## 데이터 저장소

- 단일 SQLite 파일을 기본 저장소로 사용한다.
- 로컬 기본 경로는 저장소 루트의 `data/api.sqlite`다.
- 학습자 API와 어드민 API는 같은 SQLite 파일을 공유하지만 인증 테이블과 쿠키 이름을 분리한다.
- 브라우저 localStorage는 사용자 계정, 학습 진행, 연속 학습일의 영속 저장소로 사용하지 않는다.
- `createWritingAppDatabase()`는 연결 직후 `foreign_keys=ON`, `journal_mode=WAL`, `busy_timeout=5000`, `synchronous=NORMAL`을 적용한다.

## 배포 인프라 개요

현재 문서화된 목표 운영 인프라는 다음과 같다.

- Ubuntu 24.04 LTS 단일 서버에서 Docker Compose로 네 애플리케이션 컨테이너를 관리한다.
- Cloudflare Tunnel만 외부 연결을 만들며 호스트에는 애플리케이션 port를 공개하지 않는다.
- Caddy가 Tunnel과 애플리케이션 사이의 내부 HTTP reverse proxy를 담당하고 외부 TLS는 Cloudflare가 종료한다.
- SQLite 파일은 API 프로세스와 같은 로컬 디스크에 둔다.
- 여러 서버나 네트워크 파일시스템에서 같은 SQLite 파일을 직접 공유하지 않는다.
- Litestream이 SQLite WAL을 Cloudflare R2에 연속 복제한다.
- Ansible이 Docker 설치, 설정 배치, migration, 배포, 검증, 코드 롤백과 DB 복구를 수행한다.
- 상세 실행 계약은 `deployment.md`를 단일 진실 원천으로 사용한다.

## 운영상 독립성

- `apps/admin`과 `apps/admin-api`가 중단되어도 학습자용 `apps/web`과 `apps/api`는 계속 동작해야 한다.
- 관리자 인증과 학습자 인증은 테이블, 쿠키 이름, 로그인 방식, API origin을 분리한다.
- 콘텐츠 seed는 안정적인 ID 기준으로 기존 콘텐츠를 갱신하고, seed에서 빠진 콘텐츠는 삭제가 아니라 `archived`로 전환한다.

## 관리자 API 조립 경계

`admin-api` runtime composition은 데이터베이스 생성·공유·종료와 Better Auth를 소유한다. core 조립 모듈은 주입된 database handle로 저장소와 use case를 만들고 기능별 서비스만 반환한다. shutdown은 신규 요청 차단, Bun server 정지, close-once 데이터베이스 종료 순서다.
