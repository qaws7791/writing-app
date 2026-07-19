# 백엔드 개발 가이드

## 아키텍처

백엔드는 모듈러 모놀리스로 구성한다. 도메인 규칙, 데이터 접근, 로깅, 프로세스 조립 책임을 명시적 경계로 분리하고, 하나의 `apps/api` process에서 learner/admin Host sub-app을 실행한다.

현재 학습자 API는 공개 콘텐츠 조회, Better Auth 기반 Google 로그인, 서버 권위 학습 상태 전이, 프로필과 연속 학습일 계산, OpenAI 기반 AI 코칭을 포함한다. 관리자 API는 관리자 인증, 대시보드, 콘텐츠 계층 조회와 편집, 사용자 운영, 분석, 운영 설정, 자료실 트리와 Markdown 조건부 저장을 제공한다.

사용자 또는 관리자가 받을 수 있는 API 오류 응답의 `message`는 한국어로 작성한다. 상세 원칙은 `docs/design/text-localization-policy.md`를 따른다.

### 학습자 API 계약·오류 경계 정비 완료

학습자 API request·response·오류 계약은 `@workspace/contracts/learning`의 Zod schema와 추론 타입을 HTTP 경계의 canonical entrypoint로 사용한다. 공개 object schema는 unknown field를 거절하고, route handler는 성공 응답을 전송하기 직전에 같은 schema로 runtime 검증한다. 계약 위반은 본문을 기록하지 않고 계약명, field path, route, method, request ID와 배포 버전만 `api.contract.response_invalid`에 남긴다.

학습자 오류 응답은 `code`, 한국어 `message`, `requestId`를 항상 포함한다. 검증 오류만 `VALIDATION_ERROR`와 `violations`를 포함한다. 관리자 API 오류는 `apps/api/src/http/platform/errors`의 앱 내부 공통 계약으로 정규화한다.

### 학습자 안전 read model·cursor 조회 완료

학습자 course·lesson·progress 조회는 내부 콘텐츠 DTO와 분리된 `@workspace/contracts/learning` 공개 read model을 사용한다. course detail은 코스와 레슨의 판별 가능한 `learning` 상태를 한 번에 반환한다. `packages/core/src/modules/learning/application/learner-step-presenter.ts`는 DB와 HTTP를 모르는 순수 presenter로서 10개 step type을 각각 명시적 object literal allowlist로 투영한다. 내부 step이나 중첩 항목을 spread하지 않으므로 새 internal field는 기본적으로 공개되지 않는다. 정답, 해설, AI 내부 설정, 원본 매칭 관계와 분류 정답은 응답에 포함하지 않고, 선택지·항목은 학습자 scope·curriculum version·lesson·step을 포함한 기존 HMAC 범위로 결정적 순서를 유지한다.

`apps/api/src/adapters/learning/learner-read-model-drizzle.repository.ts`는 lesson SQL row를 ORM과 무관한 `LearnerLessonPersistedRowBundle`로 모으고 `learner-read-persisted-data.ts`에 decode를 위임한다. decoder는 `summary_json`과 step `content_json`을 canonical schema로 검증해 `decoded | corrupt` 결과를 반환하며 Drizzle·HTTP·presenter를 알지 않는다. 손상 데이터는 부분 lesson 응답을 만들지 않고 전용 내부 오류로 격리된 뒤 기존 `INTERNAL_SERVER_ERROR` 500 계약으로 정규화된다.

`packages/core/src/modules/learning/application/learner-cursor.ts`는 decoded cursor primary의 type과 정렬 방향을 `first-page | invalid-primary | after` 조건으로 결정하고, `learner-read-projection.ts`는 course page, progress page window, lesson/course learning state를 ORM·HTTP·전역 시각 없이 투영한다. `apps/api/src/adapters/learning/learner-read-cursor-drizzle.ts`만 이 조건을 SQL predicate와 progress `Date`로 변환한다. read repository는 SQL row gathering, persisted decode, 순수 projection과 presenter를 명시적으로 조립하며 progress의 기존 `1 + page item당 7` query 비용은 이번 구조 분리에서 바꾸지 않았다.

