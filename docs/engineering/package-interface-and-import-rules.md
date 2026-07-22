# 패키지 Interface와 import 규칙

## 현재 경계

- `packages/core`는 `admin`, `ai-feedback`, `auth`, `content`, `learning`, `resource-library` 여섯 capability Interface만 공개한다.
- 실행 앱 전용 bootstrap, concrete repository와 infrastructure 구현은 core에서 공개하지 않는다.
- `packages/infra/http-platform`은 Hono/OpenAPI 공통 helper·error·request security와 middleware를 소유하고 endpoint contract와 제품 정책은 API에 남긴다.
- `packages/infra/observability`는 Pino logger와 공통 관측 event 계약을 소유하고 제품별 audit 분류는 API에 남긴다.
- `packages/infra/auth`는 Better Auth server/client integration, 인증 schema·migration, 비밀번호와 session token 정규화를 소유한다. API는 제품 profile·role repository를 주입한다.
- `packages/infra/db`, `ai`, `event-bus`, `storage`, `http-client`는 각각 SQLite primitive, AI provider runtime, process-local event 전달, object storage SDK, transport-neutral HTTP 결과를 소유한다.
- `packages/shared`의 `types`, `kernel`, `errors`, `event-contracts`, `contracts`, `resource-document`, `ui`는 각각 transport-neutral 타입, 최소 실행 원시값, 공통 경계 오류, module 간 event, wire schema, Markdown 변환, 순수 표현 UI를 소유한다.
- 공개 symbol은 package export와 `scripts/fixtures/core-capability-public-surface.json`의 exact snapshot으로 검증한다.

## 공개 Interface 원칙

- 패키지 소비자는 `package.json`의 명시적인 subpath export만 import한다.
- root barrel은 제공하지 않고 기능 또는 UI primitive 단위의 좁은 subpath를 사용한다.
- `packages/core`의 canonical 경로는 `@workspace/core/<module>`이다. `modules/*`, `shared/*`, repository 구현 경로는 외부에 공개하지 않는다.
- canonical ID는 `@workspace/types/ids`, Result는 `@workspace/kernel/result`, wire schema는 가장 구체적인 `@workspace/contracts/<context>/<contract>`에서 직접 소비한다.
- core capability가 제공하는 canonical data는 private forwarding 파일을 거치지 않고 해당 shared package의 구체적인 공개 subpath에서 직접 재수출한다.
- `packages/shared/ui`는 `@workspace/ui/components/ui/button`, `@workspace/ui/components/lesson/match-answer`, `@workspace/ui/lib/utils`처럼 소유 module과 primitive가 드러나는 exact 경로를 사용한다.
- `packages/config/env`는 `@workspace/env/parse-env`, `@workspace/env/local-runtime-defaults`를 제공한다. client runtime config는 server parser를 import하지 않는다.
- `packages/infra/auth`는 learner/admin의 `client`, `server`와 `schema`, `password`, `session-token`, `sqlite-database` subpath만 제공한다. root barrel과 client/server forwarding 경로는 제공하지 않는다.
- 인증 cookie 이름은 `@workspace/contracts/auth-session-cookie`가 canonical 계약으로 소유하며 auth package는 이를 재수출하지 않는다.
- 학습자 HTTP request·response·오류 타입은 `@workspace/contracts/learning/learner-api`, `@workspace/contracts/learning/learner-content`, `@workspace/contracts/learning/api-error`처럼 소유 contract의 exact 경로에서 가져오며 generated OpenAPI 타입이나 중간 계약 계층을 만들지 않는다.

## Contract data와 wire 경계

