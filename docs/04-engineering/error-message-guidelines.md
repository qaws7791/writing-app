---
title: 오류 메시지 가이드
description: 사용자에게 보여주는 오류 메시지와 API 오류 응답을 일관되게 설계하기 위한 기준입니다.
---

## 상태

- 기준 시점: 2026-04-06
- 현재 백엔드에 RFC 9457 Problem Details 기반 중앙 오류 처리가 도입되었습니다.
- 프론트엔드 오류 상태 모델은 아직 정식 설계 전입니다.
- 이 문서는 API와 사용자 피드백의 대응 기준입니다.

## 사용자 메시지 원칙

- 메시지는 한국어로 작성합니다.
- 한 문장에 한 문제와 한 행동만 담습니다.
- 사용자가 바꿀 수 있는 값이 잘못됐으면 무엇을 확인해야 하는지 함께 알려줍니다.
- 스택 트레이스, SQL 오류, 내부 클래스명 같은 구현 세부사항은 노출하지 않습니다.
- 인증과 권한 오류는 보안상 과도한 상세 정보를 주지 않습니다.

## API 오류 응답 원칙

- HTTP 상태 코드는 의미에 맞게 사용합니다.
- 본문은 RFC 9457 Problem Details를 기본 형식으로 사용합니다.
- 프론트엔드 분기용 `code`는 안정적으로 유지합니다.
- 필드 오류가 있으면 `errors` 배열로 기계적으로 읽을 수 있게 제공합니다.
- 모든 오류 응답에는 `requestId`를 포함해 로그 추적과 연결합니다.

## 권장 오류 응답 형식

```json
{
  "type": "https://api.example.com/problems/auth-required",
  "title": "로그인이 필요합니다.",
  "status": 401,
  "detail": "이 작업을 계속하려면 로그인해 주세요.",
  "code": "auth.required",
  "requestId": "req_123"
}
```

## 상태 코드 사용 기준

- `400`: JSON 파싱 실패, 쿼리 형식 오류
- `401`: 로그인 필요
- `403`: 권한 부족
- `404`: 대상 없음
- `409`: 중복 생성, 버전 충돌
- `422`: 도메인 규칙 위반
- `429`: 호출 제한 초과
- `500`: 예상하지 못한 내부 오류

## UI 처리 기준

- 사용자는 `title` 또는 가공된 UI 메시지를 보고 행동할 수 있어야 합니다.
- `detail`은 필요한 경우에만 보조 텍스트로 노출합니다.
- `requestId`는 고객 지원이나 운영 확인이 필요한 경우에만 보이게 합니다.
- 재시도 가능한 오류와 재시도 불가능한 오류를 UI에서 구분합니다.

## 로그와의 분리

- 사용자 메시지는 짧고 안전해야 합니다.
- 근본 원인, 스택, 외부 응답 전문은 로그에 남깁니다.
- 같은 오류라도 사용자 메시지와 내부 로그 메시지는 동일할 필요가 없습니다.

## 관련 문서

- [[README]]
- [[api-conventions]]
- [[logging-guide]]
- [[backend-architecture-guide]]
- [[03-architecture/error-handling]]

## 출처

- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [HTTP response status codes | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [Error Handling Cheat Sheet | OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
