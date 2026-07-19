# API 계약

이 문서는 HTTP API route, 인증 표면, 오류 응답과 OpenAPI 생성 흐름을 설명한다. 실제 path·method와 wire schema의 권위 소스는 `apps/api` route registry와 `packages/contracts`이며 `docs/authority-map.md`가 소유 관계를 안내한다.

## 기준

- 기준 파일:
  - `apps/api/src/routes/index.ts`
  - `apps/api/src/modules/*/*.routes.ts`
  - `apps/api/src/http/openapi.ts`
  - `apps/api/src/http/learner-response.ts`
  - `apps/api/src/http/admin-app.ts`
  - `apps/api/src/http/admin-route-registry.ts`
  - `apps/api/src/composition/admin-route-composition.ts`
  - `apps/api/src/modules/admin-*/*.routes.ts`
  - `apps/api/src/admin/admin-foundation.routes.ts`
  - `packages/contracts/src/learning/learner-api.ts`
  - `packages/contracts/src/learning/api-error.ts`
  - `apps/api/src/http/admin-app.ts`, `apps/api/src/modules/admin-*/*.routes.ts`

## 공통 원칙

- API route는 transport 경계다.
- 비즈니스 규칙은 core service 또는 domain policy에 둔다.
- 요청 body와 params는 runtime schema로 검증한다.
- 학습자 공개 request·response object는 strict Zod schema로 알 수 없는 필드를 거절한다. 표준 HTTP header 전체를 입력으로 받는 header schema만 명시적으로 loose object를 사용한다.
- 학습자 route는 성공 응답을 보내기 직전에 canonical response schema로 검증한다.
- 사용자 노출 오류 메시지는 한국어를 기본으로 한다.
- Better Auth raw route는 앱의 OpenAPI route registry와 분리될 수 있다.

## 쿠키 인증 OpenAPI 계약

- 학습자 보호 route는 OpenAPI의 `learnerSessionCookie` apiKey scheme을 사용하며 실제 쿠키 이름은 `learner_session_token`이다.
- 관리자 보호 route는 `adminSessionCookie` apiKey scheme을 사용하며 실제 쿠키 이름은 `admin_session_token`이다.
- 쿠키 이름 상수는 실제 Better Auth 설정과 OpenAPI 생성이 함께 사용한다. 이름이 달라지면 계약 테스트가 실패한다.
- Bearer token은 두 인증 영역의 세션 인증 수단이 아니다. 생성 클라이언트와 브라우저 호출은 요청에 `credentials: "include"`를 설정해야 한다.
- 테스트용 세션 resolver도 쿠키만 허용하므로 Bearer fallback이 운영 계약을 가리지 않는다.

## 응답 캐시 분류

| 분류        | 경로                                                  | 응답 정책                                          |
| ----------- | ----------------------------------------------------- | -------------------------------------------------- |
| 공개        | `/health`, `/openapi`                                 | 각 route의 기존 캐시 정책 유지                     |
| 인증        | `/api/auth/*`, Google 로그인 helper                   | `Cache-Control: private, no-store`, `Vary: Cookie` |
| 학습자 보호 | `/auth/session`, `/profile`, 코스·레슨·진행·AI 피드백 | `Cache-Control: private, no-store`, `Vary: Cookie` |
| 관리자 보호 | `/session`, 사용자·분석·설정·AI 대화·자료실 등        | `Cache-Control: private, no-store`, `Vary: Cookie` |

SSE와 파일 다운로드도 보호 응답 정책을 적용하되 각각 `text/event-stream`과 `Content-Disposition` 계약을 보존한다.

## HTTP 보안 계약 기준선

공통 Hono middleware는 학습자 HTTP 표면과 `/api/admin` 경로 sub-app의 최종 HTTP 응답을 함께 고정한다. 공통 fixture는 같은 입력과 관찰 항목을 사용하되 인증 realm별 기대 결과를 명시적으로 분리한다.

