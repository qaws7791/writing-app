# 운영 환경 설정

## 원칙

- 학습자 플랫폼과 어드민은 별도 프로세스로 배포한다.
- `apps/admin`과 `apps/admin-api`가 중단되어도 `apps/web`과 `apps/api`는 계속 동작해야 한다.
- 플랫폼과 어드민은 저장소 루트 `data/api.sqlite` 단일 SQLite 파일을 공유하고, 인증 테이블과 쿠키는 분리한다.
- 모든 SQLite 연결은 현재 외래키 검사 PRAGMA를 공통 설정으로 적용한 뒤 마이그레이션과 런타임 쿼리를 실행한다.
- 운영 환경의 비밀값, OAuth client secret, 최초 관리자 비밀번호는 저장소에 커밋하지 않는다.
- Better Auth 비밀값은 각 런타임마다 서로 다른 32바이트 이상 랜덤 문자열을 사용한다.

## 2026-06-14 실행 기준

- 학습자 플랫폼은 `apps/web`과 `apps/api`를 실행해 로컬에서 사용할 수 있다.
- 어드민 API는 `apps/admin-api`를 실행해 로컬에서 사용할 수 있다.
- 어드민 웹 `apps/admin`은 패키지 골격만 있고 제품 화면 소스가 아직 없다.
- 관리자 계정 자동 시드 스크립트 `apps/admin-api/src/scripts/seed-admin.ts`가 아직 없으므로 `bun run dev:admin`은 현재 end-to-end 실행 명령으로 사용할 수 없다.
- 현재 런타임이 읽는 환경 변수 계약은 `packages/env/src/parse-env.ts`, `apps/api/src/env.ts`, `apps/admin-api/src/env.ts`를 기준으로 한다.

## 2026-06-15 요청 로그 추적성 점검 시작

- 학습자 API와 어드민 API는 요청별 `requestId`, method, path, status, duration을 구조화 로그로 남기는지 확인한다.
- 공통 logger는 운영 장애 시간축을 복원할 수 있도록 timestamp를 포함해야 한다.

## 2026-06-15 요청 로그 추적성 개선 완료

- 공통 pino logger는 기본 timestamp를 유지해 JSON 로그에 `time` 필드를 포함한다.
- 학습자 API와 어드민 API는 공통 Hono middleware로 요청 ID를 응답 헤더에 싣고, 요청 완료 시 method, path, status, duration을 구조화 로그로 남긴다.
- 외부에서 `X-Request-ID`를 전달하면 같은 값을 로그와 응답에 사용하고, 없으면 런타임에서 새 요청 ID를 생성한다.

## 2026-06-17 요청 로그 런타임 의존성 명시 완료

- request id 생성과 duration 측정은 `RequestLoggingRuntime` capability로 모델링한다.
- production 런타임은 `defaultRequestLoggingRuntime`을 조립 루트에서 주입하며, 기본 request id는 `crypto.randomUUID()`로 생성한다.
- 요청 duration은 wall clock이 아니라 monotonic clock인 `performance.now()` 기준 차이로 계산한다.
- 테스트는 request id generator와 monotonic clock을 주입해 요청 로그를 결정적으로 검증한다.

## 2026-06-15 DB 재생성 안전장치 적용 시작

- 콘텐츠 시드 중 기존 SQLite 파일을 삭제해야 하는 경우 production 기본 실행을 차단한다.
- DB 파일 삭제는 명시적 허용 환경 변수, 강제 실행 인자, 저장소 로컬 `data/` 하위 경로 조건을 모두 만족할 때만 가능해야 한다.
- 일반 마이그레이션과 신규 DB 시드는 기존처럼 삭제 없이 실행한다.

## 2026-06-15 DB 재생성 안전장치 적용 완료

- 콘텐츠 시드는 legacy SQLite 파일 재생성이 필요할 때 기본적으로 DB 파일 삭제를 거절한다.
- CLI에서 재생성이 필요한 경우 `ALLOW_DATABASE_RESET=true`와 `--force`를 함께 전달해야 한다.
- 삭제 대상 DB 파일은 저장소 루트의 `data/` 하위 경로여야 하며, 외부 경로는 명시적 허용 조건이 있어도 거절한다.

## SQLite 연결 정책

`apps/api`, `apps/admin-api`, 콘텐츠 시드는 `@workspace/db`의 공통 SQLite 연결 설정을 사용한다. 설정은 `new Database(...)` 직후 적용한다. 서버 프로세스 시작은 데이터 변경 작업을 수행하지 않으며, 마이그레이션과 시드는 배포 또는 로컬 실행 전에 명시 명령으로 먼저 실행한다.

| PRAGMA         | 값   | 목적                                   |
| -------------- | ---- | -------------------------------------- |
| `foreign_keys` | `on` | 연결 단위 외래키 제약을 항상 강제한다. |

