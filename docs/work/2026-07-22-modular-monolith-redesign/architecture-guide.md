# 글결 목표 아키텍처 온보딩 & 개발 가이드

> 상태: 목표 아키텍처 명세  
> 적용 시점: 전체 아키텍처 개편 완료 후  
> 용도: 개편 작업의 구현 기준과 완료 조건

이 문서는 현재 repository 구조를 설명하지 않는다. 내일 진행할 전체 개편이 도달해야 할 목표 구조를 정의한다. 현재 package, route, schema와 실행 명령은 개편이 완료될 때까지 코드와 [`docs/authority-map.md`](../../authority-map.md)가 가리키는 권위 소스에서 확인한다.

개편이 끝나면 이 문서의 영구 결론을 관련 `docs/engineering/*` 문서에 반영하고, 이 작업 디렉터리는 `docs/archive/2026-07-22-modular-monolith-redesign/`로 이동한다.

---

## 0. TL;DR

- **모노레포**: Bun workspace + Turborepo.
- **실행 앱**: `web`, `admin`, `api`, `storybook`.
- **배포 모델**: 학습자·관리자 HTTP 표면을 하나의 API runtime으로 운영하는 modular monolith.
- **비즈니스 모듈**: `learning`, `content`, `identity`, `ai-feedback`, `resource-library`, `operations`.
- **패키지 그룹**: `packages/modules`, `packages/infra`, `packages/shared`, `packages/config`.
- 그룹 디렉터리는 탐색을 위한 물리적 분류일 뿐 package scope가 아니다. package 이름은 항상 `@workspace/<name>`이다.
- 각 비즈니스 모듈은 `domain/application/infrastructure/interface` 수직 슬라이스를 소유한다.
- 의존성은 단방향이며 domain과 application은 framework, DB, provider를 알지 못한다.
- 예상 가능한 실패는 `neverthrow`의 `Result`와 `ResultAsync`로 표현한다.
- aggregate는 mutable event queue 대신 다음 상태와 event를 함께 담은 immutable decision을 반환한다.
- 다른 모듈의 내부 코드와 table에는 접근하지 않는다. 동기 공개 port 또는 domain event로 협력한다.
- DB는 Bun SQLite + Drizzle을 유지한다. 각 모듈은 자기 schema를 소유하며 cross-module FK와 join을 만들지 않는다.
- HTTP wire schema의 단일 소유자는 `@workspace/contracts`다.
- 외부 dependency는 실제 import하는 workspace가 직접 선언하며, 공통 version은 root Bun catalog가 소유한다.
- dependency graph와 architecture rule은 dependency-cruiser, 미사용 코드는 Knip, 파일 내부 lint는 Oxlint가 맡는다.
- `@workspace/core`와 기존 평면 package 경로는 최종 구조에 남기지 않는다.

---

## 1. 아키텍처 철학

### 1.1 modular monolith를 선택하는 이유

글결은 학습, 콘텐츠 운영, 사용자·관리자 identity, AI 코칭, 자료실과 운영 분석이 함께 동작하는 제품이다. 이 경계들을 처음부터 독립 서비스로 배포하면 현재 팀과 운영 규모보다 network, 배포, 관측과 장애 복구 비용이 커진다.

따라서 다음 두 목표를 함께 만족한다.

- 배포 단위는 단순하게 유지한다: 학습자 웹, 관리자 웹과 하나의 API runtime.
- 코드 단위는 독립적으로 유지한다: 각 bounded context는 자기 규칙, use case, persistence와 HTTP interface를 소유한다.

서비스 분리 가능성은 "나중에 쉽게 분리할 수 있다"는 문구가 아니라 다음 구조로 증명한다.

- 다른 모듈의 table과 repository를 직접 사용하지 않는다.
- cross-module FK와 SQL join을 만들지 않는다.
- 공개 port와 event contract만 경계를 넘는다.
- 외부 I/O와 runtime lifecycle을 가장자리에 둔다.
- package public surface와 dependency graph를 CI에서 검증한다.

### 1.2 최상위 의존성 방향

```text
apps/api ───────────────→ modules ───────────────→ infra ───────────────→ shared
   │                         │                         │                       │
   └─────────────────────────┴─────────────────────────┴───────────────────────┘
                                  config

apps/web · apps/admin ─────→ infra/http-client · infra/auth + shared
apps/storybook ────────────→ shared/ui
```

`config`는 runtime layer가 아니라 build·runtime 설정을 제공하는 독립 그룹이다. 다른 내부 package에 의존하지 않는다.

`shared/ui`는 React를 사용하는 별도 트랙이다. domain kernel과 동일한 순수성 규칙을 적용하지 않지만, API 호출, routing, 인증과 비즈니스 상태 전이는 소유하지 않는다.

### 1.3 모듈 내부 의존성 방향

```text
interface/http ──→ application ──→ domain
                         ↑             ↑
infrastructure ──────────┘─────────────┘

module.ts ──→ 해당 모듈의 모든 계층을 조립
```

| 계층             | 소유 책임                                       | 허용 의존성                                             | 금지                                               |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| `domain`         | entity, value object, policy, invariant, event  | `kernel`, `types`, `errors`                             | DB, HTTP, React, Hono, provider SDK, `process.env` |
| `application`    | command, query, port, transaction orchestration | domain, 자기 port, `kernel`, `types`, `event-contracts` | concrete repository, Hono, Drizzle, provider SDK   |
| `infrastructure` | schema, repository 구현, module 전용 adapter    | domain, application port, infra package                 | 새로운 비즈니스 규칙, 다른 모듈 table              |
| `interface/http` | route, 인증 actor 추출, Result→HTTP 변환        | application, `contracts`, `http-platform`               | DB, repository, domain entity 직렬화               |
| `module.ts`      | module 내부 dependency 조립                     | 자기 모듈의 모든 계층                                   | 비즈니스 규칙                                      |

### 1.4 모듈 간 통신

세 경로만 허용한다.

| 경로                  | 사용 조건                                     | 예시                                                   |
| --------------------- | --------------------------------------------- | ------------------------------------------------------ |
| 공개 query port       | 즉시 필요한 조회                              | `learning`이 published curriculum을 `content`에서 조회 |
| 공개 application port | 주요 사용자 command에 반드시 필요한 동기 작업 | `learning`이 `ai-feedback`에 코칭 생성을 요청          |
| domain event          | commit 뒤의 비핵심 후속 효과                  | 레슨 완료 뒤 감사 신호 발행                            |

모든 동기 port는 `apps/api` composition root가 주입한다. 모듈은 다른 모듈 package의 내부 경로를 import하지 않는다.

domain event는 다음 의미를 갖는다.

- DB commit 뒤 발행한다.
- listener 순서에 의존하지 않는다.
- listener 실패가 이미 commit된 DB 상태를 rollback하지 않는다.
- 반드시 전달돼야 하는 event에는 in-memory bus를 사용하지 않는다.
- 다중 API instance나 durable delivery가 필요하면 transactional outbox, replay, checkpoint와 reconciliation을 함께 설계한다.

---

## 2. 목표 repository 구조

```text
writing-app/
├── apps/
│   ├── web/                         # 학습자 Next.js 앱
│   ├── admin/                       # 운영자 Next.js 앱
│   ├── api/                         # 단일 Hono runtime과 composition root
│   └── storybook/                   # 공유 UI 개발·검증 surface
│
├── packages/
│   ├── modules/
│   │   ├── learning/
│   │   ├── content/
│   │   ├── identity/
│   │   ├── ai-feedback/
│   │   ├── resource-library/
│   │   └── operations/
│   │
│   ├── infra/
│   │   ├── db/
│   │   ├── auth/
│   │   ├── ai/
│   │   ├── event-bus/
│   │   ├── storage/
│   │   ├── observability/
│   │   ├── http-client/
│   │   └── http-platform/
│   │
│   ├── shared/
│   │   ├── kernel/
│   │   ├── types/
│   │   ├── errors/
│   │   ├── event-contracts/
│   │   ├── contracts/
│   │   ├── resource-document/
│   │   └── ui/
│   │
│   └── config/
│       ├── typescript-config/
│       ├── nextjs-config/
│       └── env/
│
├── dependency-cruiser.config.mjs
├── knip.json
├── turbo.json
├── package.json
└── bun.lock
```

디렉터리 그룹을 package 이름에 포함하지 않는다.

```text
packages/modules/learning      → @workspace/learning
packages/infra/db              → @workspace/db
packages/shared/contracts      → @workspace/contracts
packages/config/env            → @workspace/env
```

### 2.1 앱 책임

| 앱                     | 책임                                               | 금지                          |
| ---------------------- | -------------------------------------------------- | ----------------------------- |
| `@workspace/web`       | 학습자 routing, 화면 조립, API 소비                | module·DB·Drizzle 직접 import |
| `@workspace/admin`     | 관리자 routing, 편집 UI, API 소비                  | module·DB·Drizzle 직접 import |
| `@workspace/api`       | 공통 middleware, module·infra 최종 조립, lifecycle | domain 규칙과 repository 구현 |
| `@workspace/storybook` | UI story와 interaction·a11y 검증                   | 제품 API, 인증, module import |

별도 worker 앱은 만들지 않는다. queue와 독립 배포 lifecycle이 필요한 제품 요구가 확인될 때 새 runtime으로 추가한다.

### 2.2 비즈니스 모듈 책임

| package                       | 책임                                                          | 주요 협력 경계                                              |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `@workspace/learning`         | 코스 탐색, 레슨 진행, 답안, 학습 상태, 활동일                 | content query, identity query, AI feedback application port |
| `@workspace/content`          | curriculum draft, immutable published revision, 발행, 보관    | learning에 published content query 제공                     |
| `@workspace/identity`         | 학습자 profile, 사용자 상태, 관리자 role·owner 정책, 비식별화 | auth가 인증한 identity를 제품 사용자로 해석                 |
| `@workspace/ai-feedback`      | 코칭 prompt, 응답 검증, 시도 정책과 기록                      | AI provider port, learning에 동기 application port 제공     |
| `@workspace/resource-library` | 자료 tree, Markdown 문서, 검색, 휴지통, asset metadata        | storage port, resource-document codec                       |
| `@workspace/operations`       | dashboard, analytics, 공지·법적 문서, 관리자 AI 대화·승인     | 다른 모듈의 reporting query port 조합                       |