| 관찰 항목                            | 학습자 API                                                                                                                             | 관리자 API                                                                                             | 실행 가능한 기준선                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| 세션 인증                            | `learner_session_token`; Bearer 단독은 `401 UNAUTHENTICATED`                                                                           | `admin_session_token`; Bearer 단독은 `401 UNAUTHORIZED`                                                | 각 `app.test.ts`의 보호 route                             |
| 신뢰하지 않은 origin의 쿠키 mutation | application 호출 전 차단, 현재 최종 응답은 `500 INTERNAL_SERVER_ERROR`                                                                 | application 호출 전 `403 FORBIDDEN_ORIGIN`                                                             | 양 앱의 side-effect spy                                   |
| 빈 body·잘못된 JSON                  | `400 VALIDATION_ERROR`, `requestId` 포함                                                                                               | `400 HTTP_EXCEPTION`                                                                                   | 학습 step 완료·관리자 notice 표 기반 fixture              |
| schema 불일치                        | `400 VALIDATION_ERROR`                                                                                                                 | `400 VALIDATION_FAILED`                                                                                | 양 앱 route validation fixture                            |
| body limit                           | 정확히 `1 MiB`는 다음 transport 단계로 전달, 1 byte 초과는 application 호출 전 차단되지만 현재 최종 응답은 `500 INTERNAL_SERVER_ERROR` | 정확히 `6 MiB`는 다음 transport 단계로 전달, 1 byte 초과는 application 호출 전 `413 PAYLOAD_TOO_LARGE` | 공통 middleware의 `max`/`max+1` 및 앱별 실제 크기 fixture |
| 보호 응답 cache                      | `private, no-store`, `Vary: Cookie`                                                                                                    | `private, no-store`, `Vary: Cookie`                                                                    | 인증 성공 route와 공개 route 대조                         |
| request ID                           | 서버 생성 ID를 header와 canonical 오류 body에 포함                                                                                     | 서버 생성 ID를 header와 구조화 로그에 포함하며 기존 오류 body shape는 유지                             | request logger 주입 fixture                               |
| 로그 redaction                       | raw header·body·query를 기록하지 않고 학습자 actor ID/type만 보강                                                                      | 같은 앱 내부 logger를 사용하며 관리자 actor ID/type만 보강                                             | `apps/api/src/observability` sentinel fixture             |

공통 origin middleware와 body-limit middleware 자체는 각각 `403 FORBIDDEN_ORIGIN`, `413 PAYLOAD_TOO_LARGE`를 만든다. 학습자 오류 정규화가 두 코드를 canonical mapping에 포함하지 않아 최종 응답을 `500`으로 바꾸는 것은 테스트로 확인한 현재 사실이며 목표 정책으로 승인한 것이 아니다. 이 기준선 이후 오류 mapping을 변경하려면 별도 정책 변경으로 status·code·클라이언트 호환성을 함께 검토해야 한다.

## 학습자 API

기준 URL은 브라우저의 `NEXT_PUBLIC_API_BASE_URL`과 서버의 `API_BASE_URL`이 가리키는 단일 `apps/api` origin이다.

학습자 request/response DTO와 status enum은 `@workspace/contracts/learning`의 Zod schema와 추론 타입을 HTTP 경계의 단일 entrypoint로 사용한다. `apps/api` route와 `apps/web` HTTP adapter는 같은 schema를 직접 import해 요청·응답을 runtime 검증한다. API module은 인증, use case 호출, 성공 응답 검증과 오류 정규화를 담당한다.

`apps/web`의 course·progress·lesson·profile 조회는 canonical 계약 타입을 직접 사용하며 identity mapper나 복제 제품 타입을 두지 않는다. 레슨의 일시적인 UI 입력 모델 변환은 feature에만 유지한다. 학습자 feature는 `@workspace/core`와 내부 `@workspace/contracts/content`를 import하지 않는다.
매칭 스텝의 presentation choice id, selection map, deterministic shuffle, answer pair 변환은 HTTP request/response 계약이 아니므로 `packages/contracts`에서 노출하지 않는다. 해당 상호작용 모델은 `apps/web/src/features/lesson-session/model/lesson-match-presentation.ts`가 소유한다.

현재 route:

| 메서드     | 경로                                                      | 인증          | 설명                                             |
| ---------- | --------------------------------------------------------- | ------------- | ------------------------------------------------ |
| `GET`      | `/health`                                                 | 없음          | API 상태                                         |
| `GET`      | `/openapi`                                                | 없음          | OpenAPI 3.1 문서                                 |
| `GET/POST` | `/api/auth/*`                                             | Better Auth   | 인증 handler                                     |
| `GET`      | `/api/auth/sign-in/google`                                | 없음          | Google sign-in redirect helper                   |
| `GET`      | `/auth/session`                                           | active 학습자 | 현재 세션                                        |
| `GET`      | `/profile`                                                | active 학습자 | 프로필과 통계                                    |
| `GET`      | `/course-categories`                                      | active 학습자 | 정규화·중복 제거된 코스 분류                     |
| `GET`      | `/courses`                                                | active 학습자 | cursor 코스 목록과 서버 검색·분류·정렬           |
| `GET`      | `/courses/{courseId}`                                     | active 학습자 | 코스 상세                                        |
| `GET`      | `/lessons/{lessonId}`                                     | active 학습자 | 레슨 상세                                        |
| `GET`      | `/progress`                                               | active 학습자 | 학습 진행 (`status=in_progress\|completed` 선택) |
| `POST`     | `/learning/lessons/{lessonId}/start`                      | active 학습자 | 고정 version으로 레슨 시작                       |
| `POST`     | `/learning/lessons/{lessonId}/steps/{stepId}/complete`    | active 학습자 | 서버 채점과 원자적 step 전이                     |
| `POST`     | `/learning/lessons/{lessonId}/steps/{stepId}/ai-feedback` | active 학습자 | AI 피드백 생성과 원자적 step 전이                |

`POST /learning/lessons/{lessonId}/start`는 클라이언트가 조회한 `expectedCurriculumVersionId`와 현재 또는 기존 pin을 대조하고 이전 레슨 잠금을 검증한다. step 완료 route는 stable ID 기반 제출만 받고 서버의 type별 grading policy로 평가한다. 오답은 저장하지 않고 `retry`를 반환하며, accepted 답안 저장, 정확히 한 step 전진, 마지막 lesson·course 완료와 활동 집계를 하나의 `IMMEDIATE` transaction에서 처리한다. 과거 step의 동일 요청은 현재 상태를 반환하고 미래 step 요청은 `409 STEP_SEQUENCE_CONFLICT`다.

세 command route는 `@workspace/contracts/learning`의 start/complete body·params·header와 response를 HTTP wire로만 사용한다. 검증된 입력은 브랜드 ID와 `@workspace/contracts/learning/step-data`의 submission을 포함한 application command로 명시적으로 조립하고, core의 `retry | advanced | lesson-completed` 결과를 기존 `retry | advanced | lesson_completed` 응답으로 변환한다. expected rejection도 route-local command 매퍼에서 기존 public status·code로 변환한 뒤 성공 응답은 canonical response schema로 다시 검증한다. 따라서 path, method, `Idempotency-Key`, JSON body, status와 오류 계약은 바뀌지 않는다.

lesson-scoped AI 피드백 route는 `Idempotency-Key`를 필수로 받고 요청 body에 답안, lesson ID나 step ID를 중복해서 받지 않는다. 서버가 고정 version의 선행 WRITE 답안을 조회한 뒤 provider를 transaction 밖에서 호출하고, 성공 결과 저장과 step 전이를 하나의 짧은 transaction에서 확정한다. provider 실패는 진행 상태를 바꾸지 않으며 같은 key의 성공 재시도는 저장된 피드백을 반환한다.

`GET /courses`는 `cursor`, `limit`, `query`, `category`, `sort`를 받고 `GET /progress`는 `cursor`, `limit`, 선택 `status`를 받는다. 두 응답은 모두 `{ items, nextCursor }`다. 코스 정렬은 `recommended`, `title-asc`, `title-desc`, `lesson-count-asc`, `lesson-count-desc`만 허용한다. cursor는 endpoint, 정규화된 query fingerprint, 위치를 HMAC-SHA256으로 서명하고 `/progress`에는 학습자 scope를 추가한다. 서명·endpoint·query·학습자 scope가 일치하지 않으면 `400 INVALID_CURSOR`다.