`/courses`와 `/progress`는 DB의 `limit + 1` keyset 조회와 `{ items, nextCursor }` 계약을 공유한다. course 검색·category·5개 정렬은 DB에서 적용하며 동일 정렬 key는 course ID 오름차순으로 구분한다. `/progress`는 `lastActivityAt DESC, courseId ASC`로 정렬한다. cursor는 HMAC-SHA256 서명, endpoint와 query fingerprint를 검증하고 진행 cursor는 학습자 scope까지 검증한다.

### 학습자 서버 권위 상태 전이 추가 완료

레슨 시작과 step 완료는 lesson-scoped 명령으로 제공한다. 서버는 고정 curriculum version, 레슨 잠금과 현재 step 순서를 검증하고 type별 채점 결과를 `retry | advanced | lesson_completed`로 반환한다. accepted 답안 저장, lesson·course 진행과 활동 집계는 하나의 SQLite `IMMEDIATE` transaction에서 확정하며, 같은 요청의 재실행이 step이나 완료 횟수를 중복 증가시키지 않는다.

AI 피드백은 고정 version의 선행 WRITE 답안을 서버에서 조회한다. target·sequence·저장 답안 준비와 attempt 상태·replay·전진 finalize는 DB·provider가 없는 순수 decision으로 결정한다. provider 호출은 transaction 밖에서 수행하고, 성공한 피드백 저장과 step 전진·완료만 하나의 짧은 transaction으로 처리한다. 같은 `Idempotency-Key`의 성공 재시도는 저장된 결과와 현재 전이 결과를 반환한다. 기존 답안·index 진행·별도 완료·root AI route는 제거했다.

### 관리자 권한 경계 정비 시작

관리자 API는 읽기 요청과 변경 요청의 권한을 분리한다. 일반 운영자는 조회 중심 업무를 수행할 수 있지만, 코스 생성/보관, 사용자 상태 변경/삭제, 운영 설정 변경, 콘텐츠 초기화 같은 변경성 작업은 소유자 권한에서만 허용한다.

### 관리자 권한 경계 정비 완료

관리자 API의 변경성 라우트는 소유자 세션을 명시적으로 요구한다. 권한이 부족한 운영자 세션은 서비스 호출 전에 `forbidden` 403 응답으로 차단하며, 어드민 웹 클라이언트는 해당 응답을 권한 오류로 매핑한다.

### 세션 토큰 보안 정비 시작

개발 편의를 위한 관리자 서버 토큰 fallback은 운영 환경에서 사용할 수 없어야 한다. 학습자 OAuth 쿠키는 브라우저 스크립트 접근을 막는 `HttpOnly`를 유지하고, HTTPS origin에서는 `Secure` 속성을 함께 내려야 한다.

### 세션 토큰 보안 정비 완료

관리자 서버 렌더링은 쿠키 토큰을 우선 사용하고, 운영 환경에서는 개발용 환경 변수 토큰으로 대체하지 않는다. 학습자 OAuth 상태 쿠키와 세션 쿠키는 HTTPS origin에서 `HttpOnly; Secure; SameSite=Lax` 속성을 함께 사용한다.

## `apps/api`

`apps/api`는 학습자 HTTP transport와 통합 전환용 관리자 HTTP transport를 Host allowlist로 분기하는 실행 경계다. Hono 앱 생성, 라우트 등록, 미들웨어, 환경 변수 파싱, 인증 헤더 전달, request body 파싱, transport-level validation, core 호출, HTTP response 변환, 에러 매핑, 프로세스 시작만 이곳에서 수행한다. 학습자와 관리자는 같은 SQLite client lifecycle만 공유하며 Better Auth instance, cookie, origin, session resolver와 route registry는 공유하지 않는다.

HTTP `*Request`, query와 header는 transport 계약이다. 변경 작업 route는 검증된 wire 값을 core application command로 명시적으로 변환하며, core command와 repository port는 HTTP request 타입이나 Hono 오류를 사용하지 않는다. 브랜드 ID, 상태 값과 안정적인 조회 projection은 변경 이유가 같을 때만 공유한다.

현재 API 라우트는 `apps/api/src/modules/*`와 `apps/api/src/http`에 구현되어 있으며, 아래 라우트와 정책을 현재 계약으로 유지한다.

현재 API 라우트는 버전 접두사 없이 노출한다. 학습자 콘텐츠도 고정 version과 잠금 상태를 적용하므로 health·OpenAPI·인증 helper를 제외한 학습자 제품 route는 active Better Auth 세션을 요구한다.

