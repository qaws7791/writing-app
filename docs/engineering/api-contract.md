# API 계약

이 문서는 HTTP API route, 인증 표면, 오류 응답, OpenAPI 생성 흐름을 설명하는 단일 진실 원천이다.

## 기준

- 기준일: 2026-07-12
- 기준 파일:
  - `apps/api/src/routes/index.ts`
  - `apps/api/src/modules/*/*.routes.ts`
  - `apps/api/src/http/openapi.ts`
  - `apps/admin-api/src/app.ts`
  - `apps/admin-api/src/routes/*.route.ts`

## 공통 원칙

- API route는 transport 경계다.
- 비즈니스 규칙은 core service 또는 domain policy에 둔다.
- 요청 body와 params는 runtime schema로 검증한다.
- 사용자 노출 오류 메시지는 한국어를 기본으로 한다.
- Better Auth raw route는 앱의 OpenAPI route registry와 분리될 수 있다.

## 쿠키 인증 OpenAPI 계약

- 학습자 보호 route는 OpenAPI의 `learnerSessionCookie` apiKey scheme을 사용하며 실제 쿠키 이름은 `learner_session_token`이다.
- 관리자 보호 route는 `adminSessionCookie` apiKey scheme을 사용하며 실제 쿠키 이름은 `admin_session_token`이다.
- 쿠키 이름 상수는 실제 Better Auth 설정과 OpenAPI 생성이 함께 사용한다. 이름이 달라지면 계약 테스트가 실패한다.
- Bearer token은 두 API의 세션 인증 수단이 아니다. 생성 클라이언트와 브라우저 호출은 요청에 `credentials: "include"`를 설정해야 한다.
- 테스트용 세션 resolver도 쿠키만 허용하므로 Bearer fallback이 운영 계약을 가리지 않는다.

## 응답 캐시 분류

| 분류        | 경로                                                  | 응답 정책                                          |
| ----------- | ----------------------------------------------------- | -------------------------------------------------- |
| 공개        | `/health`, `/openapi`                                 | 각 route의 기존 캐시 정책 유지                     |
| 인증        | `/api/auth/*`, Google 로그인 helper                   | `Cache-Control: private, no-store`, `Vary: Cookie` |
| 학습자 보호 | `/auth/session`, `/profile`, 코스·레슨·진행·AI 피드백 | `Cache-Control: private, no-store`, `Vary: Cookie` |
| 관리자 보호 | `/session`, 사용자·분석·설정·AI 대화·자료실 등        | `Cache-Control: private, no-store`, `Vary: Cookie` |

SSE와 파일 다운로드도 보호 응답 정책을 적용하되 각각 `text/event-stream`과 `Content-Disposition` 계약을 보존한다.

## 학습자 API

기준 URL은 환경별 `NEXT_PUBLIC_API_BASE_URL` 또는 `WEB_API_BASE_URL`이 가리키는 `apps/api` origin이다.

학습자 request/response DTO와 status enum은 `packages/contracts`의 Zod schema를 단일 기준으로 사용한다. `apps/api`의 route schema는 `@workspace/contracts/*`를 직접 import해 OpenAPI 문서를 생성하고, `apps/web`은 같은 정적 OpenAPI JSON에서 generated 타입을 만들며 런타임 응답 파싱은 가능한 범위에서 같은 contracts schema를 사용한다. API module은 인증 사용자 shape와 route response 조합만 담당한다.

`apps/web` feature model은 앱 내부 타입으로 유지하며 `@workspace/core`를 직접 import하지 않는다. API wire DTO와 contracts schema는 `apps/web/src/lib/api` 경계에서 검증·변환한다.
매칭 스텝의 presentation choice id, selection map, deterministic shuffle, answer pair 변환은 HTTP request/response 계약이 아니므로 `packages/contracts`에서 노출하지 않는다. 해당 상호작용 모델은 `apps/web/src/features/lessons/lesson-match-presentation.ts`가 소유한다.

현재 route:

| 메서드     | 경로                                    | 인증          | 설명                                             |
| ---------- | --------------------------------------- | ------------- | ------------------------------------------------ |
| `GET`      | `/health`                               | 없음          | API 상태                                         |
| `GET`      | `/openapi`                              | 없음          | OpenAPI 3.1 문서                                 |
| `GET/POST` | `/api/auth/*`                           | Better Auth   | 인증 handler                                     |
| `GET`      | `/api/auth/sign-in/google`              | 없음          | Google sign-in redirect helper                   |
| `GET`      | `/auth/session`                         | active 학습자 | 현재 세션                                        |
| `GET`      | `/profile`                              | active 학습자 | 프로필과 통계                                    |
| `GET`      | `/courses`                              | active 학습자 | 코스 목록                                        |
| `GET`      | `/courses/{courseId}`                   | active 학습자 | 코스 상세                                        |
| `GET`      | `/lessons/{lessonId}`                   | active 학습자 | 레슨 상세                                        |
| `GET`      | `/progress`                             | active 학습자 | 학습 진행 (`status=in_progress\|completed` 선택) |
| `POST`     | `/learning/answers`                     | active 학습자 | 스텝 답변 저장                                   |
| `POST`     | `/learning/lessons/{lessonId}/progress` | active 학습자 | 순차 레슨 진행 index 저장                        |
| `POST`     | `/learning/lessons/{lessonId}/complete` | active 학습자 | 레슨 완료                                        |
| `POST`     | `/ai-feedback`                          | active 학습자 | AI 코칭 생성                                     |

`POST /learning/answers`의 transport schema는 학습 답변 union을 검증하고, core의 `LearningService`는 lesson 조회 뒤 `step-answer-policy`에 step type별 answer 검증을 위임한다. 따라서 route나 service가 콘텐츠 후보, unsupported step, lesson-started marker 규칙을 중복 구현하지 않는다.
`POST /learning/lessons/{lessonId}/progress`는 현재 저장된 index와 같거나 정확히 1 큰 index만 허용한다. `POST /learning/lessons/{lessonId}/complete`는 body에서 index를 받지 않으며 core가 마지막 index 도달과 필수 답안 저장을 확인한 뒤 완료 index를 계산한다.
진행 저장은 DB에서 기존 index와 요청 index의 최댓값만 확정한다. 서비스 검증 뒤 다른 요청이 더 높은 index를 저장한 경우 `409 PROGRESS_CONFLICT`를 반환하며 자동 재시도하지 않는다. 클라이언트는 최신 진행을 다시 조회하고 다음 순차 요청을 만든다. 완료 상태는 늦은 진행 저장으로 `in_progress`로 후퇴하지 않는다.
`POST /ai-feedback`의 route는 인증 학습자 command를 core에 전달한다. 클라이언트는 재시도할 때 동일한 `Idempotency-Key` header를 보내며, header가 없으면 서버가 요청 단위 key를 생성한다. core의 `AiFeedbackService`는 lesson과 AI_FEEDBACK step 판정에 집중하고, attempt 원자 예약·한도 계산·provider 호출·상태 저장은 AI feedback attempt coordinator가 처리한다. 같은 학습자·레슨·스텝의 provider 호출은 한 번에 하나만 진행하며 동일 key의 성공 재시도는 저장된 결과를 반환한다.

## 어드민 API

기준 URL은 `ADMIN_API_BASE_URL`이 가리키는 `apps/admin-api` origin이다.

어드민 request/response DTO와 route query/body contract는 `packages/contracts/admin`의 Zod schema를 기준으로 사용한다. `apps/admin-api` route는 `@workspace/hono/core`의 typed route definition으로 등록하고, 세션, 권한, service 호출을 담당한다. wire contract schema는 `@workspace/contracts/admin`에서 직접 가져온다. `packages/contracts/src/admin` 내부 schema는 dashboard, users, analytics, settings, content reset, courses, shared 파일로 나누고 `@workspace/contracts/admin` entrypoint가 이를 다시 노출한다. `apps/admin`은 core를 직접 import하지 않는다. 공통 HTTP transport는 관리자 DTO를 알지 않으며, 각 feature Adapter가 자기 contract만 검증해 feature 앱 모델로 변환한다. 화면은 해당 feature Interface만 소비한다.

