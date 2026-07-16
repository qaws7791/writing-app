# 백엔드 개발 가이드

## 아키텍처

백엔드는 모듈러 모놀리스로 구성한다. 도메인 규칙, 데이터 접근, 로깅, 프로세스 조립 책임을 패키지 단위로 분리하고, 런타임은 학습자용 API와 관리자용 API를 별도 Hono 앱으로 실행한다.

현재 학습자 API는 공개 콘텐츠 조회, Better Auth 기반 Google 로그인, 학습 진행/답변 저장, 프로필과 연속 학습일 계산, OpenAI 기반 AI 코칭을 포함한다. 관리자 API는 관리자 인증, 대시보드, 콘텐츠 계층 조회와 편집, 사용자 운영, 분석, 운영 설정, 자료실 트리와 실시간 공동 편집을 제공한다.

사용자 또는 관리자가 받을 수 있는 API 오류 응답의 `message`는 한국어로 작성한다. 상세 원칙은 `docs/design/text-localization-policy.md`를 따른다.

### API 오류 경계 정비 시작

관리자 API와 학습자 API는 라우트 내부에서 처리 가능한 검증 오류를 400 응답으로 고정하고, 라우트 밖으로 전파된 예외는 전역 오류 경계에서 표준 JSON 오류 응답으로 변환한다. 잘못된 JSON 본문은 도메인 검증 전에 서버 예외로 분류하지 않고 `invalid_request`로 응답해야 한다.

### API 오류 경계 정비 완료

학습자 API와 관리자 API는 전역 오류 경계에서 Zod 검증 예외를 `invalid_request` 400으로, 그 외 예외를 `internal_error` 500으로 반환한다. 학습자 API의 쓰기 라우트는 JSON 본문을 공통 helper로 읽고, 파싱 실패를 요청 검증 실패로 처리한다.

### JSON 본문 파싱 오류 계약 정비 완료

학습자 API와 관리자 API의 쓰기 라우트는 JSON 본문 읽기 실패와 schema 검증 실패를 구분하는 helper를 사용한다. HTTP 응답의 상위 오류 코드는 기존처럼 `invalid_request`를 유지하되, 본문 파싱 실패는 `error.detail.code`에 `malformed_json`, schema 실패는 `invalid_body`를 담아 클라이언트와 테스트가 원인을 안정적으로 구분할 수 있게 한다. raw parser 오류와 요청 body 원문은 클라이언트 응답에 노출하지 않는다.

### 관리자 권한 경계 정비 시작

관리자 API는 읽기 요청과 변경 요청의 권한을 분리한다. 일반 운영자는 조회 중심 업무를 수행할 수 있지만, 코스 생성/보관, 사용자 상태 변경/삭제, 운영 설정 변경, 콘텐츠 초기화 같은 변경성 작업은 소유자 권한에서만 허용한다.

### 관리자 권한 경계 정비 완료

관리자 API의 변경성 라우트는 소유자 세션을 명시적으로 요구한다. 권한이 부족한 운영자 세션은 서비스 호출 전에 `forbidden` 403 응답으로 차단하며, 어드민 웹 클라이언트는 해당 응답을 권한 오류로 매핑한다.

### 세션 토큰 보안 정비 시작

개발 편의를 위한 관리자 서버 토큰 fallback은 운영 환경에서 사용할 수 없어야 한다. 학습자 OAuth 쿠키는 브라우저 스크립트 접근을 막는 `HttpOnly`를 유지하고, HTTPS origin에서는 `Secure` 속성을 함께 내려야 한다.

### 세션 토큰 보안 정비 완료

관리자 서버 렌더링은 쿠키 토큰을 우선 사용하고, 운영 환경에서는 개발용 환경 변수 토큰으로 대체하지 않는다. 학습자 OAuth 상태 쿠키와 세션 쿠키는 HTTPS origin에서 `HttpOnly; Secure; SameSite=Lax` 속성을 함께 사용한다.

## `apps/api`

`apps/api`는 학습자 HTTP transport 경계다. Hono 앱 생성, 라우트 등록, 미들웨어, 환경 변수 파싱, 인증 헤더 전달, request body 파싱, transport-level validation, core 호출, HTTP response 변환, 에러 매핑, 프로세스 시작만 이곳에서 수행한다.

