# 패키지 Interface와 import 규칙

## 현재 경계

- `packages/modules/identity`는 학습자 profile·사용자 상태, 관리자 session 해석, application port, persistence와 learner/admin HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/content`는 curriculum draft, immutable published revision, 발행·보관 정책, persistence·seed와 관리자 HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/ai-feedback`은 coaching prompt·provider 검증, attempt 정책·persistence, provider adapter와 학습자 HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/learning`은 학습 진행·채점·활동일 정책, read/command application, persistence·reporting과 학습자 HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/operations`는 대시보드·분석용 읽기 전용 reporting과 관리자 HTTP interface를 하나의 수직 module로 소유한다. reporting repository만 같은 SQLite의 identity·content·learning·ai-feedback table을 정적 SQL로 join·aggregate할 수 있고 다른 module의 command 저장소로 사용하지 않는다.
- 실행 앱 전용 bootstrap과 infrastructure 조립은 API의 명시적 app·container factory가 소유한다. API의 DB composition은 통합 schema entry, append-only migration 계보와 seed provider 실행 순서를 소유한다. app-owned module·platform facade를 별도로 두지 않으며 module은 공개 subpath로만 소비한다.
- `packages/infra/http-platform`은 Hono/OpenAPI app, canonical error, request security, OpenAPI helper를 소유한다. 자체 route framework는 두지 않으며 각 제품 module의 HTTP interface가 `app.openapi(route, handler)`로 endpoint method·path·canonical contract·auth·handler를 직접 등록한다. 제품 정책은 같은 module의 domain·application에 두고, API composition root는 module 등록 함수와 health·OpenAPI 같은 실행 경계 route를 명시적으로 호출한다.
- `packages/infra/observability`는 Pino logger와 공통 관측 event 계약을 소유하고 제품별 audit 분류는 API에 남긴다.
- `packages/infra/auth`는 Better Auth server/client integration, credential·session schema와 migration, 비밀번호·session token 정규화와 인증 메일 전달 Port·adapter를 소유한다. 제품 profile·status는 소유하지 않고 인증된 vendor-neutral identity를 identity module에 제공한다.
- `packages/infra/db`, `ai`, `event-bus`, `storage`, `http-client`는 각각 schema-neutral SQLite connection·transaction·migration runner·backup·destructive guard, AI provider runtime, process-local event 전달, object storage SDK, Orval 생성 admin·learner client와 얇은 fetch mutator를 소유한다. DB infra는 application schema·migration SQL·seed를 소유하거나 재수출하지 않는다.
- `packages/shared`의 `types`, `kernel`, `errors`, `contracts`, `ui`는 각각 transport-neutral 타입, 최소 실행 원시값, 공통 경계 오류, wire schema, 순수 표현 UI를 소유한다.
- 공개 subpath key와 target은 각 package manifest가 소유하고 TypeScript와 실제 consumer build가 해석한다.

## 공개 Interface 원칙

- 패키지 소비자는 `package.json`의 명시적인 subpath export만 import한다.
- root barrel은 제공하지 않고 기능 또는 UI primitive 단위의 좁은 subpath를 사용한다.
- canonical ID는 `@workspace/types/ids`, Result는 `@workspace/kernel/result`, wire schema는 가장 구체적인 `@workspace/contracts/<context>/<contract>`에서 직접 소비한다.
- 공유 UI는 primitive와 순수 presentation의 소유 의미가 드러나는 좁은 경로만 공개한다.
- config package는 server parser와 browser-safe 설정을 서로 다른 subpath로 분리하고 client graph가 secret-bearing parser를 소비하지 않게 한다.
- auth infra는 learner/admin과 client/server, 이메일 전달 Port·adapter, schema·migration·seed tooling 경계를 분리한다. root barrel과 client/server forwarding 경로는 제공하지 않는다.
- 제품 module은 `./module`, `./http`, `./ports`, `./migration-schema` 4개 subpath만 공개한다. `./module`은 조립 팩토리와 DB tooling이 쓰는 seed·purge 진입점, `./http`는 route 등록과 Hono env 계약, `./ports`는 외부가 구현하거나 소비하는 포트 타입·도메인 상수, `./migration-schema`는 Drizzle table 정의를 소유한다. consumer는 domain·infrastructure 내부 경로를 import하지 않는다.
- 제품 module은 wildcard subpath를 쓰지 않는다. `dependency-cruiser.config.mjs`가 manifest `exports`에서 경계 패턴을 파생하므로 wildcard는 경계 검사를 무력화한다.
- `packages/shared/ui`는 순수 표현 계층이므로 `./components/*`·`./lib/*` wildcard와 font·style 진입점만 공개한다.
- schema와 bootstrap seed capability는 통합 DB tooling과 격리 fixture만 소비한다. 다른 module과 일반 runtime consumer에는 제품 persistence를 공개하지 않는다.
- 현재 export key는 package manifest만 소유한다. 별도 exact 목록이나 export 형태 검사기를 복제하지 않고 TypeScript와 실제 consumer build가 target을 해석한다.
- 인증 cookie 이름은 `@workspace/contracts/auth-session-cookie`가 canonical 계약으로 소유하며 auth package는 이를 재수출하지 않는다.
- HTTP wire schema의 source는 `@workspace/contracts`의 구체적인 context 경로다. API 소비자는 OpenAPI에서 생성된 `@workspace/http-client/admin` 또는 `@workspace/http-client/learner` 타입과 함수를 사용하며 별도 수동 endpoint 계약 계층을 만들지 않는다.

## Contract data와 wire 경계

