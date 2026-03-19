---
title: API 규약
description: 아직 구현 전인 백엔드 API를 일관된 경로, 요청, 응답 형식으로 설계하기 위한 기준입니다.
---

## 상태

- 기준 시점: 2026-03-19
- 현재 `apps/api`에는 실질적인 제품 API가 없습니다.
- 이 문서는 `prompts`, `writings`, `versions`, `reviews` 같은 도메인 리소스를 구현할 때 적용할 기준입니다.

## 기본 원칙

- 경로는 동사가 아니라 리소스 명사로 설계합니다.
- 컬렉션은 복수형을 사용합니다.
- 프론트엔드 URL 구조와 API 경로를 억지로 일치시키지 않습니다.
- 요청 검증은 경계에서 수행하고, 응답은 예측 가능한 형태를 유지합니다.

## 경로 규칙

- 목록: `GET /api/prompts`
- 단건: `GET /api/prompts/:promptId`
- 생성: `POST /api/writings`
- 수정: `PATCH /api/writings/:writingId`
- 하위 리소스: `GET /api/writings/:writingId/versions`
- 리소스로 표현하기 어려운 작업: `POST /api/writings/:writingId/exports`

## 요청 규칙

- JSON body는 `camelCase`를 사용합니다.
- 날짜와 시간은 UTC ISO 8601 문자열로 주고받습니다.
- 목록 조회 쿼리는 `cursor`, `limit`, `sort`, 도메인 필터 키를 사용합니다.
- path parameter 이름은 `:id` 대신 `:writingId`, `:promptId`처럼 의미를 드러냅니다.

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

## 오류 응답 형식

오류 응답은 RFC 9457 Problem Details를 기본으로 하고, 아래 확장 필드를 추가합니다.

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
- 버전이 올라가도 오류 형식과 공통 필드 이름은 최대한 유지합니다.

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[error-message-guidelines]]
- [[logging-guide]]
- [[03-architecture/api-overview]]

## 출처

- [Validation - Hono](https://hono.dev/docs/guides/validation)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [HTTP response status codes | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