HTTP `*Request`, query와 header는 transport 계약이다. 변경 작업 route는 검증된 wire 값을 core application command로 명시적으로 변환하며, core command와 repository port는 HTTP request 타입이나 Hono 오류를 사용하지 않는다. 브랜드 ID, 상태 값과 안정적인 조회 projection은 변경 이유가 같을 때만 공유한다.

현재 API 라우트는 `apps/api/src/modules/*`와 `apps/api/src/http`에 구현되어 있으며, 아래 라우트와 정책을 현재 계약으로 유지한다.

현재 API 라우트는 버전 접두사 없이 노출한다. 사용자 정보가 필요하지 않은 콘텐츠 조회 API는 공개로 유지하고, 사용자별 데이터가 필요한 API만 Better Auth 세션 인증을 요구한다.

학습자 인증은 Google OAuth를 단일 진입점으로 사용한다. 학습자용 Better Auth 런타임은 이메일/비밀번호 가입과 로그인을 활성화하지 않는다. Next.js 앱은 `/api/auth/*`를 프록시하지 않는다. 인증 요청의 public endpoint는 Hono API 서버이며, Better Auth handler가 `/api/auth/*`를 직접 처리한다. CORS origin과 Better Auth trusted origin은 같은 웹 origin을 기준으로 검증한다. 사용자별 보호 API는 `auth.api.getSession({ headers })`로 Better Auth httpOnly 세션 쿠키를 검증하며, 브라우저 JavaScript가 세션 쿠키 값을 읽어 Bearer 토큰으로 변환하지 않는다.

학습자 가입 후 앱 소유 `learner_profiles` row를 보장하는 책임은 Better Auth 설정 객체 안에 직접 두지 않는다. Better Auth user create hook은 `LearnerOnboardingService`를 호출하는 adapter 역할만 하며, profile 생성과 조회는 `LearnerProfileRepository` 포트를 통해 수행한다. 기존 `suspended` 또는 `deleted` profile은 hook이 `active`로 되돌리지 않고, 세션 해석 중 profile row가 누락된 경우에만 active profile을 한 번 보장한다.

- `GET /health`
- `GET /openapi`
- `GET /api/auth/*`, `POST /api/auth/*`
- `GET /auth/session`
- `GET /courses`
- `GET /courses/:courseId`
- `GET /lessons/:lessonId`
- `GET /profile`
- `GET /progress`
- `POST /learning/answers`
- `POST /learning/lessons/:lessonId/progress`
- `POST /learning/lessons/:lessonId/complete`
- `POST /ai-feedback`

API 앱은 `@workspace/env/parse-env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. `DATABASE_URL` 기본 경로 위임, `WEB_ORIGIN` 기반 CORS 허용 origin 같은 앱별 의미 변환은 `apps/api/src/env.ts`에 유지한다.
SQLite 연결, repository 조립, Better Auth 영속성 설정, AI feedback provider 조립은 `packages/core`의 학습자 API 런타임 factory가 담당한다. `apps/api`는 `@workspace/db`, Drizzle 구현 패키지, OpenAI SDK를 직접 import하지 않는다.

| 변수                        | 필수 여부 | 기본값 또는 예시                    | 용도                                                                                            |
| --------------------------- | --------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`        | 필수      | `replace-with-local-auth-secret`    | Better Auth 세션과 인증 토큰 서명에 사용하는 비밀값                                             |
| `BETTER_AUTH_URL`           | 필수      | `http://localhost:4000`             | Better Auth가 콜백과 인증 URL을 계산할 때 사용하는 API 기준 URL                                 |
| `BETTER_AUTH_COOKIE_DOMAIN` | 선택      | 비움 또는 `example.com`             | 웹과 API가 같은 parent domain의 서로 다른 서브도메인일 때 Better Auth 세션 쿠키를 공유할 domain |
| `WEB_ORIGIN`                | 선택      | `http://localhost:3000`             | 자격 증명 포함 브라우저 API 요청을 허용할 학습자 웹 origin                                      |
| `DATABASE_URL`              | 필수      | `file:../../data/api.sqlite`        | 저장소 루트 `data/api.sqlite` SQLite 데이터베이스 위치                                          |
| `GOOGLE_CLIENT_ID`          | 필수      | `replace-with-google-client-id`     | Google OAuth 클라이언트 ID                                                                      |
| `GOOGLE_CLIENT_SECRET`      | 필수      | `replace-with-google-client-secret` | Google OAuth 클라이언트 secret                                                                  |
| `LOG_LEVEL`                 | 선택      | `info`                              | Pino 로그 레벨                                                                                  |
| `NODE_ENV`                  | 선택      | `development`                       | 실행 환경 이름                                                                                  |
| `OPENAI_API_KEY`            | 필수      | `replace-with-openai-api-key`       | AI 피드백 provider가 OpenAI Responses API를 호출할 때 사용하는 API 키                           |
| `OPENAI_MODEL`              | 필수      | `gpt-5-mini`                        | AI 피드백 생성에 사용할 OpenAI 모델 이름                                                        |
| `PORT`                      | 선택      | `4000`                              | API 서버가 수신할 포트                                                                          |

