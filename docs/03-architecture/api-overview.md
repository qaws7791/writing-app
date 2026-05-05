---
title: API 개요
description: 글숨 Labs MVP에서 apps/api가 사진, 표현 재료, 문장 씨앗, 문체 정원 리소스를 HTTP/OpenAPI 경계로 제공하는 방식을 정의합니다.
---

상태: active
기준 PRD: [[00-prd/v3]]

## API의 역할

API는 화면을 렌더링하지 않고 다음 책임에 집중한다.

- 인증과 세션 검증
- 사진 업로드와 삭제 요청의 오케스트레이션
- 표현 재료, 선택, 문장 씨앗, 문장 저장 리소스 제공
- AI 분석과 힌트 생성을 안전한 계약으로 제한
- 저장 자산의 출처와 사용자 소유권 보존
- 감사 이벤트와 운영 이벤트 기록

## 계층 경계

- `apps/api`는 HTTP 전송 계층이자 composition root다.
- 라우트는 요청 파싱, 검증, 인증 확인, 응답 매핑까지만 담당한다.
- 비즈니스 규칙은 `packages/core`에 둔다.
- 외부 AI, 데이터베이스, 스토리지는 `packages/ai`, `packages/database`, `packages/storage`로 분리한다.
- API 계약은 완성 긴 글 생성이 아니라 재료, 씨앗, 힌트, 카드 저장을 중심으로 설계한다.

## MVP 리소스

### 인증

기존 Better Auth 기반 인증 API를 유지한다.

- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-out`
- `GET /session`

### 사용자

- `GET /me`
- `GET /users/profile`

### 홈

- `GET /home`

응답은 시작 행동 선택에 필요한 최소 정보만 포함한다.

- 오늘의 진입 카드 3개
- 최근 작업 1개
- 문체 정원 요약 1개

여정 진행률, 배지, 스트릭, 업그레이드 카드는 MVP 홈 응답에 포함하지 않는다.

### 장면

- `POST /scenes`
- `GET /scenes/{sceneId}`
- `DELETE /scenes/{sceneId}/photo`

`POST /scenes`는 사진 업로드 메타데이터와 저장 동의를 받아 Scene을 만든다. 실제 파일 업로드 방식은 스토리지 adapter 구현 단계에서 확정한다.

`DELETE /scenes/{sceneId}/photo`는 원본 사진 접근을 제거한다. 이미 사용자가 저장한 GardenCard는 Provenance 정책에 따라 유지할 수 있다.

### 표현 재료

- `GET /scenes/{sceneId}/materials`
- `POST /scenes/{sceneId}/materials/manual`

`GET /scenes/{sceneId}/materials`는 현재 준비된 MaterialNode를 반환한다. 1차 응답은 3~5개를 목표로 하고, 전체 레이어는 준비된 범위만 먼저 노출할 수 있다.

분석 실패 시 `POST /scenes/{sceneId}/materials/manual`로 사용자가 직접 재료를 입력할 수 있어야 한다.

### 재료 선택

- `POST /scenes/{sceneId}/material-selections`
- `DELETE /scenes/{sceneId}/material-selections/{selectionId}`
- `PATCH /scenes/{sceneId}/material-selections/order`

선택과 버림 신호를 모두 저장할 수 있다. 버림 신호는 개인화에 사용할 수 있으나 응답에서 과도하게 드러내지 않는다.

### 문장 씨앗

- `POST /sentence-seeds`
- `GET /scenes/{sceneId}/sentence-seeds`

선택 재료 3개 이상일 때 생성 가능하다. 응답 후보는 최대 3개다. 후보는 완성문이 아니라 수정 가능한 씨앗이다.

### 한 문장 에디터

- `POST /sentence-drafts`
- `PATCH /sentence-drafts/{draftId}`
- `POST /sentence-drafts/{draftId}/hints`

AI 힌트는 최대 3개만 반환한다. AI가 문장을 대신 고쳐 쓴 완성문을 기본 응답으로 제공하지 않는다.

### 문체 정원

- `POST /garden-cards`
- `GET /garden-cards`
- `GET /garden-cards/{cardId}`
- `DELETE /garden-cards/{cardId}`

모든 GardenCard는 Provenance를 가진다. 목록은 조용한 아카이브로 쓰기 위해 오늘 저장한 카드, 최근 문장 카드, 다시 써볼 카드 중심으로 반환한다.

## 제거되는 기존 공개 리소스

글숨 Labs MVP 기준에서 다음 기존 글필 리소스는 제거 또는 replaced 대상이다.

- `/journeys`
- `/sessions`
- `/prompts`
- `/writings`의 긴 글 중심 흐름
- `/writings/{writingId}/feedback`
- `/writings/{writingId}/compare`

기존 인증, 사용자, 헬스체크, OpenAPI 인프라는 유지한다.

## 응답 설계 원칙

- 리소스 식별자와 메타데이터를 분리한다.
- 날짜와 시간은 UTC 기준 ISO 8601 문자열로 반환한다.
- 목록 응답은 커서 기반 탐색을 우선한다.
- 오류 응답은 Problem Details 형식을 사용한다.
- 내부 use case는 예외보다 명시적 Result 기반 실패 값을 우선 사용한다.
- UI 전용 문구는 가능한 한 클라이언트에서 조합한다.

## AI 안전 계약

AI adapter는 다음을 하지 않는다.

- 인물 식별
- 민감 속성 추론
- 긴 글 전체 대필
- 사용자의 문장 자동 수정
- 저장 동의 없는 사진 장기 보관 전제 응답

AI adapter는 다음만 반환한다.

- 표현 재료
- 문장 씨앗
- 수정 힌트
- 실패 시 직접 입력으로 이어질 수 있는 오류 정보

## 관련 문서

- [[00-prd/v3]]
- [[03-architecture/domain-model]]
- [[04-engineering/api-conventions]]
- [[04-engineering/backend-package-boundaries]]
