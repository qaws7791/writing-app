# 한글쓰기 학습 플랫폼

한글쓰기 학습 플랫폼 모노레포다. 학습자 웹, 학습자 API, 어드민 웹, 어드민 API, Storybook, 공유 패키지를 Bun workspace로 관리한다.

## 프로젝트 구조

- `apps/web`: 학습자용 Next.js 앱
- `apps/api`: 학습자 플랫폼 Hono API
- `apps/admin`: 관리자용 Next.js 운영 대시보드
- `apps/admin-api`: 관리자용 Hono API
- `apps/storybook`: 공유 UI 컴포넌트 확인용 Storybook
- `packages/ui`: shadcn 기반 공유 UI 컴포넌트
- `packages/core`: DTO, Zod schema, 도메인 서비스, repository port
- `packages/db`: Drizzle SQLite schema, migration, seed, repository 구현
- `packages/env`: 환경 변수 파싱 helper
- `packages/logger`: API 런타임용 logger

상세 구조는 `ARCHITECTURE.md`, 환경 변수와 운영 값은 `docs/operations-environment.md`를 기준으로 확인한다.

## 필요한 도구

- Node.js `24.x`
- Bun `1.3.10`
- Git

## 현재 실행 가능 상태

- 학습자 플랫폼은 `apps/web`과 `apps/api`를 함께 실행해 로컬에서 사용할 수 있다.
- 어드민 API는 `apps/admin-api`로 실행할 수 있다. 로컬 수동 검증에는 관리자 사용자 row가 먼저 필요하다.
- 어드민 웹 `apps/admin`은 패키지 골격만 있고 제품 화면 소스가 아직 없다. 어드민 프론트엔드가 구현되기 전까지 `bun --filter @workspace/admin dev`는 실제 운영 대시보드를 띄우는 명령이 아니다.
- 루트의 `bun run dev:admin`은 목표 통합 실행 명령이지만, 현재는 `apps/admin-api/src/scripts/seed-admin.ts`가 없어서 관리자 계정 자동 시드까지 포함한 end-to-end 실행 명령으로 사용할 수 없다.

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

로컬 환경 변수 파일을 만든다. 각 앱의 `.env`는 해당 패키지 디렉터리 기준으로 읽힌다.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/admin-api/.env.example apps/admin-api/.env
```

`BETTER_AUTH_SECRET`은 앱별 `.env`마다 서로 다른 32자 이상 문자열로 둔다. `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`은 해당 기능을 실제 호출할 때만 필요하다.

## 로컬 환경 변수

학습자 API는 `apps/api/.env`에 다음 값을 둔다. 학습자 API의 기본 포트는 코드상 `3001`이므로, 로컬 표준 포트 `4000`을 쓰려면 `API_PORT=4000`을 명시해야 한다.

```env
NODE_ENV=development
BETTER_AUTH_SECRET=replace-with-32-byte-local-api-secret
DATABASE_URL=file:../../data/api.sqlite
API_PORT=4000
WEB_ORIGIN=http://localhost:3000
# OPENAI_API_KEY=sk-...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