```bash
bun --filter @workspace/api dev
```

## `apps/admin-api`

`apps/admin-api`는 관리자용 백엔드 조립 루트다. 플랫폼 API와 별도 Hono 런타임으로 실행되며, 꺼져 있어도 학습자 플랫폼 API는 정상 동작해야 한다.

현재 어드민 API 라우트는 `apps/admin-api/src/routes`에 `@workspace/hono/core` typed route로 구현되어 있으며, 아래 라우트를 현재 계약으로 유지한다.

주요 라우트는 다음과 같다.

- `GET /health`
- `GET /openapi`
- `GET /api/auth/*`, `POST /api/auth/*`
- `GET /session`
- `GET /dashboard`
- `GET /courses?page=...&pageSize=...&query=...&status=...`
- `POST /courses`
- `GET /courses/{courseId}/editor`
- `PUT /courses/{courseId}/editor`
- `DELETE /courses/{courseId}`
- `GET /users?page=...&pageSize=...&query=...&status=...&sort=...`
- `GET /users/{userId}`
- `PATCH /users/{userId}/status`
- `DELETE /users/{userId}`
- `GET /analytics?days=30`
- `GET /analytics/lessons?page=...&pageSize=...&query=...`
- `GET /settings`
- `PUT /settings/notice`
- `PUT /settings/legal`
- `POST /settings/content-reset`
- `GET /ai-chat/conversations`
- `GET /ai-chat/conversations/{conversationId}`
- `POST /ai-chat/messages/stream`
- `GET /resources/tree`
- `POST /resources/folders`
- `POST /resources/documents`
- `GET /resources/documents/{documentId}`
- `PUT /resources/documents/{documentId}`
- `POST /resources/documents/import`
- `GET /resources/documents/{documentId}/export`
- `POST /resources/documents/{documentId}/images`
- `GET /resources/search`
- `PATCH /resources/folders/{folderId}/name`
- `PATCH /resources/nodes/{nodeId}/move`
- `POST /resources/nodes/{nodeId}/trash`
- `POST /resources/nodes/{nodeId}/restore`
- `DELETE /resources/nodes/{nodeId}`

자료실 본문은 `PUT /resources/documents/{documentId}`가 `If-Match` 문서 버전을 받아 제목, GFM Markdown 원본, FTS 색인과 수정 메타데이터를 한 SQLite transaction에서 저장한다. 버전이 다르면 `412 Precondition Failed`와 최신 문서를 반환한다. 자료실은 WebSocket과 Yjs 상태를 사용하지 않으며, 브라우저 포커스 복귀 때 전체 트리와 열린 문서를 다시 조회한다. 이미지는 관리자 인증 뒤 JPEG·PNG·WebP와 5MB 제한을 검증해 R2 호환 S3 API에 저장한다.

관리자 인증은 Better Auth ID/password를 사용하고, 관리자 인증 테이블은 `admin_user`, `admin_session`, `admin_account`, `admin_verification`을 사용한다. 관리자 Better Auth 런타임에는 Google/OAuth social provider를 등록하지 않는다. 플랫폼 사용자 인증 테이블과 쿠키 prefix를 공유하지 않는다. `admin_` 테이블 prefix와 Better Auth 컬럼명 보존 규칙은 `docs/engineering/schema-conventions.md`를 따른다. Next.js 어드민 앱은 `/api/auth/*`를 프록시하지 않고 어드민 Hono API의 인증 endpoint를 직접 호출한다. 관리자 보호 API도 `auth.api.getSession({ headers })`로 관리자용 httpOnly 세션 쿠키를 검증하며, `ADMIN_BETTER_AUTH_SECRET`은 공통 `BETTER_AUTH_SECRET`보다 우선한다.

