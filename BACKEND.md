# 백엔드 개발 가이드

## 아키텍처

백엔드는 모듈러 모놀리스로 구성한다. 도메인 규칙, 데이터 접근, 로깅, 프로세스 조립 책임을 패키지 단위로 분리하고, 런타임은 학습자용 API와 관리자용 API를 별도 Hono 앱으로 실행한다.

현재 학습자 API는 공개 콘텐츠 조회, Better Auth 인증, 학습 진행/답변 저장, OpenAI 기반 AI 피드백을 포함한다. 관리자 API는 관리자 인증, 콘텐츠 계층 조회, 사용자 기본 정보 조회, 현재 커리큘럼 직접 편집을 제공한다.

사용자 또는 관리자가 받을 수 있는 API 오류 응답의 `message`는 한국어로 작성한다. 상세 원칙은 `docs/text-localization-policy.md`를 따른다.

## `apps/api`

`apps/api`는 학습자 백엔드 조립 루트다. Hono 앱 생성, 라우트 등록, 환경 변수 파싱, 데이터베이스 열기, 서비스 구성, 프로세스 시작을 이곳에서 수행한다.

현재 API 라우트는 버전 접두사 없이 노출한다. 사용자 정보가 필요하지 않은 콘텐츠 조회 API는 공개로 유지하고, 사용자별 데이터가 필요한 API만 Better Auth 세션 인증을 요구한다.

- `GET /health`
- `GET /openapi.json`
- `GET /api/auth/*`, `POST /api/auth/*`
- `GET /courses`
- `GET /courses/search?q=...`
- `GET /courses/:courseId`
- `GET /lessons/:lessonId`
- `GET /me`
- `GET /profile`
- `GET /progress`
- `GET /courses/:courseId/progress`
- `GET /lessons/:lessonId/progress`
- `PUT /lessons/:lessonId/progress`
- `PUT /lessons/:lessonId/answers`
- `POST /lessons/:lessonId/complete`
- `POST /ai-feedback`

API 앱은 `@workspace/env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. `DATABASE_URL`의 `file:` prefix 제거, `CORS_ORIGIN` 분리 같은 앱별 의미 변환은 `apps/api/src/env.ts`에 유지한다.

| 변수                   | 필수 여부 | 기본값 또는 예시                              | 용도                                                                  |
| ---------------------- | --------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | 필수      | `replace-with-local-auth-secret`              | Better Auth 세션과 인증 토큰 서명에 사용하는 비밀값                   |
| `BETTER_AUTH_URL`      | 필수      | `http://localhost:4000`                       | Better Auth가 콜백과 인증 URL을 계산할 때 사용하는 API 기준 URL       |
| `CORS_ORIGIN`          | 선택      | `http://localhost:3000,http://localhost:3001` | 자격 증명 포함 요청을 허용할 프론트엔드 origin 목록                   |
| `DATABASE_URL`         | 필수      | `file:../../data/api.sqlite`                  | 저장소 루트 `data/api.sqlite` SQLite 데이터베이스 위치                |
| `GOOGLE_CLIENT_ID`     | 필수      | `replace-with-google-client-id`               | Google OAuth 클라이언트 ID                                            |
| `GOOGLE_CLIENT_SECRET` | 필수      | `replace-with-google-client-secret`           | Google OAuth 클라이언트 secret                                        |
| `LOG_LEVEL`            | 선택      | `info`                                        | Pino 로그 레벨                                                        |
| `NODE_ENV`             | 선택      | `development`                                 | 실행 환경 이름                                                        |
| `OPENAI_API_KEY`       | 필수      | `replace-with-openai-api-key`                 | AI 피드백 provider가 OpenAI Responses API를 호출할 때 사용하는 API 키 |
| `OPENAI_MODEL`         | 필수      | `gpt-5-mini`                                  | AI 피드백 생성에 사용할 OpenAI 모델 이름                              |
| `PORT`                 | 선택      | `4000`                                        | API 서버가 수신할 포트                                                |

```bash
bun --filter @workspace/api dev
```

## `apps/admin-api`

`apps/admin-api`는 관리자용 백엔드 조립 루트다. 플랫폼 API와 별도 Hono 런타임으로 실행되며, 꺼져 있어도 학습자 플랫폼 API는 정상 동작해야 한다.

주요 라우트는 다음과 같다.

- `GET /health`
- `GET /openapi.json`
- `GET /api/auth/*`, `POST /api/auth/*`
- `GET /courses?page=...&pageSize=...&query=...`
- `GET /courses?include=chapters,lessons`
- `GET /courses/:courseId`
- `GET /courses/:courseId/editor`
- `PUT /courses/:courseId/editor`
- `GET /courses/:courseId/lessons/:lessonId`
- `GET /users`

관리자 인증은 Better Auth ID/password를 사용하고, 관리자 인증 테이블은 `admin_user`, `admin_session`, `admin_account`, `admin_verification`을 사용한다. 플랫폼 사용자 인증 테이블과 쿠키 prefix를 공유하지 않는다.