코스 상세는 `units[].lessons[].learning`과 코스 단위 `learning`을 함께 반환한다. 레슨 상세는 인증 학습자의 고정 curriculum version과 잠금 상태를 적용하고, 순수 presenter의 10개 step type별 object literal allowlist로 정답·해설·AI 내부 설정·분류 정답·매칭 관계를 직렬화하지 않는다. 새 internal field는 명시적 허용 전까지 응답에서 기본 거부하며, 선택지·항목은 기존 학습자 presentation scope에서 결정적 순서를 유지한다. 잠긴 직접 레슨 조회는 `403 LESSON_LOCKED`다.
기존 답안 저장, index 진행 저장, 별도 레슨 완료와 root AI 피드백 route는 제거했다. 해당 경로는 `404 NOT_FOUND`를 반환하며 runtime OpenAPI에도 등록되지 않는다.

## 관리자 경로

관리자 브라우저는 `NEXT_PUBLIC_API_BASE_URL`, 서버 측 호출은 `API_BASE_URL`이 가리키는 하나의 API origin을 사용한다. 관리자 HTTP 표면은 모두 `/api/admin/*` 아래에 있고 production SSR은 `http://api:4000`을 사용한다. 별도 관리자 API origin, runtime 또는 image는 없다.

어드민 request/response DTO와 route query/body contract는 `packages/contracts/admin`의 Zod schema를 기준으로 사용한다. delivery는 `apps/api/src/http/admin-app.ts`와 `apps/api/src/http/admin-route-registry.ts`가 조립하며, `apps/api/src/modules/admin-ai-chat`, `admin-content`, `admin-dashboard-analytics`, `admin-identity`, `admin-resource-library`, `admin-settings`의 여섯 capability route가 app-local HTTP platform의 typed route definition으로 등록된다. 세션, 권한, service 호출은 각 capability와 app-local composition이 담당한다. wire contract schema는 `@workspace/contracts/admin`에서 직접 가져온다. `packages/contracts/src/admin` 내부 schema는 dashboard, users, analytics, settings, content reset, courses, shared 파일로 나누고 `@workspace/contracts/admin` entrypoint가 이를 다시 노출한다. `apps/admin`은 core를 직접 import하지 않는다. 공통 HTTP transport는 관리자 DTO를 알지 않으며, 각 feature Adapter가 자기 contract schema를 주입한다. schema로 검증한 DTO와 화면 모델의 의미·shape가 같으면 추가 identity mapping 없이 canonical DTO를 반환하고, 실제 표시 의미나 command shape가 달라질 때만 feature projection을 둔다. 화면은 contract package가 아니라 해당 feature Interface를 소비한다.

관리자 content application은 course page response나 archive acknowledgement를 사용하지 않는다. 목록은 canonical item과 flat page metadata를 반환하고 route가 기존 `{ items, pagination }` 응답으로 mapping한다. 보관 성공은 application `ok`를 route가 `{ archived: true }`로 변환한다. course detail·editor·publish와 content reset의 canonical 값은 `@workspace/contracts/admin/content-data`를 재사용하며, route가 성공 응답 직전에 공개 schema로 검증한다. 외부 path·method·status·body, owner authorization, ETag·If-Match와 version conflict 계약은 바뀌지 않는다.

관리자 identity application은 user page response, status request나 delete acknowledgement를 사용하지 않는다. 목록은 `@workspace/contracts/admin/identity-data`의 canonical item과 flat page metadata를 반환하고 route가 기존 `{ items, pagination }` 응답으로 mapping한다. 상태 변경·삭제는 명시적 application result로 `forbidden`·`not-found`·`ok`를 구분하며 route가 기존 `403`·`404`와 삭제 `{ deleted: true }` 응답으로 변환한다. 사용자 상세·상태 변경 성공값도 route가 전송 직전 canonical detail schema로 검증한다. public path·method·status·body, owner authorization과 profile soft-delete 저장 의미는 바뀌지 않는다.

관리자 dashboard·analytics application은 HTTP query schema나 lesson analytics page response를 사용하지 않는다. dashboard와 analytics summary는 `@workspace/contracts/admin/dashboard-analytics-data`의 canonical snapshot을 반환하고 route가 전송 직전 schema로 검증한다. lesson analytics는 canonical item과 flat page metadata를 반환하며 route가 기존 `{ items, pagination }` 응답으로 mapping한다. `days`, search, sort/direction과 page bounds는 route가 검증·default 적용 뒤 명시적 read query로 조립한다. 외부 path·status·body, session authorization, 기간 상한, 정렬·pagination과 OpenAPI query 계약은 바뀌지 않는다.

