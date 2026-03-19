---
title: 도메인 모델
description: 글쓰기 플랫폼의 핵심 엔티티와 관계, 책임 경계를 immutable 데이터 모델 기준으로 정의합니다.
---

## 모델링 원칙

- 플랫폼의 중심 엔티티는 글쓰기다.
- AI는 독립 저자가 아니라 글쓰기를 보조하는 기능으로 모델링한다.
- 공개 상태와 작성 상태를 같은 개념으로 섞지 않는다.
- 사용자의 기록은 가능한 한 버전 가능한 형태로 다룬다.
- 구현 기준에서 모델은 클래스 인스턴스보다 immutable plain object로 표현한다.
- 상태 전이는 모델 내부 메서드보다 순수 함수와 operation 계층에서 처리한다.
- 인프라 저장 모델과 제품 도메인 모델은 같은 이름을 써도 같은 타입으로 취급하지 않는다.

## 핵심 엔티티

### User

- 플랫폼을 사용하는 기본 주체
- 프로필, 선호 주제, 활동 지표를 가진다.
- 하나 이상의 인증 수단을 연결할 수 있다.
- 구현상 better-auth의 `user` 테이블과 대응한다.
- `email`, `emailVerified`, `image` 같은 필드는 인증 기본 정보이면서 동시에 최소 프로필 정보다.

### AuthAccount

- 이메일 로그인, Kakao 로그인 같은 인증 수단
- 한 `User`에 여러 `AuthAccount`가 연결될 수 있다.
- 인증 수단 자체와 사용자 프로필을 분리해 관리한다.
- 구현상 better-auth의 `account` 테이블과 대응한다.
- `providerId`, `accountId`는 외부 인증 공급자 식별자이며, `password`는 이메일 로그인 계정에서만 사용될 수 있다.

### Session

- 현재 로그인 상태를 나타내는 보안 컨텍스트
- 만료 시각, 최근 활동 시각, 기기 메타데이터를 가진다.
- `User`에 종속되지만 생명주기는 독립적이다.
- 구현상 better-auth의 `session` 테이블과 대응한다.
- 세션 토큰은 글쓰기 도메인 식별자가 아니라 인증 인프라 식별자다.

### Prompt

- 글쓰기 시작을 돕는 한 개의 글감
- 주제, 난이도, 태그, 보관 여부를 가진다.
- 직접 작성의 출발점일 뿐 본문을 대체하지 않는다.

### PromptSeries

- 여러 `Prompt`를 묶는 큐레이션 단위
- 난이도, 주제, 학습 의도에 따라 구성된다.

### Writing

- 사용자가 작성 중이거나 작성한 에세이의 현재 상태
- 제목, 본문, 상태, 가시성, 연결된 글감 참조를 가진다.
- 플랫폼의 핵심 애그리게이트다.

### WritingVersion

- 특정 시점의 글 상태 스냅샷
- 자동 저장, 수동 저장, 복원 같은 생성 이유를 기록한다.
- `Writing`의 이력을 보존한다.

### ReviewSuggestion

- AI 또는 규칙 기반 검토가 생성한 제안 단위
- 원문 위치, 제안 내용, 이유, 유형을 가진다.
- 저장 가능한 이력일 수도 있고 일회성 응답일 수도 있다.

### ShareLink

- 제한 공유를 위한 접근 단위
- 토큰, 만료 시각, 접근 정책을 가진다.
- `Writing`의 공개 전략 일부이지만 공개본과는 별도다.

### Publication

- 전체 공개된 글의 배포 상태
- 공개 시각, 공개 경로, 공개용 파생 메타데이터를 가진다.
- 초안 상태의 `Writing`과 분리해 관리한다.

### FileAsset

- 에디터 삽입 이미지, 내보내기 파일, 공개 파생 파일의 메타데이터
- 소유자, 저장 경로, MIME 타입, 공개 범위를 가진다.
- 사용자 파일 보관함 엔티티가 아니라 글 본문이나 내보내기 흐름에 종속된 자산으로 다룬다.
- 업로드 가능한 사용자 생성 자산은 현재 정적 이미지 파일만 허용하며, 최대 크기는 5MB다.
- GIF 같은 움직이는 이미지 형식은 허용하지 않는다.

### ActivityEvent

- 작성 시작, 저장, 공개, 로그인 같은 사용자 활동 기록
- 제품 분석과 회고의 기반이 된다.

## 관계 요약

- `User` 1:N `AuthAccount`
- `User` 1:N `Session`
- `User` 1:N `Writing`
- `PromptSeries` 1:N `Prompt`
- `Prompt` 0..N -> `Writing`
- `Writing` 1:N `WritingVersion`
- `Writing` 0..N `ReviewSuggestion`
- `Writing` 0..N `ShareLink`
- `Writing` 0..1 `Publication`
- `Writing` 0..N `FileAsset`
- `User` 0..N `ActivityEvent`

## 상태 모델

### Writing 상태

- `draft`: 작성 중인 비공개 초안
- `reviewing`: 검토 또는 공개 준비 중인 상태
- `published`: 공개본이 존재하는 상태
- `archived`: 사용자에게서 숨겨졌지만 기록은 유지되는 상태

### Visibility 상태

- `private`
- `shared`
- `public`

작성 상태와 가시성 상태는 별도 축으로 관리한다.

## 경계에 대한 메모

- better-auth의 `user`, `account`, `session`은 인증 서브도메인의 영속성 모델이다.
- 글쓰기 제품 문서에서는 이를 `User`, `AuthAccount`, `Session`으로 표현하되, 구현 스키마와의 대응 관계를 유지한다.
- `packages/backend-core`는 제품 도메인 모델을 정의하고, `packages/db`는 영속성 모델과 매핑을 담당한다.
- Hono request/response 타입은 도메인 모델에 직접 섞지 않는다.
- 학습 코스와 레슨은 제품 확장 엔티티이지만, 현재 핵심 쓰기 흐름과 분리된 서브도메인으로 둔다.
- 커뮤니티 피드백은 추후 추가 가능하나, 현재는 `ShareLink`와 `Publication` 이후의 별도 영역으로 본다.
- 통계용 집계 값은 원천 엔티티를 대체하지 않고 파생 데이터로 취급한다.

## 관련 다이어그램

- [[03-architecture/diagrams/domain-relationship]]
- [[03-architecture/diagrams/writing-runtime-flow]]
- [[04-engineering/backend-core-guide]]