| capability          | transport-neutral data                                   | transport에 남는 계약                                             |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| learner command     | step, submission, evaluation, learning state, branded ID | start/complete body·params·response와 AI transition 응답          |
| learner AI coaching | prompt·attempt·provider 결과와 재시도 오류               | idempotency header, coaching 결과와 공개 오류                     |
| learner read        | course·lesson·progress item, sort/filter projection      | cursor query, page와 learner HTTP response                        |
| admin content       | editor document, projection item와 publish data          | course page, archive acknowledgement와 request                    |
| admin identity      | admin/user ID, user item와 filter 값                     | admin session, user page, status request와 delete acknowledgement |
| dashboard·analytics | 운영 projection item와 sort 값                           | analytics page와 HTTP query/response envelope                     |

현재 공개 subpath inventory와 owner mapping은 package manifest가 소유한다. broad contract barrel, transport-only source와 의미 없는 forwarding의 재유입은 package 변경 리뷰에서 판단한다.

## 내부 import 원칙

- workspace 간 import는 `@workspace/*` 공개 subpath를 사용한다.
- module 구현이 canonical DTO 또는 status를 소비할 때는 가장 구체적인 `@workspace/contracts/*` 공개 subpath를, brand ID는 `@workspace/types/ids`를 직접 import한다.
- package 내부 구현은 해당 package의 `#identity/*`, `#content/*`, `#ai-feedback/*`, `#learning/*`, `#operations/*`, `#auth/*`, `#db/*`, `#ai/*` 같은 private alias를 사용하고 자기 공개 경로를 역참조하지 않는다.
- 앱은 의존 package의 private alias를 import하지 않는다.
- 같은 package의 공개 `@workspace/*` 경로를 구현이 역참조하거나 상대 경로로 우회하지 않는다.
- `packages/shared/ui`는 app, module, DB, HTTP client, auth SDK와 Next.js navigation을 import하지 않는다.
- `packages/shared/kernel`은 workspace runtime package, framework, DB, provider와 `process.env`에 의존하지 않는다.
- module의 domain·application은 `packages/shared/contracts`의 HTTP DTO를 import하지 않는다.
- `apps/web`과 `apps/admin`은 module, DB와 Drizzle을 import하지 않는다. 앱 내부 의존은 `app → features → entities → shared` 방향을 지키며 client-facing source는 `server` 또는 feature `server` 경계를 import하지 않는다.
- `better-auth` 직접 import는 `packages/infra/auth` 안에서만 허용한다. auth client subpath는 server, DB와 ORM module을 import하지 않는다.
- identity module은 `@workspace/auth` runtime을 직접 import하지 않는다. FK 선언에 필요한 공개 auth schema만 identity persistence schema가 소비하며, API auth adapter가 credential table을 읽어 vendor-neutral learner identity directory port를 구현한다.
- operations reporting은 cross-module runtime 조회의 유일한 예외다. 다른 module의 repository·application·migration schema 구현을 import하지 않고, 각 module이 공개한 리포팅 뷰 이름을 포함한 정적 SQL과 reporting 전용 projection만 소유하며, API가 주입한 별도 read-only SQLite connection에서만 실행한다. 뷰 생성은 API migration이 소유하므로 컬럼 드리프트가 배포 전에 드러난다.
- DB infra는 content module을 import하지 않는다. curriculum fixture에 필요한 정규화 정책은 API 조립 지점이 content application 경계에서 소비한다.
- module 공개 `./migration-schema`는 API의 단일 schema tooling entry, FK를 선언하는 다른 module persistence schema와 격리된 E2E seed fixture가 소비한다. 이름이 용도를 강제로 알리며 auth `./schema`는 Better Auth adapter mapping과 인증 persistence adapter도 소비한다.
- application migration은 API의 append-only SQL만 소유하며 module은 migration entrypoint를 공개하지 않는다.
- 실제 seed가 있는 auth, content와 identity만 seed capability를 공개한다. content와 identity는 `./module`에서, auth는 `./seed`에서 공개하며 API seed composition과 seed tooling만 소비한다.
- OpenAI SDK, AWS SDK와 Pino 직접 import는 각각 `packages/infra/ai`, `storage`, `observability`로 제한한다.
- API composition과 adapter는 concrete dependency를 조립할 수 있지만 HTTP route, middleware와 response 경계는 DB·Drizzle을 직접 import하지 않는다.
- capability 간 호출은 공개 API 또는 합의된 application port를 사용한다.

runtime graph는 `apps/api composition -> module public capability surface -> module infrastructure -> infra primitive`다. 인증 graph는 `frontend feature adapter -> auth client`와 `apps/api composition -> auth server runtime -> identity application`으로 나뉜다. 실제 import edge는 source가 소유한다. frontend는 같은 app, Next.js와 `http-client`, `auth`, `contracts`, `ui`, config package만 직접 소비한다.

## 자동 검증

- `bun run check:architecture`는 runtime cycle, 미선언 dependency, frontend workspace 허용 목록, module domain·application의 framework·DB import, manifest가 공개하지 않은 module target과 operations reporting의 다른 module 구현 import를 검사한다.
- 의도적 위반 fixture는 실제 dependency graph에서 위 규칙의 실패와 동일 app·Next.js 예외를 함께 검증한다.
- Knip은 workspace별 실행 진입점에서 사용되지 않는 파일·dependency·export와 중복 public symbol을 검사한다. 생성 client는 manifest export를 entry로 사용하고 `.generated`에만 unused file·symbol 예외를 둔다.
- TypeScript와 production build는 package export target과 client/server 조립 가능성을 실제 consumer 관점에서 검증한다.
- package test는 HTTP parse, migration checksum, runtime 계약처럼 import graph가 판정할 수 없는 동작을 검증한다.