학습자 인증은 Google OAuth를 단일 진입점으로 사용한다. 학습자용 Better Auth 런타임은 이메일/비밀번호 가입과 로그인을 활성화하지 않는다. Next.js 앱은 `/api/auth/*`를 프록시하지 않는다. 인증 요청의 public endpoint는 Hono API 서버이며, Better Auth handler가 `/api/auth/*`를 직접 처리한다. CORS origin과 Better Auth trusted origin은 같은 웹 origin을 기준으로 검증한다. 사용자별 보호 API는 `auth.api.getSession({ headers })`로 Better Auth httpOnly 세션 쿠키를 검증하며, 브라우저 JavaScript가 세션 쿠키 값을 읽어 Bearer 토큰으로 변환하지 않는다.

학습자 가입 후 앱 소유 `learner_profiles` row를 보장하는 책임은 app-owned `LearnerProfileRepository`가 맡는다. Better Auth user create hook과 session resolver는 같은 repository instance를 직접 사용하며, 이름만 바꿔 전달하던 onboarding service는 두지 않는다. 기존 `suspended` 또는 `deleted` profile은 hook이 `active`로 되돌리지 않고, 세션 해석 중 profile row가 누락된 경우에만 active profile을 한 번 보장한다.

- `GET /health`
- `GET /openapi`
- `GET /api/auth/*`, `POST /api/auth/*`
- `GET /auth/session`
- `GET /session` (관리자 Host의 통합 delivery 기반)
- `GET /course-categories`
- `GET /courses`
- `GET /courses/:courseId`
- `GET /lessons/:lessonId`
- `GET /profile`
- `GET /progress`
- `POST /learning/lessons/:lessonId/start`
- `POST /learning/lessons/:lessonId/steps/:stepId/complete`
- `POST /learning/lessons/:lessonId/steps/:stepId/ai-feedback`

관리자 Host에는 공통 기반 route와 여섯 capability group이 같은 `apps/api` runtime에 등록된다. 학습자와 관리자 Host는 URL path가 아니라 allowlist와 dispatcher로 분기하므로, 아래 관리자 route는 학습자 Host에서 fallback되지 않는다.

- `GET /dashboard`
- `GET /analytics`
- `GET /analytics/lessons`
- `GET /courses`
- `POST /courses`
- `DELETE /courses/:courseId`
- `GET /courses/:courseId/editor`
- `PUT /courses/:courseId/editor`
- `POST /courses/:courseId/publish`
- `GET /users`
- `GET /users/:userId`
- `PATCH /users/:userId/status`
- `DELETE /users/:userId`
- `GET /settings`
- `PUT /settings/notice`
- `PUT /settings/legal`
- `POST /settings/content-reset`
- `GET /ai-chat/conversations`
- `GET /ai-chat/conversations/:conversationId`
- `POST /ai-chat/messages/stream`
- `GET /resources/tree`
- `POST /resources/folders`
- `PATCH /resources/folders/:folderId/name`
- `POST /resources/documents`
- `GET /resources/documents/:documentId`
- `PUT /resources/documents/:documentId`
- `POST /resources/documents/import`
- `GET /resources/documents/:documentId/export`
- `POST /resources/documents/:documentId/images`
- `GET /resources/search`
- `PATCH /resources/nodes/:nodeId/move`
- `POST /resources/nodes/:nodeId/trash`
- `POST /resources/nodes/:nodeId/restore`
- `DELETE /resources/nodes/:nodeId`