| capability          | transport-neutral data                                   | transport에 남는 계약                                    |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| learner command     | step, submission, evaluation, learning state, branded ID | start/complete body·params·response와 AI transition 응답 |
| learner read        | course·lesson·progress item, sort/filter projection      | cursor query, page와 learner HTTP response               |
| admin content       | editor document, projection item, publish/reset data     | course page, archive acknowledgement와 request           |
| admin identity      | admin/user ID·role, user item와 filter 값                | user page, status request와 delete acknowledgement       |
| dashboard·analytics | 운영 projection item와 sort 값                           | analytics page와 HTTP query/response envelope            |
| settings            | 저장된 settings snapshot과 validation limit              | notice/legal request body                                |
| AI chat             | conversation, message와 role                             | message request, list/detail wrapper와 SSE event         |
| resource library    | resource ID, document, asset, tree/search item           | request, collection/mutation response wrapper와 error    |

현재 symbol inventory와 owner mapping은 package export snapshot과 architecture boundary fixture가 소유한다. 정적 검사는 broad contract barrel, transport-only source와 의미 없는 forwarding의 재유입을 거부한다.

## 내부 import 원칙

- workspace 간 import는 `@workspace/*` 공개 subpath를 사용한다.
- core 구현이 canonical DTO 또는 status를 소비할 때는 가장 구체적인 `@workspace/contracts/*` 공개 subpath를, brand ID는 `@workspace/types/ids`를 직접 import한다.
- package 내부 구현은 해당 package의 `#auth/*`, `#db/*`, `#ai/*` 같은 private alias를 사용하고 자기 공개 경로를 역참조하지 않는다.
- 앱은 의존 package의 private alias를 import하지 않는다.
- 같은 package의 공개 `@workspace/*` 경로를 구현이 역참조하거나 상대 경로로 우회하지 않는다.
- `packages/core`에는 DB·Drizzle·OpenAI·Better Auth·Hono·Next.js·React runtime dependency를 두지 않는다.
- `packages/shared/ui`는 app, module, core, DB, HTTP client, auth SDK와 Next.js navigation을 import하지 않는다.
- `packages/shared/kernel`은 workspace runtime package, framework, DB, provider와 `process.env`에 의존하지 않는다. `packages/shared/event-contracts`는 kernel과 types만 의존한다.
- module의 domain·application은 `packages/shared/contracts`의 HTTP DTO를 import하지 않는다.
- `apps/web`과 `apps/admin`은 core, DB와 Drizzle을 import하지 않는다.
- `better-auth` 직접 import는 `packages/infra/auth` 안에서만 허용한다. auth client subpath는 server, core, DB와 ORM module을 import하지 않는다.
- OpenAI·Mastra, AWS SDK, Pino와 Emittery 직접 import는 각각 `packages/infra/ai`, `storage`, `observability`, `event-bus`로 제한한다.
- API composition과 adapter는 concrete dependency를 조립할 수 있지만 HTTP route, middleware와 response 경계는 DB·Drizzle을 직접 import하지 않는다.
- capability 간 호출은 공개 API 또는 합의된 application port를 사용한다.

일반 runtime graph는 `apps/api composition -> core public port + app-owned adapter -> infra primitive`다. 인증 graph는 `frontend feature adapter -> auth client`와 `apps/api composition -> auth server runtime + app-owned product repository -> db primitive`로 나뉜다. `packages/core`와 `packages/infra` 사이의 상향·순환 의존은 허용하지 않는다.

## 자동 검증

- `bun run check:architecture`가 runtime cycle, 계층, vendor와 client/server import 경계를 검사한다.
- `bun run check:dead-code`가 사용되지 않는 file·export·dependency를 읽기 전용으로 검사한다.
- `bun run check:package-interfaces`가 shared·infra package의 exact export, canonical ID·schema 소비, provider 소유권, infra의 환경 변수·제품 정책 비의존, core symbol snapshot, 내부 상대 import, 자기 공개 경로 역참조, `src` deep import와 제거된 forwarding/runtime 재도입을 검사한다.
- module의 `./schema`와 `./seed`는 migration·seed 조립 source만 소비할 수 있다.
- package test와 typecheck는 정적 graph가 판정할 수 없는 runtime 계약과 type 계약을 검증한다.
