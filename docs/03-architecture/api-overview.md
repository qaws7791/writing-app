---
title: API 개요
description: 글필(Geulpil) 플랫폼에서 apps/api가 core와 인프라 패키지를 HTTP/OpenAPI 경계로 연결하는 방식을 정의합니다.
---

## API의 역할

API는 화면을 렌더링하지 않고, 다음 책임에 집중한다.

- 인증과 세션 검증
- 글감, 여정, 세션, 스텝, 글쓰기 같은 도메인 리소스 제공
- 여정 진행 상태 추적과 잠금 해제 로직
- AI 코칭 피드백 요청의 검증과 오케스트레이션
- 감사 이벤트와 운영 이벤트 기록

## 계층 경계

- `apps/api`는 HTTP 전송 계층이자 composition root다.
- 라우트는 요청 파싱, 검증, 인증 확인, 응답 매핑까지만 담당한다.
- 비즈니스 규칙은 `packages/core`로 이동한다.
- 외부 AI, 데이터베이스 연결은 `packages/ai`, `packages/database`로 분리한다.
- 내부 표준은 구현이 아니라 포트와 계약 스키마에 의존하는 구조다.

## 계약과 실행 흐름

- API 계약에 쓰는 zod 스키마는 `packages/core/modules/*/contracts`에 둔다.
- `apps/api`는 `@hono/zod-openapi`의 `createRoute()`로 route를 선언한다.
- 각 기능 모듈은 `new OpenAPIHono()`로 app을 만들고 `app.openapi()`로 handler를 연결한다.
- handler는 HTTP 입력을 use case 입력으로 변환하고, presenter는 use case 결과를 HTTP 응답으로 변환한다.

## 버전 전략

- 외부 공개 API 경로는 `/api/v1`를 기본으로 한다.
- 하위 호환이 깨지는 변경만 새 버전을 도입한다.
- 내부 실험용 엔드포인트는 운영 API와 분리한다.

## 주요 리소스

### 인증

- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-out`
- `GET /session`

### 사용자

- `GET /users/profile`

### 홈

- `GET /home` — v2.1: 진행 중인 여정 카드 목록 우선, 첫 여정 시작 CTA 플래그, 글쓰기 제안 보조 카드. 오늘의 추천 글감 필드 제거

### 글감

- `GET /prompts`
- `GET /prompts/categories`
- `GET /prompts/{promptId}`
- `GET /prompts/{promptId}/writings` — **deprecated (v2.1):** 글감 상세 화면이 제거되어 프론트엔드에서 미사용
- `PUT /prompts/{promptId}/bookmark`
- `DELETE /prompts/{promptId}/bookmark`

### 여정

- `GET /journeys`
- `GET /journeys/{journeyId}`
- `POST /journeys/{journeyId}/enroll`

### 세션과 스텝

- `GET /sessions/{sessionId}`
- `POST /sessions/{sessionId}/start`
- `POST /sessions/{sessionId}/steps/{stepOrder}/submit`
- `POST /sessions/{sessionId}/steps/{stepOrder}/retry`
- `POST /sessions/{sessionId}/complete`

세션 API는 정적 세션 정보만이 아니라 사용자 진행 상태, 스텝 응답, 세션 내부 AI 상태와 결과를 포함한 런타임 스냅샷을 반환한다.
`GET /sessions/{sessionId}`와 `POST /sessions/{sessionId}/start`는 같은 스냅샷 형태를 반환하고, `POST /sessions/{sessionId}/steps/{stepOrder}/submit`은 일반 제출 시 `200`, AI 작업 수락 시 `202`를 반환한다.

### 글쓰기

- `GET /writings`
- `POST /writings`
- `GET /writings/{writingId}`
- `PATCH /writings/{writingId}`
- `DELETE /writings/{writingId}`

### AI 피드백

- `POST /writings/{writingId}/feedback`
- `POST /writings/{writingId}/compare`

자유 글쓰기용 AI 피드백은 위 리소스를 유지한다. 여정 세션 내부 AI는 별도 `/ai/*` 공개 API 대신 세션 API 안에서만 실행되고 복원된다.

### 데이터 내보내기

- `POST /me/exports`

## 응답 설계 원칙

- 리소스 식별자와 메타데이터는 분리해 표현한다.
- 날짜와 시간은 모두 UTC 기준 ISO 8601 문자열로 반환한다.
- 목록 응답은 페이지네이션 또는 커서 기반 탐색을 지원한다.
- UI 전용 문구는 가능한 한 서버보다 클라이언트에서 조합한다.
- 오류 응답은 RFC 7807/9457 Problem Details 형식을 사용한다.
- 내부 use case는 예외보다 `Result` 기반 실패 값을 우선 사용한다.

## 글쓰기 요청의 특징

- 자동 저장과 명시적 저장을 구분한다.
- 자동 저장은 조용히 실패를 처리할 수 있어야 하므로 충돌 정보와 재시도 가능 여부를 함께 반환한다.
- 버전 기록은 글 본문 전체와 변경 메타데이터를 함께 다룬다.
- 세션 스텝의 글쓰기는 세션 진행 상태와 연결되어 자동 저장된다.

## 여정 진행 요청의 특징

- 세션 시작, 스텝 제출, 세션 완료는 순서를 보장해야 한다.
- 이전 세션이 완료되지 않은 상태에서 다음 세션 시작을 시도하면 403을 반환한다.
- 스텝 응답 제출 시 서버에서 유형별 검증을 수행한다.
- WRITE/REVISE 제출은 세션 내부 AI 작업을 비동기로 시작하고, 후속 FEEDBACK 상태를 세션 스냅샷으로 노출한다.
- AI 실패 시 세션 범위 재시도 엔드포인트로만 재실행한다.

## 보안 원칙

- 상태 변경 요청에는 인증과 CSRF 방어를 적용한다.
- 사용자 소유 리소스는 식별자만 맞아도 접근되는 구조를 허용하지 않는다.
- 운영용 엔드포인트는 일반 사용자 API와 분리한다.

## 비범위

- 서버가 HTML 화면을 직접 렌더링하는 책임
- AI가 글 전체를 대신 작성해 반환하는 기능
- 앱 간 직접 상대 경로 의존을 전제로 한 API 설계
- `apps/api` 안에 비즈니스 규칙이나 인프라 구현을 직접 누적하는 구조

## 관련 다이어그램

- [[03-architecture/diagrams/system-context]]
- [[03-architecture/diagrams/container-view]]
- [[03-architecture/diagrams/writing-runtime-flow]]
- [[04-engineering/backend-architecture-guide]]
- [[04-engineering/backend-package-boundaries]]
