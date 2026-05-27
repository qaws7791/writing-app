# 백엔드 개발 가이드

## 아키텍처

백엔드는 모듈러 모놀리스로 구성한다. 도메인 규칙, 데이터 접근, 로깅, 프로세스 조립 책임을 패키지 단위로 분리하고, 런타임은 학습자용 API와 관리자용 API를 별도 Hono 앱으로 실행한다. 현재 학습자 API는 공개 콘텐츠 조회, Better Auth 인증, 학습 진행/답변 저장, OpenAI 기반 AI 피드백을 포함한다. 관리자 API는 관리자 인증, 콘텐츠 계층 조회, 사용자 기본 정보 조회, 커리큘럼 버전 draft 생성과 publish를 제공한다. 콘텐츠 본문과 구조를 직접 생성, 수정, 삭제하는 관리 API는 아직 포함하지 않는다.

## 앱과 패키지 책임

### `apps/api`

`apps/api`는 백엔드 조립 루트다. Hono 앱 생성, 라우트 등록, 환경 변수 파싱, 데이터베이스 열기, 서비스 구성, 프로세스 시작을 이곳에서 수행한다.

현재 API 라우트는 버전 접두사 없이 노출한다. 사용자 정보가 필요하지 않은 콘텐츠 조회 API는 공개로 유지하고, 사용자별 데이터가 필요한 API만 Better Auth 세션 인증을 요구한다.

- `GET /health`
- `GET /openapi.json`
- `GET /api/auth/*`, `POST /api/auth/*`: Better Auth 인증 엔드포인트
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

API 앱은 `@workspace/env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. 공유 패키지는 Zod 검증, 빈 문자열 정규화, 오류 메시지 형식만 담당한다. `DATABASE_URL`의 `file:` prefix 제거, `CORS_ORIGIN` 분리 같은 앱별 의미 변환은 `apps/api/src/env.ts`에 유지한다.

필수 환경 변수는 누락 시 서버 시작 단계에서 즉시 실패한다. 기능을 숨기거나 다른 동작으로 대체하지 않는다. 로컬 실행에 필요한 전체 예시는 `apps/api/.env.example`을 기준으로 관리하고, 운영 환경 값과 배포 체크리스트는 `docs/operations-environment.md`를 기준으로 관리한다.

| 변수                   | 필수 여부 | 기본값 또는 예시                              | 용도                                                                                                       |
| ---------------------- | --------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | 필수      | `replace-with-local-auth-secret`              | Better Auth 세션과 인증 토큰 서명에 사용하는 비밀값                                                        |
| `BETTER_AUTH_URL`      | 필수      | `http://localhost:4000`                       | Better Auth가 콜백과 인증 URL을 계산할 때 사용하는 API 기준 URL                                            |
| `CORS_ORIGIN`          | 선택      | `http://localhost:3000,http://localhost:3001` | 자격 증명 포함 요청을 허용할 프론트엔드 origin 목록. 쉼표로 여러 값을 구분한다.                            |
| `DATABASE_URL`         | 필수      | `file:../../data/api.sqlite`                  | 저장소 루트 `data/api.sqlite` SQLite 데이터베이스 위치. `file:` 접두사는 API 시작 시 파일 경로로 변환한다. |
| `GOOGLE_CLIENT_ID`     | 필수      | `replace-with-google-client-id`               | Google OAuth 클라이언트 ID                                                                                 |
| `GOOGLE_CLIENT_SECRET` | 필수      | `replace-with-google-client-secret`           | Google OAuth 클라이언트 secret                                                                             |
| `LOG_LEVEL`            | 선택      | `info`                                        | Pino 로그 레벨. `trace`, `debug`, `info`, `warn`, `error`, `fatal` 중 하나를 사용한다.                     |
| `NODE_ENV`             | 선택      | `development`                                 | 실행 환경 이름. 로거와 런타임 환경 구분에 사용한다.                                                        |
| `OPENAI_API_KEY`       | 필수      | `replace-with-openai-api-key`                 | AI 피드백 provider가 OpenAI Responses API를 호출할 때 사용하는 API 키                                      |
| `OPENAI_MODEL`         | 필수      | `gpt-5-mini`                                  | AI 피드백 생성에 사용할 OpenAI 모델 이름                                                                   |
| `PORT`                 | 선택      | `4000`                                        | API 서버가 수신할 포트                                                                                     |

기본값이 있는 선택 환경 변수는 `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`, `NODE_ENV`이다. `DATABASE_URL`은 예시 파일에서 앱 패키지 기준 상대 경로 `../../data/api.sqlite`를 사용해 저장소 루트 `data/api.sqlite`를 가리키지만, 런타임 검증에서는 명시 입력을 요구한다.

```bash
bun --filter @workspace/api dev
```

### `apps/admin-api`

`apps/admin-api`는 관리자용 백엔드 조립 루트다. 플랫폼 API와 별도 Hono 런타임으로 실행되며, 꺼져 있어도 학습자 플랫폼 API는 정상 동작해야 한다.

