---
title: 로깅 가이드
description: 요청 추적, 운영 디버깅, 보안 대응을 위해 어떤 로그를 어떤 형식으로 남길지에 대한 기준입니다.
---

## 상태

- 기준 시점: 2026-04-06
- `apps/api`에 구조화 로거, `requestId` 미들웨어가 도입되어 있습니다.
- 여정, 세션, AI 피드백 도메인 이벤트가 추가될 예정입니다.

## 기본 원칙

- 로그는 기본적으로 구조화된 JSON 형태를 우선합니다.
- 애플리케이션 로그는 `stdout`으로 내보내고, 수집과 보관은 실행 환경이 담당하게 합니다.
- 요청 단위 추적을 위해 모든 서버 로그에 `requestId`를 포함합니다.
- 사용자 글 본문, 인증 토큰, 쿠키, 비밀번호, 외부 API 비밀 값은 로그에 남기지 않습니다.

## 남겨야 하는 이벤트

- 요청 시작과 종료
- 비정상 종료와 예외
- 인증/인가 실패
- 글쓰기 작업 생성, 수정, 삭제
- 여정 참여, 세션 시작/완료, 스텝 제출
- AI 피드백 생성 요청 및 응답 지연
- 외부 API 호출 실패와 지연
- 운영상 중요한 비즈니스 이벤트

## 기본 필드

- `timestamp`
- `level`
- `message`
- `service`
- `env`
- `requestId`
- `method`
- `route`
- `status`
- `durationMs`
- `code`

## 이 제품에 대한 추가 금지 항목

- 에세이 전체 본문
- 사용자가 선택한 문장 원문 전체
- 버전 기록 전문
- 공유용 링크 토큰
- 외부 AI 제공자 응답 전문
- AI 피드백 내용 전체 (강점, 개선점, 질문)

## Hono 적용 기준

- `requestId` 미들웨어를 가장 앞단에 둡니다.
- 기본 로거 또는 커스텀 출력 함수를 request logger로 사용합니다.
- 공통 메타데이터는 `c.set()` / `c.get()`으로 후속 미들웨어와 핸들러에 전달합니다.
- `app.onError()`에서 사용자 응답과 내부 로그를 분리합니다.

## 로그 레벨 기준

- `error`: 요청 실패, 예외, 데이터 손상 가능성
- `warn`: 재시도 가능 실패, 권한 거부, 외부 의존성 지연
- `info`: 요청 완료, 상태 변화, 운영 이벤트
- `debug`: 개발 중 추가 진단 정보. 기본 배포에서는 비활성

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[api-conventions]]
- [[error-message-guidelines]]

## 출처

- [Logging Cheat Sheet | OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [Logger Middleware - Hono](https://hono.dev/docs/middleware/builtin/logger)
- [Request ID Middleware - Hono](https://hono.dev/docs/middleware/builtin/request-id)
- [Context - Hono](https://hono.dev/docs/api/context)
