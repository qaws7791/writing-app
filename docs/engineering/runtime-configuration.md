# 런타임 설정

## 기준 source

- `package.json`, `scripts/local-onboarding.ts`, `scripts/doctor.ts`
- `packages/env/src/parse-env.ts`, `packages/env/src/local-runtime-defaults.ts`
- `apps/api/.env.example`, `apps/api/src/config/env.ts`
- `apps/web/.env.example`, `apps/admin/.env.example`
- `apps/web/src/shared/config/runtime-config.ts`, `apps/web/src/server/env/runtime-config.ts`
- `apps/admin/src/shared/config/admin-runtime-config.ts`, `apps/admin/src/server/env/admin-runtime-config.ts`

제품 backend는 `apps/api` 하나다. 같은 process가 학습자 경로와 `/api/admin/*` 관리자
경로를 실행하고 SQLite client와 종료 lifecycle을 한 번 소유한다.

## 로컬 port와 Host

| 서비스                | port | 기준 설정                                     |
| --------------------- | ---: | --------------------------------------------- |
| 학습자 웹             | 3000 | Next.js dev                                   |
| 어드민 웹             | 3001 | Next.js dev                                   |
| API                   | 4000 | `API_PORT`                                    |
| E2E fixture readiness | 4199 | `scripts/run-e2e.ts`가 소유하는 임시 listener |

학습자 웹은 `http://localhost:3000`, 어드민 웹은 `http://localhost:3001`, API는
`http://localhost:4000`을 canonical 로컬 주소로 사용한다. `127.0.0.1`은 개발 서버의
listen bind로 사용할 수 있지만 frontend와 인증 origin 계약에는 사용하지 않는다. 두 웹은
같은 API origin을 소비하며 관리자 인증은 별도 secret, cookie 이름, table과 trusted origin을 유지한다.

## 로컬 자동 준비

```bash
bun run setup
```

setup은 다음을 수행한다.

1. Bun 1.3.10과 Node.js 24.x를 확인한다.
2. lockfile 기준 의존성을 설치한다.
3. 없는 `.env`를 생성하고 기존 파일에는 누락된 활성 환경 변수만 보충한다.
4. learner auth, admin auth, cursor signing secret을 서로 다른 값으로 생성한다.
5. migration, 콘텐츠 seed, 관리자 owner seed를 실행한다.
6. `bun run doctor`로 환경 파일과 DB 경로를 검사한다.

기존 사용자 값은 덮어쓰지 않는다. 저장소가 제공했던 이전 로컬 기본값만 현재
계약으로 이전한다. API 설정과 관리자 seed credential은 `apps/api/.env`
하나에 둔다. credential 원문은 setup과 doctor 출력에 노출하지 않는다.

## 통합 API 환경

| 변수                         | 필수 조건 | 설명                                             |
| ---------------------------- | --------- | ------------------------------------------------ |
| `API_PORT`                   | 선택      | API listen port, 기본값 `4000`                   |
| `API_ORIGIN`                 | 운영 필수 | 하나의 public API URL                            |
| `API_ALLOWED_HOSTS`          | 필수      | API Host authority allowlist                     |
| `LEARNER_AUTH_SECRET`        | 필수      | 학습자 인증 secret                               |
| `ADMIN_AUTH_SECRET`          | 필수      | 학습자 secret과 다른 관리자 인증 secret          |
| `WEB_ORIGIN`                 | 필수      | learner web origin                               |
| `ADMIN_ORIGIN`               | 필수      | admin web origin                                 |
| `LEARNER_AUTH_COOKIE_DOMAIN` | 운영 필수 | learner web/API의 공통 parent cookie domain      |
| `ADMIN_AUTH_COOKIE_DOMAIN`   | 운영 필수 | admin web/API의 공통 parent cookie domain        |
| `CURSOR_SIGNING_SECRET`      | 운영 필수 | learner auth secret과 다른 cursor signing secret |
| `DATABASE_URL`               | 운영 필수 | 로컬 기본값 `file:data/api.sqlite`               |
| `DEPLOYMENT_VERSION`         | 운영 필수 | 응답과 로그에 사용할 immutable 배포 식별자       |
| `ENABLE_TEST_AUTH`           | 테스트만  | production에서는 반드시 `false`                  |
| `OPENAI_API_KEY`             | 기능 선택 | AI provider 호출 시 사용                         |
| `OPENAI_MODEL`               | 선택      | OpenAI model, 기본값 `gpt-5.2`                   |