주요 라우트는 다음과 같다.

- `GET /health`
- `GET /openapi.json`
- `GET /api/auth/*`, `POST /api/auth/*`
- `GET /courses?page=...&pageSize=...&query=...`
- `GET /courses?include=chapters,lessons`
- `GET /courses/:courseId/curriculum-versions`
- `POST /courses/:courseId/curriculum-versions`
- `GET /curriculum-versions/:versionId`
- `POST /curriculum-versions/:versionId/publish`
- `GET /users`

관리자 인증은 Better Auth ID/password를 사용하고, 관리자 인증 테이블은 `admin_user`, `admin_session`, `admin_account`, `admin_verification`을 사용한다. 플랫폼 사용자 인증 테이블과 쿠키 prefix를 공유하지 않는다.

어드민 API 앱은 `@workspace/env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. `DATABASE_URL`의 `file:` prefix 제거, `ADMIN_CORS_ORIGIN` 분리, 기본 포트 `4001` 같은 앱별 의미 변환은 `apps/admin-api/src/env.ts`에 유지한다.

필수 환경 변수는 누락 시 서버 시작 단계에서 즉시 실패한다. 운영 환경 값과 배포 체크리스트는 `docs/operations-environment.md`를 기준으로 관리한다.

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

로컬 통합 실행에서는 루트 `bun run dev:admin`이 `bun run dev:admin:setup`을 먼저 실행한다. 이 setup은 콘텐츠 시드와 관리자 계정 시드를 실행하지만, 환경 변수 값은 루트 `package.json`에서 주입하지 않는다. `DATABASE_URL`, `ADMIN_BETTER_AUTH_SECRET`, `ADMIN_BETTER_AUTH_URL`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` 같은 필수 값은 `.env`, 셸, CI에서 명시적으로 제공한다. 필수 값이 없으면 시작 단계에서 실패한다.

### `packages/core`

`packages/core`는 도메인 중심 계약을 담는다. 콘텐츠, 학습 진행, AI 피드백 DTO, `CourseId`, `LessonId`, `UserId` 같은 브랜드 ID, 저장소 포트, 명시적 결과 변형, 도메인 서비스를 제공한다. 외부 런타임이나 데이터베이스 구현에 의존하지 않고 API와 데이터베이스 패키지가 공유하는 도메인 경계를 정의한다.

### 콘텐츠 변경 정책

콘텐츠 변경 정책의 단일 출처는 `DOMAIN.md`다. 백엔드 구현은 이 정책을 기준으로 학습자 완료 성취를 보존해야 한다.

현재 구현은 `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons` 스키마를 갖고, 공개 콘텐츠 목록/검색/상세 조회는 최신 published 커리큘럼 버전의 active 챕터와 레슨 배치 스냅샷을 기준으로 계산한다. 학습 진행은 `course_progress.curriculum_version_id`를 기준으로 학습자가 시작한 커리큘럼 버전을 유지하고, `lesson_progress.curriculum_version_id`에 각 레슨 진행의 기준 버전을 함께 기록한다.

관리자 코스 트리 조회는 최신 published 커리큘럼 버전의 챕터와 레슨을 `active`, `deprecated`, `archived` 상태와 함께 반환한다. 공개 콘텐츠와 학습 진행 경로는 active 노드만 신규 학습 경로로 사용하지만, 이미 저장된 완료 진행 row는 archived 여부와 관계없이 완료 성취로 남긴다.

관리자 발행 API는 최신 published 버전의 snapshot에서 draft를 만들고, draft를 published 상태로 승격한다. publish 후 공개 콘텐츠 조회는 코스에서 가장 큰 published `version_number`를 최신 버전으로 사용한다. 기존 학습자 진행 row는 자동 마이그레이션하지 않고 저장된 `course_progress.curriculum_version_id`를 유지한다.

관리자 마이그레이션 API는 published 버전 사이의 레슨 매핑을 생성하고 특정 사용자 진행에 적용한다. `equivalent`와 `split`은 완료 source lesson을 target lesson 완료로 이전하고, `merged`는 같은 target lesson에 연결된 모든 source lesson이 완료된 경우에만 target을 완료로 인정한다. `removed`는 새 버전에 대응 레슨을 만들지 않고 기존 완료 row를 보존 목록에 기록한다. 적용 결과는 `curriculum_migration_applications`에 저장하며, 성공 application은 재실행해도 같은 결과를 반환한다.

따라서 관리자 콘텐츠 생성, 수정, 삭제 API를 추가하기 전에 다음 제약을 먼저 지킨다.