`operations`는 다른 모듈의 table을 읽지 않는다. `identity`, `learning`, `content`가 제공하는 reporting query port를 병렬 호출해 응답을 조립한다. durable outbox가 없는 동안 in-memory event로 권위 projection을 만들지 않는다.

### 2.3 infra package 책임

| package                    | 책임                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `@workspace/db`            | Bun SQLite connection, transaction, migration runner, destructive guard             |
| `@workspace/auth`          | Better Auth learner/admin client·server integration, credential와 session lifecycle |
| `@workspace/ai`            | OpenAI client, Mastra runtime, timeout·abort와 provider 오류 정규화                 |
| `@workspace/event-bus`     | Emittery v2 기반 typed in-memory dispatch                                           |
| `@workspace/storage`       | AWS SDK v3 기반 Cloudflare R2 object adapter                                        |
| `@workspace/observability` | Pino logger, request·security·audit event 기반                                      |
| `@workspace/http-client`   | fetch 실패와 contract 실패를 구분하는 공통 transport                                |
| `@workspace/http-platform` | Hono context, route/OpenAPI helper와 공통 HTTP security 기반                        |

Redis cache, BullMQ, email, push, feature flag package는 만들지 않는다. 실제 제품 요구와 운영 owner가 생길 때만 추가한다.

### 2.4 shared package 책임

| package                        | 책임                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| `@workspace/kernel`            | neverthrow 재노출, Clock, IdGenerator, DomainEvent, DomainDecision |
| `@workspace/types`             | Brand와 transport-neutral ID                                       |
| `@workspace/errors`            | 공통 infrastructure·transport 오류 vocabulary                      |
| `@workspace/event-contracts`   | 모듈 간 event 이름과 payload                                       |
| `@workspace/contracts`         | Zod 기반 HTTP request·response·공개 오류 계약                      |
| `@workspace/resource-document` | GFM, AST, Lexical headless 변환과 검증                             |
| `@workspace/ui`                | 두 앱과 Storybook의 표현·접근성 primitive                          |

`@workspace/utils`, `common`, `helpers` 같은 포괄 package는 만들지 않는다. 둘 이상의 독립 consumer와 독립적인 변경 이유가 확인된 책임만 좁은 이름으로 추출한다.

### 2.5 config package 책임

| package                        | 책임                                    |
| ------------------------------ | --------------------------------------- |
| `@workspace/typescript-config` | strict TypeScript base와 runtime별 확장 |
| `@workspace/nextjs-config`     | CSP와 security header helper            |
| `@workspace/env`               | env parser와 local runtime default      |

ESLint, Prettier, Tailwind와 Vitest config package는 만들지 않는다. Oxlint와 Oxfmt는 root 설정을 사용하고, runtime별 test config는 해당 workspace가 소유한다.

---

## 3. 기술 선택

| 영역              | 목표 선택                                      | 적용 원칙                                     |
| ----------------- | ---------------------------------------------- | --------------------------------------------- |
| package manager   | Bun workspace                                  | package import 소유권과 catalog를 사용        |
| task runner       | Turborepo                                      | build, lint, typecheck, test graph            |
| language          | TypeScript strict                              | 의미 있는 brand와 exhaustive union            |
| learner/admin web | Next.js App Router + React                     | Server Component 우선                         |
| API               | Hono + OpenAPI                                 | module-owned route, unified runtime           |
| validation        | Zod                                            | 모든 신뢰 경계에서 canonical schema 사용      |
| DB                | Bun SQLite + Drizzle                           | module-owned schema, unified migration        |
| auth              | Better Auth                                    | learner Google OAuth와 admin ID/password 분리 |
| AI                | OpenAI + Mastra                                | provider 기반과 제품 prompt 분리              |
| event bus         | Emittery v2                                    | async completion·AggregateError 관찰          |
| object storage    | AWS SDK v3 + Cloudflare R2                     | 자료실 이미지 전용                            |
| logging           | Pino                                           | 구조화 로그와 request ID                      |
| styling/UI        | Tailwind CSS + shared UI                       | API·routing 없는 표현 package                 |
| editor            | Lexical + GFM codec                            | React editor와 headless document codec 분리   |
| architecture      | dependency-cruiser                             | graph, cycle, boundary의 단일 구현            |
| dead code         | Knip                                           | unused file, export와 dependency              |
| lint/format       | Oxlint + Oxfmt                                 | root 단일 설정                                |
| test              | Vitest, Testing Library, Storybook, Playwright | 계층별 검증                                   |

정확한 version은 root·workspace manifest와 lockfile이 소유한다. 이 문서의 기술명은 선택과 경계를 설명하며 version 값을 복제하지 않는다.

---

## 4. workspace와 task 설정

### 4.1 root `package.json`

```json
{
  "name": "writing-app",
  "private": true,
  "catalog": {
    "drizzle-orm": "0.45.2",
    "hono": "4.12.29",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "typescript": "5.9.3",
    "vitest": "4.1.10",
    "zod": "4.4.3"
  },
  "workspaces": [
    "apps/*",
    "packages/modules/*",
    "packages/infra/*",
    "packages/shared/*",
    "packages/config/*"
  ],
  "scripts": {
    "build": "turbo build",
    "check:architecture": "depcruise apps packages --config dependency-cruiser.config.mjs",
    "check:dead-code": "knip",
    "dev": "turbo dev",
    "format": "oxfmt",
    "format:check": "oxfmt --check",
    "lint": "bun run check:architecture && bun run check:dead-code && oxlint apps packages scripts --deny-warnings",
    "test": "turbo test",
    "typecheck": "turbo typecheck"
  },
  "packageManager": "bun@1.3.10",
  "engines": {
    "node": "24.x"
  }
}
```

version 값은 작성 시점 root manifest와 lockfile의 해석 결과를 사용했다. 개편 실행 전에 다시 대조하고, version이 바뀌었다면 문서가 아니라 manifest와 lockfile 값을 따른다.

### 4.2 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^test"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

### 4.3 dependency 소유권

- source가 import하는 외부 package는 해당 workspace가 직접 선언한다.
- runtime source import는 `dependencies`, test·build·lint 전용 import는 `devDependencies`다.
- host runtime이 제공할 계약은 `peerDependencies`와 개발용 `devDependencies`를 함께 사용한다.
- 내부 package는 `workspace:*`를 사용한다.
- 둘 이상의 workspace가 사용하는 외부 dependency는 root Bun catalog의 exact version을 사용한다.
- 단일 workspace만 사용하는 dependency는 해당 manifest가 직접 version을 소유한다.
- hoisting과 전이 dependency에 기대는 import는 금지한다.
- intentional version drift에는 근거, owner와 제거 조건이 필요하다.
- Syncpack은 사용하지 않는다.

---

## 5. architecture와 dead-code 검증

### 5.1 dependency-cruiser

dependency-cruiser는 graph, cycle, package 선언과 architecture boundary의 단일 구현이다. 같은 규칙을 Oxlint나 별도 custom graph parser에 복제하지 않는다. `$1` group matching은 [공식 rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)의 `to.pathNot` 의미를 따른다.

```js
// dependency-cruiser.config.mjs
const source = "^(apps|packages)/"

export default {
  forbidden: [
    {
      name: "no-circular-runtime-dependencies",
      severity: "error",
      from: { path: source },
      to: { circular: true, dependencyTypesNot: ["type-only"] },
    },
    {
      name: "no-unlisted-dependencies",
      severity: "error",
      from: { path: source },
      to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
    },
    {
      name: "config-does-not-depend-on-workspaces",
      severity: "error",
      from: { path: "^packages/config/" },
      to: { path: "^(apps|packages/(modules|infra|shared))/" },
    },
    {
      name: "shared-does-not-depend-up",
      severity: "error",
      from: { path: "^packages/shared/" },
      to: { path: "^(apps|packages/(modules|infra))/" },
    },
    {
      name: "infra-does-not-depend-on-modules-or-apps",
      severity: "error",
      from: { path: "^packages/infra/" },
      to: { path: "^(apps|packages/modules)/" },
    },
    {
      name: "modules-do-not-import-other-module-internals",
      severity: "error",
      from: { path: "^packages/modules/([^/]+)/" },
      to: {
        path: "^packages/modules/",
        pathNot: "^packages/modules/$1/",
      },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      from: { path: "^packages/modules/[^/]+/src/domain/" },
      to: {
        path: "^(apps|packages/(infra|modules/[^/]+/src/(application|infrastructure|interface)))/",
      },
    },
    {
      name: "application-does-not-import-concrete-adapters",
      severity: "error",
      from: { path: "^packages/modules/[^/]+/src/application/" },
      to: { path: "^packages/modules/[^/]+/src/(infrastructure|interface)/" },
    },
    {
      name: "frontends-do-not-import-server-domain-or-db",
      severity: "error",
      from: { path: "^apps/(web|admin)/" },
      to: {
        path: "^packages/(modules|infra)/",
        pathNot: "^packages/infra/(auth|http-client)/",
      },
    },
    {
      name: "storybook-only-consumes-ui-and-config",
      severity: "error",
      from: { path: "^apps/storybook/" },
      to: {
        path: "^packages/",
        pathNot: "^packages/(shared/ui|config)/",
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
}
```

정규식 capture 동작과 workspace alias resolution은 fixture로 검증한다. 규칙 예외를 넓은 directory allowance로 추가하지 않는다.

### 5.2 Knip

```json
{
  "$schema": "https://unpkg.com/knip/schema.json",
  "workspaces": {
    "apps/*": {},
    "packages/modules/*": {},
    "packages/infra/*": {},
    "packages/shared/*": {},
    "packages/config/*": {}
  }
}
```

- CI는 읽기 전용 `bun run check:dead-code`만 실행한다.
- `knip --fix`는 삭제를 수반하므로 diff를 직접 검토할 때만 사용한다.
- dynamic entry의 실제 오탐만 좁게 선언한다.
- 생성물 전체를 ignore해 실제 source 누락을 숨기지 않는다.