API 앱은 `@workspace/env/parse-env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. `DATABASE_URL` 기본 경로 위임, `WEB_ORIGIN` 기반 CORS 허용 origin 같은 앱별 의미 변환은 `apps/api/src/env.ts`에 유지한다.
`apps/api/src/api-runtime.ts`가 SQLite client 생성·close-once와 learner core, 관리자 Better Auth 및 capability route composition을 한 번 조립하고, production과 E2E 진입점은 같은 app-local factory를 사용한다. learner Better Auth handler, profile Drizzle adapter, test auth plugin과 SDK session 해석은 `apps/api/src/adapters/auth`가 소유한다. 관리자 delivery는 `src/http/admin-app.ts`와 여섯 고정 capability registry가 소유하며, capability별 app-owned adapter와 공개 core factory를 조립한다. AI chat의 Mastra agent는 app edge에서 자료실의 공개 read use case만 도구로 연결하고, 자료실 R2 adapter는 app composition에서만 생성한다. OpenAI SDK·response parsing·키 부재 fallback과 AI feedback persistence는 `apps/api/src/adapters/ai-feedback`가, 학습 전이 transaction·effect interpreter와 course·lesson read model·profile/progress reader는 `apps/api/src/adapters/learning`이 소유한다. Hono/OpenAPI app·route·error·security 표준과 request logging middleware는 `src/http/platform`, Pino와 request/security audit event는 `src/observability`가 소유한다. production composition은 concrete provider를, E2E composition은 결정적 test provider를 core의 `AiFeedbackProvider` port에 주입한다. app composition은 core capability facade의 공개 policy·use case·port만 직접 조립한다. DB·Drizzle import는 앱 composition과 app-owned adapter에서만 허용하고 route·middleware·HTTP response 경계에서는 금지한다. 저장소의 Compose·Caddy 설정은 두 public API Host를 이 runtime으로 보낸다.

| 변수                              | 필수 여부 | 기본값 또는 예시                    | 용도                                                                                     |
| --------------------------------- | --------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`              | 필수      | `replace-with-local-auth-secret`    | Better Auth 세션과 인증 토큰 서명에 사용하는 비밀값                                      |
| `CURSOR_SIGNING_SECRET`           | 운영 필수 | 별도의 32-byte 이상 비밀값          | cursor 서명과 비공개 presentation scope 파생                                             |
| `BETTER_AUTH_URL`                 | 필수      | `http://localhost:4000`             | Better Auth가 콜백과 인증 URL을 계산할 때 사용하는 API 기준 URL                          |
| `BETTER_AUTH_COOKIE_DOMAIN`       | 선택      | 비움 또는 `example.com`             | 로컬 선택; production parser는 learner 소비·발급 Host parent를 검증하고 role은 값을 요구 |
| `LEARNER_API_ALLOWED_HOSTS`       | 필수      | `localhost:4000,api:4000`           | 학습자 Host dispatcher allowlist                                                         |
| `ADMIN_BETTER_AUTH_SECRET`        | 필수      | 학습자 값과 다른 비밀값             | 관리자 Better Auth 전용 서명 비밀값                                                      |
| `ADMIN_BETTER_AUTH_URL`           | 필수      | `http://127.0.0.1:4000`             | 관리자 인증 URL 및 admin Host allowlist 기준                                             |
| `ADMIN_ORIGIN`                    | 필수      | `http://127.0.0.1:3001`             | 관리자 CORS·trusted origin                                                               |
| `ADMIN_BETTER_AUTH_COOKIE_DOMAIN` | 선택      | 비움 또는 `example.com`             | 로컬 선택; production parser는 admin 소비·발급 Host parent를 검증하고 role은 값을 요구   |
| `ADMIN_API_ALLOWED_HOSTS`         | 필수      | `127.0.0.1:4000,...`                | 관리자 Host dispatcher allowlist                                                         |
| `ADMIN_ASSET_*`                   | 운영 필수 | HTTPS endpoint·public URL·별도 권한 | 자료실 이미지 R2 bucket 설정; backup R2 권한과 분리                                      |
| `WEB_ORIGIN`                      | 선택      | `http://localhost:3000`             | 자격 증명 포함 브라우저 API 요청을 허용할 학습자 웹 origin                               |
| `DATABASE_URL`                    | 필수      | `file:data/api.sqlite`              | 저장소 루트 `data/api.sqlite` SQLite 데이터베이스 위치                                   |
| `GOOGLE_CLIENT_ID`                | 필수      | `replace-with-google-client-id`     | Google OAuth 클라이언트 ID                                                               |
| `GOOGLE_CLIENT_SECRET`            | 필수      | `replace-with-google-client-secret` | Google OAuth 클라이언트 secret                                                           |
| `LOG_LEVEL`                       | 선택      | `info`                              | Pino 로그 레벨                                                                           |
| `NODE_ENV`                        | 선택      | `development`                       | 실행 환경 이름                                                                           |
| `OPENAI_API_KEY`                  | 선택      | 없음                                | AI 피드백 provider가 OpenAI Responses API를 호출할 때 사용하는 API 키                    |
| `OPENAI_MODEL`                    | 선택      | `gpt-5.2`                           | AI 피드백 생성에 사용할 OpenAI 모델 이름                                                 |
| `API_PORT`                        | 선택      | `4000`                              | API 서버가 수신할 포트                                                                   |