SQLite 파일은 API 프로세스와 같은 로컬 디스크에 둔다. 여러 서버나 네트워크 파일시스템에서 같은 SQLite 파일을 직접 공유하지 않는다. WAL, `busy_timeout`, 체크포인트, 캐시 관련 PRAGMA는 운영 정책으로 필요하지만 현재 `createKwepDatabase`에는 아직 구현되어 있지 않으므로 배포 전 별도 구현과 검증이 필요하다.

## 로컬 개발

로컬 표준 포트와 현재 실행 상태는 다음과 같다. 코드의 로컬 기본값과 `.env.example`은 같은 포트 계약을 따른다.

| 앱         | 포트   | 포트 변수             | 실행 명령                               | 상태                     |
| ---------- | ------ | --------------------- | --------------------------------------- | ------------------------ |
| 학습자 웹  | `3000` | 없음                  | `bun --filter @workspace/web dev`       | 실행 가능                |
| 학습자 API | `4000` | `API_PORT=4000`       | `bun --filter @workspace/api dev`       | 실행 가능                |
| 어드민 웹  | `3001` | 없음                  | `bun --filter @workspace/admin dev`     | 제품 화면 소스 구현 필요 |
| 어드민 API | `4001` | `ADMIN_API_PORT=4001` | `bun --filter @workspace/admin-api dev` | 실행 가능                |

로컬 예시는 각 앱의 `.env.example`을 기준으로 만든다. API 앱 패키지에서 실행되는 `DATABASE_URL=file:../../data/api.sqlite`는 저장소 루트의 `data/api.sqlite`를 가리킨다.

루트 `package.json`은 포트나 비밀값을 대신 주입하지 않는다. `bun run dev:app`은 학습자 웹과 API 서버만 시작하며 DB를 변경하지 않는다. 최초 준비나 콘텐츠 갱신이 필요하면 `bun run dev:app:setup`을 명시적으로 실행한다. 깨끗한 개발 DB로 시작해야 할 때만 `bun run dev:app:fresh`를 사용한다. `bun run dev:admin`은 목표상 콘텐츠 시드와 관리자 계정 시드 후 어드민 웹/API를 실행하지만, 현재는 관리자 시드 스크립트와 어드민 웹 소스가 없어서 통합 실행 명령으로 사용할 수 없다.

## 로컬 환경 변수 파일

학습자 플랫폼 실행에는 다음 파일이 필요하다.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

어드민 API와 이후 어드민 웹 실행에는 다음 파일이 필요하다.

```bash
cp apps/admin-api/.env.example apps/admin-api/.env
cp apps/admin/.env.example apps/admin/.env
```

선택 환경 변수는 필요할 때만 정의한다. `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`을 빈 문자열로 두면 현재 parser에서 실패할 수 있다.

## 데이터베이스 준비 명령

서버 프로세스 시작 자체는 운영 데이터를 변경하지 않는다. 배포 파이프라인이나 로컬 setup 단계에서 다음 명령을 명시적으로 실행한다.

| 목적                            | 명령                                           | 비고                                                              |
| ------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| 스키마 마이그레이션만 적용      | `bun --filter @workspace/db db:migrate`        | `schema_migrations`에 적용 이력과 checksum을 기록한다.            |
| 콘텐츠 마이그레이션과 시드 적용 | `bun run dev:app:setup`                        | 로컬 학습자 앱 준비용 명령이다. 학습 진행과 답변 기록은 보존한다. |
| 개발 DB 파일 초기화             | `bun run db:reset`                             | 로컬 SQLite 파일과 WAL/SHM 파일을 삭제한다.                       |
| 최초 관리자 계정 생성           | `bun --filter @workspace/admin-api seed:admin` | 현재 스크립트 파일이 없어 실행 불가하며, 별도 구현이 필요하다.    |

운영에서는 `db:migrate`를 먼저 실행하고, 콘텐츠를 갱신해야 하는 명확한 운영 절차가 있을 때만 `db:seed`를 사용한다. `db:reset`과 `dev:app:fresh`는 로컬 개발 DB 초기화용 명령이며 운영에서 사용하지 않는다.

## 학습자 API 환경 변수

`apps/api`는 학습자 플랫폼 백엔드다.