Knip 설정과 workspace 해석은 [공식 문서](https://knip.dev/)를 기준으로 갱신한다.

### 5.3 public surface 검증

- package consumer는 manifest의 explicit subpath만 import한다.
- broad root barrel은 제공하지 않는다.
- module의 public symbol은 package interface test로 고정한다.
- schema와 seed entry는 tooling-only consumer allowlist를 둔다.
- private alias와 자기 package public path 역참조를 검사한다.
- forwarding file과 삭제된 `@workspace/core` 식별자의 재도입을 거부한다.

---

## 6. package interface 규칙

### 6.1 module manifest

```json
{
  "name": "@workspace/learning",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./api": "./src/api/index.ts",
    "./module": "./src/module.ts",
    "./schema": "./src/infrastructure/persistence/schema.ts",
    "./seed": "./src/infrastructure/persistence/seed.ts"
  },
  "imports": {
    "#learning/*": "./src/*"
  },
  "scripts": {
    "lint": "oxlint .",
    "test": "vitest run --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workspace/contracts": "workspace:*",
    "@workspace/db": "workspace:*",
    "@workspace/errors": "workspace:*",
    "@workspace/event-bus": "workspace:*",
    "@workspace/event-contracts": "workspace:*",
    "@workspace/http-platform": "workspace:*",
    "@workspace/kernel": "workspace:*",
    "@workspace/types": "workspace:*",
    "drizzle-orm": "catalog:",
    "hono": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@workspace/typescript-config": "workspace:*",
    "vitest": "catalog:"
  }
}
```

`./seed`는 실제 seed를 가진 module에만 둔다. 사용하지 않는 entry를 템플릿으로 미리 만들지 않는다.

### 6.2 import 규칙

- workspace 간 import: `@workspace/<package>/<subpath>`.
- package 내부 import: `#<package>/*` private alias.
- 상대 import, file extension이 붙은 import와 `src` deep import를 사용하지 않는다.
- 같은 package 구현이 자기 공개 `@workspace/*` path를 역참조하지 않는다.
- `./schema`와 `./seed`는 migration·seed composition만 사용한다.
- `web`과 `admin`은 module package를 import하지 않는다.
- module의 domain·application은 `contracts`의 HTTP schema를 import하지 않는다.

---

## 7. shared 기반

### 7.1 `@workspace/kernel`

```ts
// packages/shared/kernel/src/result.ts
export {
  ResultAsync,
  err,
  errAsync,
  ok,
  okAsync,
  type Result,
} from "neverthrow"
```

```ts
// packages/shared/kernel/src/domain-event.ts
export type DomainEvent<TType extends string, TPayload> = Readonly<{
  id: string
  occurredAt: Date
  payload: Readonly<TPayload>
  type: TType
}>

export type DomainDecision<TAggregate, TEvent> = Readonly<{
  aggregate: TAggregate
  events: readonly TEvent[]
}>
```

```ts
// packages/shared/kernel/src/clock.ts
export type Clock = Readonly<{
  now: () => Date
}>

export type IdGenerator<TId> = Readonly<{
  next: () => TId
}>
```

domain과 application은 `new Date()`, `Date.now()`와 `crypto.randomUUID()`를 직접 호출하지 않는다. production adapter는 composition root에서 주입하고 test는 고정 값을 사용한다.

`AggregateRoot`에 mutable event 배열을 두지 않는다. domain method는 `DomainDecision`으로 다음 상태와 event를 함께 반환한다.

### 7.2 `@workspace/types`

```ts
// packages/shared/types/src/brand.ts
declare const brandSymbol: unique symbol

export type Brand<TValue, TName extends string> = TValue & {
  readonly [brandSymbol]: TName
}
```

```ts
// packages/shared/types/src/ids.ts
import type { Brand } from "#types/brand"

export type AdminId = Brand<string, "AdminId">
export type ConversationId = Brand<string, "ConversationId">
export type CourseId = Brand<string, "CourseId">
export type CurriculumVersionId = Brand<string, "CurriculumVersionId">
export type LearnerId = Brand<string, "LearnerId">
export type LessonId = Brand<string, "LessonId">
export type LessonStepId = Brand<string, "LessonStepId">
export type LessonStepItemId = Brand<string, "LessonStepItemId">
export type MessageId = Brand<string, "MessageId">
export type ResourceAssetId = Brand<string, "ResourceAssetId">
export type ResourceDocumentId = Brand<string, "ResourceDocumentId">
export type ResourceFolderId = Brand<string, "ResourceFolderId">
export type ResourceNodeId = ResourceDocumentId | ResourceFolderId
export type UnitId = Brand<string, "UnitId">
export type UserId = Brand<string, "UserId">
```

문자열 cast는 Zod transform이나 신뢰 경계 factory 한 곳에서만 수행한다.

### 7.3 오류 모델

예상 가능한 domain·application 실패는 `Error` subclass가 아니라 immutable discriminated union이다.

```ts
export type LearningError =
  | { readonly kind: "answer-rejected"; readonly reason: string }
  | { readonly kind: "lesson-not-found"; readonly lessonId: LessonId }
  | { readonly kind: "step-already-completed"; readonly stepId: LessonStepId }
```

`interface/http`는 exhaustive `switch`로 공개 error code와 status를 선택한다. infrastructure는 원본 exception을 구조화 로그용 cause로 보존하되 공개 응답에 provider 원문, stack, secret과 개인정보를 노출하지 않는다.

### 7.4 `@workspace/event-contracts`

```ts
// packages/shared/event-contracts/src/workspace-event.ts
import type { DomainEvent } from "@workspace/kernel/domain-event"
import type {
  CourseId,
  LearnerId,
  LessonId,
  ResourceDocumentId,
  UserId,
} from "@workspace/types/ids"

export type WorkspaceEventMap = {
  readonly "ai-feedback.completed": DomainEvent<
    "ai-feedback.completed",
    { readonly learnerId: LearnerId; readonly lessonId: LessonId }
  >
  readonly "content.curriculum-published": DomainEvent<
    "content.curriculum-published",
    { readonly courseId: CourseId; readonly revision: number }
  >
  readonly "identity.user-status-changed": DomainEvent<
    "identity.user-status-changed",
    {
      readonly status: "active" | "deleted" | "suspended"
      readonly userId: UserId
    }
  >
  readonly "learning.lesson-completed": DomainEvent<
    "learning.lesson-completed",
    { readonly learnerId: LearnerId; readonly lessonId: LessonId }
  >
  readonly "resource-library.document-saved": DomainEvent<
    "resource-library.document-saved",
    { readonly documentId: ResourceDocumentId; readonly version: number }
  >
}

export type WorkspaceEventName = keyof WorkspaceEventMap
```

event 계약에는 entity, repository, use case와 HTTP DTO를 넣지 않는다.

### 7.5 `@workspace/contracts`

- request, response와 공개 오류의 canonical Zod schema를 소유한다.
- `learning`, `content`, `identity`, `ai-feedback`, `resource-library`, `operations` subpath로 나눈다.
- root barrel을 제공하지 않는다.
- module HTTP interface와 두 frontend가 같은 schema를 사용한다.
- domain과 application은 wire schema를 import하지 않는다.
- runtime OpenAPI는 실제 등록 route에서 생성한다.
- 정적 OpenAPI 사본과 generated TypeScript client를 repository에 저장하지 않는다.

### 7.6 `@workspace/resource-document`

- GFM Markdown을 유일한 문서 domain 원본으로 유지한다.
- Markdown AST parsing·serialization, Lexical headless 변환과 validation을 제공한다.
- `resource-library` module과 `apps/admin`이 소비한다.
- Lexical React editor, 화면 state와 command UI는 `apps/admin` 자료실 feature가 소유한다.
- tree, 권한, 저장, version conflict와 asset lifecycle은 `resource-library` module이 소유한다.

### 7.7 `@workspace/ui`

- `components/ui/*`: 접근성 primitive.
- `components/lesson/*`: 데이터와 command를 props로만 받는 학습 표현.
- `lib/*`: class name과 표현 전용 helper.
- API, auth, DB, module, Next navigation을 import하지 않는다.
- root barrel을 제공하지 않는다.
- React는 peer dependency로 선언하고 앱·Storybook이 runtime version을 소유한다.

---

## 8. infra 기반

### 8.1 `@workspace/db`

```ts
// packages/infra/db/src/sqlite-database.ts
import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

export function createSqliteDatabase(filename: string) {
  const sqlite = new Database(filename, { create: true })
  const db = drizzle(sqlite)

  return {
    close: () => sqlite.close(),
    db,
  }
}

export type SqliteDatabase = ReturnType<typeof createSqliteDatabase>["db"]
```

`@workspace/db`는 module schema를 import하지 않는다. connection, transaction, migration 실행 primitive, backup·restore helper와 destructive-operation guard만 제공한다.

### 8.2 `@workspace/event-bus`

| 후보                   | 장점                                                                 | 이 구조에서의 한계                                                              | 판단 |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---- |
| Node.js `EventEmitter` | 추가 dependency 없음, 익숙한 API                                     | `emit()`이 동기이며 async listener 완료·실패를 기다리지 않음                    | 제외 |
| EventEmitter3          | 작고 빠르며 Node API와 유사                                          | 핵심 의미가 동기 dispatch라 use case의 async 완료 관찰과 맞지 않음              | 제외 |
| mitt                   | 매우 작고 wildcard가 단순함                                          | browser 중심의 최소 API이며 async 오류 집계와 lifecycle 계약을 직접 만들어야 함 | 제외 |
| typed-emitter          | Node EventEmitter에 compile-time type을 추가                         | type-only wrapper라 runtime의 동기 dispatch 의미는 그대로임                     | 제외 |
| Emittery v2            | typed event map, async `emit()`, listener 완료 대기와 다중 실패 집계 | in-memory 한정, durable delivery 없음                                           | 채택 |

현재 runtime floor인 Node.js 24는 Emittery v2의 Node.js 22 이상 요구를 만족한다. 선택 이유는 기능 수가 아니라 **publish 완료와 listener 실패를 `ResultAsync`로 관찰할 수 있는 의미**다. 처리량이 실제 병목이라는 측정이 생기기 전에는 micro-benchmark 우위를 위해 이 계약을 바꾸지 않는다.

비교 근거는 [Node.js Events](https://nodejs.org/api/events.html), [EventEmitter3](https://github.com/primus/eventemitter3), [mitt](https://github.com/developit/mitt), [typed-emitter](https://github.com/andywer/typed-emitter)와 [Emittery](https://github.com/sindresorhus/emittery)의 공식 문서다.

```ts
// packages/infra/event-bus/src/event-bus.ts
import Emittery from "emittery"
import { ResultAsync } from "@workspace/kernel/result"
import type {
  WorkspaceEventMap,
  WorkspaceEventName,
} from "@workspace/event-contracts/workspace-event"

export type EventDispatchError = Readonly<{
  cause: unknown
  kind: "event-dispatch-failed"
}>

export type EventBus = Readonly<{
  publish: <TName extends WorkspaceEventName>(
    name: TName,
    event: WorkspaceEventMap[TName]
  ) => ResultAsync<void, EventDispatchError>
  subscribe: <TName extends WorkspaceEventName>(
    name: TName,
    listener: (event: WorkspaceEventMap[TName]) => Promise<void> | void
  ) => () => void
}>

export function createInMemoryEventBus(): EventBus {
  const emitter = new Emittery<WorkspaceEventMap>()

  return {
    publish(name, event) {
      return ResultAsync.fromPromise(emitter.emit(name, event), (cause) => ({
        cause,
        kind: "event-dispatch-failed" as const,
      }))
    },
    subscribe(name, listener) {
      return emitter.on(name, ({ data }) => listener(data))
    },
  }
}
```

기본 dispatch는 병렬 `emit()`이다. `emitSerial()`과 listener 순서 의존은 금지한다. 반환된 unsubscribe는 test teardown과 graceful shutdown에서 호출한다.

### 8.3 `@workspace/auth`

- `better-auth` 직접 import는 이 package에서만 허용한다.
- `learner/client`, `learner/server`, `admin/client`, `admin/server`, `password`, `session-token`, `schema` subpath만 공개한다.
- Google OAuth credential/session과 admin ID/password credential/session을 분리한다.
- Better Auth schema와 database rate-limit counter를 소유한다.
- 제품 profile, user status와 admin role policy는 `identity`가 소유한다.
- auth runtime과 identity use case는 `apps/api`가 조립한다.

### 8.4 `@workspace/ai`

- OpenAI client와 Mastra runtime factory만 제공한다.
- timeout, AbortSignal, lifecycle과 provider 오류 정규화를 소유한다.
- prompt, coaching policy, attempt와 제품 response DTO를 소유하지 않는다.
- `ai-feedback`과 `operations`의 module-local adapter가 각 application port를 구현한다.
- API key가 없으면 fail-closed한 provider-unavailable Result를 반환한다.

### 8.5 `@workspace/storage`

- AWS SDK v3 S3 client와 R2 adapter를 제공한다.
- bucket, endpoint, credential과 public base URL은 검증된 config로 받는다.
- object key, MIME 정책, asset ownership과 document 관계는 `resource-library`가 소유한다.
- SDK exception을 typed infrastructure error로 변환한다.
- provider SDK의 retry를 확인하지 않고 blanket retry를 추가하지 않는다.

### 8.6 `@workspace/observability`

- Pino root·child logger factory를 제공한다.
- request 완료, security, owner mutation, provider와 event dispatch 실패의 구조화 event 타입을 제공한다.
- secret, credential, 원문 답안과 불필요한 개인정보를 redaction한다.
- `process.env`를 직접 읽지 않고 검증된 설정을 인자로 받는다.
- OpenTelemetry와 Sentry는 운영 backend, 보존, 접근 제어, 비용과 대응 절차가 결정될 때만 추가한다.

### 8.7 `@workspace/http-client`

```ts
export type HttpResult<TValue> =
  | { readonly kind: "success"; readonly value: TValue }
  | {
      readonly kind: "http-error"
      readonly code: string
      readonly status: number
    }
  | { readonly kind: "network-error"; readonly cause: unknown }
  | { readonly kind: "contract-error"; readonly cause: unknown }
```

- fetch exception, non-success HTTP와 response schema mismatch를 구분한다.
- consumer가 전달한 Zod schema로 성공 응답을 검증한다.
- query가 제거된 URL, method와 원인 분류를 관측용 값으로 보존한다.
- UI에 내부 cause를 직접 노출하지 않는다.

### 8.8 `@workspace/http-platform`

- 공통 Hono environment와 request context 타입.
- route, path와 runtime OpenAPI helper.
- body limit, trusted-origin과 private no-store middleware.
- 공통 error handler, request ID와 logger 연결 기반.
- 개별 endpoint, 권한 정책, module error mapping과 repository는 소유하지 않는다.

---

## 9. 비즈니스 모듈 표준

### 9.1 디렉터리 template

```text
packages/modules/<module-name>/
├── src/
│   ├── api/
│   │   └── index.ts
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── policies/
│   │   ├── events/
│   │   └── errors/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── ports/
│   │   └── event-handlers/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   └── adapters/
│   ├── interface/
│   │   └── http/
│   └── module.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

실제 책임이 없는 빈 directory를 미리 만들지 않는다. `_template` package도 실제 자동 생성 workflow가 정당화되기 전에는 만들지 않는다.

### 9.2 네이밍

디렉터리와 파일 이름에는 PascalCase를 사용하지 않는다.

| 대상                        | 규칙                           | 예시                             |
| --------------------------- | ------------------------------ | -------------------------------- |
| directory·file              | kebab-case                     | `complete-lesson.command.ts`     |
| React file                  | kebab-case                     | `lesson-player.tsx`              |
| class·type·component symbol | PascalCase                     | `LessonPlayer`, `LearningError`  |
| command function            | camelCase + Command            | `completeLessonCommand`          |
| query function              | camelCase + Query              | `getCourseQuery`                 |
| event handler               | `on-*.handler.ts`              | `on-lesson-completed.handler.ts` |
| repository 구현             | 기술명 + 역할                  | `drizzle-learning.repository.ts` |
| route                       | 복수형 `.routes.ts`            | `learning.routes.ts`             |
| event name                  | `<context>.<past-tense-kebab>` | `learning.lesson-completed`      |
| DB table                    | `<context>_<plural_snake>`     | `learning_lesson_attempts`       |
| package                     | `@workspace/<name>`            | `@workspace/learning`            |

여러 use case를 한 class에 모은 `user-service.ts`와 포괄 `utils.ts`를 만들지 않는다.

### 9.3 DB 소유권

- module은 자기 table과 schema만 import한다.
- 같은 module 내부 FK는 허용한다.
- cross-module FK, cascade와 SQL join은 금지한다.
- 다른 module reference는 `@workspace/types` branded ID로 저장한다.
- command 시점의 존재·상태 검증은 공개 query port로 수행한다.
- archive와 비식별화를 우선해 dangling reference 위험을 줄인다.
- module 간 무결성은 contract test와 reconciliation으로 관측한다.

### 9.4 transaction

- application command가 transaction 경계를 선언한다.
- 같은 module table의 변경만 한 transaction에 포함한다.
- OpenAI, R2와 event listener를 transaction 안에서 기다리지 않는다.
- commit 뒤 event를 발행한다.
- `If-Match` 기반 optimistic concurrency conflict를 Result로 반환한다.
- module 간 원자성이 필요하면 process manager 또는 outbox를 별도 설계한다.

---

## 10. 완성형 예제: learning 레슨 완료

이 예제는 목표 구조의 흐름을 끝까지 보여준다. 실제 제품 계약의 상세 field는 `@workspace/contracts`와 제품 요구사항을 권위로 삼아 조정한다.

### 10.1 domain entity

```ts
// packages/modules/learning/src/domain/entities/lesson-progress.entity.ts
import type {
  DomainDecision,
  DomainEvent,
} from "@workspace/kernel/domain-event"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"

export type LessonProgressError =
  | { readonly kind: "already-completed" }
  | { readonly kind: "unexpected-step"; readonly stepId: LessonStepId }

export type LessonCompletedEvent = DomainEvent<
  "learning.lesson-completed",
  { learnerId: LearnerId; lessonId: LessonId }
>

type LessonProgressProps = Readonly<{
  completedAt: Date | null
  currentStepId: LessonStepId
  learnerId: LearnerId
  lessonId: LessonId
}>

export class LessonProgress {
  private constructor(private readonly props: LessonProgressProps) {}

  static reconstitute(props: LessonProgressProps): LessonProgress {
    return new LessonProgress(props)
  }

  complete(input: {
    readonly completedAt: Date
    readonly eventId: string
    readonly stepId: LessonStepId
  }): Result<
    DomainDecision<LessonProgress, LessonCompletedEvent>,
    LessonProgressError
  > {
    if (this.props.completedAt !== null) {
      return err({ kind: "already-completed" })
    }
    if (input.stepId !== this.props.currentStepId) {
      return err({ kind: "unexpected-step", stepId: input.stepId })
    }

    const aggregate = new LessonProgress({
      ...this.props,
      completedAt: input.completedAt,
    })
    const event: LessonCompletedEvent = {
      id: input.eventId,
      occurredAt: input.completedAt,
      payload: {
        learnerId: this.props.learnerId,
        lessonId: this.props.lessonId,
      },
      type: "learning.lesson-completed",
    }

    return ok({ aggregate, events: [event] })
  }

  toPersistence() {
    return { ...this.props }
  }
}
```

### 10.2 application port

```ts
// packages/modules/learning/src/application/ports/lesson-progress.repository.ts
import type { ResultAsync } from "@workspace/kernel/result"
import type { LearnerId, LessonId } from "@workspace/types/ids"
import type { LessonProgress } from "#learning/domain/entities/lesson-progress.entity"

export type LearningPersistenceError = Readonly<{
  cause: unknown
  kind: "learning-persistence-failed"
}>

export type LessonProgressRepository = Readonly<{
  find: (input: {
    readonly learnerId: LearnerId
    readonly lessonId: LessonId
  }) => ResultAsync<LessonProgress | null, LearningPersistenceError>
  save: (
    progress: LessonProgress
  ) => ResultAsync<void, LearningPersistenceError>
}>
```

```ts
// packages/modules/learning/src/application/ports/learning-event-publisher.ts
import type { ResultAsync } from "@workspace/kernel/result"
import type { LessonCompletedEvent } from "#learning/domain/entities/lesson-progress.entity"

export type LearningEventDispatchError = Readonly<{
  cause: unknown
  kind: "event-dispatch-failed"
}>

export type LearningEventPublisher = Readonly<{
  publish: (
    event: LessonCompletedEvent
  ) => ResultAsync<void, LearningEventDispatchError>
}>
```

### 10.3 application command

```ts
// packages/modules/learning/src/application/commands/complete-lesson.command.ts
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { errAsync, type ResultAsync } from "@workspace/kernel/result"
import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"
import type {
  LearningPersistenceError,
  LessonProgressRepository,
} from "#learning/application/ports/lesson-progress.repository"
import type {
  LearningEventDispatchError,
  LearningEventPublisher,
} from "#learning/application/ports/learning-event-publisher"
import type { LessonProgressError } from "#learning/domain/entities/lesson-progress.entity"

export type CompleteLessonError =
  | LearningPersistenceError
  | LearningEventDispatchError
  | LessonProgressError
  | { readonly kind: "lesson-progress-not-found" }

type Dependencies = Readonly<{
  clock: Clock
  eventPublisher: LearningEventPublisher
  eventIdGenerator: IdGenerator<string>
  repository: LessonProgressRepository
}>

export function completeLessonCommand(dependencies: Dependencies) {
  return (input: {
    readonly learnerId: LearnerId
    readonly lessonId: LessonId
    readonly stepId: LessonStepId
  }): ResultAsync<void, CompleteLessonError> =>
    dependencies.repository
      .find(input)
      .andThen((progress) => {
        if (progress === null) {
          return errAsync({ kind: "lesson-progress-not-found" as const })
        }
        return progress.complete({
          completedAt: dependencies.clock.now(),
          eventId: dependencies.eventIdGenerator.next(),
          stepId: input.stepId,
        })
      })
      .andThen((decision) =>
        dependencies.repository
          .save(decision.aggregate)
          .map(() => decision.events)
      )
      .andThen((events) =>
        ResultAsync.combine(
          events.map((event) => dependencies.eventPublisher.publish(event))
        ).map(() => undefined)
      )
}
```

event dispatch 실패는 이미 commit된 lesson 완료를 되돌리지 않는다. HTTP 응답과 운영 재처리 의미는 use case별로 명시한다. 반드시 전달돼야 한다면 이 구현 대신 outbox를 사용한다.

### 10.4 module schema

```ts
// packages/modules/learning/src/infrastructure/persistence/schema.ts
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const learningLessonProgress = sqliteTable(
  "learning_lesson_progress",
  {
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    currentStepId: text("current_step_id").notNull(),
    learnerId: text("learner_id").notNull(),
    lessonId: text("lesson_id").notNull(),
  },
  (table) => [
    uniqueIndex("learning_lesson_progress_learner_lesson_unique").on(
      table.learnerId,
      table.lessonId
    ),
  ]
)
```

다른 module table object를 import해 FK를 만들지 않는다.

### 10.5 repository adapter

```ts
// packages/modules/learning/src/infrastructure/persistence/drizzle-lesson-progress.repository.ts
import { and, eq } from "drizzle-orm"
import type { SqliteDatabase } from "@workspace/db/sqlite-database"
import { ResultAsync } from "@workspace/kernel/result"
import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"
import type { LessonProgressRepository } from "#learning/application/ports/lesson-progress.repository"
import { LessonProgress } from "#learning/domain/entities/lesson-progress.entity"
import { learningLessonProgress } from "#learning/infrastructure/persistence/schema"

export function createDrizzleLessonProgressRepository(
  db: SqliteDatabase
): LessonProgressRepository {
  return {
    find(input) {
      return ResultAsync.fromPromise(
        db
          .select()
          .from(learningLessonProgress)
          .where(
            and(
              eq(learningLessonProgress.learnerId, input.learnerId),
              eq(learningLessonProgress.lessonId, input.lessonId)
            )
          )
          .limit(1),
        (cause) => ({ cause, kind: "learning-persistence-failed" as const })
      ).map((rows) => {
        const row = rows[0]
        if (row === undefined) return null

        return LessonProgress.reconstitute({
          completedAt: row.completedAt,
          currentStepId: row.currentStepId as LessonStepId,
          learnerId: row.learnerId as LearnerId,
          lessonId: row.lessonId as LessonId,
        })
      })
    },
    save(progress) {
      const value = progress.toPersistence()
      return ResultAsync.fromPromise(
        db
          .insert(learningLessonProgress)
          .values(value)
          .onConflictDoUpdate({
            target: [
              learningLessonProgress.learnerId,
              learningLessonProgress.lessonId,
            ],
            set: {
              completedAt: value.completedAt,
              currentStepId: value.currentStepId,
            },
          }),
        (cause) => ({ cause, kind: "learning-persistence-failed" as const })
      ).map(() => undefined)
    },
  }
}
```

### 10.6 canonical HTTP contract

```ts
// packages/shared/contracts/src/learning/complete-lesson.ts
import { z } from "zod"
import type { LessonId, LessonStepId } from "@workspace/types/ids"

export const CompleteLessonRequestSchema = z.object({
  lessonId: z
    .string()
    .min(1)
    .transform((value) => value as LessonId),
  stepId: z
    .string()
    .min(1)
    .transform((value) => value as LessonStepId),
})

export const CompleteLessonResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("completed") }),
  z.object({ kind: z.literal("completed-with-pending-follow-up") }),
])