`apps/api` parser는 local Host에서 두 cookie domain을 생략할 수 있다. production에서 값이 주어지면 learner `WEB_ORIGIN`·`BETTER_AUTH_URL` 및 관리자 `ADMIN_ORIGIN`·`ADMIN_BETTER_AUTH_URL`의 cookie 소비·발급 Host 모두를 포함하는 공통 parent인지 검증한다. production Ansible은 public `WEB_HOST`, `API_HOST`, `ADMIN_HOST`, `ADMIN_API_HOST`가 pairwise distinct하고 내부 service/alias 이름이 아니어야 한다고 검증하며, learner와 관리자 각 Host 쌍이 자신의 비어 있지 않은 공통 parent cookie domain에 속해야 배포를 진행한다. 이 설정은 API가 발급한 `HttpOnly` 세션 쿠키를 각 Next.js SSR이 전달하게 하며, learner/admin 인증 경계를 합치지 않는다.

```bash
bun --filter @workspace/api dev
```

관리자 API는 `apps/api/src/http/admin-app.ts`와 `apps/api/src/modules/admin-*`에 구현되고, `apps/api/src/composition/admin-route-composition.ts`가 여섯 capability group을 조립한다.

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
- `POST /courses/{courseId}/publish`
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

관리자 course·curriculum·content reset route는 query/body/header와 세션 actor를 transport-neutral content command로 조립한다. app composition은 app-owned content repository를 core content의 course·reset factory에 직접 연결한다. core course 목록은 canonical item과 flat page metadata를, 보관은 `not-found | ok` 결과를 반환한다. route가 이를 기존 pagination envelope와 `{ archived: true }` acknowledgement로 mapping하고 course detail·editor·publish/reset 성공 응답을 공개 schema로 검증한다. 외부 path, status, ETag·If-Match, owner 권한과 version conflict 의미는 유지한다.

관리자 user route는 query/body/params와 세션 actor를 transport-neutral identity query·command로 조립한다. 사용자 목록·상세는 admin의 `AdminUserReader`를 직접 사용하고, 상태 변경·soft-delete는 auth의 `AdminUserMutationRepository`·mutation use case가 소유한다. app composition은 하나의 identity adapter를 조회 reader와 mutation factory에 각각 연결하고 route dependency도 query와 mutation으로 분리한다. 목록은 canonical item과 flat page metadata를 반환하고 상태 변경·삭제는 `forbidden | not-found | ok` 결과를 사용한다. route가 목록을 기존 pagination envelope로, 삭제 성공을 `{ deleted: true }`로 변환하고 상세·상태 변경 성공값을 공개 schema로 검증한다. 삭제는 기존처럼 learner profile의 `deletedAt`과 `deleted` status만 갱신하며 session revoke·cascade·physical delete를 추가하지 않았다. 외부 path, status, body와 operator `403` 의미는 유지한다.

관리자 dashboard·analytics route는 기간, 검색, 정렬과 page query를 명시적 read query로 조립한다. core의 `AdminDashboardReader`와 `AdminAnalyticsReader`는 각각 필요한 조회 method만 공개하며 app composition과 route가 app-owned reader를 직접 사용한다. reader는 `admin/dashboard-analytics-data`의 canonical dashboard·analytics snapshot과 lesson item만 사용하고 lesson analytics를 flat page metadata로 반환하며, route가 이를 기존 pagination envelope로 변환하고 모든 성공값을 공개 schema로 검증한다. cross-capability table 조회는 허용하지만 write method나 mutation SQL은 사용하지 않으며 기존 기간·정렬·빈 결과와 HTTP/OpenAPI 의미를 유지한다.

관리자 AI chat core 경계는 `@workspace/contracts/admin/ai-chat-data`의 conversation ID·conversation·message·role만 사용한다. conversation 목록은 canonical 배열을, 상세와 사용자 메시지 생성은 canonical conversation과 `messageItems` history를 반환한다. `apps/api` composition과 관리자 route는 `AiChatRepository`를 직접 사용하며, route가 기존 `{ items }`·`{ conversation, messages }` wrapper로 mapping해 message body·query·params와 모든 JSON/SSE payload를 공개 schema로 검증한다. Mastra provider는 app-edge route orchestration에 남으며 persistence adapter 안으로 들어가지 않는다. prompt·timeout·출력 상한·취소, SQLite 관리자 격리·pagination·ordering, 정상 `chunk → done`과 provider 오류 `error` 의미는 유지한다.

