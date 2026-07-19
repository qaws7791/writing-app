# 한글쓰기 학습 플랫폼

한글쓰기 학습 플랫폼 모노레포다. 학습자 웹, 단일 API, 어드민 웹, Storybook, 공유 패키지를 Bun workspace로 관리한다.

상세 구조는 [시스템 개요](docs/engineering/system-overview.md), 환경 변수와 운영 값은 [런타임 설정](docs/engineering/runtime-configuration.md)을 기준으로 확인한다. 어떤 소스가 각 프로젝트 사실을 소유하는지는 [사실별 권위 지도](docs/authority-map.md)에서 확인한다.

## 현재 상태

- 학습자·관리자 웹과 API, SQLite migration·seed, 자동 테스트와 프로덕션 컨테이너 정의가 구현되어 있다.
- `apps/api`는 하나의 public API를 제공한다. 학습자 경로와 `/api/admin/*` 관리자 경로를 같은 runtime에서 조립하고 인증·권한 경계는 경로별로 분리한다.
- Compose/Caddy source는 public API 요청을 `apps/api`로 전달하며 별도 관리자 API service·image·rollback source는 없다. 실제 production 적용·관찰 증적은 사용자 승인으로 이번 완료 범위에서 제외했으므로 운영 성공으로 주장하지 않는다.
- 로컬 개발은 Windows, Linux와 macOS에서 Node.js `24.x`, Bun `1.3.10`을 지원 대상으로 삼는다.
- 프로덕션은 Ubuntu 24.04 LTS `linux/amd64` 단일 서버와 로컬 SQLite 구성을 최초 범위로 삼는다.
- Docker Compose, Ansible과 GHCR 이미지 릴리스는 구현되어 있지만 실제 Ubuntu 통합 검증, OpenTofu·cloud-init과 승인형 GitHub Actions 배포는 진행 중이다. 현재 상태는 [배포 문서](docs/engineering/deployment.md), 실행 순서는 [자동화 작업 계획](docs/work/2026-07-16-repository-onboarding-production-deployment/plan.md)에서 확인한다.

## 프로젝트 구조

- `apps/web`: 학습자용 Next.js 앱
- `apps/api`: 학습자 경로와 `/api/admin/*` 관리자 경로를 제공하는 단일 Hono API
- `apps/admin`: 관리자용 Next.js 운영 대시보드
- `apps/storybook`: 공유 UI 컴포넌트 확인용 Storybook
- `packages/ui`: 공유 UI 컴포넌트
- `packages/contracts`: 학습자·관리자 HTTP DTO와 Zod 계약
- `packages/core`: 도메인, DTO, 유스케이스와 repository port
- `packages/db`: Drizzle SQLite schema, migration, seed, DB client
- `packages/env`: 환경 변수 파싱 helper
- `packages/http-client`: HTTP result와 네트워크 오류 모델
- `packages/resource-document`: Lexical node와 GFM Markdown 변환·검증 계약
- `packages/repository-tooling`: repository inventory, TypeScript module graph와 정책 matcher
- `packages/config`: 공유 TypeScript 설정

전체 workspace 인벤토리는 `docs/engineering/workspace-inventory.md`에서 확인한다.

## 새 팀원 탐색 경로

영역별 첫 문서에서 시작해 공개 Interface, 실제 Implementation, 가까운 테스트 순서로 읽는다.