export const CompleteLessonErrorResponseSchema = z.object({
  code: z.enum([
    "forbidden",
    "lesson-progress-not-found",
    "lesson-state-conflict",
    "learning-unavailable",
  ]),
})

export type CompleteLessonRequest = z.infer<typeof CompleteLessonRequestSchema>
export type CompleteLessonResponse = z.infer<
  typeof CompleteLessonResponseSchema
>
```

### 10.7 HTTP route

```ts
// packages/modules/learning/src/interface/http/learning.routes.ts
import { Hono, type Context } from "hono"
import {
  CompleteLessonErrorResponseSchema,
  CompleteLessonRequestSchema,
  CompleteLessonResponseSchema,
} from "@workspace/contracts/learning/complete-lesson"
import type { HttpPlatformEnv } from "@workspace/http-platform/env"
import { zValidator } from "@workspace/http-platform/zod-validator"
import type {
  CompleteLessonError,
  completeLessonCommand,
} from "#learning/application/commands/complete-lesson.command"

type Dependencies = Readonly<{
  completeLesson: ReturnType<typeof completeLessonCommand>
}>

function mapCompleteLessonError(
  context: Context<HttpPlatformEnv>,
  error: CompleteLessonError
) {
  switch (error.kind) {
    case "event-dispatch-failed":
      return context.json(
        CompleteLessonResponseSchema.parse({
          kind: "completed-with-pending-follow-up",
        }),
        202
      )
    case "lesson-progress-not-found":
      return context.json(
        CompleteLessonErrorResponseSchema.parse({
          code: "lesson-progress-not-found",
        }),
        404
      )
    case "already-completed":
    case "unexpected-step":
      return context.json(
        CompleteLessonErrorResponseSchema.parse({
          code: "lesson-state-conflict",
        }),
        409
      )
    case "learning-persistence-failed":
      return context.json(
        CompleteLessonErrorResponseSchema.parse({
          code: "learning-unavailable",
        }),
        503
      )
  }

  const unreachable: never = error
  return unreachable
}

