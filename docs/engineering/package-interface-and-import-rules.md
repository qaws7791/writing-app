# 패키지 Interface와 import 규칙

## 작업 상태

- 2026-07-18: ADR-0015에 따라 단일 consumer였던 `packages/hono`와 `packages/logger`를 `apps/api`에 흡수했다. Hono/OpenAPI app·route·error·security 표준은 `apps/api/src/http/platform`, Pino와 request/security audit event는 `apps/api/src/observability`, Hono request logging middleware는 HTTP platform이 소유한다. 기존 workspace package와 호환 export는 제거했다.
- 2026-07-18: TypeScript checker로 core의 6개 capability `api/index.ts`가 실제 export하는 349개 symbol 이름을 계산하고 exact fixture와 비교한다. facade의 `export *` 대상에서 symbol이 추가·제거돼도 package-interface 검사가 capability별 `added`·`removed` 목록으로 실패한다. core architecture test는 실제 `#core/modules/<capability>/api/index` 역참조와 모든 facade의 infrastructure export를 거부한다.
- 2026-07-18: MTA-59~64로 관리자 content·identity·dashboard/analytics·settings·AI chat·자료실의 adapter·route를 모두 `apps/api` admin Host sub-app으로 옮겼고 MTA-41에서 이전 관리자 runtime workspace를 제거했다.
- 2026-07-18: learner transition·onboarding과 관리자 dashboard·analytics·AI chat·user query의 1:1 forwarding service/factory/type/test를 제거했다. learner content service는 read-model 검증과 오류 변환 책임에 맞춰 learning capability로 이동했고, production core runtime·private capability allowance는 모두 0개가 됐다. package-interface 검사는 삭제된 production 경로의 재도입을 거부한다.
- 2026-07-17: 관리자 course/reset은 content로, 사용자 상태 변경·soft-delete는 auth로 소유권을 옮기고 조회는 admin의 좁은 reader에 유지했다. `AdminRepository`·`AdminService`·`AdminServicePorts`·`createAdminService`와 전용 파일·test·export를 삭제했으며 package-interface 검사가 같은 파일·symbol의 재도입을 거부한다.
- 2026-07-17: 관리자 settings와 AI chat을 각각 capability-local repository port와 독립 use case composition으로 분리했다. settings는 version·ETag 없는 last-write-wins를 유지하고 AI provider는 app edge에 남는다.
- 2026-07-17: 관리자 dashboard·analytics를 capability-local read-only port와 독립 use case composition으로 분리했다. 두 reader는 learning 날짜 정책을 public capability API로 사용하므로 MTA-35 private allowance를 제거했다.
- 2026-07-17: core production·test 전체의 learning/admin contract 참조를 canonical data entrypoint 8개 exact allowlist로 닫았다. 53개 참조가 모두 canonical이며 broad·legacy·transport source는 0개다. Oxlint와 root architecture inventory가 import·re-export·dynamic·TypeScript import 우회를 독립적으로 차단한다.
- 2026-07-17: 관리자 AI chat 목록·상세·message application 경계를 HTTP/SSE wire에서 분리했다. core는 `admin/ai-chat-data`의 canonical conversation·message·role·ID만 사용하고 Admin API route가 request, list/detail wrapper와 chunk/done/error schema validation을 소유한다. 마지막 broad `admin.dto.ts` forwarding도 제거했다.
- 2026-07-17: 관리자 settings 조회·저장 application 경계를 HTTP request/response validation에서 분리했다. core는 `admin/settings-data`의 canonical snapshot만 사용하고 Admin API route가 notice/legal body와 길이 검증, owner 오류 mapping과 모든 성공 응답 schema validation을 소유한다.
- 2026-07-17: 관리자 dashboard·analytics read query/result를 HTTP query/page wire에서 분리했다. core는 `admin/dashboard-analytics-data`의 canonical snapshot·item·sort만 사용하고 Admin API route가 query 조립, lesson page mapping과 모든 성공 응답 schema validation을 소유한다.
- 2026-07-17: 관리자 user query·status update·soft-delete core command/result/rejection을 HTTP wire에서 분리했다. core는 `admin/identity-data`의 canonical data만 사용하고 Admin API route가 user page·delete acknowledgement, public 오류 mapping과 성공 응답 schema validation을 소유한다.
- 2026-07-17: 학습 시작·단계 완료·AI finalize core command/result/error를 HTTP wire에서 분리했다. core는 `learning/step-data`의 canonical step data만 사용하고 학습자 API route가 body·params·header mapping, public status/error mapping과 성공 응답 schema validation을 소유한다.
- 2026-07-17: 관리자 course·curriculum·content reset core command/result/error를 HTTP wire에서 분리했다. core는 `admin/content-data`의 canonical data만 사용하고 Admin API route가 course page·archive acknowledgement mapping과 성공 응답 schema validation을 소유한다.
- 2026-07-17: 자료실 core의 tree·search·document·asset command/query/result/rejection을 HTTP wire에서 분리했다. core는 `admin/resource-library-data`의 canonical item·MIME만 type-only로 사용하고, Admin API route가 request·actor mapping, public status/error mapping과 response schema validation을 소유한다.
- 2026-07-17: contracts의 canonical data와 HTTP wire를 분류하고 learner command/read, admin content·identity·dashboard/analytics·settings·AI chat·resource-library용 transport-neutral 공개 entrypoint 8개를 추가했다. 기존 core consumer 전환과 broad barrel hard-fail은 MTA-45~48·54~58이 소유한다.
- 2026-07-17: core의 두 API bootstrap export를 제거하고 learner·admin service 조립을 실행 앱에 흡수했다. core는 DB·Drizzle dependency 없이 6개 capability facade만 공개한다.
- 2026-07-17: learner 매칭 정책 공개 subpath를 UI package에서 제거하고 정책·interaction state를 `apps/web` lesson feature로 이동했다.
- 2026-07-17: learner 전용 레슨 초안 저장 구현과 결과 타입을 UI 공개 경로에서 제거하고 `apps/web` client 경계로 이동했다.
- 2026-07-17: `apps/api`가 학습자 DB 생성·close를 소유하도록 옮기고 당시 core learner API bootstrap을 application service 조립만 남긴 축소 seam으로 갱신했다.
- 2026-07-17: 당시 관리자 API 실행 앱이 `createAdminApiCore` entrypoint와 반환 타입을 소유하도록 옮기고 core 관리자 API bootstrap을 service 조립 seam으로 축소했다.
- 2026-07-17: 자료실 tree·document·search·asset Drizzle adapter와 SQLite 통합 테스트를 당시 관리자 API 실행 앱으로 옮기고 core에는 public port·use case·순수 정책만 남겼다.
- 2026-07-17: learner Better Auth와 test auth adapter를 `apps/api`로 옮기고 core auth 공개 면적을 transport-neutral data·port로 제한했다.
- 2026-07-17: 관리자 course/content reset Drizzle adapter와 SQLite fixture를 당시 관리자 API 실행 앱으로 옮기고 순수 page bounds 정책만 core public API로 승격했다.
- 2026-07-17: learner profile과 관리자 user Drizzle adapter를 각 실행 앱으로 옮기고 core composition은 공개 repository port만 입력받도록 축소했다.
- 2026-07-17: OpenAI SDK adapter와 contract test를 `apps/api`로 옮기고 core composition은 `AiFeedbackProvider` port만 입력받도록 축소했다.
- 2026-07-17: AI feedback service의 learning private import를 consumer-owned generic transition port로 바꾸고 prepare/finalize 순수 decision을 learning 공개 API로 제공했다.
- 2026-07-17: learner read-model·profile 통계 Drizzle adapter와 SQLite test를 `apps/api`로 옮기고 core composition은 공개 read repository·profile reader port만 입력받도록 축소했다.
- 2026-07-17: 관리자 settings Drizzle adapter와 SQLite 특성 테스트를 당시 관리자 API 실행 앱으로 옮기고 core composition은 `SettingsRepository` port를 명시적으로 입력받도록 축소했다.
- 2026-07-17: 관리자 AI chat Drizzle adapter와 SQLite 특성 테스트를 당시 관리자 API 실행 앱으로 옮기고 마지막 concrete admin aggregate를 삭제해 core admin seam을 DB-free port 조립으로 축소했다.
- 2026-07-17: core 내부의 의미 없는 canonical contract forwarding 파일 18개를 제거하고 공개 capability Interface는 contract 직접 재수출로 보존했다.
- 2026-07-16: 학습자 웹의 generated OpenAPI 타입 경로를 제거하고 `@workspace/contracts/learning` 직접 소비 경로로 전환했다.
- 2026-07-12: `packages/core`, `packages/ui`, `packages/env` 공개 Interface와 패키지 내부 import 규칙 정비를 완료했다.

