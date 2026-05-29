# 한글쓰기 학습 플랫폼

한글쓰기 학습 플랫폼 모노레포다. 학습자 웹, 학습자 API, 어드민 웹, 어드민 API, 문서 앱, Storybook, 공유 패키지를 Bun workspace로 관리한다.

## 프로젝트 구조

- `apps/web`: 학습자용 Next.js 앱
- `apps/api`: 학습자 플랫폼 Hono API
- `apps/admin`: 관리자용 Next.js 운영 대시보드
- `apps/admin-api`: 관리자용 Hono API
- `apps/docs`: 프로젝트와 API 문서 앱
- `apps/storybook`: 공유 UI 컴포넌트 확인용 Storybook
- `packages/ui`: shadcn 기반 공유 UI 컴포넌트
- `packages/core`: DTO, Zod schema, 도메인 서비스, repository port
- `packages/db`: Drizzle SQLite schema, migration, seed, repository 구현
- `packages/env`: 환경 변수 파싱 helper
- `packages/logger`: API 런타임용 logger

상세 구조는 `ARCHITECTURE.md`, 환경 변수와 운영 값은 `docs/operations-environment.md`를 기준으로 확인한다.

## 필요한 도구

- Node.js `20.x`
- Bun `1.3.10`
- Docker Desktop
- Git

Docker Desktop은 어드민 썸네일 업로드 검증에 필요한 RustFS S3-compatible storage를 실행할 때 사용한다.

## 클론 후 초기 세팅

저장소를 클론하고 루트로 이동한다.

```bash
git clone <repository-url>
cd writing-app
```

의존성을 설치한다.

```bash
bun install
```

로컬 환경 변수 파일을 만든다.

```bash
cp .env.docker.example .env.docker
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/admin-api/.env.example apps/admin-api/.env
```

`.env.docker`의 RustFS credential과 `apps/admin-api/.env`의 `ADMIN_ASSET_S3_ACCESS_KEY`, `ADMIN_ASSET_S3_SECRET_KEY`는 같은 값이어야 한다. 로컬 예시는 다음처럼 맞출 수 있다.

```env
RUSTFS_ACCESS_KEY=writingapp-local-access
RUSTFS_SECRET_KEY=writingapp-local-secret
```

```env
ADMIN_ASSET_S3_ACCESS_KEY=writingapp-local-access
ADMIN_ASSET_S3_SECRET_KEY=writingapp-local-secret
```

`apps/api/.env`의 Google OAuth 값과 OpenAI 값은 학습자 API에서 해당 기능을 실제 호출할 때 필요한 값으로 교체한다. 어드민만 먼저 실행할 때는 `apps/admin-api/.env`의 관리자 인증, 시드, asset 값이 핵심이다.

## 로컬 스토리지 실행

어드민 코스 썸네일 업로드를 사용하려면 RustFS를 실행한다.

```bash
docker compose up -d
```

Compose는 RustFS API `9000`, Console `9001`을 열고 `writing-app-public-assets` 공개 버킷을 초기화한다.

상태를 확인한다.

```bash
docker compose ps
docker compose logs --tail=80 rustfs_public_assets_init
```

중지할 때는 다음 명령을 사용한다.

```bash
docker compose down
```

## 데이터베이스와 관리자 계정 준비

학습자 API와 어드민 API는 로컬에서 저장소 루트의 `data/api.sqlite`를 공유한다. 어드민을 실행하기 전에 콘텐츠 seed와 관리자 계정을 준비한다.

```bash
bun run dev:admin:setup
```

관리자 계정은 `apps/admin-api/.env`의 `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `ADMIN_SEED_NAME`을 사용한다. 같은 이메일이 이미 있으면 기본적으로 비밀번호를 바꾸지 않는다. 로컬 개발 DB의 기존 관리자 비밀번호를 시드 값으로 다시 맞춰야 할 때만 다음처럼 실행한다.

```bash
ADMIN_SEED_RESET_PASSWORD=true bun --filter @workspace/admin-api seed:admin
```

Windows PowerShell에서는 다음처럼 실행한다.

```powershell
$env:ADMIN_SEED_RESET_PASSWORD = "true"
bun --filter @workspace/admin-api seed:admin
Remove-Item Env:ADMIN_SEED_RESET_PASSWORD
```

## 개발 서버 실행

학습자 플랫폼만 실행한다.

```bash
bun run dev:app
```

- 학습자 웹: `http://localhost:3000`
- 학습자 API: `http://localhost:4000`

어드민만 실행한다.

```bash
bun run dev:admin
```

- 어드민 웹: `http://localhost:3001`
- 어드민 API: `http://localhost:4001`

모든 개발 서버를 실행한다.

```bash
bun run dev
```

문서 앱과 Storybook은 별도로 실행할 수 있다.

```bash
bun run docs
bun run storybook
```

## 자주 쓰는 검증 명령

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

커밋 전에는 다음 명령으로 포맷과 훅 검증을 실행할 수 있다.

```bash
bun lefthook run pre-commit
```

## 로컬 실행 기본 순서

처음 클론한 개발자는 보통 다음 순서로 시작한다.

```bash
bun install
cp .env.docker.example .env.docker
cp apps/admin/.env.example apps/admin/.env
cp apps/admin-api/.env.example apps/admin-api/.env
docker compose up -d
bun run dev:admin:setup
bun run dev:admin
```

학습자 플랫폼까지 함께 개발할 때는 `apps/api/.env`도 만들고 필요한 OAuth/OpenAI 값을 채운 뒤 `bun run dev:app` 또는 `bun run dev`를 사용한다.