export function createLearningRoutes(dependencies: Dependencies) {
  const routes = new Hono<HttpPlatformEnv>()

  routes.post(
    "/lessons/complete",
    zValidator("json", CompleteLessonRequestSchema),
    async (context) => {
      const actor = context.get("actor")
      if (actor.kind !== "learner") {
        return context.json(
          CompleteLessonErrorResponseSchema.parse({ code: "forbidden" }),
          403
        )
      }

      const input = context.req.valid("json")
      const result = await dependencies.completeLesson({
        learnerId: actor.learnerId,
        lessonId: input.lessonId,
        stepId: input.stepId,
      })

      return result.match(
        () =>
          context.json(
            CompleteLessonResponseSchema.parse({ kind: "completed" }),
            200
          ),
        (error) => mapCompleteLessonError(context, error)
      )
    }
  )

  return routes
}
```

mapper는 모든 `CompleteLessonError` variant를 exhaustive하게 처리하고 공개 contract만 반환한다. event dispatch 실패는 lesson commit 성공을 숨기지 않도록 `202 completed-with-pending-follow-up`으로 구분한다. route는 repository나 domain entity를 직접 사용하지 않는다.

### 10.8 module factory

```ts
// packages/modules/learning/src/module.ts
import type { SqliteDatabase } from "@workspace/db/sqlite-database"
import type { EventBus } from "@workspace/event-bus/event-bus"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { completeLessonCommand } from "#learning/application/commands/complete-lesson.command"
import type { LearningEventPublisher } from "#learning/application/ports/learning-event-publisher"
import { createDrizzleLessonProgressRepository } from "#learning/infrastructure/persistence/drizzle-lesson-progress.repository"
import { createLearningRoutes } from "#learning/interface/http/learning.routes"

export type LearningModuleDependencies = Readonly<{
  clock: Clock
  db: SqliteDatabase
  eventBus: EventBus
  eventIdGenerator: IdGenerator<string>
}>

export function createLearningModule(dependencies: LearningModuleDependencies) {
  const repository = createDrizzleLessonProgressRepository(dependencies.db)
  const eventPublisher: LearningEventPublisher = {
    publish: (event) =>
      dependencies.eventBus.publish(event.type, event).mapErr((error) => ({
        cause: error.cause,
        kind: "event-dispatch-failed" as const,
      })),
  }
  const completeLesson = completeLessonCommand({
    clock: dependencies.clock,
    eventPublisher,
    eventIdGenerator: dependencies.eventIdGenerator,
    repository,
  })

  return {
    api: {
      commands: { completeLesson },
    },
    routes: createLearningRoutes({ completeLesson }),
  } as const
}

export type LearningModule = ReturnType<typeof createLearningModule>
```

---

## 11. `apps/api` composition과 lifecycle

### 11.1 source 구조

```text
apps/api/src/
├── composition/
│   ├── create-container.ts
│   └── create-app.ts
├── config/
│   └── env.ts
├── lifecycle/
│   └── server-lifecycle.ts
├── runtime/
│   ├── system-clock.ts
│   └── uuid-generator.ts
└── main.ts
```

`apps/api`는 여러 모듈과 infra를 동시에 알아도 되는 유일한 실행 경계다. 조립과 lifecycle만 소유하며 domain 규칙과 concrete repository를 다시 구현하지 않는다.

### 11.2 container

```ts
// apps/api/src/runtime/system-clock.ts
import type { Clock } from "@workspace/kernel/clock"

