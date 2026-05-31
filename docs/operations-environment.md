# 운영 환경 설정

## 원칙

- 학습자 플랫폼과 어드민은 별도 프로세스로 배포한다.
- `apps/admin`과 `apps/admin-api`가 중단되어도 `apps/web`과 `apps/api`는 계속 동작해야 한다.
- 플랫폼과 어드민은 저장소 루트 `data/api.sqlite` 단일 SQLite 파일을 공유하고, 인증 테이블과 쿠키는 분리한다.
- 모든 SQLite 연결은 WAL, `busy_timeout`, 외래키 검사, 체크포인트, 캐시 관련 PRAGMA를 공통 설정으로 적용한 뒤 마이그레이션과 런타임 쿼리를 실행한다.
- 운영 환경의 비밀값, OAuth client secret, 최초 관리자 비밀번호는 저장소에 커밋하지 않는다.
- Better Auth 비밀값은 각 런타임마다 서로 다른 32바이트 이상 랜덤 문자열을 사용한다.

## SQLite 연결 정책

`apps/api`, `apps/admin-api`, 콘텐츠 시드, 관리자 시드는 `@workspace/db`의 공통 SQLite 연결 설정을 사용한다. 설정은 `new Database(...)` 직후 적용한다. 서버 프로세스 시작은 데이터 변경 작업을 수행하지 않으며, 마이그레이션과 시드는 배포 또는 로컬 실행 전에 명시 명령으로 먼저 실행한다.

| PRAGMA               | 값          | 목적                                                                 |
| -------------------- | ----------- | -------------------------------------------------------------------- |
| `foreign_keys`       | `on`        | 연결 단위 외래키 제약을 항상 강제한다.                               |
| `journal_mode`       | `WAL`       | 단일 로컬 파일을 공유하는 두 API 프로세스의 읽기/쓰기 충돌을 줄인다. |
| `synchronous`        | `NORMAL`    | WAL 모드에서 내구성과 쓰기 성능의 균형을 잡는다.                     |
| `busy_timeout`       | `5000`      | 쓰기 락 경합 시 즉시 실패하지 않고 최대 5초 대기한다.                |
| `wal_autocheckpoint` | `1000`      | WAL이 1000페이지 이상이면 자동 체크포인트를 시도한다.                |
| `journal_size_limit` | `67108864`  | 체크포인트 후 남는 journal/WAL 파일 크기를 64MiB로 제한한다.         |
| `mmap_size`          | `268435456` | 로컬 파일 읽기 성능을 위해 최대 256MiB 메모리 매핑을 허용한다.       |
| `temp_store`         | `MEMORY`    | 임시 정렬/인덱스 저장소를 메모리 우선으로 사용한다.                  |
| `optimize`           | `0x10002`   | 연결 시작 시 쿼리 플래너 통계를 필요한 범위에서 최신화한다.          |

SQLite 파일은 API 프로세스와 같은 로컬 디스크에 둔다. 여러 서버나 네트워크 파일시스템에서 같은 SQLite 파일을 직접 공유하지 않는다. WAL 모드에서는 `*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm`이 함께 데이터베이스 상태를 구성하므로, 백업 직전에는 쓰기 트래픽을 멈추거나 SQLite 백업 API를 사용한다. 단순 파일 복사가 필요한 점검 상황에서는 먼저 `pragma wal_checkpoint(TRUNCATE)`를 실행한다.

## 로컬 개발

로컬 기본 포트는 다음과 같다.

| 앱               | 포트           | 실행 명령                               |
| ---------------- | -------------- | --------------------------------------- |
| 학습자 웹        | `3000`         | `bun --filter @workspace/web dev`       |
| 학습자 API       | `4000`         | `bun --filter @workspace/api dev`       |
| 어드민 웹        | `3001`         | `bun --filter @workspace/admin dev`     |
| 어드민 API       | `4001`         | `bun --filter @workspace/admin-api dev` |
| 어드민 통합 실행 | `3001`, `4001` | `bun dev:admin`                         |

로컬 예시는 각 앱의 `.env.example`을 기준으로 만든다. API 앱 패키지에서 실행되는 `DATABASE_URL=file:../../data/api.sqlite`는 저장소 루트의 `data/api.sqlite`를 가리킨다.