관리자 인증은 Better Auth의 email/password endpoint를 사용한다. owner 변경은 유효한 owner session을 요구하며, operator 요청은 `403 FORBIDDEN`을 반환한다. 비밀번호 변경은 기존처럼 모든 관리자 session을 폐기한다.

어드민 API의 query, path params, JSON body 검증은 route config의 zod-openapi `request` schema가 소유한다. Handler는 `context.req.valid("query" | "param" | "json")`로 검증된 값만 읽는다.
Route 파일은 관리자 세션 middleware와 OpenAPI security requirement를 `adminSessionRouteOptions()` 또는 `ownerAdminRouteOptions()`로 함께 선언한다. JSON body request content는 `jsonRequestBody()`를 사용해 반복되는 `application/json` shape를 숨긴다.

현재 route:

| 메서드     | 경로                                       | 권한        | 설명                       |
| ---------- | ------------------------------------------ | ----------- | -------------------------- |
| `GET`      | `/health`                                  | 없음        | API 상태                   |
| `GET`      | `/openapi`                                 | 없음        | OpenAPI 3.1 문서           |
| `GET/POST` | `/api/auth/*`                              | Better Auth | 관리자 인증 handler        |
| `GET`      | `/session`                                 | 관리자      | 현재 관리자 세션           |
| `GET`      | `/dashboard`                               | 관리자      | 대시보드                   |
| `GET`      | `/analytics`                               | 관리자      | 분석 요약                  |
| `GET`      | `/analytics/lessons`                       | 관리자      | 레슨별 분석                |
| `GET`      | `/courses`                                 | 관리자      | 코스 목록                  |
| `POST`     | `/courses`                                 | owner       | 코스 생성                  |
| `DELETE`   | `/courses/{courseId}`                      | owner       | 코스 보관                  |
| `GET`      | `/courses/{courseId}/editor`               | 관리자      | 코스 편집 문서 조회        |
| `PUT`      | `/courses/{courseId}/editor`               | owner       | 전체 코스 편집 문서 저장   |
| `GET`      | `/users`                                   | 관리자      | 사용자 목록                |
| `GET`      | `/users/{userId}`                          | 관리자      | 사용자 상세                |
| `PATCH`    | `/users/{userId}/status`                   | owner       | 사용자 상태 변경           |
| `DELETE`   | `/users/{userId}`                          | owner       | 사용자 삭제 상태 전환      |
| `GET`      | `/settings`                                | 관리자      | 설정 조회                  |
| `PUT`      | `/settings/notice`                         | owner       | 공지 설정 저장             |
| `PUT`      | `/settings/legal`                          | owner       | 법적 문서 저장             |
| `POST`     | `/settings/content-reset`                  | owner       | 콘텐츠 초기화              |
| `GET`      | `/resources/tree`                          | 관리자      | 자료 트리 전체 조회        |
| `POST`     | `/resources/folders`                       | 관리자      | 자료 폴더 생성             |
| `POST`     | `/resources/documents`                     | 관리자      | 빈 자료 문서 생성          |
| `GET`      | `/resources/documents/{documentId}`        | 관리자      | Markdown 문서 조회         |
| `PUT`      | `/resources/documents/{documentId}`        | 관리자      | 제목·Markdown 조건부 저장  |
| `POST`     | `/resources/documents/import`              | 관리자      | Markdown 단일 가져오기     |
| `GET`      | `/resources/documents/{documentId}/export` | 관리자      | Markdown 문서 내보내기     |
| `POST`     | `/resources/documents/{documentId}/images` | 관리자      | R2 문서 이미지 업로드      |
| `GET`      | `/resources/search`                        | 관리자      | 제목·본문 FTS 검색         |
| `PATCH`    | `/resources/folders/{folderId}/name`       | 관리자      | 자료 폴더 이름 변경        |
| `PATCH`    | `/resources/nodes/{nodeId}/move`           | 관리자      | 자료 항목 폴더 이동        |
| `POST`     | `/resources/nodes/{nodeId}/trash`          | 관리자      | 하위 트리 휴지통 이동      |
| `POST`     | `/resources/nodes/{nodeId}/restore`        | 관리자      | 하위 트리 복원             |
| `DELETE`   | `/resources/nodes/{nodeId}`                | 관리자      | 휴지통 하위 트리 영구 삭제 |
| `GET`      | `/ai-chat/conversations`                   | 관리자      | AI 대화 목록               |
| `GET`      | `/ai-chat/conversations/{conversationId}`  | 관리자      | AI 대화 상세               |
| `POST`     | `/ai-chat/messages/stream`                 | 관리자      | AI 응답 stream             |