export const systemClock: Clock = {
  now: () => new Date(),
}
```

```ts
// apps/api/src/runtime/uuid-generator.ts
import { randomUUID } from "node:crypto"
import type { IdGenerator } from "@workspace/kernel/clock"

export const uuidGenerator: IdGenerator<string> = {
  next: () => randomUUID(),
}
```

```ts
// apps/api/src/composition/create-container.ts
import { createAiRuntime } from "@workspace/ai/runtime"
import { createAuthRuntime } from "@workspace/auth/server"
import { createSqliteDatabase } from "@workspace/db/sqlite-database"
import { createInMemoryEventBus } from "@workspace/event-bus/event-bus"
import { createAppLogger } from "@workspace/observability/logger"
import { createR2Storage } from "@workspace/storage/r2-storage"
import { createAiFeedbackModule } from "@workspace/ai-feedback/module"
import { createContentModule } from "@workspace/content/module"
import { createIdentityModule } from "@workspace/identity/module"
import { createLearningModule } from "@workspace/learning/module"
import { createOperationsModule } from "@workspace/operations/module"
import { createResourceLibraryModule } from "@workspace/resource-library/module"
import type { ApiEnv } from "#api/config/env"
import { systemClock } from "#api/runtime/system-clock"
import { uuidGenerator } from "#api/runtime/uuid-generator"

export function createContainer(env: ApiEnv) {
  const logger = createAppLogger({ level: env.logLevel })
  const database = createSqliteDatabase(env.databaseFilename)
  const eventBus = createInMemoryEventBus()
  const ai = createAiRuntime(env.ai)
  const storage = createR2Storage(env.assetStorage)
  const auth = createAuthRuntime({ database: database.db, env: env.auth })

  const identity = createIdentityModule({
    auth,
    clock: systemClock,
    db: database.db,
    eventBus,
    idGenerator: uuidGenerator,
  })
  const content = createContentModule({
    clock: systemClock,
    db: database.db,
    eventBus,
    idGenerator: uuidGenerator,
  })
  const aiFeedback = createAiFeedbackModule({
    ai,
    clock: systemClock,
    db: database.db,
    idGenerator: uuidGenerator,
  })
  const learning = createLearningModule({
    aiFeedback: aiFeedback.api.application.requestFeedback,
    clock: systemClock,
    contentQueries: content.api.queries,
    db: database.db,
    eventBus,
    eventIdGenerator: uuidGenerator,
    identityQueries: identity.api.queries,
  })
  const resourceLibrary = createResourceLibraryModule({
    clock: systemClock,
    db: database.db,
    eventBus,
    idGenerator: uuidGenerator,
    storage,
  })
  const operations = createOperationsModule({
    ai,
    clock: systemClock,
    contentReporting: content.api.reporting,
    db: database.db,
    identityReporting: identity.api.reporting,
    learningReporting: learning.api.reporting,
    resourceCommands: resourceLibrary.api.commands,
  })

  return {
    close: async () => {
      await ai.close()
      database.close()
      await logger.flush()
    },
    modules: {
      aiFeedback,
      content,
      identity,
      learning,
      operations,
      resourceLibrary,
    },
    platform: { auth, eventBus, logger },
  } as const
}

export type ApiContainer = ReturnType<typeof createContainer>
```

실제 env field와 factory signature는 구현 manifest와 parser가 소유한다.

### 11.3 Hono app 조립

```ts
// apps/api/src/composition/create-app.ts
import { Hono } from "hono"
import { createErrorHandler } from "@workspace/http-platform/error-handler"
import { createRequestBodyLimitMiddleware } from "@workspace/http-platform/body-limit"
import { createRequestContextMiddleware } from "@workspace/http-platform/request-context"
import { createTrustedOriginMiddleware } from "@workspace/http-platform/trusted-origin"
import type { HttpPlatformEnv } from "@workspace/http-platform/env"
import type { ApiContainer } from "#api/composition/create-container"

export function createApp(container: ApiContainer) {
  const app = new Hono<HttpPlatformEnv>()

  app.use("*", createRequestContextMiddleware(container.platform.logger))
  app.use("*", createRequestBodyLimitMiddleware())
  app.use("*", createTrustedOriginMiddleware())
  app.onError(createErrorHandler(container.platform.logger))

  app.route("/api/auth", container.platform.auth.routes)
  app.route("/api/learning", container.modules.learning.routes)
  app.route("/api/ai-feedback", container.modules.aiFeedback.routes)
  app.route("/api/admin/content", container.modules.content.routes)
  app.route("/api/admin/resources", container.modules.resourceLibrary.routes)
  app.route("/api/admin/operations", container.modules.operations.routes)

  return app
}
```

인증·인가 middleware의 정확한 mount 위치는 route의 audience와 공개 계약을 기준으로 구성한다. browser redirect나 UI의 보호 표시가 server-side authorization을 대체하지 않는다.

### 11.4 lifecycle

- 장기 수명 resource는 composition root에서 한 번만 생성한다.
- import 시점 singleton과 side effect를 만들지 않는다.
- 초기화 일부가 실패하면 이미 생성된 resource를 생성 역순으로 정리한 뒤 fail-fast한다.
- 종료 시 새 요청 수락 중단, 진행 요청 drain, event unsubscribe, AI client 정리, DB close와 log flush 순서를 명시한다.
- test는 process를 시작하지 않고 `createContainer`와 `createApp` factory를 사용한다.

---

## 12. 인증과 identity

### 12.1 책임 분리

`@workspace/auth`:

- Google OAuth, admin ID/password credential.
- session cookie, token, password hash와 Better Auth lifecycle.
- auth-owned schema와 database rate-limit counter.
- learner/admin client·server integration.

`@workspace/identity`:

- learner profile.
- user `active | suspended | deleted` 상태.
- admin role와 owner authorization policy.
- app-owned profile 비식별화.
- 인증 identity를 제품 사용자로 provisioning하는 use case.

`identity`는 Better Auth schema, SDK type과 concrete session representation에 의존하지 않는다. `apps/api`가 auth hook과 identity application port를 조립한다.

### 12.2 rate limit

- Better Auth 내장 limiter를 사용하고 counter는 SQLite database storage에 둔다.
- reverse proxy가 정제한 IP header만 신뢰한다.
- 관리자 AI의 관리자·IP별 counter는 `operations` schema가 소유한다.
- 같은 AI 대화의 in-flight 중복은 API instance의 memory lock으로 막는다.
- 학습자 코칭 attempt 제한은 `ai-feedback` domain과 persistence가 소유한다.
- 제한 응답은 안정된 공개 code를 제공한다. 만료를 계산할 수 있는 pending lease에는 정확한 `Retry-After`를 제공하고, 시간 경과로 해소되지 않는 완료 attempt 상한에는 잘못된 값을 제공하지 않는다.
- Redis 기반 generic limiter를 만들지 않는다.

### 12.3 보안 원칙

- learner와 admin credential, cookie와 session lifecycle을 분리한다.
- 공개 admin signup을 제공하지 않는다.
- 모든 protected read와 write는 server-side authorization을 통과한다.
- role, credential, suspended/deleted 상태 변경 시 기존 session 폐기 영향을 검토한다.
- test-only auth는 production에서 fail-closed한다.
- CORS, trusted origin, Host, cookie, CSP와 no-store를 하나의 browser security boundary로 검토한다.

---

## 13. AI 경계

### 13.1 학습자 AI 코칭

`learning`이 사용자-facing command를 소유하고 `ai-feedback`의 공개 application port를 동기 주입받는다.

```text
HTTP request
  → learning.request-ai-feedback command
  → ai-feedback.request-feedback application port
  → module-local OpenAI adapter
  → ai-feedback attempt 저장
  → learning 상태 전이 저장
  → HTTP response