관리자 settings application은 notice·legal HTTP request object를 사용하지 않고 `@workspace/contracts/admin/settings-data`의 canonical snapshot만 조회·저장 결과로 사용한다. route가 body의 각 필드와 공지 2,000자·법적 문서 100,000자 상한을 검증해 명시적 command로 조립하고, 모든 조회·저장 성공값을 전송 직전 canonical schema로 검증한다. 저장 application 결과는 `forbidden | ok(value)`이며 route가 기존 owner `403`으로 mapping한다. 외부 path·method·status·body, OpenAPI 계약과 version 없는 last-write-wins 의미는 바뀌지 않는다.

관리자 AI chat application은 message request, list/detail HTTP wrapper와 SSE event를 사용하지 않고 `@workspace/contracts/admin/ai-chat-data`의 canonical conversation ID·conversation·message·role만 사용한다. 목록은 conversation 배열을 반환하고 상세·사용자 메시지 생성 결과는 conversation과 `messageItems` history를 반환한다. route가 이를 기존 `{ items }`와 `{ conversation, messages }`로 mapping해 검증하고 `chunk`·`done`·`error` data도 event별 schema 검증 뒤 직렬화한다. path·status·security·query/body, SSE frame, rate limit, provider timeout·취소와 persistence 의미는 바뀌지 않는다.

관리자 인증은 Better Auth의 email/password endpoint를 사용한다. owner 변경은 유효한 owner session을 요구하며, operator 요청은 `403 FORBIDDEN`을 반환한다. 비밀번호 변경은 기존처럼 모든 관리자 session을 폐기한다.

어드민 API의 query, path params, JSON body 검증은 route config의 zod-openapi `request` schema가 소유한다. Handler는 `context.req.valid("query" | "param" | "json")`로 검증된 값만 읽는다.
Route 파일은 관리자 세션 middleware와 OpenAPI security requirement를 `adminSessionRouteOptions()` 또는 `ownerAdminRouteOptions()`로 함께 선언한다. JSON body request content는 `jsonRequestBody()`를 사용해 반복되는 `application/json` shape를 숨긴다.

자료실 tree·search·document·asset core 경계는 HTTP request/query/collection·mutation response/error wire를 import하지 않는다. `@workspace/contracts/admin/resource-library-data`의 canonical item·MIME만 type-only로 재사용하고, `apps/api/src/modules/admin-resource-library/` route가 검증된 wire와 세션 actor를 application command/query로 명시적으로 조립한다. application result/rejection은 route에서 기존 status·error와 response schema로 변환하며, ETag·If-Match, upload/download header와 R2 object key 비노출 순서를 유지한다.

현재 route:

| 메서드     | 경로                                                 | 권한        | 설명                       |
| ---------- | ---------------------------------------------------- | ----------- | -------------------------- |
| `GET`      | `/api/admin/health`                                  | 없음        | 관리자 경로 상태           |
| `GET`      | `/api/admin/openapi`                                 | 없음        | 관리자 OpenAPI 3.1 문서    |
| `GET/POST` | `/api/admin/auth/*`                                  | Better Auth | 관리자 인증 handler        |
| `GET`      | `/api/admin/session`                                 | 관리자      | 현재 관리자 세션           |
| `GET`      | `/api/admin/dashboard`                               | 관리자      | 대시보드                   |
| `GET`      | `/api/admin/analytics`                               | 관리자      | 분석 요약                  |
| `GET`      | `/api/admin/analytics/lessons`                       | 관리자      | 레슨별 분석                |
| `GET`      | `/api/admin/courses`                                 | 관리자      | 코스 목록                  |
| `POST`     | `/api/admin/courses`                                 | owner       | 코스 생성                  |
| `DELETE`   | `/api/admin/courses/{courseId}`                      | owner       | 코스 보관                  |
| `GET`      | `/api/admin/courses/{courseId}/editor`               | 관리자      | 코스 편집 문서 조회        |
| `PUT`      | `/api/admin/courses/{courseId}/editor`               | owner       | 전체 코스 편집 문서 저장   |
| `POST`     | `/api/admin/courses/{courseId}/publish`              | owner       | 현재 draft 발행            |
| `GET`      | `/api/admin/users`                                   | 관리자      | 사용자 목록                |
| `GET`      | `/api/admin/users/{userId}`                          | 관리자      | 사용자 상세                |
| `PATCH`    | `/api/admin/users/{userId}/status`                   | owner       | 사용자 상태 변경           |
| `DELETE`   | `/api/admin/users/{userId}`                          | owner       | 사용자 삭제 상태 전환      |
| `GET`      | `/api/admin/settings`                                | 관리자      | 설정 조회                  |
| `PUT`      | `/api/admin/settings/notice`                         | owner       | 공지 설정 저장             |
| `PUT`      | `/api/admin/settings/legal`                          | owner       | 법적 문서 저장             |
| `POST`     | `/api/admin/settings/content-reset`                  | owner       | 콘텐츠 초기화              |
| `GET`      | `/api/admin/resources/tree`                          | 관리자      | 자료 트리 전체 조회        |
| `POST`     | `/api/admin/resources/folders`                       | 관리자      | 자료 폴더 생성             |
| `POST`     | `/api/admin/resources/documents`                     | 관리자      | 빈 자료 문서 생성          |
| `GET`      | `/api/admin/resources/documents/{documentId}`        | 관리자      | Markdown 문서 조회         |
| `PUT`      | `/api/admin/resources/documents/{documentId}`        | 관리자      | 제목·Markdown 조건부 저장  |
| `POST`     | `/api/admin/resources/documents/import`              | 관리자      | Markdown 단일 가져오기     |
| `GET`      | `/api/admin/resources/documents/{documentId}/export` | 관리자      | Markdown 문서 내보내기     |
| `POST`     | `/api/admin/resources/documents/{documentId}/images` | 관리자      | R2 문서 이미지 업로드      |
| `GET`      | `/api/admin/resources/search`                        | 관리자      | 제목·본문 FTS 검색         |
| `PATCH`    | `/api/admin/resources/folders/{folderId}/name`       | 관리자      | 자료 폴더 이름 변경        |
| `PATCH`    | `/api/admin/resources/nodes/{nodeId}/move`           | 관리자      | 자료 항목 폴더 이동        |
| `POST`     | `/api/admin/resources/nodes/{nodeId}/trash`          | 관리자      | 하위 트리 휴지통 이동      |
| `POST`     | `/api/admin/resources/nodes/{nodeId}/restore`        | 관리자      | 하위 트리 복원             |
| `DELETE`   | `/api/admin/resources/nodes/{nodeId}`                | 관리자      | 휴지통 하위 트리 영구 삭제 |
| `GET`      | `/api/admin/ai-chat/conversations`                   | 관리자      | AI 대화 목록               |
| `GET`      | `/api/admin/ai-chat/conversations/{conversationId}`  | 관리자      | AI 대화 상세               |
| `POST`     | `/api/admin/ai-chat/messages/stream`                 | 관리자      | AI 응답 stream             |

`POST /api/admin/ai-chat/messages/stream`은 관리자·클라이언트 IP별 요청 횟수와 관리자별 일일 요청 횟수, 대화별 단일 in-flight를 제한한다. 한도 초과는 `429`와 `Retry-After`를 반환한다. SSE stream은 `chunk` 뒤 반드시 `done` 또는 `error`로 종료하며, 요청 취소와 30초 provider timeout은 provider abort로 전달되고 assistant 메시지를 저장하지 않는다. prompt는 최근 20개 메시지와 12,000자, provider 출력은 2,000 token과 64 KiB를 상한으로 둔다.

### 관리자 커리큘럼 draft 저장과 발행

