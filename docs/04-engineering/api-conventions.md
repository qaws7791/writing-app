---
title: API 규약
description: apps/api가 backend-core 계약 스키마와 use case를 HTTP/OpenAPI 경계에 연결할 때 따르는 규약입니다.
---

## 상태

- 기준 시점: 2026-03-20
- 현재 `apps/api`에는 실질적인 제품 API가 없습니다.
- 이 문서는 구현 예정인 Hono + `@hono/zod-openapi` 구조의 표준 규약입니다.

## 역할

- `apps/api`는 HTTP 경계와 OpenAPI 문서화를 담당합니다.
- 계약 스키마는 `packages/backend-core/modules/*/contracts`에서 가져옵니다.
- 비즈니스 로직은 `packages/backend-core` use case를 호출합니다.
- 인프라 구현체는 `packages/db`, `packages/storage`, `packages/ai`에서 조립합니다.

## 모듈 구성 규칙

- 각 도메인 모듈은 `new OpenAPIHono()`로 독립 app을 만듭니다.
- route 선언은 `routes/*` 파일에 둡니다.
- `app.openapi()`에서 route와 handler를 연결합니다.
- handler는 `Context`를 use case 입력으로 바꾸는 역할만 합니다.
- 응답 직렬화와 Problem Details 변환은 presenter에서 담당합니다.

## 표준 흐름

1. `backend-core/modules/*/contracts`에서 zod 스키마를 정의합니다.
2. `apps/api/modules/*/routes`에서 `createRoute()`로 route를 선언합니다.
3. handler가 `Context`에서 입력을 읽어 use case input을 만듭니다.
4. use case는 `Result`를 반환합니다.
5. presenter가 성공 응답 또는 오류 응답으로 매핑합니다.

## 경로 규칙

- 경로는 동사가 아니라 리소스 명사로 설계합니다.
- 컬렉션은 복수형을 사용합니다.
- path parameter는 `:id` 대신 `:writingId`, `:promptId`처럼 의미를 드러냅니다.
- 내부 모듈 구조와 외부 API 경로를 억지로 1:1 대응시키지 않습니다.

## 요청 규칙

- JSON body는 `camelCase`를 사용합니다.
- 날짜와 시간은 UTC ISO 8601 문자열로 주고받습니다.
- 목록 조회 쿼리는 `cursor`, `limit`, `sort`, 도메인 필터 키를 사용합니다.
- 경계 검증은 `@hono/zod-openapi` route 스키마를 기준으로 수행합니다.

## 성공 응답 규칙

- 단건 조회/생성/수정: `{ "item": ... }`
- 목록 조회: `{ "items": [...], "page": { "nextCursor": "...", "hasMore": true } }`
- 삭제 성공: `204 No Content`
- 비동기 AI 작업 접수: 즉시 결과가 없으면 `202 Accepted`

## 상태 코드 기준

- `200`: 정상 조회 또는 동기 처리 성공
- `201`: 새 리소스 생성 성공
- `202`: 비동기 작업 접수
- `400`: JSON 형식 오류, 잘못된 쿼리 형식
- `401`: 인증되지 않음
- `403`: 권한 없음
- `404`: 리소스 없음
- `409`: 버전 충돌, 중복 생성, 상태 충돌
- `422`: 형식은 맞지만 도메인 규칙 위반
- `429`: 호출 제한 초과
- `500`: 서버 내부 오류

## 오류 응답 규칙

- 내부 use case는 예외보다 `Result` 기반 실패 값을 우선 사용합니다.
- HTTP 경계에서는 RFC 9457 Problem Details로 변환합니다.
- 내부 구현 오류 메시지는 그대로 노출하지 않습니다.

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "요청 값을 확인해 주세요.",
  "status": 422,
  "detail": "title은 1자 이상이어야 합니다.",
  "instance": "/api/writings",
  "code": "writing.invalid_title",
  "errors": [
    {
      "field": "title",
      "code": "too_short",
      "message": "제목은 1자 이상이어야 합니다."
    }
  ],
  "requestId": "req_123"
}
```

## 버전 정책

- 내부 전용 초기 단계에서는 `/api`로 시작할 수 있습니다.
- 외부 소비자 또는 breaking change 관리가 필요해지는 시점부터 `/api/v1`을 도입합니다.
- 버전이 올라가도 공통 envelope와 오류 형식은 최대한 유지합니다.

## 하지 않는 것

- route 파일에서 직접 비즈니스 규칙 구현
- route handler에서 SQL, 스토리지 SDK, AI SDK 직접 호출
- presenter 없이 Hono `Context`에서 결과 매핑 로직까지 전부 처리

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[backend-package-boundaries]]
- [[backend-core-guide]]
- [[dependency-injection]]
- [[03-architecture/api-overview]]
- [[03-architecture/error-handling]]

## 출처

- [OpenAPI RPC - Hono](https://hono.dev/examples/zod-openapi)
- [Validation - Hono](https://hono.dev/docs/guides/validation)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