자료실 본문은 `PUT /resources/documents/{documentId}`가 `If-Match` 문서 버전을 받아 제목, GFM Markdown 원본, FTS 색인과 수정 메타데이터를 한 SQLite transaction에서 저장한다. 버전이 다르면 `412 Precondition Failed`와 최신 문서를 반환한다. 자료실은 WebSocket과 Yjs 상태를 사용하지 않으며, 브라우저 포커스 복귀 때 전체 트리와 열린 문서를 다시 조회한다. 이미지는 관리자 인증 뒤 JPEG·PNG·WebP와 5MB 제한을 검증해 R2 호환 S3 API에 저장한다.

관리자 인증은 Better Auth ID/password를 사용하고, 관리자 인증 테이블은 `admin_user`, `admin_session`, `admin_account`, `admin_verification`을 사용한다. 관리자 Better Auth 런타임에는 Google/OAuth social provider를 등록하지 않는다. 플랫폼 사용자 인증 테이블과 쿠키 prefix를 공유하지 않는다. `admin_` 테이블 prefix와 Better Auth 컬럼명 보존 규칙은 `docs/engineering/schema-conventions.md`를 따른다. Next.js 어드민 앱은 `/api/auth/*`를 프록시하지 않고 어드민 Hono API의 인증 endpoint를 직접 호출한다. 관리자 보호 API도 `auth.api.getSession({ headers })`로 관리자용 httpOnly 세션 쿠키를 검증하며, `ADMIN_BETTER_AUTH_SECRET`은 공통 `BETTER_AUTH_SECRET`보다 우선한다.

운영 target API는 `apps/api/src/config/env.ts`에서 `@workspace/env/parse-env`를 사용해 learner/admin 환경을 함께 검증하며, `ADMIN_ORIGIN`과 관리자 Host allowlist도 여기서 해석한다. SQLite client는 `apps/api/src/api-runtime.ts`가 학습자와 관리자 sub-app에 한 번만 제공하므로 마이그레이션과 런타임 쿼리 전에 WAL 모드, 외래키 검사, `busy_timeout`, 체크포인트, 캐시 관련 PRAGMA를 한 lifecycle에서 적용한다.

최초 관리자 계정은 다음 명령으로 생성한다. 같은 이메일이 이미 있으면 중복 생성하지 않는다.

```bash
bun --filter @workspace/api seed:admin
```

관리자 seed row는 `apps/api/src/scripts/seed-admin-user.ts`의 명시적 user/account row 계약으로 생성한다. user row는 항상 `admin-1` owner 계정이며 credential account row는 같은 seed aggregate에서 만들어 schema drift가 typecheck에서 드러난다.

## `packages/core`

`packages/core`는 도메인 중심 계약과 application implementation을 담는다. 콘텐츠, 학습 진행, AI 피드백, 자료실 트리·문서·검색·자산 메타데이터, 브랜드 ID, repository port, 명시적 결과 변형과 도메인 서비스를 둔다. 자료실·관리자 course/content reset·identity·dashboard·analytics·settings·AI chat Drizzle adapter와 learner Better Auth SDK·profile Drizzle adapter·OpenAI feedback provider adapter·학습 전이·AI feedback·read model Drizzle adapter는 모두 `apps/api/src/adapters`가 소유한다. core의 DB·Drizzle·Better Auth·OpenAI·Hono·Next.js·React dependency와 runtime allowance는 0이다.

core의 learning/admin contract 참조는 transport-neutral data entrypoint 8개로 제한한다. production과 test를 포함한 현재 참조 53개는 모두 canonical 경로이며 broad·legacy·HTTP wire 참조는 0개다. 학습자·관리자 API route가 body·params·query parsing, application command/query 조립, public error mapping과 성공 response schema validation을 소유한다. root architecture inventory와 Oxlint는 import, re-export, literal dynamic·TypeScript import 우회를 함께 거절하고 core computed dynamic import도 target을 증명할 수 없으므로 허용하지 않는다.