| 영역         | 첫 문서                                                       | Interface                                                                   | Implementation                                                                                              | 테스트                                                                                                     |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 학습 콘텐츠  | [콘텐츠 모델](docs/product/content-model.md)                  | [학습 공개 경계](packages/core/src/modules/learning/api/index.ts)           | [학습자 콘텐츠 서비스](packages/core/src/modules/learning/application/use-cases/learner-content.service.ts) | [서비스 테스트](packages/core/src/modules/learning/application/use-cases/learner-content.service.test.ts)  |
| 학습 진행    | [시스템 개요](docs/engineering/system-overview.md)            | [학습 공개 경계](packages/core/src/modules/learning/api/index.ts)           | [진행 조회 서비스](packages/core/src/modules/learning/application/use-cases/learner-progress.service.ts)    | [서비스 테스트](packages/core/src/modules/learning/application/use-cases/learner-progress.service.test.ts) |
| 관리자 API   | [API 계약](docs/engineering/api-contract.md)                  | [관리자 계약](packages/contracts/src/admin/index.ts)                        | [관리자 route 조립](apps/api/src/composition/admin-route-composition.ts)                                    | [target 앱 테스트](apps/api/src/http/admin-app.test.ts)                                                    |
| 자료실       | [자료실 API 계약](docs/engineering/api-contract.md)           | [자료실 공개 경계](packages/core/src/modules/resource-library/api/index.ts) | [target 자료실 조립](apps/api/src/modules/admin-resource-library/admin-resource-library.composition.ts)     | [target 저장소 테스트](apps/api/src/adapters/resource-library/resource-library-drizzle.repository.test.ts) |
| 공유 UI      | [프론트엔드 가이드](docs/engineering/frontend-development.md) | [UI 패키지 공개 경계](packages/ui/package.json)                             | [UI 컴포넌트](packages/ui/src/components)                                                                   | [Storybook](apps/storybook/src/stories)                                                                    |
| 데이터베이스 | [데이터 모델](docs/engineering/data-model.md)                 | [DB 패키지 공개 경계](packages/db/src/index.ts)                             | [DB 클라이언트](packages/db/src/client.ts)                                                                  | [백업·복구 테스트](packages/db/src/database-backup.test.ts)                                                |

## 필요한 도구

- Node.js `24.x`
- Bun `1.3.10`
- Git

Ansible 기반 운영 배포의 제어 노드는 Linux 또는 WSL2가 필요하지만 로컬 애플리케이션 개발은 Windows PowerShell에서도 지원한다.

## 5분 빠른 시작

```bash
git clone https://github.com/qaws7791/writing-app.git
cd writing-app
bun run setup
bun run dev
```

`bun run setup`은 다음 작업을 순서대로 수행한다.

1. Bun과 Node.js 버전을 확인한다.
2. frozen lockfile로 의존성을 설치한다.
3. 누락된 앱별 `.env`만 `.env.example`에서 생성한다.
4. 학습자·관리자 인증 비밀값과 로컬 관리자 비밀번호를 서로 다른 난수로 생성한다.
5. baseline migration, 콘텐츠 seed와 관리자 seed를 실행한다.
6. `bun run doctor`로 로컬 준비 결과를 진단한다.

기존 `.env`, 인증 비밀값과 SQLite 데이터는 덮어쓰지 않는다. 관리자 seed/audit script는 Git에 포함되지 않는 `apps/api/.env`의 `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`를 사용한다. `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`은 해당 기능을 실제 호출할 때만 설정한다.

로컬에서 Google OAuth 대신 테스트 로그인 버튼을 쓰려면 `apps/api/.env`와 `apps/web/.env` 모두에 `ENABLE_TEST_AUTH=true`가 있어야 한다. API만 빠지면 `/api/auth/test/sign-in`이 404를 반환한다.

준비 상태를 다시 확인할 때는 데이터나 설정을 변경하지 않는 진단 명령을 실행한다.

```bash
bun run doctor
```

## 데이터 준비

`apps/api`는 로컬과 production source 구성에서 SQLite lifecycle을 단독 소유하며 로컬 DB는 저장소 루트의 `data/api.sqlite`를 사용한다.

```bash
bun run dev:app:setup
bun run dev:admin:setup
```

두 명령은 `bun run setup` 내부에서도 실행된다. `dev:app:setup`은 baseline migration과 보존형 콘텐츠 seed를 실행하고, `dev:admin:setup`은 관리자 seed를 추가한다. `dev:app`과 `dev:admin`은 DB를 변경하지 않고 장기 실행 process만 시작한다. 기존 학습 진행과 답변은 삭제하지 않는다. 깨끗한 개발 DB가 필요할 때만 `bun run db:reset` 또는 `bun run dev:app:fresh`를 사용한다.

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

