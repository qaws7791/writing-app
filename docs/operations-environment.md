# 운영 환경 설정

## 원칙

- 학습자 플랫폼과 어드민은 별도 프로세스로 배포한다.
- `apps/admin`과 `apps/admin-api`가 중단되어도 `apps/web`과 `apps/api`는 계속 동작해야 한다.
- 플랫폼과 어드민은 저장소 루트 `data/api.sqlite` 단일 SQLite 파일을 공유하고, 인증 테이블과 쿠키는 분리한다.
- 운영 환경의 비밀값, OAuth client secret, 최초 관리자 비밀번호는 저장소에 커밋하지 않는다.
- Better Auth 비밀값은 각 런타임마다 서로 다른 32바이트 이상 랜덤 문자열을 사용한다.

## 로컬 개발

로컬 기본 포트는 다음과 같다.

| 앱               | 포트           | 실행 명령                                            |
| ---------------- | -------------- | ---------------------------------------------------- |
| 학습자 웹        | `3000`         | `bun --filter @workspace/web dev`                    |
| 학습자 API       | `4000`         | `bun --filter @workspace/api dev`                    |
| 어드민 웹        | `3001`         | `bun --filter @workspace/admin dev`                  |
| 어드민 API       | `4001`         | `bun --filter @workspace/admin-api dev`              |
| 어드민 통합 실행 | `3001`, `4001` | `bun dev:admin`                                      |
| RustFS S3 API    | `9000`         | `docker compose up rustfs rustfs_public_assets_init` |
| RustFS Console   | `9001`         | `docker compose up rustfs`                           |

로컬 예시는 각 앱의 `.env.example`을 기준으로 만든다. API 앱 패키지에서 실행되는 `DATABASE_URL=file:../../data/api.sqlite`는 저장소 루트의 `data/api.sqlite`를 가리킨다.

루트 `package.json`은 환경 변수 값을 주입하지 않는다. `bun dev:admin`은 실행 전에 `bun run dev:admin:setup`으로 콘텐츠 시드와 관리자 계정 시드를 실행하지만, 필요한 값은 `.env`, 셸, CI 같은 실행 환경에서 명시적으로 제공되어야 한다. 필수 환경 변수가 없으면 `apps/admin-api/src/env.ts` 또는 `apps/admin-api/src/scripts/seed-admin.ts`에서 즉시 실패한다.

- `apps/api/.env.example`
- `apps/admin/.env.example`
- `apps/admin-api/.env.example`

## 학습자 API 환경 변수

`apps/api`는 학습자 플랫폼 백엔드다.

| 변수                   | 운영 값 예시                           | 비고                                           |
| ---------------------- | -------------------------------------- | ---------------------------------------------- |
| `BETTER_AUTH_SECRET`   | 32바이트 이상 랜덤 문자열              | 어드민 비밀값과 공유하지 않는다.               |
| `BETTER_AUTH_URL`      | `https://api.example.com`              | 학습자 API의 외부 접근 URL                     |
| `CORS_ORIGIN`          | `https://app.example.com`              | 쉼표로 여러 origin을 허용할 수 있다.           |
| `DATABASE_URL`         | `file:/var/lib/writing-app/app.sqlite` | 어드민 API와 같은 단일 SQLite 파일을 사용한다. |
| `GOOGLE_CLIENT_ID`     | Google OAuth client id                 | 운영 OAuth 앱 기준                             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret             | 저장소에 커밋하지 않는다.                      |
| `OPENAI_API_KEY`       | OpenAI API key                         | 저장소에 커밋하지 않는다.                      |
| `OPENAI_MODEL`         | `gpt-5-mini`                           | 운영 모델 정책에 맞춘다.                       |
| `PORT`                 | `4000`                                 | systemd/Caddy 설정과 맞춘다.                   |
| `LOG_LEVEL`            | `info`                                 | 장애 분석 시 일시적으로 높인다.                |
| `NODE_ENV`             | `production`                           | 운영에서는 `production`을 사용한다.            |

## 어드민 로컬 실행 전 준비

`bun dev:admin`을 실행하기 전에 다음 값을 명시적으로 준비한다.

```env
ADMIN_API_BASE_URL=http://localhost:4001
ADMIN_BETTER_AUTH_SECRET=replace-with-32-byte-random-secret
ADMIN_BETTER_AUTH_URL=http://localhost:4001
ADMIN_CORS_ORIGIN=http://localhost:3001
DATABASE_URL=file:../../data/api.sqlite
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=replace-with-local-admin-password
ADMIN_ASSET_S3_ENDPOINT=http://localhost:9000
ADMIN_ASSET_S3_REGION=us-east-1
ADMIN_ASSET_S3_BUCKET=writing-app-public-assets
ADMIN_ASSET_PUBLIC_BASE_URL=http://localhost:9000/writing-app-public-assets
ADMIN_ASSET_S3_ACCESS_KEY=replace-with-local-rustfs-access-key
ADMIN_ASSET_S3_SECRET_KEY=replace-with-local-rustfs-secret-key
```

기존 관리자 계정 비밀번호를 시드 값으로 갱신해야 할 때만 `ADMIN_SEED_RESET_PASSWORD=true`를 명시한다. 루트 스크립트는 이 값을 대신 설정하지 않는다.

