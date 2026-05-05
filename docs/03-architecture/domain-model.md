---
title: 도메인 모델
description: 글숨 Labs의 사진, 표현 재료, 문장 씨앗, 문체 정원 중심 도메인 모델을 정의합니다.
---

상태: active
기준 PRD: [[00-prd/v3]]

## 모델링 원칙

- 플랫폼의 중심 도메인은 첫 문장 루프다.
- 핵심 흐름은 `Scene → MaterialNode → MaterialSelection → SentenceSeed → SentenceDraft → GardenCard`로 표현한다.
- AI는 완성문 작성자가 아니라 재료 생성, 씨앗 생성, 수정 힌트 제공자로 제한한다.
- 모든 저장 자산은 `Provenance`를 가진다.
- 사진 저장과 삭제, 민감 추론 금지, 인물 식별 금지는 도메인 규칙으로 취급한다.
- 구현 기준에서 모델은 클래스 인스턴스보다 immutable plain object로 표현한다.
- 상태 전이는 모델 내부 메서드보다 순수 함수와 use case 계층에서 처리한다.
- better-auth의 사용자, 계정, 세션 스키마는 인증 서브도메인으로 유지한다.

## 핵심 엔티티

### User

플랫폼을 사용하는 기본 주체다. Better Auth의 `user` 테이블과 대응한다.

역할:

- Scene을 생성한다.
- MaterialSelection을 남긴다.
- SentenceDraft와 GardenCard를 소유한다.
- 사진 저장 동의와 데이터 삭제 요청의 주체다.

### AuthAccount

외부 인증 수단이다. Better Auth의 `account` 테이블과 대응한다.

제품 도메인과 직접 섞지 않고 인증 경계에 둔다.

### Session

로그인 상태를 나타내는 보안 컨텍스트다. Better Auth의 `session` 테이블과 대응한다.

글숨 Labs의 `Scene`과 이름이 겹치지 않도록 제품 도메인에서는 장면을 `Scene`으로, 인증 세션은 `AuthSession` 또는 인프라 session으로 구분한다.

### Scene

사용자가 올린 사진 한 장과 분석 상태를 나타낸다.

주요 필드:

- `sceneId`
- `userId`
- `photoObjectKey`
- `photoRetentionStatus`
- `analysisStatus`
- `activeLayer`
- `createdAt`

상태:

- `idle`
- `uploading`
- `analyzing`
- `ready`
- `failed`
- `photo_deleted`

### MaterialNode

사진에서 추출되거나 사용자가 직접 입력한 표현 재료다.

유형:

- `visible_object`
- `sense`
- `mood`
- `movement`
- `question`
- `sentence_seed`

규칙:

- 사진 업로드 후 3초 안에 1차 MaterialNode 3~5개를 제공한다.
- 전체 레이어 데이터는 10초 안에 준비되는 것을 목표로 한다.
- 인물 식별과 민감 속성 추론 결과를 MaterialNode로 저장하지 않는다.

### MaterialSelection

사용자가 선택하거나 버린 재료 신호다.

주요 필드:

- `selectionId`
- `sceneId`
- `materialNodeId`
- `userId`
- `action`: `selected` 또는 `dismissed`
- `order`
- `createdAt`

규칙:

- 재료 3개 이상 선택 시 SentenceSeed 생성이 가능하다.
- 버린 재료는 개인화 신호로 저장할 수 있지만 사용자에게 과도하게 드러내지 않는다.

### SentenceSeed

선택 재료를 문장 작성 직전의 작은 구조로 바꾼 후보값이다.

규칙:

- 사용자가 선택한 재료를 반드시 포함한다.
- 후보는 최대 3개만 제공한다.
- 완성문이 아니라 수정 가능한 씨앗으로 표시한다.

### SentenceDraft

사용자가 직접 작성 중인 한 문장이다.

주요 필드:

- `draftId`
- `sceneId`
- `userId`
- `seedId`
- `body`
- `authorship`: `user_written` 또는 `ai_example_based`
- `status`: `draft` 또는 `saved`
- `createdAt`
- `updatedAt`

규칙:

- 저장 가능한 핵심 단위는 긴 글이 아니라 한 문장이다.
- AI 힌트는 문장을 직접 고쳐 쓰지 않고 사용자가 수정할 수 있는 방향을 제안한다.

### GardenCard

문체 정원에 저장되는 표현 자산이다.

유형:

- `word`
- `sense`
- `question`
- `sentence_seed`
- `sentence`
- `scene`
- `rhythm`

규칙:

- 모든 GardenCard는 Provenance를 가진다.
- 사용자는 카드를 삭제할 수 있다.
- 카드는 한 문장 에디터에서 다시 불러올 수 있다.

### Provenance

표현 카드의 출처 정보다.

출처 유형:

- `photo`
- `manual_input`
- `sentence`
- `game`
- `rhythm`

주요 필드:

- `sourceType`
- `sourceId`
- `sceneId`
- `materialNodeIds`
- `seedId`
- `createdBy`: `user` 또는 `ai_assisted`

## 관계 요약

- `User` 1:N `Scene`
- `Scene` 1:N `MaterialNode`
- `User` 1:N `MaterialSelection`
- `Scene` 1:N `MaterialSelection`
- `MaterialSelection` N:1 `MaterialNode`
- `Scene` 1:N `SentenceSeed`
- `SentenceSeed` N:M `MaterialNode`
- `SentenceSeed` 0..N `SentenceDraft`
- `User` 1:N `SentenceDraft`
- `User` 1:N `GardenCard`
- `GardenCard` 1:1 `Provenance`

## 주요 상태 흐름

```text
idle
→ uploading
→ analyzing
→ ready
→ collecting
→ seed_ready
→ drafting
→ saved
```

| 상태       | 도메인 의미                                   |
| ---------- | --------------------------------------------- |
| idle       | Scene 생성 전 또는 사진 선택 전               |
| uploading  | 사진 업로드 중                                |
| analyzing  | MaterialNode 생성 중                          |
| ready      | 1차 MaterialNode 표시 가능                    |
| collecting | MaterialSelection이 1개 이상 있음             |
| seed_ready | 선택 재료 3개 이상으로 SentenceSeed 생성 가능 |
| drafting   | SentenceDraft 작성 중                         |
| saved      | GardenCard 생성 완료                          |

## 보안과 개인정보 규칙

- 인물 식별을 하지 않는다.
- 민감 속성을 추론하지 않는다.
- 사진 저장 동의를 명시적으로 관리한다.
- 사용자가 사진 삭제를 요청하면 원본 사진 접근을 제거한다.
- 사진 삭제 후에도 사용자가 동의한 GardenCard와 Provenance는 보존할 수 있으나, 원본 사진 재식별이 가능하면 안 된다.

## 관련 문서

- [[00-prd/v3]]
- [[03-architecture/api-overview]]
- [[02-design/information-architecture]]
- [[04-engineering/backend-core-guide]]