production에서는 자료실 image upload의 핵심 설정인 `ADMIN_ASSET_S3_ENDPOINT`,
`ADMIN_ASSET_S3_BUCKET`, `ADMIN_ASSET_PUBLIC_BASE_URL`, `ADMIN_ASSET_S3_ACCESS_KEY`,
`ADMIN_ASSET_S3_SECRET_KEY`가 항상 필요하다. `ADMIN_ASSET_S3_REGION`은 선택이며 기본값은
`auto`다. non-production에서는 핵심 설정 다섯 개를 모두 생략할 수 있지만 일부만 설정하면
fail-fast한다.

production parser는 HTTPS public URL, 영구 DB, secret entropy와 상호 분리, cookie
domain의 발급·소비 Host 포함, test auth 비활성화를 검증한다.

## 관리자 seed·보안 운영 설정

`bun run dev:admin:setup`은 migration, 콘텐츠 seed, 관리자 seed를 순서대로 실행한다.
관리자 credential은 `apps/api/.env`에 명시하며 기본 이메일·비밀번호 fallback은 없다.

| 변수                                  | 필수 조건 | 설명                                      |
| ------------------------------------- | --------- | ----------------------------------------- |
| `ADMIN_SEED_EMAIL`                    | seed 필수 | owner 이메일                              |
| `ADMIN_SEED_PASSWORD`                 | seed 필수 | 16자 이상, 문자 종류 3개 이상인 비밀번호  |
| `ADMIN_SEED_NAME`                     | 선택      | owner 표시 이름                           |
| `ADMIN_SEED_RESET_PASSWORD`           | 선택      | `true`일 때 기존 credential 비밀번호 갱신 |
| `ADMIN_SEED_PRODUCTION_APPROVED`      | 운영 필수 | production seed 명시 승인                 |
| `ADMIN_SEED_EXPECTED_DATABASE_URL`    | 운영 필수 | 실제 DB URL과 같은 대상 확인값            |
| `ADMIN_AUDIT_APPROVED_ADMINS_JSON`    | 감사 필수 | 승인된 관리자 email·role 목록             |
| `ADMIN_SESSION_REVOCATION_APPROVED`   | 폐기 필수 | 전체 관리자 세션 폐기 승인                |
| `ADMIN_SESSION_EXPECTED_DATABASE_URL` | 폐기 필수 | 실제 DB URL과 같은 대상 확인값            |

```bash
bun --filter @workspace/api seed:admin
bun --filter @workspace/api audit:admin-auth
bun --filter @workspace/api revoke:admin-sessions
```

## 로컬 개발 감시

`bun run dev:admin`은 `@workspace/admin`과 `@workspace/api`를 함께 시작한다. API watcher는
learner/admin route를 한 process에서 재시작하고 어드민 웹은 Next.js watcher가 소유한다.
`bun run test:admin-dev-lifecycle`은 disposable DB로 readiness, 정확한 재시작, 종료 후
3001·4000 port와 Next lock 해제를 검증한다.

`bun run dev:app`은 학습자 웹과 같은 `@workspace/api`를 시작한다. 두 dev 명령을 동시에
실행하면 API port 소유권이 충돌하므로 하나만 선택한다.

## Frontend 공개 설정

- 학습자 웹: `NEXT_PUBLIC_API_BASE_URL`, `API_BASE_URL`, `WEB_ORIGIN`,
  `ENABLE_TEST_AUTH`
- 어드민 웹: `NEXT_PUBLIC_API_BASE_URL`, `API_BASE_URL`,
  `NEXT_PUBLIC_LEARNER_WEB_ORIGIN`, `ADMIN_ORIGIN`

브라우저는 하나의 public API URL을 사용하고 두 SSR은 Compose 내부 `http://api:4000`을
사용한다. production에서 client와 server URL이 누락되면 build 또는 runtime parser가 실패한다.