## 완료 결과

- core 공개 export는 `admin`, `ai-feedback`, `auth`, `content`, `learning`, `resource-library` 6개 canonical capability Interface다. 실행 앱 전용 bootstrap export와 repository Implementation은 공개하지 않는다.
- 6개 facade의 공개 symbol 이름은 `scripts/fixtures/core-capability-public-surface.json`에 정렬된 exact snapshot으로 고정한다. 새 export와 제거는 같은 변경에서 의도를 검토하고 fixture를 명시적으로 갱신해야 한다.
- `@workspace/core/auth`는 plain session data와 `LearnerProfileRepository`를 공개한다. learner profile Drizzle factory, onboarding forwarding factory와 Better Auth hook·SDK type은 공개하지 않는다.
- UI와 env root barrel 및 호환 pass-through를 제거하고 모든 소비자를 좁은 subpath로 이관했다.
- UI의 `./lib/*` wildcard는 순수 UI helper만 제공하며 browser 저장소 파일은 공개하지 않는다. 레슨 초안 persistence와 로그아웃 정리는 `apps/web`이 소유한다.
- UI의 `./components/lesson/match-presentation` 공개 subpath를 제거했다. `MatchAnswer`는 controlled 표시 계약만 공개하고 learner choice 생성·selection·payload 정책은 `apps/web`이 소유한다.
- core·UI·env·Storybook 내부 import를 package별 private alias로 통일했다. API의 app-local HTTP platform과 observability는 `@/*` 절대 alias를 사용한다.
- core 내부 DTO·brand ID·status 소비자는 가장 구체적인 `@workspace/contracts/*` 공개 subpath를 직접 사용한다. validation이나 정책을 추가하지 않던 forwarding 파일 18개와 그 중복 테스트 경로를 제거했다.
- `@workspace/core/content`, `learning`, `ai-feedback`, `auth`의 canonical contract 타입은 capability facade가 forwarding 파일 없이 직접 재수출한다. Learner content read service는 learning 공개 Interface가 소유한다.
- 학습 전이 port는 `CompleteLearnerStepBody`·`CompleteLearnerStepResult`를 사용하지 않는다. 답안 의도는 `acknowledge | answer` application command로, 결과는 `retry | advanced | lesson-completed` application variant로 표현하며 route는 port의 `completeStep`·`startLesson`을 직접 호출한다.
- export snapshot과 relative/self/deep import negative 검사를 pre-commit에 연결했다.
- Bun 1.3.10 기준 전체 workspace typecheck가 통과한다.
- Bun 1.3.10 기준 전체 14개 test task가 통과한다.
- Storybook production build는 성공했고 story별 subpath chunk와 `workspace-ui` chunk가 생성되는 것을 확인했다.