학습자 profile repository port는 core auth application에 있고 Drizzle profile repository는 `apps/api` auth adapter가 소유한다. Better Auth hook과 session resolver는 learner composition이 만든 같은 repository instance를 직접 사용한다. 학습 전이 route는 transition repository의 `startLesson`·`completeStep`만 노출받아 직접 호출하고, learner content service는 read-model 검증과 오류 변환 책임에 맞춰 learning capability가 소유한다. 관리자 SQLite client도 `apps/api/src/api-runtime.ts`가 학습자 client와 함께 생성·공유·close-once로 종료하며, `apps/api/src/composition/admin-route-composition.ts`가 관리자 persistence adapter wiring을 소유한다. 이 composition은 dashboard·analytics·user reader와 AI chat repository를 route에 직접 전달하고, content course/reset·identity mutation·settings처럼 정책이 있는 use case만 factory로 조립한다. core의 catch-all `AdminRepository`·`AdminService` application façade와 query forwarding use case는 존재하지 않는다.

관리자 settings core 경계는 `@workspace/contracts/admin/settings-data`의 저장 snapshot만 canonical data로 재사용한다. `apps/api/src/modules/admin-settings` composition은 `SettingsRepository`를 독립 use case factory에 직접 연결한다. notice·legal request body와 길이 검증은 같은 target route가 소유하고, 검증된 값을 별도 application command로 조립한다. 저장 결과는 `forbidden | ok(value)`를 명시하며 route가 owner `403`과 모든 조회·저장 성공 응답 schema 검증을 담당한다. 기존 path·status·body와 version·ETag 없는 last-write-wins 저장 의미는 유지한다.

## 콘텐츠 변경 정책

콘텐츠 변경 정책의 단일 출처는 `DOMAIN.md`다. 현재 구현은 코스당 단일 mutable draft와 immutable published revision들을 관계형 테이블로 운영한다. 신규 학습자 공개 조회는 코스의 현재 published pointer를 사용하고 기존 학습자는 고정된 version을 사용한다.

학습 진행은 `learner_course_progress`에서 `courseId`와 `curriculumVersionId`를 고정한다. 레슨 진행, 답변과 AI 시도는 같은 version 범위의 레슨·스텝만 참조한다. `currentStepId`가 영속 기준이고 기존 application port의 index는 고정 version의 `sortOrder`로 변환한다.

레슨 답변 저장 command의 `answer`는 `learningAnswerSchema`를 통과한 값만 허용한다. API route, core service command, DB learning repository는 같은 학습 답변 계약을 사용하며, 임의 JSON 값은 application boundary 전에 거절한다.

어드민 코스 상세는 `GET /courses/{courseId}/editor`로 현재 draft 전체 문서와 `editVersion` ETag를 조회한다. owner의 `PUT /courses/{courseId}/editor`와 `POST /courses/{courseId}/publish`는 `If-Match`를 필수로 검증한다. 저장은 같은 revision의 `editVersion`만 증가시키며, 발행 transaction은 구조와 stable item ID를 검증하고 published pointer를 교체한 뒤 다음 revision draft를 복제한다. stale 값은 `409 STALE_REVISION`, 불완전한 발행 draft는 `422`, 없는 코스와 보관 코스는 `404 NOT_FOUND`다.

## `packages/db`

`packages/db`는 Drizzle SQLite 기반 저수준 영속성 패키지다. 콘텐츠, Better Auth, 학습 진행, AI 피드백 시도 스키마, baseline migration SQL, 시드 데이터, 데이터베이스 클라이언트 생성을 제공하되, 도메인 DTO나 repository port를 알지 않는다.

DB 테이블과 컬럼 명명 규칙은 `docs/engineering/schema-conventions.md`를 따른다. Better Auth 계열 테이블은 provider convention을 유지하고, 프로젝트가 직접 관리하는 테이블은 SQL 이름에 snake_case를 사용한다.

어드민 공지와 법적 문서처럼 하나의 설정 명령이 여러 `admin_settings` 행을 바꾸는 경우 repository가 단일 SQLite transaction으로 모두 반영한다. 중간 쓰기가 실패하면 앞선 쓰기도 rollback되며, 호출자는 같은 aggregate 입력을 안전하게 재시도할 수 있다. 같은 명령의 모든 행은 command가 전달한 동일한 `updatedAt` 시점을 사용한다.

인증과 학습자 상태 테이블은 다음 이름을 사용한다.