루트 `package.json`은 환경 변수 값을 주입하지 않는다. `bun dev:app`은 실행 전에 `bun run dev:app:setup`으로 콘텐츠 마이그레이션과 시드를 실행한다. `bun dev:admin`은 실행 전에 `bun run dev:admin:setup`으로 콘텐츠 시드와 관리자 계정 시드를 실행한다. 필요한 값은 `.env`, 셸, CI 같은 실행 환경에서 명시적으로 제공되어야 한다. 필수 환경 변수가 없으면 `apps/admin-api/src/env.ts` 또는 `apps/admin-api/src/scripts/seed-admin.ts`에서 즉시 실패한다.

## 데이터베이스 준비 명령

서버 시작 명령은 운영 데이터를 변경하지 않는다. 배포 파이프라인이나 로컬 setup 단계에서 다음 명령을 명시적으로 실행한다.

| 목적                            | 명령                                           | 비고                                                      |
| ------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| 스키마 마이그레이션만 적용      | `bun --filter @workspace/db db:migrate`        | `schema_migrations`에 적용 이력과 checksum을 기록한다.    |
| 콘텐츠 마이그레이션과 시드 적용 | `bun --filter @workspace/db db:seed`           | 로컬 개발이나 콘텐츠 초기화가 필요한 환경에서만 사용한다. |
| 최초 관리자 계정 생성           | `bun --filter @workspace/admin-api seed:admin` | 운영 배포 직후 한 번만 실행한다.                          |

운영에서는 `db:migrate`를 먼저 실행하고, 콘텐츠를 덮어써야 하는 명확한 운영 절차가 있을 때만 `db:seed`를 사용한다.

- `apps/api/.env.example`
- `apps/web/.env.example`
- `apps/admin/.env.example`
- `apps/admin-api/.env.example`

## 학습자 API 환경 변수

`apps/api`는 학습자 플랫폼 백엔드다.

| 변수                        | 운영 값 예시                           | 비고                                                               |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `BETTER_AUTH_SECRET`        | 32바이트 이상 랜덤 문자열              | 어드민 비밀값과 공유하지 않는다.                                   |
| `BETTER_AUTH_URL`           | `https://api.example.com`              | 학습자 API의 외부 접근 URL                                         |
| `BETTER_AUTH_COOKIE_DOMAIN` | `example.com` 또는 비움                | 학습자 웹과 API가 같은 parent domain의 서브도메인일 때만 설정한다. |
| `CORS_ORIGIN`               | `https://app.example.com`              | 쉼표로 여러 origin을 허용할 수 있다.                               |
| `DATABASE_URL`              | `file:/var/lib/writing-app/app.sqlite` | 어드민 API와 같은 단일 SQLite 파일을 사용한다.                     |
| `GOOGLE_CLIENT_ID`          | Google OAuth client id                 | 운영 OAuth 앱 기준                                                 |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth client secret             | 저장소에 커밋하지 않는다.                                          |
| `OPENAI_API_KEY`            | OpenAI API key                         | 저장소에 커밋하지 않는다.                                          |
| `OPENAI_MODEL`              | `gpt-5-mini`                           | 운영 모델 정책에 맞춘다.                                           |
| `PORT`                      | `4000`                                 | systemd/Caddy 설정과 맞춘다.                                       |
| `LOG_LEVEL`                 | `info`                                 | 장애 분석 시 일시적으로 높인다.                                    |
| `NODE_ENV`                  | `production`                           | 운영에서는 `production`을 사용한다.                                |

## 어드민 로컬 실행 전 준비

`bun dev:admin`을 실행하기 전에 다음 값을 명시적으로 준비한다.

```env
ADMIN_API_BASE_URL=http://localhost:4001
ADMIN_BETTER_AUTH_SECRET=replace-with-32-byte-random-secret
ADMIN_BETTER_AUTH_URL=http://localhost:4001
ADMIN_BETTER_AUTH_COOKIE_DOMAIN=
ADMIN_CORS_ORIGIN=http://localhost:3001
DATABASE_URL=file:../../data/api.sqlite
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=replace-with-local-admin-password
```

기존 관리자 계정 비밀번호를 시드 값으로 갱신해야 할 때만 `ADMIN_SEED_RESET_PASSWORD=true`를 명시한다. 루트 스크립트는 이 값을 대신 설정하지 않는다.

## 어드민 API 환경 변수