어드민 API 앱은 `@workspace/env/parse-env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. `DATABASE_URL` 기본 경로 위임, `ADMIN_ORIGIN` 기반 CORS 허용 origin, `ADMIN_API_PORT` 같은 앱별 의미 변환은 `apps/admin-api/src/env.ts`에 유지한다.
SQLite 연결은 학습자 API와 같은 `@workspace/db` 공통 설정을 사용한다. 따라서 어드민 API도 마이그레이션과 런타임 쿼리 전에 WAL 모드, 외래키 검사, `busy_timeout`, 체크포인트, 캐시 관련 PRAGMA를 적용한다.

| 변수                              | 필수 여부 | 기본값 또는 예시                                | 용도                                                                                                     |
| --------------------------------- | --------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `ADMIN_BETTER_AUTH_SECRET`        | 필수      | `replace-with-admin-auth-secret`                | 관리자 Better Auth 세션과 인증 토큰 서명에 사용하는 비밀값                                               |
| `ADMIN_BETTER_AUTH_URL`           | 필수      | `http://localhost:4001`                         | 관리자 Better Auth가 인증 URL을 계산할 때 사용하는 API 기준 URL                                          |
| `ADMIN_BETTER_AUTH_COOKIE_DOMAIN` | 선택      | 비움 또는 `example.com`                         | 어드민 웹과 어드민 API가 같은 parent domain의 서로 다른 서브도메인일 때 관리자 세션 쿠키를 공유할 domain |
| `ADMIN_ORIGIN`                    | 선택      | `http://localhost:3001`                         | 자격 증명 포함 브라우저 API 요청을 허용할 어드민 웹 origin                                               |
| `DATABASE_URL`                    | 필수      | `file:../../data/api.sqlite`                    | 저장소 루트 `data/api.sqlite`에 있는 플랫폼 공유 SQLite 데이터베이스 위치                                |
| `LOG_LEVEL`                       | 선택      | `info`                                          | Pino 로그 레벨                                                                                           |
| `NODE_ENV`                        | 선택      | `development`                                   | 실행 환경 이름                                                                                           |
| `ADMIN_API_PORT`                  | 선택      | `4001`                                          | 어드민 API 서버가 수신할 포트                                                                            |
| `ADMIN_SEED_EMAIL`                | 시드 필수 | `admin@example.com`                             | 최초 관리자 계정 시드에 사용할 이메일                                                                    |
| `ADMIN_SEED_PASSWORD`             | 시드 필수 | `replace-with-local-admin-password`             | 최초 관리자 계정 시드에 사용할 비밀번호                                                                  |
| `ADMIN_SEED_NAME`                 | 시드 선택 | `관리자`                                        | 최초 관리자 계정 시드에 사용할 이름                                                                      |
| `ADMIN_SEED_RESET_PASSWORD`       | 시드 선택 | `false`                                         | `true`일 때 기존 관리자 credential 비밀번호를 시드 비밀번호로 갱신                                       |
| `ADMIN_ASSET_S3_ENDPOINT`         | 운영 필수 | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | Cloudflare R2 S3 호환 API endpoint                                                                       |
| `ADMIN_ASSET_S3_REGION`           | 선택      | `auto`                                          | R2는 `auto`, 로컬 S3 호환 저장소는 해당 region 사용                                                      |
| `ADMIN_ASSET_S3_BUCKET`           | 운영 필수 | `writing-app-public-assets`                     | 자료실 문서 종속 이미지를 저장할 bucket                                                                  |
| `ADMIN_ASSET_PUBLIC_BASE_URL`     | 운영 필수 | `https://assets.example.com`                    | Markdown 이미지 URL에 사용할 R2 custom domain 기준 URL                                                   |
| `ADMIN_ASSET_S3_ACCESS_KEY`       | 운영 필수 | 비밀값                                          | R2 API token의 Access Key ID                                                                             |
| `ADMIN_ASSET_S3_SECRET_KEY`       | 운영 필수 | 비밀값                                          | R2 API token의 Secret Access Key                                                                         |

```bash
bun --filter @workspace/admin-api dev
```

최초 관리자 계정은 다음 명령으로 생성한다. 같은 이메일이 이미 있으면 중복 생성하지 않는다.