- `GET /api/admin/courses/{courseId}/editor`는 mutable draft만 반환하고 `editVersion`의 강한 ETag를 응답한다.
- `PUT /api/admin/courses/{courseId}/editor`는 `If-Match: "<editVersion>"`를 필수로 받고 같은 draft version과 edit version일 때만 전체 문서를 저장한다.
- `POST /api/admin/courses/{courseId}/publish`도 같은 `If-Match`를 요구한다. 빈 유닛·레슨·스텝, 잘못된 AI 대상이나 stable selectable item ID가 있으면 발행하지 않는다.
- 저장 성공은 같은 `revision`에서 `editVersion`만 증가시킨다. 발행 성공은 `{ curriculumVersionId, revision, publishedAt }`을 반환하고 서버가 다음 revision draft를 복제한다.
- 누락된 `If-Match`는 `428`, 잘못된 형식은 `400`, stale 값은 `409 STALE_REVISION`, 발행 불가 draft는 `422`다.
- 관리자 웹은 충돌을 자동 병합하지 않는다. 최신 draft로 교체하거나 최신 `curriculumVersionId/editVersion/revision`에 로컬 변경을 재기준화한 뒤 다시 저장한다.

`GET /api/admin/ai-chat/conversations`는 `page`와 최대 50인 `pageSize`, `GET /api/admin/ai-chat/conversations/{conversationId}`는 `messagePage`와 최대 100인 `messagePageSize` query로 대화와 메시지를 페이지 단위로 조회한다.

`GET /api/admin/resources/documents/{documentId}`는 제목, Markdown, 경로, 작성자·수정자·시각과 현재 `version`을 반환하고 같은 버전의 강한 ETag를 응답 header에 포함한다. `PUT /api/admin/resources/documents/{documentId}`는 `If-Match`를 필수로 받아 제목, Markdown, 검색 색인, 수정 메타데이터와 버전 증가를 하나의 SQLite transaction에서 저장한다. 버전이 다르면 저장하지 않고 `412 Precondition Failed`와 최신 문서·ETag를 반환한다. 자동 병합, 강제 덮어쓰기와 Yjs 동기화 endpoint는 제공하지 않는다.

`GET /api/admin/resources/tree`는 활성 또는 휴지통 scope의 최대 1,000개 전체 트리를 이름순으로 반환한다. 폴더 중첩은 최대 3단계이며 이동은 대상 폴더만 지정하고 수동 순서를 받지 않는다. 자료실 WebSocket endpoint는 없으며 클라이언트는 포커스 복귀와 화면 재진입 때 HTTP로 재검증한다.

`POST /api/admin/resources/documents/{documentId}/images`는 JPEG·PNG·WebP, 5MB 이하와 대체 텍스트를 검증해 문서 종속 R2 객체를 만든다. SVG·GIF·변환·썸네일과 이미지 라이브러리는 제공하지 않는다.

## 인증 표면

- 학습자 로그인은 Google OAuth를 사용한다.
- 관리자 로그인은 `POST /api/admin/auth/sign-in/email`을 사용한다.
- 프론트엔드는 Next.js same-origin auth proxy를 두지 않고 API origin의 Better Auth endpoint를 직접 호출한다.
- 브라우저 요청은 `credentials: "include"`를 사용한다.
- 쿠키가 포함된 변경 요청은 CORS와 별도로 설정된 웹 origin 검사를 통과해야 한다.
- 어드민 Server Action의 API adapter는 서버 요청에도 정규화한 `ADMIN_ORIGIN`을 명시한다.

## 오류 응답

학습자 API 오류 계약은 `@workspace/contracts/learning`이 소유한다. `apps/api/src/http/platform/errors`는 transport 내부의 범용 오류와 Zod issue를 제공하고, 학습자 route 경계가 이를 canonical 오류로 정규화한다.

기본 shape:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "오류 메시지",
  "requestId": "서버 요청 ID"
}
```

검증 오류만 `code: "VALIDATION_ERROR"`와 `{ path, message }[]` 형태의 `violations`를 추가한다. 입력값, Zod issue code와 stack은 응답에 포함하지 않는다.

주요 상태:

- `400 VALIDATION_ERROR`, `INVALID_CURSOR`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`, `LESSON_LOCKED`
- `404 COURSE_NOT_FOUND`, `LESSON_NOT_FOUND`
- `409 STEP_SEQUENCE_CONFLICT`, `CURRICULUM_VERSION_CHANGED`, `ATTEMPT_IN_PROGRESS`, `AI_FEEDBACK_ANSWER_NOT_FOUND`
- `429 ATTEMPT_LIMIT_EXCEEDED`
- `500 INTERNAL_SERVER_ERROR`
- `503 PROVIDER_UNAVAILABLE`

