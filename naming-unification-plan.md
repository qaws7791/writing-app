# 네이밍 통일 계획: draft / writing / write → writing

## 현황: 하나의 개념에 세 가지 이름

사용자가 작성하는 글(에세이)을 가리키는 핵심 엔티티가 코드베이스 전체에서 세 가지 다른 이름으로 불린다.

| 용어      | 사용 위치                         | 역할          |
| --------- | --------------------------------- | ------------- |
| `draft`   | DB 테이블, 프론트엔드 도메인/훅   | CRUD·상태     |
| `writing` | API 동기화 라우트, 버전 관리       | 동기화·버전   |
| `write`   | 프론트엔드 URL 라우트              | 페이지 경로   |

이 불일치는 다음 문제를 일으킨다:

- 같은 엔티티를 검색할 때 세 가지 키워드를 모두 확인해야 한다
- 새 기능을 추가할 때 어떤 이름을 써야 할지 매번 판단해야 한다
- API 라우트(`/writings/`, `/writings/`)가 분리되어 같은 엔티티를 다른 자원처럼 보이게 한다
- DDD 유비쿼터스 언어 원칙에 위배된다

## 결정: `writing`으로 통일

도메인 모델 문서(`docs/03-architecture/domain-model.md`)가 이미 **Writing**을 정식 엔티티로 정의한다.

> Writing — 사용자가 작성 중이거나 작성한 에세이의 현재 상태

`draft`는 Writing의 **상태**(`writing.status = 'draft'`)이지 엔티티 이름이 아니다.
`write`는 동사이지 명사가 아니다.

### 네이밍 규칙

| 범주         | Before                              | After                               |
| ------------ | ----------------------------------- | ----------------------------------- |
| 엔티티 타입  | `Draft`, `WritingDetail`              | `Writing`, `WritingDetail`          |
| 브랜드 타입  | `writingId`                           | `WritingId`                         |
| ID 변수      | `writingId`                           | `writingId`                         |
| 콘텐츠 타입  | `WritingContent`                      | `WritingContent`                    |
| API 라우트   | `/writings/{writingId}`                 | `/writings/{writingId}`             |
| 프론트 라우트 | `/writing/[id]`                       | `/writing/[id]`                     |
| 쿼리 키      | `draftQueryKeys`                    | `writingQueryKeys`                  |
| 훅 이름      | `useDraftDetailQuery`               | `useWritingDetailQuery`             |
| 리포지토리   | `DraftRepository`                   | `WritingRepository`                 |
| DB 스키마 변수 | `drafts`                           | `writings`                          |
| 파일 이름    | `writing-repository.ts`               | `writing-repository.ts`             |
| 디렉토리     | `domain/writing/`                     | `domain/writing/`                   |

### 예외: DB 테이블 이름

SQL 테이블 이름(`"drafts"`)은 마이그레이션 없이 변경할 수 없다.
Drizzle 스키마에서 TypeScript 변수명만 `writings`로 변경하고, SQL 테이블 이름은 별도 마이그레이션에서 처리한다.

```ts
// Before
export const drafts = pgTable("drafts", { ... })

// After (1단계: 코드만 변경)
export const writings = pgTable("drafts", { ... }) // SQL 이름은 마이그레이션에서 변경

// After (2단계: 마이그레이션 후)
export const writings = pgTable("writings", { ... })
```

## 변경 범위

### 1. packages/core

| 파일/디렉토리 | 변경 내용 |
| ------------- | --------- |
| `shared/brand/brand.ts` | `writingId` → `WritingId` |
| `shared/brand/index.ts` | re-export 갱신 |
| `shared/schema/` | `WritingContent` → `WritingContent` |
| `shared/utilities/writing-content-utilities.ts` | 파일명 → `writing-content-utilities.ts`, 함수명 갱신 |
| `modules/writings/` | `modules/writings/`에 병합 후 삭제 |
| `modules/writings/` | 기존 writing 타입 + 병합된 draft 타입 통합 |
| `index.ts` | re-export 경로 갱신 |

### 2. packages/database