```bash
bun --filter @workspace/admin-api seed:admin
```

관리자 seed row는 `apps/admin-api/src/scripts/seed-admin-user.ts`의 명시적 user/account row 계약으로 생성한다. user row는 항상 `admin-1` owner 계정이며, credential account row는 같은 seed aggregate에서 만들어 schema drift가 typecheck에서 드러나야 한다.

## `packages/core`

`packages/core`는 도메인 중심 계약과 application implementation을 담는다. 콘텐츠, 학습 진행, AI 피드백, 자료실 트리·문서·검색·자산 메타데이터, 브랜드 ID, repository port와 구현, 명시적 결과 변형, 도메인 서비스, 트랜잭션 경계, DB query, Better Auth profile onboarding, OpenAI feedback provider adapter를 둔다. HTTP transport에는 의존하지 않으며, DB 접근은 `packages/db`의 저수준 primitive를 통해 수행한다.

학습자 profile repository port와 onboarding service는 auth application에 있고 Drizzle repository와 Better Auth hook은 auth infrastructure에 있다. learner composition은 repository instance 하나를 hook과 session resolver에 함께 주입한다. 관리자 SQLite client는 `apps/admin-api/src/admin-runtime.ts`가 생성·공유·종료하며 core 관리자 factory는 주입된 Drizzle database handle로 자료 트리·문서·검색·자산 서비스를 조립한다.

## 콘텐츠 변경 정책

콘텐츠 변경 정책의 단일 출처는 `DOMAIN.md`다. 현재 구현은 단일 현재 커리큘럼만 운영한다. 공개 콘텐츠 목록/검색/상세 조회는 active 유닛, 레슨, 스텝의 현재 상태를 기준으로 계산한다.

학습 진행은 `courseId`와 `lessonId`에 직접 묶인다. `course_progress`와 `lesson_progress`에는 `curriculum_version_id`를 저장하지 않는다. 레슨 진행 저장, 완료, 답변 저장은 대상 레슨이 현재 코스 커리큘럼에 포함되는지 확인한 뒤 처리한다.

레슨 답변 저장 command의 `answer`는 `learningAnswerSchema`를 통과한 값만 허용한다. API route, core service command, DB learning repository는 같은 학습 답변 계약을 사용하며, 임의 JSON 값은 application boundary 전에 거절한다.

어드민 코스 상세는 `GET /courses/{courseId}/editor`로 branded ID와 구조화된 10종 step union을 포함한 전체 문서를 조회하고, owner가 `PUT /courses/{courseId}/editor`로 저장한다. 저장은 단일 SQLite transaction에서 현재 revision 비교, 경로·문서 ID와 row 소유권 검증, 포함 row upsert, 누락 하위 row 보관, revision 증가와 최종 projection 조회를 수행한다. revision 충돌은 `409 STALE_REVISION`, 잘못된 소유 ID와 step의 레슨 간 이동은 `400 INVALID_REQUEST`, 없는 코스와 보관 코스는 `404 NOT_FOUND`다.

## `packages/db`

`packages/db`는 Drizzle SQLite 기반 저수준 영속성 패키지다. 콘텐츠, Better Auth, 학습 진행, AI 피드백 시도 스키마, baseline migration SQL, 시드 데이터, 데이터베이스 클라이언트 생성을 제공하되, 도메인 DTO나 repository port를 알지 않는다.

DB 테이블과 컬럼 명명 규칙은 `docs/engineering/schema-conventions.md`를 따른다. Better Auth 계열 테이블은 provider convention을 유지하고, 프로젝트가 직접 관리하는 테이블은 SQL 이름에 snake_case를 사용한다.

어드민 공지와 법적 문서처럼 하나의 설정 명령이 여러 `admin_settings` 행을 바꾸는 경우 repository가 단일 SQLite transaction으로 모두 반영한다. 중간 쓰기가 실패하면 앞선 쓰기도 rollback되며, 호출자는 같은 aggregate 입력을 안전하게 재시도할 수 있다. 같은 명령의 모든 행은 command가 전달한 동일한 `updatedAt` 시점을 사용한다.

인증과 학습자 상태 테이블은 다음 이름을 사용한다.

