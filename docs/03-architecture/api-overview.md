---
title: API 개요
description: 글쓰기 플랫폼에서 apps/api가 backend-core와 인프라 패키지를 HTTP/OpenAPI 경계로 연결하는 방식을 정의합니다.
---

## API의 역할

API는 화면을 렌더링하지 않고, 다음 책임에 집중한다.

- 인증과 세션 검증
- 글감, 글쓰기, 버전 기록, 공개 설정 같은 도메인 리소스 제공
- AI 보조 요청의 검증과 오케스트레이션
- 에디터 이미지 업로드와 다운로드 권한 제어
- 감사 이벤트와 운영 이벤트 기록

## 계층 경계

- `apps/api`는 HTTP 전송 계층이자 composition root다.
- 라우트는 요청 파싱, 검증, 인증 확인, 응답 매핑까지만 담당한다.
- 비즈니스 규칙은 `packages/backend-core`로 이동한다.
- 외부 AI, 스토리지, 데이터베이스 연결은 `packages/ai`, `packages/storage`, `packages/db`로 분리한다.
- 내부 표준은 구현이 아니라 포트와 계약 스키마에 의존하는 구조다.

## 계약과 실행 흐름

- API 계약에 쓰는 zod 스키마는 `packages/backend-core/modules/*/contracts`에 둔다.
- `apps/api`는 `@hono/zod-openapi`의 `createRoute()`로 route를 선언한다.
- 각 기능 모듈은 `new OpenAPIHono()`로 app을 만들고 `app.openapi()`로 handler를 연결한다.
- handler는 HTTP 입력을 use case 입력으로 변환하고, presenter는 use case 결과를 HTTP 응답으로 변환한다.

## 버전 전략

- 외부 공개 API 경로는 `/api/v1`를 기본으로 한다.
- 하위 호환이 깨지는 변경만 새 버전을 도입한다.
- 내부 실험용 엔드포인트는 운영 API와 분리한다.

## 주요 리소스

### 인증

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/signup`
- `GET /auth/session`
- `POST /auth/social/kakao`

### 사용자

- `GET /me`
- `PATCH /me/profile`
- `GET /me/activity`

### 글감

- `GET /prompts`
- `GET /prompts/{promptId}`
- `POST /prompts/{promptId}/bookmark`
- `DELETE /prompts/{promptId}/bookmark`
- `GET /prompt-series/{seriesId}`

### 글쓰기

- `GET /writings`
- `POST /writings`
- `GET /writings/{writingId}`
- `PATCH /writings/{writingId}`
- `DELETE /writings/{writingId}`
- `POST /writings/{writingId}/autosave`
- `GET /writings/{writingId}/versions`

### AI 보조

- `POST /writings/{writingId}/ai/suggestions`
- `POST /writings/{writingId}/ai/reviews/spelling`
- `POST /writings/{writingId}/ai/reviews/flow`

### 공개와 공유

- `PATCH /writings/{writingId}/visibility`
- `POST /writings/{writingId}/share-links`
- `DELETE /share-links/{shareLinkId}`
- `POST /writings/{writingId}/publish`

### 파일

- `POST /files/upload-requests`
- `GET /files/{fileId}`
- `DELETE /files/{fileId}`
- `POST /writings/{writingId}/exports`

파일 업로드 API는 범용 첨부 API가 아니라 에디터 본문 삽입용 이미지 업로드만 지원한다.

## 응답 설계 원칙

- 리소스 식별자와 메타데이터는 분리해 표현한다.
- 날짜와 시간은 모두 UTC 기준 ISO 8601 문자열로 반환한다.
- 목록 응답은 페이지네이션 또는 커서 기반 탐색을 지원한다.
- UI 전용 문구는 가능한 한 서버보다 클라이언트에서 조합한다.
- 오류 응답은 RFC 7807/9457 Problem Details 형식을 사용한다.
- 내부 use case는 예외보다 `Result` 기반 실패 값을 우선 사용한다.

## 쓰기 요청의 특징

- 자동 저장과 명시적 저장을 구분한다.
- 자동 저장은 조용히 실패를 처리할 수 있어야 하므로 충돌 정보와 재시도 가능 여부를 함께 반환한다.
- 버전 기록은 글 본문 전체와 변경 메타데이터를 함께 다룬다.
- AI 요청은 사용자의 원문을 대체하지 않고 제안 목록만 반환한다.
- 이미지 업로드는 글쓰기 흐름의 보조 기능이며, 에디터에 삽입할 이미지 파일만 허용한다.
- 업로드 제한은 정적 이미지 형식, 최대 5MB이며 GIF는 허용하지 않는다.

## 보안 원칙

- 상태 변경 요청에는 인증과 CSRF 방어를 적용한다.
- 사용자 소유 리소스는 식별자만 맞아도 접근되는 구조를 허용하지 않는다.
- 공유 링크는 별도 토큰과 만료 정책을 가진다.
- 운영용 엔드포인트는 일반 사용자 API와 분리한다.

## 비범위

- 서버가 HTML 화면을 직접 렌더링하는 책임
- AI가 글 전체를 대신 작성해 반환하는 기능
- 앱 간 직접 상대 경로 의존을 전제로 한 API 설계
- 사용자가 별도 파일 보관함처럼 임의의 파일을 업로드하는 기능
- `apps/api` 안에 비즈니스 규칙이나 인프라 구현을 직접 누적하는 구조

## 관련 다이어그램

- [[03-architecture/diagrams/system-context]]
- [[03-architecture/diagrams/container-view]]
- [[03-architecture/diagrams/writing-runtime-flow]]
- [[04-engineering/backend-architecture-guide]]
- [[04-engineering/backend-package-boundaries]]