## 클라이언트 API Result 경계

- `@workspace/http-client`는 HTTP fetch 실행, 네트워크 예외 분류, 클라이언트 API result의 공통 `status: "ok" | "error"` shape와 `httpApiOk`·`httpApiFailure` 생성자를 소유한다.
- `apps/web`은 서버 오류의 canonical code와 message를 그대로 사용하고 `NETWORK_ERROR`, `CONTRACT_ERROR`만 자체 생성한다.
- 학습자 웹의 `ApiResult<T>`와 관리자 웹의 `AdminApiResult<T>`는 각 앱의 오류 union을 고정하는 type-only specialization만 제공한다. 앱별 성공·실패 shape나 pass-through 생성자는 만들지 않고 HTTP transport가 `@workspace/http-client` 생성자를 직접 사용한다.
- `packages/core/shared/result`는 `{ kind: "ok" | "err" }` discriminated union으로 도메인 use case의 성공/실패 값을 표현하며 HTTP transport, UI 메시지, neverthrow wrapper를 알지 않는다.

## OpenAPI 생성

학습자 API:

- route 정의는 `@hono/zod-openapi` 기반이다.
- route spec과 handler를 같은 파일 가까이에 둔다.
- 학습자 HTTP 경계와 웹의 canonical entrypoint는 `@workspace/contracts/learning`의 Zod schema와 `z.infer` 타입이다. 단계 1의 기존 course·lesson shape는 내부 content schema를 이 entrypoint에서 재사용하며, solution을 제거한 독립 learner read model은 후속 단계에서 교체한다.
- `/openapi`는 실제 Hono 앱에 등록된 route에서 OpenAPI 3.1 문서를 생성한다.
- 정적 OpenAPI JSON과 generated TypeScript 타입은 추적하지 않는다.
- strict object가 runtime OpenAPI에 `additionalProperties: false`로 표현되는지 route 테스트로 검증한다.
- `apps/web` 런타임 HTTP 호출은 `src/shared/http/openapi-client.ts`의 자체 adapter가 담당하며, `openapi-fetch`는 도입하지 않는다. 브라우저 소비자는 `features/*/api`, 서버 소비자는 `features/*/server/dal`의 좁은 경계를 사용한다.

어드민 API:

- route 정의는 `apps/api/src/http/platform/core` 기반이다.
- route spec과 handler를 같은 route 파일 가까이에 둔다.
- route schema는 `@workspace/contracts/admin`을 직접 참조한다.
- 관리자 OpenAPI는 `/api/admin` 경로 sub-app에 실제 등록된 여섯 capability route와 foundation route에서 생성한다.
- 관리자 Better Auth raw route는 sub-app 내부 상대 경로 `/auth/*`에 등록되고 최종 public 경로는 `/api/admin/auth/*`다.
- `/openapi`는 실제 Hono 앱에 등록된 route에서 OpenAPI 3.1 문서를 생성한다.

## 계약 변경 절차

1. `@workspace/contracts/learning`의 canonical schema와 추론 타입을 변경한다.
2. route handler와 웹 HTTP adapter를 같은 계약으로 갱신한다.
3. strict request, response runtime parse, 오류 request ID와 redacted log 테스트를 갱신한다.
4. runtime `/openapi` route에서 실제 문서와 `additionalProperties: false`를 확인한다.
5. 관련 engineering 문서를 갱신한다.

## 관리자 웹 API 경계

관리자 웹의 API 클라이언트는 기능별 애플리케이션 계약과 HTTP 어댑터로 분리한다. 공통 계층은 URL, 인증 쿠키, 요청 헤더, JSON·빈 응답·다운로드 처리와 오류 변환만 담당하며 관리자 DTO나 기능 모델을 알지 않는다. 과정, 사용자, 설정, 대시보드, 분석, 채팅, 자료실 어댑터는 각 기능 디렉터리에서 자기 계약과 스키마만 소유한다.