## 공개 Interface 원칙

- 패키지 소비자는 `package.json`의 명시적인 subpath export만 import한다.
- root barrel은 제공하지 않는다. 기능 또는 UI primitive 단위의 좁은 subpath를 사용한다.
- `packages/core`의 canonical 경로는 `@workspace/core/<module>`이다. `modules/*`, `shared/*`, repository Implementation 경로는 외부에 공개하지 않는다.
- core capability facade가 외부 Interface로 제공하는 canonical data는 private forwarding 파일을 거치지 않고 `@workspace/contracts/*`에서 직접 재수출한다.
- `packages/ui`는 `@workspace/ui/components/ui/<name>`, `@workspace/ui/components/lesson/<name>`, `@workspace/ui/lib/<name>`처럼 소유 module이 드러나는 경로를 사용한다.
- `packages/env`는 parser와 로컬 기본값을 각각 `@workspace/env/parse-env`, `@workspace/env/local-runtime-defaults`에서 제공한다. client runtime config는 parser를 import하지 않는다.
- 학습자 HTTP request·response·오류 타입은 `@workspace/contracts/learning`에서만 가져오며 generated OpenAPI 타입과 `writing-app-api-contract` 중간 계층을 만들지 않는다.
- core가 재사용하는 contract data는 `@workspace/contracts/learning/{step-data,read-data}`와 `@workspace/contracts/admin/{content-data,identity-data,dashboard-analytics-data,settings-data,ai-chat-data,resource-library-data}`의 좁은 entrypoint를 목표 경계로 삼는다. 이 파일들은 기존 canonical schema를 직접 재수출하며 새 schema나 identity mapper를 만들지 않는다.
- HTTP body·params·query·cursor/page·error와 SSE event는 기존 transport contract에 남는다. route는 이를 parse·validation하되 core command/query/result로 넘길 때 transport-neutral data만 재사용한다.