```

이 호출은 주요 command에 필요한 동기 협력이다. 완료 뒤 analytics·audit처럼 응답에 필요하지 않은 효과만 event로 발행한다.

### 13.2 관리자 AI

- `operations`가 대화, 요청 제한, 승인과 streaming policy를 소유한다.
- `@workspace/ai`는 Mastra runtime만 제공한다.
- AI는 `content` draft와 `resource-library` document 변경안을 만들 수 있다.
- 발행, 영구 삭제, 권한과 운영 설정 변경은 AI가 수행하지 않는다.
- 변경안은 관리자가 검토·승인한 뒤 대상 module의 기존 command를 호출한다.
- AI는 Git, repository code와 `docs`를 읽지 않는다.
- provider key가 없으면 대화를 저장하지 않고 provider-unavailable Result를 반환한다.
- streaming event는 canonical contract가 허용한 variant만 사용한다.

### 13.3 provider 안전성

- AI provider에 필요한 최소 텍스트만 전달한다.
- 원문 답안, prompt와 provider 응답을 무조건 로그에 남기지 않는다.
- timeout과 AbortSignal을 적용한다.
- provider 오류 원문을 public HTTP response에 노출하지 않는다.
- retry는 작업 멱등성, provider SDK의 내장 retry와 quota 영향을 확인한 뒤 결정한다.

---

## 14. 자료실과 R2 일관성

SQLite와 R2는 transaction을 공유하지 않는다.

### 14.1 upload

1. 인증·인가, MIME, byte size와 대체 텍스트를 검증한다.
2. `resource-library`가 결정적인 object key를 만든다.
3. R2 upload를 실행한다.
4. SQLite transaction으로 asset metadata와 document 관계를 저장한다.
5. DB 저장 실패 시 R2 object 삭제를 보상 시도한다.
6. 보상 삭제도 실패하면 orphan object event를 구조화 로그로 기록한다.

### 14.2 delete

1. SQLite에서 대상, 소유권과 참조를 확인한다.
2. metadata를 삭제 예정 상태로 전이한다.
3. R2 object를 삭제한다.
4. 성공 뒤 metadata 삭제를 완료한다.
5. 실패하면 retry 가능한 상태와 감사 로그를 유지한다.

### 14.3 reconciliation

- orphan object와 삭제 예정 metadata를 조회하는 운영 명령을 제공한다.
- dry-run 결과와 실제 삭제를 분리한다.
- 대상 key, owner, 실행 actor와 결과를 구조화해 기록한다.
- R2 실패를 성공으로 숨기지 않는다.
- blanket retry 대신 같은 object key를 유지하는 멱등성과 SDK 동작을 먼저 확인한다.

---

## 15. migration과 seed

### 15.1 소유권

- 각 module은 자기 Drizzle schema를 소유한다.
- `@workspace/auth`는 Better Auth schema를 소유한다.
- `@workspace/db`는 migration 실행 primitive만 소유한다.
- `apps/api/drizzle.config.ts`가 허용된 `./schema` entry를 수집한다.
- `apps/api/drizzle/`이 하나의 SQLite migration 순서를 소유한다.
- module별 migration directory를 만들지 않는다.

### 15.2 seed

- seed 데이터의 의미는 해당 module이 소유한다.
- 실제 seed가 있는 package만 `./seed` tooling subpath를 공개한다.
- `apps/api/src/db/seed.ts`가 module seed provider를 조립한다.
- seed는 기존 사용자 학습 기록을 암묵적으로 삭제하지 않는다.
- reset은 명시적 환경 확인과 destructive-operation guard를 통과한다.
- production reset은 별도 승인 없이는 fail-closed한다.

### 15.3 변경 절차

1. 제품 invariant와 기존 데이터 영향을 정의한다.
2. module schema, repository, contract와 test를 변경한다.
3. 통합 migration을 생성하고 SQL을 review한다.
4. backup, restore와 rollback 한계를 확인한다.
5. migration을 code와 같은 commit에 포함한다.
6. 임의 SQL로 production schema를 직접 변경하지 않는다.

---

## 16. frontend 개발

### 16.1 source 구조

```text
apps/web/src/
apps/admin/src/
├── app/        # URL, layout, metadata, redirect, 화면 조립
├── features/   # 사용자 능력 단위 model/server/api/hooks/ui
├── entities/   # 둘 이상의 feature가 공유하는 안정된 표현
├── shared/     # domain-neutral HTTP·auth와 작은 공용 코드
└── server/     # server auth, env, 요청별 API client factory
```

의존성은 `app → features → entities → shared`로 흐른다. `server`는 server-only platform boundary다.

- 전역 `components`, `hooks`, `services`, `utils`, `common`에 feature 코드를 모으지 않는다.
- feature끼리 내부 path를 import하지 않는다.
- 실제 capability가 없으면 빈 directory를 만들지 않는다.
- 모든 directory와 file 이름은 kebab-case다.

### 16.2 Server Component 우선

- 최초 조회와 SEO가 필요한 화면은 Server Component가 feature server DAL을 호출한다.
- Server Component가 자기 Next Route Handler를 다시 fetch하지 않는다.
- browser interaction 뒤 요청만 feature의 client HTTP adapter를 사용한다.
- Client Component는 event handler, browser API와 local interaction이 필요한 최소 leaf에 둔다.
- serializable props만 server→client boundary를 넘는다.
- root layout 전체를 Client Component로 만들지 않는다.

### 16.3 상태 소유권

| 상태                      | 소유자                                      |
| ------------------------- | ------------------------------------------- |
| server render 조회        | Server Component와 feature DAL              |
| browser 재조회·mutation   | 해당 feature API adapter와 가까운 component |
| 공유·새로고침 가능한 상태 | URL params·query                            |
| draft·dialog·drag         | 가까운 component, hook 또는 reducer         |
| theme                     | 범위가 좁은 provider                        |

TanStack Query, React Hook Form, nuqs, Zustand와 MSW를 기본 dependency로 두지 않는다. 현재 feature의 복잡성과 기존 수단의 한계가 검증될 때 별도 결정으로 도입한다.

### 16.4 HTTP 소비

- `web`과 `admin`은 `@workspace/http-client`를 사용한다.
- 성공 응답을 endpoint별 `@workspace/contracts` schema로 parse한다.
- network, HTTP와 contract error를 서로 다른 variant로 유지한다.
- Server Action은 기존 API command를 호출하는 write boundary로만 사용한다.
- frontend는 module, DB와 Drizzle을 import하지 않는다.
- server response를 client cache와 local state에 동시에 복제하지 않는다.

### 16.5 UI와 자료실 editor

- 공통 접근성 primitive는 `@workspace/ui`를 사용한다.
- UI package는 API, session, routing과 domain transition을 소유하지 않는다.
- 내부 탐색은 `Link`, command 결과 이동은 router API를 사용한다.
- destructive action은 확인 UI를 거친다.
- error는 `role="alert"`, 일반 status는 `role="status"`를 우선한다.
- Lexical React editor는 `apps/admin` 자료실 feature에 둔다.
- GFM·AST·headless 변환만 `@workspace/resource-document`에서 공유한다.
- Lexical과 chart처럼 무거운 client runtime은 실제 route에서 동적으로 import한다.

---

## 17. 오류 처리

```text
domain
  → Result<T, DomainError>

application
  → ResultAsync<T, ApplicationError>

infrastructure
  → SDK/DB exception을 typed infrastructure error로 변환

interface/http
  → exhaustive mapping으로 status + public error contract 반환

apps/api global handler
  → 예상하지 못한 결함만 500 + request ID + 구조화 로그
```

규칙:

- validation, not-found, conflict, authorization, provider unavailable처럼 호출자가 분기할 실패는 값이다.
- domain·application의 실패 가능한 함수는 `Result` 또는 `ResultAsync`를 반환한다.
- `redirect`, `notFound` 같은 framework 제어 흐름은 일반 오류로 삼키지 않는다.
- 오류를 `null`, 빈 배열과 generic `success` boolean로 병합하지 않는다.
- `switch`는 exhaustive하게 처리한다.
- public error에 stack, SQL, provider 원문, credential과 개인정보를 포함하지 않는다.
- event dispatch 실패가 이미 commit된 상태를 rollback한다고 표현하지 않는다.

---

## 18. 시간, ID와 불변성

- domain과 application은 `Clock`과 `IdGenerator`를 주입받는다.
- persistence는 UTC instant, wire는 ISO 8601 문자열을 사용한다.
- 학습 활동일은 `learning`이 `Asia/Seoul` 논리 날짜로 계산한다.
- client가 보낸 임의 timezone과 server OS local timezone을 학습일 기준으로 사용하지 않는다.
- entity 상태 변경은 기존 props를 바꾸지 않고 새 instance를 반환한다.
- domain event도 immutable value다.
- aggregate event는 숨은 queue가 아니라 `DomainDecision`으로 반환한다.
- 범용 `JSON.stringify` equality를 제공하지 않고 value object가 의미에 맞는 동등성을 정의한다.

---

## 19. 관측성과 운영

### 19.1 구조화 로그

- request ID, audience, actor type, 결과, duration과 오류 분류를 기록한다.
- owner mutation, authentication failure, authorization denial과 AI quota를 security audit event로 남긴다.
- secret, password, session token, 원문 답안과 불필요한 개인정보를 기록하지 않는다.
- 제품 코드에서 `console.log`와 `console.error`를 사용하지 않는다.
- logger package가 `process.env`를 읽지 않고 app이 검증한 값을 전달한다.

### 19.2 health와 shutdown

- health는 process 생존뿐 아니라 DB readiness와 사용자 영향 판단에 필요한 신호를 제공한다.
- shutdown은 새 요청 차단, 진행 요청 drain과 resource close를 관찰 가능하게 기록한다.
- event subscription 해제, AI runtime close, DB close와 log flush를 누락하지 않는다.

### 19.3 telemetry 확장

OpenTelemetry, Sentry, dashboard와 alert backend는 다음이 결정된 뒤 도입한다.

- 운영 owner.
- 보존 기간과 접근 제어.
- 개인정보와 비용.
- backend 장애 시 동작.
- alert 대응과 복구 훈련.

---

## 20. 테스트 전략

| 계층           | 도구                           | 대상                                    | 대체 경계            |
| -------------- | ------------------------------ | --------------------------------------- | -------------------- |
| domain         | Vitest                         | entity, value object, policy와 decision | 없음                 |
| application    | Vitest                         | use case orchestration과 Result         | port fake            |
| infrastructure | Vitest + 임시 SQLite           | schema와 repository                     | 외부 provider만 fake |
| interface/http | Vitest + Hono `app.request()`  | status, body, auth와 contract           | application fake     |
| frontend       | Testing Library + `user-event` | 접근 가능한 사용자 행위                 | HTTP adapter fake    |
| shared UI      | Storybook interaction·a11y     | state, variant와 접근성                 | domain 없음          |
| end-to-end     | Playwright                     | 인증, 학습, 발행, 권한과 자료 저장      | test auth만 사용     |

규칙:

- test는 대상 파일 옆 `*.test.ts` 또는 `*.test.tsx`에 둔다.
- directory·file에 PascalCase를 사용하지 않는다.
- 각 workspace가 Vitest를 catalog devDependency로 직접 선언한다.
- PostgreSQL testcontainer, Supertest와 MSW를 기본 스택에 넣지 않는다.
- E2E와 local browser test는 `ENABLE_TEST_AUTH=true`를 사용한다.
- 권한, version conflict, provider failure와 recovery path를 success path와 함께 검증한다.
- architecture rule에는 허용·금지 fixture를 함께 둔다.

### 20.1 domain test 예제

```ts
// packages/modules/learning/src/domain/entities/lesson-progress.entity.test.ts
import { describe, expect, it } from "vitest"
import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"
import { LessonProgress } from "#learning/domain/entities/lesson-progress.entity"

