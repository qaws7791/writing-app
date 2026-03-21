# core

비즈니스 로직의 중심입니다. 순수 함수와 immutable 데이터 구조로 구현됩니다.

## 구조

- `shared/`: 모든 모듈이 공유하는 타입, 유틸리티, 포트
  - `brand/`: 도메인 식별자 (UserId, DraftId 등)
  - `types/`: 공통 타입 (Result, DomainError 등)
  - `schema/`: zod 계약 스키마
  - `utilities/`: 순수 헬퍼 함수
  - `ports/`: 외부 의존성 인터페이스
  - `testing/`: 테스트 유틸리티

- `modules/`: 기능별 모듈
  - `drafts/`: 초안 관리
  - `prompts/`: 글감 관리
  - `home/`: 홈 페이지

각 모듈은 동일한 구조를 따릅니다:

- `contracts/`: 모듈의 공개 API
- `model/`: 도메인 엔티티 (plain objects, readonly)
- `operations/`: 순수 함수 (상태 전이, 검증)
- `use-cases/`: 포트 주입 use-cases
- `ports/`: 로컬 포트 (선택사항)
- `errors/`: 모듈 전용 에러
- `fixtures/`: 테스트 fixture

## 설계 원칙

- **Immutable Data**: 모든 데이터 구조는 readonly
- **Pure Functions**: 부수 효과 없는 로직
- **Discriminated Unions**: 에러를 boolean 대신 union으로
- **Ports and Adapters**: 외부 의존성은 포트로 분리
- **Tidy First**: 함수 5줄 이내, clear naming

## 사용 예

```ts
import {
  createDraftUseCase,
  getDraftUseCase,
  type CreateDraftInput,
} from "@workspace/core"

// dependency 주입
const createDraft = (input: CreateDraftInput) =>
  createDraftUseCase(
    userId,
    input,
    draftRepository,
    promptExists,
    () => createId(),
    () => new Date().toISOString()
  )
```