## Contracts data와 wire 경계

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

상세 symbol inventory와 MTA-45~47·54~58 owner mapping은 [MTA-27](./monorepo-target-architecture-plan/mta-27-core-transport-contract-classification.md)에 기록한다. learner command/read, 관리자 content·identity·dashboard/analytics·settings·AI chat과 자료실 consumer 전환은 각각 MTA-45·46, MTA-54~58과 MTA-47에서 완료됐다. MTA-48은 core의 broad `admin`/`learning`, legacy·transport-only source와 제거된 `admin.dto.ts` forwarding의 재유입을 예외 없이 정적으로 금지한다.

## 내부 import 원칙

- workspace 간 import는 `@workspace/*` 공개 subpath를 사용한다.
- core Implementation이 canonical DTO, brand ID 또는 status를 소비할 때는 가장 구체적인 `@workspace/contracts/*` 공개 subpath를 직접 import한다. 의미나 validation을 추가하지 않는 한 줄짜리 core forwarding 파일을 만들지 않는다.
- `packages/core`, `packages/ui`, `packages/env` 내부 Implementation은 각 package 이름이 드러나는 `#core/*`, `#ui/*`, `#env/*` private alias를 사용한다.
- TypeScript source를 직접 소비하는 앱은 의존 패키지의 private alias를 해석하기 위한 mapping만 tsconfig에 둔다. 앱 코드는 이 alias를 import하지 않는다.
- `apps/storybook` 내부 module은 tsconfig와 Vite가 함께 소유하는 `#storybook/*` private alias를 사용하고, builder가 먼저 읽는 설정 module은 package `imports`로 고정한다.
- 같은 패키지의 공개 `@workspace/*` 경로를 Implementation이 역참조하거나 상대 경로로 우회하지 않는다.
- `packages/core`에는 DB·Drizzle·OpenAI·Better Auth·Hono·Next.js·React runtime dependency가 없다. 실행 앱 composition이 core의 공개 port·use case와 app-owned adapter를 조립한다.
- `packages/ui`는 app, core, DB, HTTP client, auth SDK와 Next.js navigation을 import하지 않는다.
- `packages/ui`는 `localStorage` key/version, 사용자 scope와 저장 실패 분류 같은 앱 persistence 정책을 소유하지 않는다.
- `packages/ui` lesson 컴포넌트는 앱의 answer payload나 learner interaction state를 만들지 않고 표시 값과 callback만 소비한다.
- `apps/web`과 `apps/admin`은 core, DB와 Drizzle을 import하지 않는다.
- API 실행 앱의 composition과 adapter는 concrete dependency를 조립할 수 있지만 HTTP route, middleware, response와 target 관리자 transport helper인 `apps/api/src/admin/**`는 DB·Drizzle을 직접 import하지 않는다.
- `apps/api/src/http/platform`은 Hono/OpenAPI route·error·request security와 transport middleware를, `apps/api/src/observability`는 Pino logger와 request/security audit event 계약을 소유한다. 두 경계는 제거한 platform·logger workspace의 호환 import를 제공하지 않는다.
- app-local `@/adapters/**/**.repository` import는 실행 앱 composition과 같은 capability test에서 허용한다. target 관리자 capability의 adapter는 `apps/api/src/adapters/**`에 두며, `#core/**.repository`나 core private infrastructure deep import는 허용하지 않는다.
- core의 learner·admin API bootstrap 전환 seam은 제거됐다. learner와 admin app composition은 각 capability facade의 공개 port·의미 있는 use case만 소비하며 core private path나 compatibility wrapper를 사용하지 않는다.
- capability 간 호출은 공개 API 또는 합의된 application port를 사용한다. 현재 production private capability edge와 allowance는 모두 0개이며 새 private edge는 허용하지 않는다.