`POST /ai-chat/messages/stream`은 관리자·클라이언트 IP별 요청 횟수와 관리자별 일일 요청 횟수, 대화별 단일 in-flight를 제한한다. 한도 초과는 `429`와 `Retry-After`를 반환한다. SSE stream은 `chunk` 뒤 반드시 `done` 또는 `error`로 종료하며, 요청 취소와 30초 provider timeout은 provider abort로 전달되고 assistant 메시지를 저장하지 않는다. prompt는 최근 20개 메시지와 12,000자, provider 출력은 2,000 token과 64 KiB를 상한으로 둔다.

`GET /ai-chat/conversations`는 `page`와 최대 50인 `pageSize`, `GET /ai-chat/conversations/{conversationId}`는 `messagePage`와 최대 100인 `messagePageSize` query로 대화와 메시지를 페이지 단위로 조회한다.

`GET /resources/documents/{documentId}`는 제목, Markdown, 경로, 작성자·수정자·시각과 현재 `version`을 반환하고 같은 버전의 강한 ETag를 응답 header에 포함한다. `PUT /resources/documents/{documentId}`는 `If-Match`를 필수로 받아 제목, Markdown, 검색 색인, 수정 메타데이터와 버전 증가를 하나의 SQLite transaction에서 저장한다. 버전이 다르면 저장하지 않고 `412 Precondition Failed`와 최신 문서·ETag를 반환한다. 자동 병합, 강제 덮어쓰기와 Yjs 동기화 endpoint는 제공하지 않는다.

`GET /resources/tree`는 활성 또는 휴지통 scope의 최대 1,000개 전체 트리를 이름순으로 반환한다. 폴더 중첩은 최대 3단계이며 이동은 대상 폴더만 지정하고 수동 순서를 받지 않는다. 자료실 WebSocket endpoint는 없으며 클라이언트는 포커스 복귀와 화면 재진입 때 HTTP로 재검증한다.

`POST /resources/documents/{documentId}/images`는 JPEG·PNG·WebP, 5MB 이하와 대체 텍스트를 검증해 문서 종속 R2 객체를 만든다. SVG·GIF·변환·썸네일과 이미지 라이브러리는 제공하지 않는다.

## 인증 표면

- 학습자 로그인은 Google OAuth를 사용한다.
- 관리자 로그인은 `POST /api/auth/sign-in/email`을 사용한다.
- 프론트엔드는 Next.js same-origin auth proxy를 두지 않고 API origin의 Better Auth endpoint를 직접 호출한다.
- 브라우저 요청은 `credentials: "include"`를 사용한다.
- 쿠키가 포함된 변경 요청은 CORS와 별도로 설정된 웹 origin 검사를 통과해야 한다.
- 어드민 Server Action의 API adapter는 서버 요청에도 정규화한 `ADMIN_ORIGIN`을 명시한다.

## 오류 응답

학습자 API와 어드민 API는 `@workspace/hono/errors`의 표준 오류 응답을 사용한다.

기본 shape:

```json
{
  "code": "ERROR_CODE",
  "message": "오류 메시지",
  "errors": []
}
```