이 명령은 어드민 웹의 Next.js watcher와 단일 API의 Bun watcher를 시작한다.

- 어드민 웹: `http://localhost:3001`
- API: `http://localhost:4000`

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
bun run check:document-drift
bun run check:workspace-inventory
bun run check:deployment-config
bun run check:container-image-lock
bun run test:deployment-images
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build
bun lefthook run pre-commit
```

`check:deployment-config`는 임시 production fixture로 Compose 계약을 해석하고 고정된 Caddy와 Litestream image에서 설정을 검사한다. `check:container-image-lock`은 Bun·Node base와 Caddy·Cloudflared·Litestream 운영 image의 tag+digest 고정을 검사한다. `test:deployment-images`는 `web`, `api`, `admin` 세 production image를 `linux/amd64`로 빌드하고 비 root 실행, health와 Next.js 정적 자산을 smoke 검증한다. 배포 설정과 image smoke에는 실행 중인 Docker daemon이 필요하다. Ansible lint와 syntax 검사는 Linux 또는 WSL2에서 의존성을 설치한 뒤 `bun run check:deployment-ansible`로 실행한다. 자세한 준비 절차는 [배포 문서](docs/engineering/deployment.md)를 따른다.

Ubuntu bootstrap 멱등성 검사는 운영 장비에서 실행하지 않는다. 저장소 CI는 명시적인 Ubuntu 24.04 일회성 runner에서만 `test:deployment-bootstrap`을 허용한다.

## 프로덕션 이미지 릴리스

GitHub 저장소의 Actions variables에 실제 HTTPS origin인 `PRODUCTION_WEB_ORIGIN`, `PRODUCTION_API_ORIGIN`, `PRODUCTION_ADMIN_ORIGIN`을 등록한다. `main` push의 `필수 품질 게이트`가 성공하면 `프로덕션 이미지 릴리스` workflow가 같은 commit에서 `web`, `api`, `admin` 이미지를 빌드해 GHCR에 게시한다.

workflow는 게시된 각 digest를 고정된 Grype로 검사하고 `HIGH` 이상 취약점이 있으면 배포 manifest 생성을 차단한다. 결과의 `production-image-digests-*` artifact에는 검사를 통과한 세 `ghcr.io/...@sha256:...` reference와 source revision, 공개 origin·취약점 정책 digest가 들어 있다. 운영 배포에는 이 digest reference만 사용하며 `latest` tag를 사용하지 않는다. 저장소의 Actions package 쓰기 권한, 생성된 GHCR package 공개 범위와 운영 서버의 pull 권한은 저장소 소유자가 GitHub 설정에서 확인해야 한다.

현재 승인형 CD와 OpenTofu 기반 호스트 생성은 구현 전이다. 따라서 최초 서버 준비와 실제 digest 배포는 [배포 문서](docs/engineering/deployment.md)의 Ansible 절차를 따르며, 자동화되지 않은 단계를 완료된 것으로 가정하지 않는다.

학습자 HTTP 계약은 `@workspace/contracts/learning`의 strict Zod schema와 추론 타입을 API와 웹이 직접 사용한다. OpenAPI 3.1 문서는 실행 중인 학습자 API의 `/openapi`에서 확인하며 정적 JSON과 웹 생성 타입은 추적하지 않는다.

## 문서

프로젝트 지식은 `docs`에서 관리한다.

- `docs/product`: 제품 기준 문서
- `docs/design`: 디자인, UI, 접근성 기준 문서
- `docs/engineering`: 시스템, API, DB, 운영, 테스트 기준 문서
- `docs/work`: 진행 중인 한시적 계획과 조사
- `docs/archive`: 완료되거나 폐기된 작업 기록. 현재 사실의 근거로 사용하지 않는다.

탐색은 [문서 인덱스](docs/_index.md)에서 시작한다. 작업 로그와 오래된 조사 문서를 현재 기준 문서와 섞지 않는다.