| 변수                   | 로컬 값 예시                 | 운영 값 예시                           | 비고                                  |
| ---------------------- | ---------------------------- | -------------------------------------- | ------------------------------------- |
| `NODE_ENV`             | `development`                | `production`                           | 런타임 모드                           |
| `BETTER_AUTH_SECRET`   | 32자 이상 로컬 비밀값        | 32자 이상 운영 비밀값                  | 어드민 API 비밀값과 공유하지 않는다.  |
| `BETTER_AUTH_URL`      | `http://localhost:4000`      | `https://api.example.com`              | Google OAuth callback 기준 API origin |
| `DATABASE_URL`         | `file:../../data/api.sqlite` | `file:/var/lib/writing-app/app.sqlite` | 어드민 API와 같은 SQLite 파일을 쓴다. |
| `API_PORT`             | `4000`                       | 배포 환경 포트                         | 학습자 API listen 포트                |
| `WEB_ORIGIN`           | `http://localhost:3000`      | `https://app.example.com`              | 학습자 웹 origin                      |
| `OPENAI_API_KEY`       | 필요할 때만 설정             | OpenAI API key                         | 저장소에 커밋하지 않는다.             |
| `OPENAI_MODEL`         | `gpt-5.2`                    | 운영에서 사용할 모델 ID                | 값이 없으면 `gpt-5.2`를 사용한다.     |
| `GOOGLE_CLIENT_ID`     | 필요할 때만 설정             | Google OAuth client id                 | 저장소에 커밋하지 않는다.             |
| `GOOGLE_CLIENT_SECRET` | 필요할 때만 설정             | Google OAuth client secret             | 저장소에 커밋하지 않는다.             |

## 학습자 웹 환경 변수

`apps/web`은 학습자 플랫폼 프론트엔드다.

| 변수                       | 로컬 값 예시            | 운영 값 예시              | 비고                         |
| -------------------------- | ----------------------- | ------------------------- | ---------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | `https://api.example.com` | 브라우저에서 호출할 API URL  |
| `WEB_API_BASE_URL`         | `http://localhost:4000` | `https://api.example.com` | 서버 컴포넌트에서 호출할 API |

웹 실행 코드는 `NEXT_PUBLIC_API_BASE_URL`과 `WEB_API_BASE_URL`을 직접 읽지 않는다. `apps/web/src/runtime-config.ts`가 브라우저용 API base URL과 서버용 API base URL을 읽고 정규화하는 단일 경계이며, 인증 client와 API client factory는 이 모듈에서 받은 값을 사용한다.

## 어드민 API 환경 변수

`apps/admin-api`는 관리자 전용 백엔드다.

| 변수                 | 로컬 값 예시                 | 운영 값 예시                           | 비고                                  |
| -------------------- | ---------------------------- | -------------------------------------- | ------------------------------------- |
| `NODE_ENV`           | `development`                | `production`                           | 런타임 모드                           |
| `BETTER_AUTH_SECRET` | 32자 이상 로컬 비밀값        | 32자 이상 운영 비밀값                  | 학습자 API 비밀값과 공유하지 않는다.  |
| `DATABASE_URL`       | `file:../../data/api.sqlite` | `file:/var/lib/writing-app/app.sqlite` | 학습자 API와 같은 SQLite 파일을 쓴다. |
| `ADMIN_API_PORT`     | `4001`                       | 배포 환경 포트                         | 어드민 API listen 포트                |
| `ADMIN_ORIGIN`       | `http://localhost:3001`      | `https://admin.example.com`            | 어드민 웹 origin                      |

관리자 계정 자동 시드는 `apps/admin-api/src/scripts/seed-admin.ts`가 구현된 뒤 별도 운영 절차로 복원한다. 그 전까지는 운영 배포 대상으로 보지 않는다.

## 어드민 웹 환경 변수

`apps/admin`은 관리자 운영 대시보드 프론트엔드다. 현재는 제품 화면 소스 구현이 필요하다.

| 변수                 | 로컬 값 예시            | 운영 값 예시                    | 비고                  |
| -------------------- | ----------------------- | ------------------------------- | --------------------- |
| `ADMIN_API_BASE_URL` | `http://localhost:4001` | `https://admin-api.example.com` | 호출할 어드민 API URL |

## 배포 체크리스트

- `apps/api`와 `apps/admin-api`의 Better Auth 비밀값이 서로 다르다.
- `apps/api`의 `BETTER_AUTH_URL`이 Google OAuth redirect URI의 origin과 일치한다.
- `apps/api`의 `API_PORT`와 `WEB_ORIGIN`이 배포 환경과 일치한다.
- `apps/admin-api`의 `ADMIN_API_PORT`와 `ADMIN_ORIGIN`이 배포 환경과 일치한다.
- `apps/web`의 `NEXT_PUBLIC_API_BASE_URL`, `WEB_API_BASE_URL`은 `apps/api`의 외부 또는 내부 접근 URL과 일치한다.
- `apps/admin`의 `ADMIN_API_BASE_URL`은 `apps/admin-api`의 외부 또는 내부 접근 URL과 일치한다.
- `DATABASE_URL`이 두 API에서 같은 SQLite 파일을 가리키며, 로컬 예시는 저장소 루트 `data/api.sqlite`다.
- 단일 SQLite 파일의 권한과 백업 정책을 API 프로세스 계정 기준으로 확인한다.
- 어드민 웹 소스와 `apps/admin-api/src/scripts/seed-admin.ts`가 구현되기 전에는 어드민을 운영 배포 대상으로 보지 않는다.