- `user`, `session`, `account`, `verification`: Better Auth 테이블
- `admin_user`, `admin_session`, `admin_account`, `admin_verification`: 관리자 Better Auth 테이블
- `courses`: 코스 identity, 보관 상태와 현재 published version pointer
- `course_curriculum_versions`: 코스별 draft/published revision과 `edit_version`
- `course_unit_versions`, `lesson_versions`, `lesson_step_versions`: curriculum version 범위 콘텐츠 계층
- `learner_profiles`: 학습자 앱 소유 프로필과 상태
- `learner_activity_days`: 사용자별 학습 활동 날짜와 연속 학습일 계산 기준
- `learner_course_progress`: 사용자별 코스 curriculum version 고정과 진행 요약
- `learner_lesson_progress`: version 범위 레슨의 현재 step ID와 완료 상태
- `learner_lesson_answers`: version 범위 레슨 스텝 답변
- `ai_feedback_attempts`: version 범위 AI 피드백 예약·완료 시도와 구조화 결과
- `admin_settings`: 공지, 법적 문서, 운영 설정 key-value 저장소
- `admin_resource_nodes`: 폴더·문서 트리, 이름순 조회와 휴지통 상태
- `admin_resource_documents`: 문서별 GFM Markdown 원본과 content revision
- `admin_resource_assets`: 문서 종속 R2 이미지 메타데이터
- `admin_resource_search`: 자료 제목·본문 FTS5 색인

콘텐츠 시드는 각 코스에 revision `1` published와 revision `2` draft로 기준 콘텐츠 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝을 명시적으로 보관한다. 재seed는 published와 학습자 pin을 보존하고 draft만 교체한다. 표준 스텝 타입은 `READING`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `WRITE`, `AI_FEEDBACK`, `MATCH`, `CATEGORIZE`다.

신규 DB는 `0000-writing-app-baseline.sql`을 사용한다. `courses.curriculum_revision`이 있는 기존 DB는 같은 migration 진입점의 일회성 transaction에서 revision `1` published, revision `2` draft와 versioned learner state로 이관한다. 데이터 이상은 기본값으로 숨기지 않고 commit 전에 실패시킨다.

AI 피드백은 `apps/api/src/adapters/ai-feedback/openai-feedback-provider.ts`가 OpenAI Responses API와 Structured Outputs를 호출하고, core의 learner AI feedback transition service가 재시도 제한, 고정 version의 저장 답변 조회, 결과 저장과 step 전이를 조정한다. `AI_FEEDBACK.target`은 같은 레슨의 앞선 WRITE 스텝만 허용하며, seed 변환과 콘텐츠·어드민 계약에서 이 참조 무결성을 검증한다. 클라이언트 요청은 답변 본문을 받지 않고 경로의 레슨 ID와 AI 코칭 스텝 ID만 사용한다. 학습자 API CORS는 실제 요청이 사용하는 `Authorization`, `Content-Type`, `Idempotency-Key` 헤더를 명시적으로 허용한다. 한국어 글쓰기 코칭 지침과 입력 프롬프트 조립은 `packages/core/src/modules/ai-feedback/domain/ai-feedback.prompt.ts`, 완료 시도 한도는 같은 모듈의 `ai-feedback-attempt-policy.ts`가 단일 출처다. OpenAI 호출 실패는 사용자 재시도 횟수를 소모하지 않고 `PROVIDER_UNAVAILABLE` 오류로 반환한다.

학습 진행 read model과 순수 상태 전이 정책은 `packages/core/src/modules/learning`이 소유한다. 첫 미완료 레슨만 열고 이후 레슨을 잠그는 규칙, 완료율과 다음 레슨 projection은 core의 `learner-read-projection.ts`가 결정하고 learner read model repository는 typed row bundle을 공급한다. 채점·시작 decision·단계 완료 effect plan은 core에 유지하고 답안·진행·완료·활동일 SQL과 transaction interpreter는 `apps/api/src/adapters/learning`이 처리한다.

학습 활동일 정책은 `packages/core/src/modules/learning/domain/learning-date.ts`가 단일 출처다. `learner_activity_days.activity_date`는 UTC timestamp가 아니라 플랫폼 학습 시간대 `Asia/Seoul` 기준의 `LearningDateKey`이며, core repository와 runtime factory는 이 정책으로 저장, 집계, 연속 학습일 계산을 수행한다.