- `user`, `session`, `account`, `verification`: Better Auth 테이블
- `admin_user`, `admin_session`, `admin_account`, `admin_verification`: 관리자 Better Auth 테이블
- `courses`, `course_units`: 코스와 유닛
- `lessons`, `lesson_steps`: 레슨 본문과 스텝
- `learner_profiles`: 학습자 앱 소유 프로필과 상태
- `learner_activity_days`: 사용자별 학습 활동 날짜와 연속 학습일 계산 기준
- `course_progress`: 사용자별 코스 진행 요약
- `lesson_progress`: 사용자별 레슨 현재 위치와 완료 상태
- `lesson_answers`: 사용자별 레슨 스텝 답변
- `feedback_attempts`: AI 피드백 완료 시도와 구조화 결과
- `admin_settings`: 공지, 법적 문서, 운영 설정 key-value 저장소
- `admin_resource_nodes`: 폴더·문서 트리, 정렬, 휴지통 상태
- `admin_resource_documents`: 문서별 GFM Markdown 원본과 content revision
- `admin_resource_collaboration`: Yjs snapshot과 projection 상태
- `admin_resource_audit_events`: 자료 구조 변경 감사 기록
- `admin_resource_tree_state`: 자료 구조 명령의 전역 revision
- `admin_resource_search`: 자료 제목·본문 FTS5 색인

콘텐츠 시드는 기준 콘텐츠 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝을 명시적으로 보관한다. 표준 스텝 타입은 `READING`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `WRITE`, `AI_FEEDBACK`, `MATCH`, `CATEGORIZE`다.

DB migration은 피벗 기간 동안 누적 보정 migration이 아니라 `0000-writing-app-baseline.sql` 기준 새 baseline으로 관리한다. 운영 데이터 이전이 필요하면 별도 이전 계획을 작성하고 이 baseline 구현에 호환 adapter를 넣지 않는다.

AI 피드백은 `packages/core`의 OpenAI provider adapter가 OpenAI Responses API와 Structured Outputs를 호출하고, core AI 피드백 서비스가 재시도 제한, 저장 답변 조회, 결과 저장 규칙을 담당한다. `AI_FEEDBACK.target`은 같은 레슨의 앞선 WRITE 스텝만 허용하며, seed 변환과 콘텐츠·어드민 계약에서 이 참조 무결성을 검증한다. 클라이언트 요청은 답변 본문을 받지 않고 레슨 ID와 AI 코칭 스텝 ID만 받는다. core 서비스는 로그인한 사용자와 target 스텝으로 저장된 WRITE 답변을 조회해 제공자 입력의 단일 출처로 사용한다. 학습자 API CORS는 실제 요청이 사용하는 `Authorization`, `Content-Type`, `Idempotency-Key` 헤더를 명시적으로 허용한다. 한국어 글쓰기 코칭 지침과 입력 프롬프트 조립은 `packages/core/src/ai-feedback/ai-feedback.prompt.ts`의 prompt policy가 단일 출처다. 완료 시도 한도는 `packages/core/src/ai-feedback/ai-feedback-attempt-policy.ts`의 attempt policy로 명시하고, core 런타임 factory가 기본 정책을 서비스에 주입한다. OpenAI 호출 실패는 사용자 재시도 횟수를 소모하지 않고 `ai-feedback-unavailable` 오류로 반환한다.

학습 진행 read model 정책은 `packages/core/src/learning/learning-progress-read-model.ts`가 단일 출처다. 첫 미완료 레슨만 `available`로 열고 이후 레슨을 `locked`로 두는 규칙, 완료율 계산, 다음 레슨 projection은 API route가 아니라 core learning interface에서 계산한다.

학습 활동일 정책은 `packages/core/src/learning/learning-date.ts`가 단일 출처다. `learner_activity_days.activity_date`는 UTC timestamp가 아니라 플랫폼 학습 시간대 `Asia/Seoul` 기준의 `LearningDateKey`이며, core repository와 runtime factory는 이 정책으로 저장, 집계, 연속 학습일 계산을 수행한다.

## `packages/logger`

`packages/logger`는 Pino 로거 생성, 요청 완료 로그 helper, Hono 요청 로깅 middleware를 제공한다. 요청 로깅 middleware는 외부 `x-request-id`를 보존하고 없으면 request logging runtime의 ID generator로 새 ID를 만든다. duration은 wall clock이 아니라 runtime의 monotonic clock 차이로 계산하며, 학습자 API와 어드민 API 조립 루트가 production default runtime을 명시적으로 주입한다.
