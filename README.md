# 한글쓰기 학습 플랫폼

한글쓰기 학습 플랫폼 모노레포다. 학습자 웹, 학습자 API, 어드민 웹, 어드민 API, Storybook, 공유 패키지를 Bun workspace로 관리한다.

상세 구조는 `ARCHITECTURE.md`, 환경 변수와 운영 값은 `docs/engineering/runtime-configuration.md`를 기준으로 확인한다.

## 프로젝트 구조

- `apps/web`: 학습자용 Next.js 앱
- `apps/api`: 학습자 플랫폼 Hono API
- `apps/admin`: 관리자용 Next.js 운영 대시보드
- `apps/admin-api`: 관리자용 Hono API
- `apps/storybook`: 공유 UI 컴포넌트 확인용 Storybook
- `packages/ui`: 공유 UI 컴포넌트
- `packages/contracts`: 학습자·관리자 HTTP DTO와 Zod 계약
- `packages/core`: 도메인, DTO, 유스케이스, repository 구현
- `packages/db`: Drizzle SQLite schema, migration, seed, DB client
- `packages/hono`: Hono route, validation, error handling 표준
- `packages/env`: 환경 변수 파싱 helper
- `packages/http-client`: HTTP result와 네트워크 오류 모델
- `packages/logger`: API 런타임용 logger
- `packages/resource-document`: Lexical GFM 문서 계약과 Yjs 투영
- `packages/repository-tooling`: repository inventory, TypeScript module graph와 정책 matcher
- `packages/config`: 공유 TypeScript 설정

전체 workspace 인벤토리는 `docs/engineering/workspace-inventory.md`에서 확인한다.

## 새 팀원 탐색 경로

영역별 첫 문서에서 시작해 공개 Interface, 실제 Implementation, 가까운 테스트 순서로 읽는다.

| 영역         | 첫 문서                                                                | Interface                                                                   | Implementation                                                                                                               | 테스트                                                                                                                              |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 학습 콘텐츠  | [도메인 가이드](DOMAIN.md)                                             | [콘텐츠 공개 경계](packages/core/src/modules/content/api/index.ts)          | [학습자 콘텐츠 서비스](packages/core/src/modules/content/application/use-cases/learner-content.service.ts)                   | [서비스 테스트](packages/core/src/modules/content/application/use-cases/learner-content.service.test.ts)                            |
| 학습 진행    | [시스템 개요](docs/engineering/system-overview.md)                     | [학습 공개 경계](packages/core/src/modules/learning/api/index.ts)           | [학습 서비스](packages/core/src/modules/learning/application/use-cases/learning.service.ts)                                  | [서비스 테스트](packages/core/src/modules/learning/application/use-cases/learning.service.test.ts)                                  |
| 관리자 API   | [API 계약](docs/engineering/api-contract.md)                           | [관리자 계약](packages/contracts/src/admin/index.ts)                        | [관리자 앱 조립](apps/admin-api/src/app.ts)                                                                                  | [앱 테스트](apps/admin-api/src/app.test.ts)                                                                                         |
| 자료실       | [자료실 동기화 설계](docs/engineering/resource-library-sync-design.md) | [자료실 공개 경계](packages/core/src/modules/resource-library/api/index.ts) | [문서 저장소](packages/core/src/modules/resource-library/infrastructure/persistence/resource-document-drizzle.repository.ts) | [저장소 테스트](packages/core/src/modules/resource-library/infrastructure/persistence/resource-document-drizzle.repository.test.ts) |
| 공유 UI      | [프론트엔드 가이드](FRONTEND.md)                                       | [UI 패키지 공개 경계](packages/ui/package.json)                             | [UI 컴포넌트](packages/ui/src/components)                                                                                    | [Storybook](apps/storybook/src/stories)                                                                                             |
| 데이터베이스 | [데이터 모델](docs/engineering/data-model.md)                          | [DB 패키지 공개 경계](packages/db/src/index.ts)                             | [DB 클라이언트](packages/db/src/client.ts)                                                                                   | [백업·복구 테스트](packages/db/src/database-backup.test.ts)                                                                         |

## 필요한 도구

- Node.js `24.x`
- Bun `1.3.10`
- Git

## 로컬 준비

```bash
bun install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin-api/.env.example apps/admin-api/.env
cp apps/admin/.env.example apps/admin/.env
```

`BETTER_AUTH_SECRET`과 `ADMIN_BETTER_AUTH_SECRET`은 서로 다른 32자 이상 문자열로 둔다. `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`은 해당 기능을 실제 호출할 때만 설정한다.

로컬에서 Google OAuth 대신 테스트 로그인 버튼을 쓰려면 `apps/api/.env`와 `apps/web/.env` 모두에 `ENABLE_TEST_AUTH=true`가 있어야 한다. API만 빠지면 `/api/auth/test/sign-in`이 404를 반환한다.

## 데이터 준비

학습자 API와 어드민 API는 로컬에서 저장소 루트의 `data/api.sqlite`를 공유한다.

```bash
bun run dev:app:setup
bun run dev:admin:setup
```

`dev:app:setup`은 baseline migration과 보존형 콘텐츠 seed를 실행하고, `dev:admin:setup`은 여기에 관리자 seed를 추가로 실행한다. 두 setup 명령은 개발 서버를 시작하기 전에 필요한 경우 명시적으로 한 번 실행하며, `dev:app`과 `dev:admin`은 DB를 변경하지 않고 장기 실행 process만 시작한다. 기존 학습 진행과 답변은 삭제하지 않는다. 깨끗한 개발 DB가 필요할 때만 `bun run db:reset` 또는 `bun run dev:app:fresh`를 사용한다.

## 개발 서버

학습자 앱과 API:

```bash
bun run dev:app
```

- 학습자 웹: `http://localhost:3000`
- 학습자 API: `http://localhost:4000`

어드민 앱과 API:

```bash
bun run dev:admin
```

이 명령은 어드민 웹의 Next.js watcher와 어드민 API의 Bun watcher만 시작한다.

- 어드민 웹: `http://localhost:3001`
- 어드민 API: `http://localhost:4001`

모든 개발 서버:

```bash
bun run dev
```

Storybook:

```bash
bun run storybook
```

## 주요 검증

```bash
bun run check:toolchain
bun run check:components-config
bun run check:api-contract
bun run check:document-drift
bun run check:workspace-inventory
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build
bun lefthook run pre-commit
```

OpenAPI 계약과 웹 생성 타입을 갱신해야 할 때:

```bash
bun --filter=@workspace/api openapi:generate
bun --filter=@workspace/web api:generate
```

정적 OpenAPI 계약 파일은 `docs/engineering/contracts/writing-app-api-openapi.json`이다.

## 문서

`docs` 바로 아래에는 다음 세 폴더만 둔다.

- `docs/product`: 제품 기준 문서
- `docs/design`: 디자인, UI, 접근성 기준 문서
- `docs/engineering`: 시스템, API, DB, 운영, 테스트 기준 문서

작업 로그와 오래된 조사 문서는 장기 기준 문서로 보관하지 않는다.