[ADR-0014](./adr/ADR-0014-app-owned-persistence-adapters.md)의 target graph는 `apps/api composition -> core public port + app-owned adapter -> db primitive`다. `packages/core -> packages/db`와 `packages/db -> packages/core`는 모두 0이며 learner/admin SQLite lifecycle과 여섯 관리자 capability adapter는 `apps/api`가 소유한다. Compose/Caddy source가 이 topology를 가리키는 것은 검증됐지만, 외부 운영 적용·관찰은 이번 작업의 검증 범위에서 제외했다.

## 자동 검증

- contracts package 공개 export snapshot은 transport-neutral entrypoint 8개와 기존 호환 export를 함께 고정한다. entrypoint test는 기존 schema reference identity와 body/query/page/SSE wire 비노출을 검증한다.
- package export snapshot은 허용된 공개 subpath가 의도 없이 늘어나는 것을 막는다. TypeScript checker 기반 core public-surface snapshot은 6개 facade의 transitive `export *`까지 실제 symbol 이름으로 해석해 capability별 added/removed를 실패시킨다.
- core architecture test는 모든 capability facade의 infrastructure re-export와 facade가 아닌 core 구현의 `#core/modules/<capability>/api/index` 역참조를 거부한다.
- 제거된 관리자 application aggregate와 dashboard·analytics·AI chat·user query forwarding 파일, admin facade 재수출과 `AdminRepository`·`AdminService`·`AdminServicePorts`·`createAdminService` top-level symbol은 package-interface 검사에서 금지한다.
- package Interface 검사는 MTA-7과 MTA-37에서 제거한 core forwarding·dead reader 파일의 exact path가 다시 생성되는 것을 거부한다. learner onboarding·transition forwarding, 이전 content-owned learner service 경로, HTTP wire·canonical data 혼합 `admin.dto.ts`도 재도입 금지 대상으로 고정한다.
- Oxlint는 core의 static·type-only import, named/all re-export, literal·무치환 template dynamic import, TypeScript import type·import-equals에 exact canonical allowlist를 적용한다. target을 증명할 수 없는 computed dynamic import도 core 전체에서 거절한다.
- architecture boundary 검사는 test를 포함한 core source inventory에 같은 exact allowlist를 allowance 없이 적용한다. 유사 package prefix는 다른 package로 취급하고 canonical source의 추가 하위 경로도 묵시적으로 허용하지 않는다.
- import architecture 검사는 내부 상대 import, 자기 공개 경로 역참조, 외부의 `core` Implementation deep import와 root barrel import를 거부한다.
- `bun run check:architecture-boundaries`는 신규 위반뿐 아니라 이미 제거된 위반의 stale allowance도 실패시킨다. 각 allowance는 제거 작업 ID를 가진다.
- `bun run check:package-interfaces`, `bun run check:architecture-boundaries`, package test, typecheck와 `bun run check:import-cycles`를 함께 실행한다.