`apps/admin-api`는 관리자 전용 백엔드다.

| 변수                              | 운영 값 예시                           | 비고                                                                            |
| --------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `ADMIN_BETTER_AUTH_SECRET`        | 32바이트 이상 랜덤 문자열              | 플랫폼 `BETTER_AUTH_SECRET`과 공유하지 않는다.                                  |
| `ADMIN_BETTER_AUTH_URL`           | `https://admin-api.example.com`        | 어드민 API의 외부 접근 URL                                                      |
| `ADMIN_BETTER_AUTH_COOKIE_DOMAIN` | `example.com` 또는 비움                | 어드민 웹과 어드민 API가 같은 parent domain의 서브도메인일 때만 설정한다.       |
| `ADMIN_CORS_ORIGIN`               | `https://admin.example.com`            | 어드민 웹 origin만 허용한다.                                                    |
| `DATABASE_URL`                    | `file:/var/lib/writing-app/app.sqlite` | 플랫폼 API와 같은 단일 SQLite 파일을 사용한다.                                  |
| `PORT`                            | `4001`                                 | systemd/Caddy 설정과 맞춘다.                                                    |
| `LOG_LEVEL`                       | `info`                                 | 장애 분석 시 일시적으로 높인다.                                                 |
| `NODE_ENV`                        | `production`                           | 운영에서는 `production`을 사용한다.                                             |
| `ADMIN_SEED_EMAIL`                | 최초 관리자 이메일                     | 최초 시드 실행 시에만 필요하다.                                                 |
| `ADMIN_SEED_PASSWORD`             | 최초 관리자 임시 비밀번호              | 시드 후 즉시 교체한다.                                                          |
| `ADMIN_SEED_NAME`                 | 최초 관리자 이름                       | 생략하면 `관리자`를 사용한다.                                                   |
| `ADMIN_SEED_RESET_PASSWORD`       | `false`                                | `true`일 때 기존 관리자 credential 비밀번호를 `ADMIN_SEED_PASSWORD`로 갱신한다. |

최초 관리자 계정은 운영 배포 직후 한 번만 생성한다.

```bash
bun --filter @workspace/admin-api seed:admin
```

같은 이메일로 다시 실행하면 기본적으로 중복 생성하지 않는다. 운영에서 기존 관리자 비밀번호를 바꿔야 하는 경우에만 `ADMIN_SEED_RESET_PASSWORD=true`를 명시한다. `ADMIN_SEED_PASSWORD`는 시드 완료 후 운영 비밀값 저장소에서 제거한다.

## 어드민 웹 환경 변수

`apps/admin`은 서버 컴포넌트와 브라우저 로그인 요청에서 어드민 API URL을 명시적으로 사용한다.

| 변수                 | 운영 값 예시                    | 비고                                                         |
| -------------------- | ------------------------------- | ------------------------------------------------------------ |
| `ADMIN_API_BASE_URL` | `https://admin-api.example.com` | 서버 컴포넌트와 브라우저 로그인 요청이 호출할 어드민 API URL |

## 배포 체크리스트

- `apps/api`와 `apps/admin-api`의 Better Auth 비밀값이 서로 다르다.
- `apps/api`의 `CORS_ORIGIN`에는 학습자 웹 origin만 둔다.
- `apps/admin-api`의 `ADMIN_CORS_ORIGIN`에는 어드민 웹 origin만 둔다.
- 웹 origin과 API origin이 같은 parent domain의 서브도메인인지 확인한다.
- 서브도메인 배포에서는 `BETTER_AUTH_COOKIE_DOMAIN` 또는 `ADMIN_BETTER_AUTH_COOKIE_DOMAIN`을 parent domain으로 설정한다.
- 서로 다른 site domain 배포에서는 직접 cookie 인증을 사용하지 않는다.
- `apps/admin`의 `ADMIN_API_BASE_URL`은 `apps/admin-api`의 외부 또는 내부 접근 URL과 일치한다.
- `DATABASE_URL`이 두 API에서 같은 SQLite 파일을 가리키며, 로컬 예시는 저장소 루트 `data/api.sqlite`다.
- 단일 SQLite 파일의 권한과 백업 정책을 API 프로세스 계정 기준으로 확인한다.
- `bun --filter @workspace/admin-api seed:admin` 실행 후 최초 관리자 비밀번호를 교체한다.
