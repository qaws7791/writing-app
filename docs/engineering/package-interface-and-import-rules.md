# 패키지 Interface와 import 규칙

## 현재 경계

- `packages/modules/identity`는 profile·사용자 상태·관리자 role 정책, application port, persistence와 learner/admin HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/content`는 curriculum draft, immutable published revision, 발행·보관·reset 정책, persistence·seed와 관리자 HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/ai-feedback`은 coaching prompt·provider 검증, attempt 정책·persistence, provider adapter와 학습자 HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/learning`은 학습 진행·채점·활동일 정책, read/command application, persistence·reporting과 학습자 HTTP interface를 하나의 수직 module로 소유한다.
- `packages/modules/resource-library`는 자료 tree·Markdown 문서·검색·휴지통과 자산 metadata, persistence·reconciliation과 관리자 HTTP interface를 하나의 수직 module로 소유한다. object storage 구현, 관리자 actor 조회와 document 저장 event publisher는 API composition이 port로 주입한다.
- `packages/modules/operations`는 대시보드·분석 reporting 조합, 공지·법적 문서 설정, 관리자 AI 대화·quota·변경안, persistence와 관리자 HTTP interface를 하나의 수직 module로 소유한다. identity role은 capability로 변환하고 세 reporting query와 content·resource command는 API composition이 port로 주입한다.
- 실행 앱 전용 bootstrap과 infrastructure 조립은 API의 명시적 app·container factory가 소유한다. API의 DB composition은 통합 schema entry, append-only migration 계보와 seed provider 실행 순서를 소유한다. app-owned module·platform facade를 별도로 두지 않으며 module은 공개 subpath로만 소비한다.
- `packages/infra/http-platform`은 Hono/OpenAPI 공통 app·route helper, error, request security와 middleware를 소유한다. 각 제품 module의 HTTP interface는 endpoint method·path·canonical contract 연결·auth option·handler를 소유하고, 제품 정책은 같은 module의 domain·application에 둔다. API는 module route 조립과 health·OpenAPI 같은 실행 경계 route를 소유한다.
- `packages/infra/observability`는 Pino logger와 공통 관측 event 계약을 소유하고 제품별 audit 분류는 API에 남긴다.
- `packages/infra/auth`는 Better Auth server/client integration, credential·session schema와 migration, 비밀번호와 session token 정규화를 소유한다. 제품 profile·status·role은 소유하지 않고 인증된 vendor-neutral identity를 identity module에 제공한다.
- `packages/infra/db`, `ai`, `event-bus`, `storage`, `http-client`는 각각 schema-neutral SQLite connection·transaction·migration runner·backup·destructive guard, AI provider runtime, process-local event 전달, object storage SDK, transport-neutral HTTP 결과를 소유한다. DB infra는 application schema·migration SQL·seed를 소유하거나 재수출하지 않는다.
- `packages/shared`의 `types`, `kernel`, `errors`, `event-contracts`, `contracts`, `resource-document`, `ui`는 각각 transport-neutral 타입, 최소 실행 원시값, 공통 경계 오류, module 간 event, wire schema, Markdown 변환, 순수 표현 UI를 소유한다.
- 공개 subpath key와 target은 각 package manifest가 소유하고 workspace inventory 검사가 유효성을 검증한다.

## 공개 Interface 원칙

- 패키지 소비자는 `package.json`의 명시적인 subpath export만 import한다.
- root barrel은 제공하지 않고 기능 또는 UI primitive 단위의 좁은 subpath를 사용한다.
- canonical ID는 `@workspace/types/ids`, Result는 `@workspace/kernel/result`, wire schema는 가장 구체적인 `@workspace/contracts/<context>/<contract>`에서 직접 소비한다.
- 공유 UI는 primitive와 순수 presentation의 소유 의미가 드러나는 좁은 경로만 공개한다.
- config package는 server parser와 browser-safe 설정을 서로 다른 subpath로 분리하고 client graph가 secret-bearing parser를 소비하지 않게 한다.
- auth infra는 learner/admin과 client/server, schema·migration·seed tooling 경계를 분리한다. root barrel과 client/server forwarding 경로는 제공하지 않는다.
- 제품 module은 application port, query·command, HTTP, module factory와 필요한 tooling 경계를 capability 단위 subpath로 공개한다. consumer는 domain·infrastructure 내부 경로를 import하지 않는다.
- schema·migration·seed subpath는 통합 DB tooling과 격리 fixture만 소비한다. 다른 module과 일반 runtime consumer에는 제품 persistence를 공개하지 않는다.
- 현재 export key는 package manifest만 소유한다. package interface 검사는 explicit subpath 형식과 target 존재 여부를 확인하며 별도 exact 목록을 복제하지 않는다.
- 인증 cookie 이름은 `@workspace/contracts/auth-session-cookie`가 canonical 계약으로 소유하며 auth package는 이를 재수출하지 않는다.
- identity profile·session과 관리자 사용자 계약은 `@workspace/contracts/identity/*`, content 관리자 계약은 `@workspace/contracts/content/*`, 학습 HTTP 계약은 `@workspace/contracts/learning/*`의 구체적인 경로에서 가져온다. generated OpenAPI 타입이나 중간 계약 계층을 만들지 않는다.

## Contract data와 wire 경계

| capability          | transport-neutral data                                   | transport에 남는 계약                                    |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| learner command     | step, submission, evaluation, learning state, branded ID | start/complete body·params·response와 AI transition 응답 |
| learner AI coaching | prompt·attempt·provider 결과와 재시도 오류               | idempotency header, coaching 결과와 공개 오류            |
| learner read        | course·lesson·progress item, sort/filter projection      | cursor query, page와 learner HTTP response               |
| admin content       | editor document, projection item, publish/reset data     | course page, archive acknowledgement와 request           |
| admin identity      | admin/user ID·role, user item와 filter 값                | user page, status request와 delete acknowledgement       |
| dashboard·analytics | 운영 projection item와 sort 값                           | analytics page와 HTTP query/response envelope            |
| settings            | 저장된 settings snapshot과 validation limit              | notice/legal request body                                |
| AI chat             | conversation, message와 role                             | message request, list/detail wrapper와 SSE event         |
| AI change proposal  | 안전한 변경 variant와 검토 상태                          | 제안 조회·승인·거절 response                             |
| resource library    | resource ID, document, asset, tree/search item           | request, collection/mutation response wrapper와 error    |

현재 공개 subpath inventory와 owner mapping은 package manifest와 architecture boundary fixture가 소유한다. 정적 검사는 broad contract barrel, transport-only source와 의미 없는 forwarding의 재유입을 거부한다.

## 내부 import 원칙

- workspace 간 import는 `@workspace/*` 공개 subpath를 사용한다.
- module 구현이 canonical DTO 또는 status를 소비할 때는 가장 구체적인 `@workspace/contracts/*` 공개 subpath를, brand ID는 `@workspace/types/ids`를 직접 import한다.
- package 내부 구현은 해당 package의 `#identity/*`, `#content/*`, `#ai-feedback/*`, `#learning/*`, `#resource-library/*`, `#operations/*`, `#auth/*`, `#db/*`, `#ai/*` 같은 private alias를 사용하고 자기 공개 경로를 역참조하지 않는다.
- 앱은 의존 package의 private alias를 import하지 않는다.
- 같은 package의 공개 `@workspace/*` 경로를 구현이 역참조하거나 상대 경로로 우회하지 않는다.
- `packages/shared/ui`는 app, module, DB, HTTP client, auth SDK와 Next.js navigation을 import하지 않는다.
- `packages/shared/kernel`은 workspace runtime package, framework, DB, provider와 `process.env`에 의존하지 않는다. `packages/shared/event-contracts`는 kernel과 types만 의존한다.
- module의 domain·application은 `packages/shared/contracts`의 HTTP DTO를 import하지 않는다.
- `apps/web`과 `apps/admin`은 module, DB와 Drizzle을 import하지 않는다. 앱 내부 의존은 `app → features → entities → shared` 방향을 지키며 client-facing source는 `server` 또는 feature `server` 경계를 import하지 않는다.
- `better-auth` 직접 import는 `packages/infra/auth` 안에서만 허용한다. auth client subpath는 server, DB와 ORM module을 import하지 않는다.
- identity module은 `@workspace/auth` runtime·schema를 직접 import하지 않는다. API auth adapter가 credential table을 읽어 vendor-neutral learner identity directory port를 구현하고, legacy role backfill은 API 통합 migration이 수행한다.
- DB infra는 content module을 import하지 않는다. 기존 curriculum 이관에 필요한 정규화 정책은 API migration 조립 지점이 content 공개 normalization port에서 API-owned legacy 이관으로 주입한다.
- module 공개 `./schema`는 API의 단일 schema tooling entry와 격리된 E2E seed fixture만 소비한다. auth `./schema`는 Better Auth adapter mapping과 인증 persistence adapter가 추가로 소비하는 명시적 예외다.
- 공개 `./migration`은 API의 통합 migration 사전 검사와 migration 호환성 test만 소비한다. module factory는 migration을 실행하지 않는다.
- 실제 seed가 있는 auth, content와 identity만 `./seed`를 공개하며 API seed composition과 seed tooling만 소비한다.
- OpenAI·Mastra, AWS SDK, Pino와 Emittery 직접 import는 각각 `packages/infra/ai`, `storage`, `observability`, `event-bus`로 제한한다.
- API composition과 adapter는 concrete dependency를 조립할 수 있지만 HTTP route, middleware와 response 경계는 DB·Drizzle을 직접 import하지 않는다.
- capability 간 호출은 공개 API 또는 합의된 application port를 사용한다.

runtime graph는 `apps/api composition -> module public facade -> module infrastructure -> infra primitive`다. 인증 graph는 `frontend feature adapter -> auth client`와 `apps/api composition -> auth server runtime -> identity application`으로 나뉜다. 현재 package 계층과 import 방향은 architecture 검사가 판정한다.

## 자동 검증

- `bun run check:architecture`가 runtime cycle, 계층, vendor와 client/server import 경계를 검사한다.
- `bun run check:dead-code`가 사용되지 않는 file·export·dependency를 읽기 전용으로 검사한다.
- `bun run check:workspace-inventory`가 explicit export key·target의 형식과 존재 여부를 검사한다.
- `bun run check:package-interfaces`가 canonical ID·schema 소비, UI·infra의 runtime 비의존, API의 검증 전 env·Clock·ID 경계, 내부 상대 import와 자기 공개 경로 역참조를 검사한다.
- 같은 검사는 API schema aggregator·Drizzle config, migration·test-support의 tooling consumer, DB schema 재공개 금지, reconciliation과 frontend `server-only` 경계를 고정한다. package·module 의존 graph는 `check:architecture`, HTTP parse·migration checksum·event 전달 동작은 각 소유 package의 실행 테스트가 전담한다.
- package test와 typecheck는 정적 graph가 판정할 수 없는 runtime 계약과 type 계약을 검증한다.