어드민 API 앱은 `@workspace/env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. `DATABASE_URL`의 `file:` prefix 제거, `ADMIN_CORS_ORIGIN` 분리, 기본 포트 `4001` 같은 앱별 의미 변환은 `apps/admin-api/src/env.ts`에 유지한다.

| 변수                        | 필수 여부 | 기본값 또는 예시                    | 용도                                                                      |
| --------------------------- | --------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `ADMIN_BETTER_AUTH_SECRET`  | 필수      | `replace-with-admin-auth-secret`    | 관리자 Better Auth 세션과 인증 토큰 서명에 사용하는 비밀값                |
| `ADMIN_BETTER_AUTH_URL`     | 필수      | `http://localhost:4001`             | 관리자 Better Auth가 인증 URL을 계산할 때 사용하는 API 기준 URL           |
| `ADMIN_CORS_ORIGIN`         | 선택      | `http://localhost:3001`             | 자격 증명 포함 요청을 허용할 어드민 프론트엔드 origin                     |
| `DATABASE_URL`              | 필수      | `file:../../data/api.sqlite`        | 저장소 루트 `data/api.sqlite`에 있는 플랫폼 공유 SQLite 데이터베이스 위치 |
| `LOG_LEVEL`                 | 선택      | `info`                              | Pino 로그 레벨                                                            |
| `NODE_ENV`                  | 선택      | `development`                       | 실행 환경 이름                                                            |
| `PORT`                      | 선택      | `4001`                              | 어드민 API 서버가 수신할 포트                                             |
| `ADMIN_SEED_EMAIL`          | 시드 필수 | `admin@example.com`                 | 최초 관리자 계정 시드에 사용할 이메일                                     |
| `ADMIN_SEED_PASSWORD`       | 시드 필수 | `replace-with-local-admin-password` | 최초 관리자 계정 시드에 사용할 비밀번호                                   |
| `ADMIN_SEED_NAME`           | 시드 선택 | `관리자`                            | 최초 관리자 계정 시드에 사용할 이름                                       |
| `ADMIN_SEED_RESET_PASSWORD` | 시드 선택 | `false`                             | `true`일 때 기존 관리자 credential 비밀번호를 시드 비밀번호로 갱신        |

```bash
bun --filter @workspace/admin-api dev
```

최초 관리자 계정은 다음 명령으로 생성한다. 같은 이메일이 이미 있으면 중복 생성하지 않는다.

```bash
bun --filter @workspace/admin-api seed:admin
```

## `packages/core`

`packages/core`는 도메인 중심 계약을 담는다. 콘텐츠, 학습 진행, AI 피드백, 관리자 DTO, 브랜드 ID, 저장소 포트, 명시적 결과 변형, 도메인 서비스를 제공한다. 외부 런타임이나 데이터베이스 구현에 의존하지 않고 API와 데이터베이스 패키지가 공유하는 도메인 경계를 정의한다.

## 콘텐츠 변경 정책

콘텐츠 변경 정책의 단일 출처는 `DOMAIN.md`다. 현재 구현은 단일 현재 커리큘럼만 운영한다. 공개 콘텐츠 목록/검색/상세 조회는 `course_chapters`, `course_lessons`, `lesson_steps`의 active 상태를 기준으로 계산한다.

학습 진행은 `courseId`와 `lessonId`에 직접 묶인다. `course_progress`와 `lesson_progress`에는 `curriculum_version_id`를 저장하지 않는다. 레슨 진행 저장, 완료, 답변 저장은 대상 레슨이 현재 코스 커리큘럼에 포함되는지 확인한 뒤 처리한다.

관리자 편집은 현재 커리큘럼 전체 스냅샷을 저장한다. `PUT /courses/:courseId/editor`는 코스 기본 정보, 챕터, 레슨 배치, 스텝을 현재 테이블에 반영하고, 저장 요청에서 빠진 기존 스텝은 삭제하지 않고 `archived` 상태로 바꾼다.

## `packages/db`

`packages/db`는 Drizzle SQLite 기반 영속성 패키지다. 콘텐츠, Better Auth, 학습 진행, AI 피드백 시도 스키마, 마이그레이션 SQL, 시드 데이터, 데이터베이스 클라이언트 생성, 저장소 구현을 제공한다.

인증과 학습자 상태 테이블은 다음 이름을 사용한다.

- `user`, `session`, `account`, `verification`: Better Auth 테이블
- `admin_user`, `admin_session`, `admin_account`, `admin_verification`: 관리자 Better Auth 테이블
- `courses`, `course_categories`: 코스와 카테고리
- `course_chapters`, `course_lessons`: 현재 커리큘럼의 챕터와 레슨 배치
- `lessons`, `lesson_steps`: 레슨 본문과 스텝
- `course_progress`: 사용자별 코스 진행 요약
- `lesson_progress`: 사용자별 레슨 현재 위치와 완료 상태
- `lesson_answers`: 사용자별 레슨 스텝 답변
- `feedback_attempts`: AI 피드백 완료 시도와 구조화 결과

콘텐츠 시드는 현재 웹 카탈로그와 과정 상세 화면의 과정/챕터/레슨 ID를 명시적으로 보관한다. 모든 레슨은 현재 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE` 기본 단계로 플레이 가능성과 학습 상태 저장 경로를 보장한다.

AI 피드백은 `apps/api`의 OpenAI provider가 OpenAI Responses API와 Structured Outputs를 호출하고, `packages/core`의 AI 피드백 서비스가 재시도 제한, 저장 답변 조회, 결과 저장 규칙을 담당한다. OpenAI 호출 실패는 사용자 재시도 횟수를 소모하지 않고 `ai-feedback-unavailable` 오류로 반환한다.

## `packages/logger`

`packages/logger`는 Pino 로거 생성과 요청 로그 필드 헬퍼를 제공한다. API 조립 루트와 라우트 주변부에서 공통 로그 형식을 재사용한다.