| 파일 | 변경 내용 |
| ---- | --------- |
| `schema/drafts.ts` | 파일명 → `schema/writings.ts`, 변수명 `drafts` → `writings` |
| `schema/index.ts` | re-export 갱신 |
| `repository/draft.repository.ts` | `writing.repository.ts`와 병합 |
| `repository/draft.mappers.ts` | `writing.mappers.ts`로 변경 |
| `types/db.ts` | `DraftRow`, `DraftInsert` → `WritingRow`, `WritingInsert` |

### 3. apps/api

| 파일/디렉토리 | 변경 내용 |
| ------------- | --------- |
| `routes/writings/` | `routes/writings/`에 병합 |
| `routes/writings/` | 기존 sync 라우트 + 병합된 CRUD 라우트 |
| `writing-services.ts` | draft 관련 서비스를 writing으로 통합 |
| `application-services.ts` | DI 바인딩 갱신 |
| 모든 라우트 파일 | `writingId` 파라미터 → `writingId` |

### 4. packages/api-client

| 파일 | 변경 내용 |
| ---- | --------- |
| `schema.d.ts` | API 스키마 변경 후 `bun run api:generate`로 재생성 |

### 5. apps/web — domain

| 파일/디렉토리 | 변경 내용 |
| ------------- | --------- |
| `domain/writing/` | `domain/writing/`으로 이동 |
| `draft.types.ts` | `writing.types.ts`로 변경, 타입명 갱신 |
| `draft.service.ts` | `writing.service.ts`로 변경, 함수명 갱신 |
| `writing-sync.service.ts` | `writing-sync.service.ts`로 변경, 함수명 갱신 |

### 6. apps/web — features/writing

| 파일 | 변경 내용 |
| ---- | --------- |
| `hooks/writing-query-keys.ts` | → `writing-query-keys.ts` |
| `hooks/use-writing-*.ts` (6개) | → `use-writing-*.ts` |
| `hooks/use-editor-draft.ts` | → `use-editor-writing.ts` |
| `repositories/writing-repository.ts` | → `writing-repository.ts` |
| `sync/local-db.ts` | `writingId` 컬럼 → `writingId` |
| `sync/types.ts` | `writingId` 필드 → `writingId` |
| `sync/*.ts` (전체) | 변수명 `writingId` → `writingId` |
| `components/create-writing-card.tsx` | → `create-writing-card.tsx` |
| `components/writing-list-item.tsx` | → `writing-list-item.tsx` |
| `components/writing-list-section.tsx` | → `writing-list-section.tsx` |
| `index.ts` | re-export 갱신 |

### 7. apps/web — views & routes

| 파일 | 변경 내용 |
| ---- | --------- |
| `views/write-list-view.tsx` | → `writing-list-view.tsx` |
| `views/writing-editor-view.tsx` | 내부 `writingId` → `writingId` |
| `app/(protected)/writing/` | → `app/(protected)/writing/` |
| `app/(protected)/writing/[id]/page.tsx` | 라우트 경로 변경 |

### 8. docs/

| 문서 | 변경 내용 |
| ---- | --------- |
| `03-architecture/domain-model.md` | 이미 Writing 사용, 확인만 |
| `04-engineering/frontend-architecture-guide.md` | `draft/` → `writing/`, 파일명·타입명 갱신 |
| `04-engineering/state-management-guide.md` | `EditorDraftSnapshot` → `EditorWritingSnapshot` 등 |
| `03-architecture/data-flow.md` | "초안" 표현 확인, 코드 참조 갱신 |
| 기타 문서 | `draft` → `writing` 참조 갱신 |

## 실행 순서

1. **packages/core**: 브랜드 타입, 스키마, 모듈 통합 (최하위 의존성)
2. **packages/database**: 스키마 변수, 리포지토리, 매퍼
3. **apps/api**: 라우트 병합, 서비스 갱신
4. **packages/api-client**: OpenAPI 스키마 재생성
5. **apps/web — domain**: 도메인 타입·서비스 이동
6. **apps/web — features**: 훅·리포지토리·동기화·컴포넌트
7. **apps/web — views & routes**: 뷰·페이지·라우트 경로
8. **docs/**: 문서 전체 갱신
9. **검증**: 빌드, 타입체크, 린트 통과 확인
