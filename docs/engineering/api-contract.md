# API 계약

이 문서는 HTTP API route, 인증 표면, 오류 응답, OpenAPI 생성 흐름을 설명하는 단일 진실 원천이다.

## 기준

- 기준일: 2026-06-19
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

## 학습자 API

기준 URL은 환경별 `NEXT_PUBLIC_API_BASE_URL` 또는 `WEB_API_BASE_URL`이 가리키는 `apps/api` origin이다.

학습자 request/response DTO와 status enum은 `packages/contracts`의 Zod schema를 단일 기준으로 사용한다. `apps/api`의 route schema는 `@workspace/contracts/*`를 직접 import해 OpenAPI 문서를 생성하고, `apps/web`은 같은 정적 OpenAPI JSON에서 generated 타입을 만들며 런타임 응답 파싱은 가능한 범위에서 같은 contracts schema를 사용한다. API module은 인증 사용자 shape와 route response 조합만 담당한다.

`apps/web` feature model은 앱 내부 타입으로 유지하며 `@workspace/core`를 직접 import하지 않는다. API wire DTO와 contracts schema는 `apps/web/src/lib/api` 경계에서 검증·변환한다.

현재 route:

| 메서드     | 경로                                    | 인증          | 설명                           |
| ---------- | --------------------------------------- | ------------- | ------------------------------ |
| `GET`      | `/health`                               | 없음          | API 상태                       |
| `GET`      | `/openapi`                              | 없음          | OpenAPI 3.1 문서               |
| `GET/POST` | `/api/auth/*`                           | Better Auth   | 인증 handler                   |
| `GET`      | `/api/auth/sign-in/google`              | 없음          | Google sign-in redirect helper |
| `GET`      | `/auth/session`                         | active 학습자 | 현재 세션                      |
| `GET`      | `/profile`                              | active 학습자 | 프로필과 통계                  |
| `GET`      | `/courses`                              | active 학습자 | 코스 목록                      |
| `GET`      | `/courses/{courseId}`                   | active 학습자 | 코스 상세                      |
| `GET`      | `/lessons/{lessonId}`                   | active 학습자 | 레슨 상세                      |
| `GET`      | `/progress`                             | active 학습자 | 학습 진행                      |
| `POST`     | `/learning/answers`                     | active 학습자 | 스텝 답변 저장                 |
| `POST`     | `/learning/lessons/{lessonId}/complete` | active 학습자 | 레슨 완료                      |
| `POST`     | `/ai-feedback`                          | active 학습자 | AI 코칭 생성                   |

## 어드민 API

기준 URL은 `ADMIN_API_BASE_URL`이 가리키는 `apps/admin-api` origin이다.

어드민 request/response DTO와 route query/body contract는 `packages/contracts/admin`의 Zod schema를 기준으로 사용한다. `apps/admin-api` route는 세션, 권한, service 호출을 담당하고 wire contract schema는 `@workspace/contracts/admin`에서 직접 가져온다. `apps/admin`은 core를 직접 import하지 않으며, `@workspace/contracts/admin`은 `apps/admin/src/lib/api/http-admin-api.ts`의 HTTP 응답 검증과 앱 모델 변환에만 사용한다. 화면과 API 포트는 `apps/admin/src/lib/api/admin-api.ts`가 노출하는 앱 모델 타입을 소비한다.

현재 route:

| 메서드     | 경로                        | 권한        | 설명                  |
| ---------- | --------------------------- | ----------- | --------------------- |
| `GET`      | `/health`                   | 없음        | API 상태              |
| `GET/POST` | `/api/auth/*`               | Better Auth | 관리자 인증 handler   |
| `GET`      | `/dashboard`                | 관리자      | 대시보드              |
| `GET`      | `/analytics`                | 관리자      | 분석 요약             |
| `GET`      | `/analytics/lessons`        | 관리자      | 레슨별 분석           |
| `GET`      | `/courses`                  | 관리자      | 코스 목록             |
| `POST`     | `/courses`                  | owner       | 코스 생성             |
| `DELETE`   | `/courses/:courseId`        | owner       | 코스 보관             |
| `GET`      | `/courses/:courseId/editor` | 관리자      | 코스 편집 문서 조회   |
| `GET`      | `/users`                    | 관리자      | 사용자 목록           |
| `GET`      | `/users/:userId`            | 관리자      | 사용자 상세           |
| `PATCH`    | `/users/:userId/status`     | owner       | 사용자 상태 변경      |
| `DELETE`   | `/users/:userId`            | owner       | 사용자 삭제 상태 전환 |
| `GET`      | `/settings`                 | 관리자      | 설정 조회             |
| `PUT`      | `/settings/notice`          | owner       | 공지 설정 저장        |
| `PUT`      | `/settings/legal`           | owner       | 법적 문서 저장        |
| `POST`     | `/settings/content-reset`   | owner       | 콘텐츠 초기화         |

현재 어드민 API에는 학습자 API와 같은 `/openapi` route가 구현되어 있지 않다.

## 인증 표면

- 학습자 로그인은 Google OAuth를 사용한다.
- 관리자 로그인은 `POST /api/auth/sign-in/email`을 사용한다.
- 프론트엔드는 Next.js same-origin auth proxy를 두지 않고 API origin의 Better Auth endpoint를 직접 호출한다.
- 브라우저 요청은 `credentials: "include"`를 사용한다.

## 오류 응답

학습자 API는 `@workspace/hono/errors`의 표준 오류 응답을 사용한다.

기본 shape:

```json
{
  "code": "ERROR_CODE",
  "message": "오류 메시지",
  "errors": []
}
```

어드민 API는 `errorResponse()` helper를 사용한다.

주요 상태:

- `400 invalid_request`
- `401 unauthorized`
- `403 forbidden`
- `404 not_found`
- `429` AI 피드백 시도 한도
- `500 internal_error`
- `503` AI provider unavailable

JSON body 오류 detail:

- `malformed_json`
- `invalid_body`
- `unknown_body_read_error`

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

## 계약 변경 절차

1. route schema와 handler를 변경한다.
2. route 테스트를 갱신한다.
3. OpenAPI 정적 JSON을 갱신한다.
4. 웹 generated 타입과 mapper 테스트를 갱신한다.
5. `bun run check:api-contract`로 OpenAPI JSON과 웹 generated 타입 drift가 없는지 확인한다.
6. 관련 engineering 문서를 갱신한다.