주요 상태:

- `400 INVALID_REQUEST` 또는 `VALIDATION_FAILED`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 ATTEMPT_IN_PROGRESS` 동일 AI 피드백 범위의 요청 처리 중
- `409 PROGRESS_CONFLICT` 저장된 레슨 진행보다 오래된 요청
- `429` AI 피드백 시도 한도
- `413 PAYLOAD_TOO_LARGE`
- `500 INTERNAL_SERVER_ERROR`
- `503` AI provider unavailable

## 클라이언트 API Result 경계

- `@workspace/http-client`는 HTTP fetch 실행, 네트워크 예외 분류, 클라이언트 API result의 공통 `status: "ok" | "error"` shape를 소유한다.
- `apps/web`과 `apps/admin`은 각 앱의 사용자 메시지, 서버 오류 코드 매핑, 인증 cookie 정책을 소유한다.
- 앱별 `api-result.ts`는 앱 API 포트의 이름을 유지하는 얇은 alias와 factory만 제공한다.
- `packages/core/shared/result`는 `{ kind: "ok" | "err" }` discriminated union으로 도메인 use case의 성공/실패 값을 표현하며 HTTP transport, UI 메시지, neverthrow wrapper를 알지 않는다.

## OpenAPI 생성

학습자 API:

- route 정의는 `@hono/zod-openapi` 기반이다.
- route spec과 handler를 같은 파일 가까이에 둔다.
- route schema 파일과 `apps/api/src/http/openapi.ts`는 HTTP 계약 원천인 `@workspace/contracts/*`를 직접 import한다.
- `/openapi`는 실제 Hono 앱에 등록된 route에서 OpenAPI 3.1 문서를 생성한다.
- 정적 계약 파일은 `docs/engineering/contracts/writing-app-api-openapi.json`이다.
- 웹 generated 타입은 이 정적 JSON을 기준으로 생성하고, `apps/web/src/lib/api/writing-app-api-contract.ts`에서 transport contract 타입으로만 감싼다.
- `apps/web` 런타임 HTTP 호출은 `src/lib/api/http/openapi-client.ts`의 자체 adapter가 담당하며, `openapi-fetch`는 도입하지 않는다.
- `bun run check:api-contract`는 임시 OpenAPI JSON과 웹 generated 타입을 다시 생성해 추적 파일과 비교하므로 schema drift를 한 곳에서 감지한다.

명령:

```bash
bun --filter=@workspace/api openapi:generate
bun --filter=@workspace/web api:generate
bun run check:api-contract
```

어드민 API:

- route 정의는 `@workspace/hono/core` 기반이다.
- route spec과 handler를 같은 route 파일 가까이에 둔다.
- route schema는 `@workspace/contracts/admin`을 직접 참조한다.
- Better Auth raw route는 typed route registry 바깥에서 `/api/auth/*`에 등록한다.
- `/openapi`는 실제 Hono 앱에 등록된 route에서 OpenAPI 3.1 문서를 생성한다.

## 계약 변경 절차

1. route schema와 handler를 변경한다.
2. route 테스트를 갱신한다.
3. OpenAPI 정적 JSON을 갱신한다.
4. 웹 generated 타입과 mapper 테스트를 갱신한다.
5. `bun run check:api-contract`로 OpenAPI JSON과 웹 generated 타입 drift가 없는지 확인한다.
6. 관련 engineering 문서를 갱신한다.

# 관리자 웹 API 경계 전환 (2026-07-12)

관리자 웹의 API 클라이언트는 기능별 애플리케이션 계약과 HTTP 어댑터로 분리한다. 공통 계층은 URL, 인증 쿠키, 요청 헤더, JSON·빈 응답·다운로드 처리와 오류 변환만 담당하며 관리자 DTO나 기능 모델을 알지 않는다. 과정, 사용자, 설정, 대시보드, 분석, 채팅, 자료실 어댑터는 각 기능 디렉터리에서 자기 계약과 스키마만 소유한다.