학습자 웹은 `apps/web/.env`에 다음 값을 둔다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
WEB_API_BASE_URL=http://localhost:4000
```

어드민 API는 `apps/admin-api/.env`에 다음 값을 둔다. 어드민 API의 기본 포트는 코드상 `3002`이므로, 로컬 표준 포트 `4001`을 쓰려면 `ADMIN_API_PORT=4001`을 명시해야 한다.

```env
NODE_ENV=development
BETTER_AUTH_SECRET=replace-with-32-byte-local-admin-secret
DATABASE_URL=file:../../data/api.sqlite
ADMIN_API_PORT=4001
ADMIN_ORIGIN=http://localhost:3001
```

어드민 웹은 `apps/admin/.env`에 다음 값을 둔다. 현재는 어드민 웹 제품 화면 소스가 없으므로 이후 프론트엔드 구현 시 사용할 값이다.

```env
ADMIN_API_BASE_URL=http://localhost:4001
```

## 데이터베이스와 관리자 계정 준비

학습자 API와 어드민 API는 로컬에서 저장소 루트의 `data/api.sqlite`를 공유한다. 학습자 콘텐츠와 기본 학습자 계정을 준비한다.

```bash
bun run dev:app:setup
```

이 명령은 마이그레이션을 적용하고 기본 학습자 `user-1`, 학습자 프로필, Kwep 콘텐츠를 보존형 seed로 갱신한다. 기존 학습 진행과 답변 기록은 삭제하지 않는다. 개발 DB를 완전히 초기화해야 할 때만 `bun run db:reset`을 명시적으로 실행한다.

현재 관리자 계정 자동 시드 스크립트는 아직 없다. 어드민 API를 로컬에서 수동 검증해야 할 때는 임시 관리자 사용자를 직접 넣는다. 이 임시 절차는 현재 어드민 API의 로컬 bearer resolver가 관리자 사용자 id를 토큰으로 허용하기 때문에 가능하다.

```bash
bun -e 'import { createKwepDatabase, adminAuthUsers } from "@workspace/db"; const client = createKwepDatabase(); const now = new Date(); client.db.insert(adminAuthUsers).values({ id: "admin-1", name: "관리자", email: "admin@example.com", emailVerified: true, image: null, role: "owner", createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: adminAuthUsers.id, set: { name: "관리자", email: "admin@example.com", emailVerified: true, image: null, role: "owner", updatedAt: now } }).run(); client.close();'
```

어드민 로그인 화면과 관리자 비밀번호 시드는 어드민 프론트엔드와 `seed-admin.ts`가 구현된 뒤 `bun --filter @workspace/admin-api seed:admin`으로 대체한다.

## 학습자 플랫폼 실행

루트에서 통합 실행한다.

```bash
bun run dev:app
```

- 학습자 웹: `http://localhost:3000`
- 학습자 API: `http://localhost:4000`
- `bun run dev:app`은 서버만 시작하며 DB를 seed하거나 초기화하지 않는다. 처음 실행 전에는 `bun run dev:app:setup`을 먼저 실행한다.

개별 프로세스로 띄울 때는 터미널을 나누어 실행한다.

```bash
bun --filter @workspace/api dev
bun --filter @workspace/web dev
```

## 어드민 실행

어드민 API만 현재 실행 가능하다.

```bash
bun --filter @workspace/admin-api dev
```

- 어드민 API: `http://localhost:4001`
- 로컬 수동 검증 토큰: `Authorization: Bearer admin-1`

어드민 웹은 제품 화면 소스가 추가된 뒤 다음 명령으로 실행한다.

```bash
bun --filter @workspace/admin dev
```

목표 통합 실행 명령은 다음과 같다. 현재는 관리자 시드 스크립트와 어드민 웹 소스가 구현된 뒤 사용한다.

```bash
bun run dev:admin
```

## 모든 개발 서버 실행

구현된 앱을 모두 동시에 실행한다.

```bash
bun run dev
```

Storybook은 별도로 실행할 수 있다.

```bash
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

학습자 플랫폼을 처음 실행하는 순서는 다음과 같다.

```bash
bun install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
bun run dev:app:setup
bun run dev:app
```

어드민 API를 로컬에서 수동 검증하는 순서는 다음과 같다.

```bash
bun install
cp apps/admin-api/.env.example apps/admin-api/.env
bun --filter @workspace/db db:seed
bun -e 'import { createKwepDatabase, adminAuthUsers } from "@workspace/db"; const client = createKwepDatabase(); const now = new Date(); client.db.insert(adminAuthUsers).values({ id: "admin-1", name: "관리자", email: "admin@example.com", emailVerified: true, image: null, role: "owner", createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: adminAuthUsers.id, set: { name: "관리자", email: "admin@example.com", emailVerified: true, image: null, role: "owner", updatedAt: now } }).run(); client.close();'
bun --filter @workspace/admin-api dev
```