- 구조 변경은 draft/published 발행 플로우와 명시적 마이그레이션 정책을 기준으로 허용한다.
- 신규 학습자는 최신 published 버전으로 시작한다.
- 기존 학습자는 명시적 업그레이드 전까지 자신의 진행 버전을 유지한다.
- 레슨과 챕터 삭제는 실제 delete가 아니라 `deprecated` 또는 `archived` 상태 전환으로 처리한다.
- 이미 완료한 레슨은 archived 상태가 되더라도 완료 성취와 카운트에서 사라지지 않는다.
- 진행 마이그레이션은 관리자 지정 매핑이 있을 때만 수행한다.
- 부분 진행과 lesson answer는 아직 마이그레이션하지 않는다.

학습자 업그레이드 UX가 구현되기 전까지 publish는 신규 공개 조회의 최신 버전만 바꾸며, 기존 학습자의 진행 버전을 자동 변경하지 않는다. 어드민 API는 published 콘텐츠 구조를 직접 수정하는 관리 API를 제공하지 않는다.

### `packages/db`

`packages/db`는 Drizzle SQLite 기반 영속성 패키지다. 콘텐츠, Better Auth, 학습 진행, AI 피드백 시도 스키마, 마이그레이션 SQL, 시드 데이터, 데이터베이스 클라이언트 생성, 저장소 구현을 제공한다. 과정과 레슨 조회 데이터는 시드된 작성 콘텐츠에서 가져온다.

인증과 학습자 상태 테이블은 다음 이름을 사용한다.

- `user`, `session`, `account`, `verification`: Better Auth 테이블
- `admin_user`, `admin_session`, `admin_account`, `admin_verification`: 관리자 Better Auth 테이블
- `course_progress`: 사용자별 코스 진행 요약과 현재 진행 중인 `curriculum_version_id`
- `lesson_progress`: 사용자별 레슨 현재 위치, 완료 상태, 해당 레슨 진행의 `curriculum_version_id`
- `lesson_answers`: 사용자별 레슨 스텝 답변
- `feedback_attempts`: AI 피드백 완료 시도와 구조화 결과
- `curriculum_versions`: 코스별 커리큘럼 버전과 `draft`, `published`, `archived` 상태
- `curriculum_version_chapters`: 특정 커리큘럼 버전에 포함된 챕터 스냅샷
- `curriculum_version_lessons`: 특정 커리큘럼 버전에 포함된 레슨 배치 스냅샷
- `curriculum_version_migrations`: source/target 커리큘럼 버전 사이의 active 마이그레이션 맵
- `lesson_migration_mappings`: 마이그레이션 맵 안의 레슨 단위 `equivalent`, `split`, `merged`, `removed` 매핑
- `curriculum_migration_applications`: 특정 사용자에게 마이그레이션을 적용한 completed/failed 결과

콘텐츠 시드는 현재 웹 정적 카탈로그와 과정 상세 화면의 과정/챕터/레슨 ID를 명시적으로 보관하고, 각 코스의 기존 구조를 `v1` published 커리큘럼 버전으로 함께 생성한다. 공개 콘텐츠 목록, 검색, 상세 API는 코스별 published 버전 중 가장 큰 `version_number`를 최신 버전으로 보고 그 버전의 active 챕터와 active 레슨 배치로 `lessonCount`, `firstLessonId`, `chapters`를 계산한다. 레슨 플레이 본문은 아직 `lessons`, `lesson_steps`를 `lessonId`로 조회하며, 모든 레슨은 현재 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE` 기본 단계로 플레이 가능성과 학습 상태 저장 경로를 보장한다.

인증된 학습 진행 API는 새 코스 진행을 만들 때 최신 published 커리큘럼 버전을 선택하고, 이미 진행 중인 코스가 있으면 저장된 `course_progress.curriculum_version_id`를 유지한다. 코스 진행률과 다음 레슨은 공개 최신 버전이 아니라 해당 진행 버전의 active 레슨 배치를 기준으로 계산한다. 레슨 진행 저장, 완료, 답변 저장은 대상 레슨이 학습자의 진행 버전에 포함되는지 확인한 뒤 처리한다.

AI 피드백은 `apps/api`의 OpenAI provider가 OpenAI Responses API와 Structured Outputs를 호출하고, `packages/core`의 AI 피드백 서비스가 재시도 제한, 저장 답변 조회, 결과 저장 규칙을 담당한다. OpenAI 호출 실패는 사용자 재시도 횟수를 소모하지 않고 `ai-feedback-unavailable` 오류로 반환한다. OpenAI 요청용 구조화 출력 schema는 OpenAI가 지원하는 JSON Schema 부분집합에 맞추고, provider 응답은 도메인 DTO schema로 다시 검증한다.

### `packages/logger`

`packages/logger`는 Pino 로거 생성과 요청 로그 필드 헬퍼를 제공한다. API 조립 루트와 라우트 주변부에서 공통 로그 형식을 재사용할 수 있게 한다.

`apps/api`는 앱 생성 시 logger를 주입받아 요청 ID, method, path, status, duration을 요청 단위로 기록한다. 클라이언트가 `x-request-id`를 보내면 같은 값을 응답 헤더와 로그에 사용하고, 없으면 API가 새 request id를 생성한다.
