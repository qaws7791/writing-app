# 패키지 Interface와 import 규칙

## 현재 경계

- `packages/core`는 `admin`, `ai-feedback`, `auth`, `content`, `learning`, `resource-library` 여섯 capability Interface만 공개한다.
- 실행 앱 전용 bootstrap, concrete repository와 infrastructure 구현은 core에서 공개하지 않는다.
- `apps/api/src/http/platform`은 Hono/OpenAPI route·error·request security와 middleware를 소유한다.
- `apps/api/src/observability`는 Pino logger와 request/security audit event 계약을 소유한다.
- 공개 symbol은 package export와 `scripts/fixtures/core-capability-public-surface.json`의 exact snapshot으로 검증한다.

## 공개 Interface 원칙

- 패키지 소비자는 `package.json`의 명시적인 subpath export만 import한다.
- root barrel은 제공하지 않고 기능 또는 UI primitive 단위의 좁은 subpath를 사용한다.
- `packages/core`의 canonical 경로는 `@workspace/core/<module>`이다. `modules/*`, `shared/*`, repository 구현 경로는 외부에 공개하지 않는다.
- core capability가 제공하는 canonical data는 private forwarding 파일을 거치지 않고 `@workspace/contracts/*`에서 직접 재수출한다.
- `packages/ui`는 `@workspace/ui/components/ui/<name>`, `@workspace/ui/components/lesson/<name>`, `@workspace/ui/lib/<name>`처럼 소유 module이 드러나는 경로를 사용한다.
- `packages/env`는 `@workspace/env/parse-env`, `@workspace/env/local-runtime-defaults`를 제공한다. client runtime config는 server parser를 import하지 않는다.
- 학습자 HTTP request·response·오류 타입은 `@workspace/contracts/learning`에서 가져오며 generated OpenAPI 타입이나 중간 계약 계층을 만들지 않는다.

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
- core 구현이 canonical DTO, brand ID 또는 status를 소비할 때는 가장 구체적인 `@workspace/contracts/*` 공개 subpath를 직접 import한다.
- `packages/core`, `packages/ui`, `packages/env` 내부 구현은 `#core/*`, `#ui/*`, `#env/*` private alias를 사용한다.
- 앱은 의존 package의 private alias를 import하지 않는다.
- 같은 package의 공개 `@workspace/*` 경로를 구현이 역참조하거나 상대 경로로 우회하지 않는다.
- `packages/core`에는 DB·Drizzle·OpenAI·Better Auth·Hono·Next.js·React runtime dependency를 두지 않는다.
- `packages/ui`는 app, core, DB, HTTP client, auth SDK와 Next.js navigation을 import하지 않는다.
- `apps/web`과 `apps/admin`은 core, DB와 Drizzle을 import하지 않는다.
- API composition과 adapter는 concrete dependency를 조립할 수 있지만 HTTP route, middleware와 response 경계는 DB·Drizzle을 직접 import하지 않는다.
- capability 간 호출은 공개 API 또는 합의된 application port를 사용한다.

현재 runtime graph는 `apps/api composition -> core public port + app-owned adapter -> db primitive`다. `packages/core -> packages/db`와 `packages/db -> packages/core` 의존은 허용하지 않는다.

## 자동 검증

- contract와 package export snapshot은 허용된 공개 subpath와 symbol을 고정한다.
- core architecture test는 infrastructure re-export와 구현의 capability facade 역참조를 거부한다.
- architecture boundary 검사는 test를 포함한 core source에 canonical contract allowlist를 적용한다.
- import architecture 검사는 내부 상대 import, 자기 공개 경로 역참조, 외부의 core 구현 deep import와 root barrel import를 거부한다.
- `bun run check:package-interfaces`, `bun run check:architecture-boundaries`, package test, typecheck와 `bun run check:import-cycles`를 함께 실행한다.