describe("LessonProgress", () => {
  it("현재 step을 완료하면 새 aggregate와 완료 event를 반환한다", () => {
    const progress = LessonProgress.reconstitute({
      completedAt: null,
      currentStepId: "step-1" as LessonStepId,
      learnerId: "learner-1" as LearnerId,
      lessonId: "lesson-1" as LessonId,
    })

    const result = progress.complete({
      completedAt: new Date("2026-07-22T00:00:00.000Z"),
      eventId: "event-1",
      stepId: "step-1" as LessonStepId,
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) return
    expect(result.value.events).toHaveLength(1)
    expect(result.value.events[0]?.type).toBe("learning.lesson-completed")
    expect(result.value.aggregate.toPersistence().completedAt).toEqual(
      new Date("2026-07-22T00:00:00.000Z")
    )
  })
})
```

---

## 21. local 개발과 검증

실제 port, env 이름과 기본값은 runtime parser, `.env.example`과 local runtime source가 소유한다.

```bash
bun install --frozen-lockfile
bun run setup
bun run doctor
bun run dev:app
bun run dev:admin
bun run storybook
```

품질 gate:

```bash
bun run check:architecture
bun run check:dead-code
bun run lint
bun run typecheck
bun run test
bun run build
bun run audit:full
bun lefthook run pre-commit
```

- setup은 기존 env와 데이터를 덮어쓰지 않는다.
- destructive DB 작업은 별도 명령과 guard를 사용한다.
- 시작한 dev server와 background process는 작업 종료 전에 안전하게 정리한다.
- 문서의 고정 port나 env 예제보다 code authority를 우선한다.

---

## 22. 금지 패턴

| 금지                                      | 이유                                | 대안                                   |
| ----------------------------------------- | ----------------------------------- | -------------------------------------- |
| `@workspace/core` facade 유지             | dual architecture와 forwarding debt | 6개 module public subpath로 직접 전환  |
| `@workspace/learning/src/...`             | package encapsulation 파괴          | explicit public subpath 또는 주입 port |
| module A가 module B repository/table 사용 | bounded context와 추출 가능성 파괴  | query/application port 또는 event      |
| cross-module FK·join                      | schema와 migration 결합             | branded ID + 공개 query                |
| domain에서 Hono·Drizzle·SDK import        | business policy가 기술에 결합       | application port + adapter             |
| frontend에서 module·DB import             | HTTP와 보안 경계 우회               | feature DAL·HTTP adapter               |
| 예상 가능한 실패에 `throw`                | 호출자 분기와 exhaustiveness 상실   | Result union                           |
| aggregate 내부 mutable event queue        | hidden state와 중복 발행 위험       | immutable DomainDecision               |
| transaction 안에서 OpenAI·R2 대기         | SQLite lock과 장애 영향 확대        | I/O 분리 + compensation                |
| in-memory event로 권위 projection 구성    | restart·listener 실패 시 drift      | reporting query, 이후 durable outbox   |
| generic `utils`, `common`, `service`      | 책임과 변경 이유가 퍼짐             | domain language의 작은 unit            |
| 전역 singleton·import side effect         | test 격리와 shutdown 불명확         | composition root factory               |
| package가 직접 `process.env` 접근         | 설정 소유권과 검증 우회             | app parser 결과 주입                   |
| API response type cast만 수행             | contract drift 은폐                 | canonical Zod parse                    |
| broad root barrel                         | 의존 표면과 bundle 확대             | narrow subpath export                  |
| architecture rule 중복                    | tool 간 drift                       | dependency-cruiser 단일 graph rule     |
| directory·file PascalCase                 | repository naming 불일치            | kebab-case                             |

---

## 23. 새 모듈 추가 절차

1. 제품 요구와 독립 bounded context인지 확인한다.
2. 둘 이상의 consumer나 미래 가능성이 아니라 실제 변경 이유를 정의한다.
3. `packages/modules/<kebab-name>` workspace를 만든다.
4. manifest에 필요한 public subpath와 private alias만 선언한다.
5. domain entity, policy, error와 unit test부터 작성한다.
6. application command/query와 port fake test를 작성한다.
7. module-owned schema와 repository integration test를 작성한다.
8. canonical HTTP contract를 `@workspace/contracts/<context>`에 추가한다.
9. module HTTP interface와 contract test를 작성한다.
10. `module.ts`에서 내부 dependency를 조립한다.
11. `apps/api` composition root에 module과 cross-module port를 주입한다.
12. unified Drizzle migration과 필요한 seed를 생성한다.
13. dependency-cruiser와 public surface fixture를 갱신한다.
14. 관련 제품·엔지니어링 권위 문서를 갱신한다.
15. 전체 quality gate를 실행한다.

모듈 경계를 정의할 수 없거나 다른 모듈의 repository가 필요해 보이면 package를 만들기 전에 책임을 다시 설계한다.

---

## 24. 기존 모듈에 use case 추가 절차

1. command인지 query인지 정하고 한 파일에 하나의 use case만 둔다.
2. domain invariant와 예상 가능한 error union을 먼저 정의한다.
3. 필요한 외부 협력을 application port로 선언한다.
4. application test를 port fake로 작성한다.
5. repository method와 adapter를 같은 변경에서 구현한다.
6. HTTP wire 변경이 있으면 canonical contract를 먼저 갱신한다.
7. route는 parse, actor, use case 호출과 Result mapping만 수행한다.
8. 비핵심 후속 효과만 domain event로 발행한다.
9. module factory와 composition root의 주입을 갱신한다.
10. package interface, architecture, test, typecheck와 build를 검증한다.

---

## 25. 전체 개편 실행 순서

개편은 capability별로 단계적으로 수행하되 최종 merge 상태에는 compatibility facade를 남기지 않는다. 임시 forwarding과 adapter는 같은 작업 branch 안에서만 허용하고 다음 단계로 넘어가기 전에 제거 조건을 확인한다.

### 25.1 1단계: 기반과 검증 도구

1. root workspace glob을 2단계 package 구조로 변경한다.
2. Bun catalog 대상을 정리한다.
3. `typescript-config`, `nextjs-config`, `env`를 새 경로로 이동한다.
4. dependency-cruiser와 Knip을 도입한다.
5. 기존 custom `@workspace/repository-tooling`과 graph script를 제거한다.
6. 새 architecture rule의 허용·금지 fixture를 통과시킨다.

### 25.2 2단계: shared와 infra

1. `types`, `kernel`, `errors`, `event-contracts`를 만든다.
2. 기존 `contracts`, `resource-document`, `ui`를 shared 그룹으로 이동한다.
3. `db`, `auth`, `http-client`를 infra 그룹으로 이동한다.
4. `ai`, `event-bus`, `storage`, `observability`, `http-platform`을 app-owned 구현에서 추출한다.
5. package public subpath와 private alias를 고정한다.
6. package가 직접 `process.env`를 읽지 않게 composition input으로 전환한다.

### 25.3 3단계: 비즈니스 모듈

권고 이동 순서:

1. `identity`.
2. `content`.
3. `ai-feedback`.
4. `learning`.
5. `resource-library`.
6. `operations`.

각 module마다 다음 gate를 통과한 뒤 다음 module로 간다.

- domain/application test.
- repository integration test.
- HTTP contract test.
- package interface test.
- dependency-cruiser.
- typecheck와 관련 앱 build.

### 25.4 4단계: API composition

1. module-local repository와 route를 package 안으로 이동한다.
2. `apps/api`에는 common middleware, container, app와 lifecycle만 남긴다.
3. learning↔AI feedback 동기 port를 주입한다.
4. operations reporting query port를 주입한다.
5. event subscription teardown과 graceful shutdown을 연결한다.
6. unified OpenAPI와 route parity를 검증한다.

### 25.5 5단계: frontend와 Storybook

1. package import를 새 infra/shared subpath로 전환한다.
2. `web`과 `admin`의 module·DB import가 0인지 검사한다.
3. resource-document와 Lexical React 경계를 분리한다.
4. Server Component DAL과 client adapter의 contract parse를 검증한다.
5. Storybook이 UI·config 외 package를 사용하지 않게 한다.

### 25.6 6단계: 제거와 통합 검증

1. `@workspace/core` package와 모든 forwarding file을 삭제한다.
2. 기존 `packages/*` 평면 workspace와 빈 generated directory를 정리한다.
3. legacy alias, deleted runtime identifier와 old import를 검색한다.
4. unified migration을 새 schema entry에서 다시 검증한다.
5. lint, typecheck, test, build, audit와 E2E를 실행한다.
6. 영구 결론을 `docs/engineering/*`에 반영한다.
7. 이 작업 디렉터리를 archive로 이동한다.

최종 결과에 deprecated alias, 장기 dual architecture와 `@workspace/core` compatibility facade를 남기지 않는다.

---

## 26. 완료 조건

- [ ] 앱 4개와 합의된 package 24개만 workspace inventory에 존재한다.
- [ ] 모든 내부 package 이름이 `@workspace/*`다.
- [ ] 이전 project 식별자와 폐기된 package-manager·DB 전제가 남아 있지 않다.
- [ ] `@workspace/core`와 `@workspace/repository-tooling`이 제거됐다.
- [ ] package는 `modules`, `infra`, `shared`, `config` 아래에만 존재한다.
- [ ] module이 domain/application/infrastructure/interface 수직 슬라이스를 소유한다.
- [ ] frontend의 module·DB import가 0이다.
- [ ] cross-module schema import, FK와 join이 0이다.
- [ ] expected failure가 Result union으로 표현된다.
- [ ] aggregate event가 immutable DomainDecision으로 반환된다.
- [ ] dependency-cruiser와 Knip이 통과한다.
- [ ] package interface와 runtime cycle 검사가 통과한다.
- [ ] unified migration, seed, backup·restore 경계를 검증했다.
- [ ] `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`가 통과한다.
- [ ] 핵심 Playwright E2E를 `ENABLE_TEST_AUTH=true`로 통과했다.
- [ ] 시작한 모든 process를 안전하게 종료했다.
- [ ] 관련 제품·엔지니어링 권위 문서를 갱신했다.

---

## 27. 마지막 원칙

1. **앱은 조립하고 모듈은 책임진다.** route부터 persistence까지 하나의 bounded context 안에서 변경 이유를 모은다.
2. **경계를 넘을 때는 계약을 사용한다.** 내부 import와 table 접근 대신 공개 port, wire contract와 event를 사용한다.
3. **실패와 상태 전이를 값으로 드러낸다.** Result, discriminated union과 immutable decision으로 제어 흐름을 명시한다.
4. **인프라는 얇게 격리한다.** Better Auth, Drizzle, OpenAI, Mastra, Emittery, AWS SDK와 Pino를 제품 규칙과 섞지 않는다.
5. **검증 가능한 구조만 약속한다.** dependency graph, public surface, test와 운영 evidence로 architecture를 지킨다.
6. **임시 구조를 최종 구조로 남기지 않는다.** 개편이 끝나면 forwarding, compatibility facade와 old path를 제거한다.