## 어드민 API 환경 변수

`apps/admin-api`는 관리자 전용 백엔드다.

| 변수                          | 운영 값 예시                                           | 비고                                                                            |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `ADMIN_BETTER_AUTH_SECRET`    | 32바이트 이상 랜덤 문자열                              | 플랫폼 `BETTER_AUTH_SECRET`과 공유하지 않는다.                                  |
| `ADMIN_BETTER_AUTH_URL`       | `https://admin-api.example.com`                        | 어드민 API의 외부 접근 URL                                                      |
| `ADMIN_CORS_ORIGIN`           | `https://admin.example.com`                            | 어드민 웹 origin만 허용한다.                                                    |
| `DATABASE_URL`                | `file:/var/lib/writing-app/app.sqlite`                 | 플랫폼 API와 같은 단일 SQLite 파일을 사용한다.                                  |
| `PORT`                        | `4001`                                                 | systemd/Caddy 설정과 맞춘다.                                                    |
| `LOG_LEVEL`                   | `info`                                                 | 장애 분석 시 일시적으로 높인다.                                                 |
| `NODE_ENV`                    | `production`                                           | 운영에서는 `production`을 사용한다.                                             |
| `ADMIN_ASSET_S3_ENDPOINT`     | `https://s3.example.com`                               | RustFS 또는 S3-compatible API endpoint                                          |
| `ADMIN_ASSET_S3_REGION`       | `us-east-1`                                            | S3 signed URL 생성에 사용할 region                                              |
| `ADMIN_ASSET_S3_BUCKET`       | `writing-app-public-assets`                            | 코스 썸네일을 저장할 공개 에셋 버킷                                             |
| `ADMIN_ASSET_PUBLIC_BASE_URL` | `https://assets.example.com/writing-app-public-assets` | DB에 저장할 공개 썸네일 URL의 기준 경로                                         |
| `ADMIN_ASSET_S3_ACCESS_KEY`   | S3 access key                                          | signed URL 발급용 서버 전용 access key                                          |
| `ADMIN_ASSET_S3_SECRET_KEY`   | S3 secret key                                          | signed URL 발급용 서버 전용 secret key                                          |
| `ADMIN_SEED_EMAIL`            | 최초 관리자 이메일                                     | 최초 시드 실행 시에만 필요하다.                                                 |
| `ADMIN_SEED_PASSWORD`         | 최초 관리자 임시 비밀번호                              | 시드 후 즉시 교체한다.                                                          |
| `ADMIN_SEED_NAME`             | 최초 관리자 이름                                       | 생략하면 `관리자`를 사용한다.                                                   |
| `ADMIN_SEED_RESET_PASSWORD`   | `false`                                                | `true`일 때 기존 관리자 credential 비밀번호를 `ADMIN_SEED_PASSWORD`로 갱신한다. |

최초 관리자 계정은 운영 배포 직후 한 번만 생성한다.

```bash
bun --filter @workspace/admin-api seed:admin
```

같은 이메일로 다시 실행하면 기본적으로 중복 생성하지 않는다. 운영에서 기존 관리자 비밀번호를 바꿔야 하는 경우에만 `ADMIN_SEED_RESET_PASSWORD=true`를 명시한다. `ADMIN_SEED_PASSWORD`는 시드 완료 후 운영 비밀값 저장소에서 제거한다.

## 어드민 웹 환경 변수

`apps/admin`은 서버 컴포넌트와 same-origin auth proxy에서 어드민 API를 호출한다.

| 변수                 | 운영 값 예시                    | 비고                                                    |
| -------------------- | ------------------------------- | ------------------------------------------------------- |
| `ADMIN_API_BASE_URL` | `https://admin-api.example.com` | 브라우저 origin이 아니라 서버에서 접근할 어드민 API URL |

## 배포 체크리스트

- `apps/api`와 `apps/admin-api`의 Better Auth 비밀값이 서로 다르다.
- `apps/api`의 `CORS_ORIGIN`에는 학습자 웹 origin만 둔다.
- `apps/admin-api`의 `ADMIN_CORS_ORIGIN`에는 어드민 웹 origin만 둔다.
- `apps/admin`의 `ADMIN_API_BASE_URL`은 `apps/admin-api`의 외부 또는 내부 접근 URL과 일치한다.
- `DATABASE_URL`이 두 API에서 같은 SQLite 파일을 가리키며, 로컬 예시는 저장소 루트 `data/api.sqlite`다.
- `ADMIN_ASSET_S3_ACCESS_KEY`와 `ADMIN_ASSET_S3_SECRET_KEY`는 RustFS 또는 운영 S3-compatible 스토리지 credential과 일치한다.
- `ADMIN_ASSET_PUBLIC_BASE_URL`은 공개 다운로드가 가능한 bucket 또는 CDN 경로를 가리킨다.
- 단일 SQLite 파일의 권한과 백업 정책을 API 프로세스 계정 기준으로 확인한다.
- `bun --filter @workspace/admin-api seed:admin` 실행 후 최초 관리자 비밀번호를 교체한다.
