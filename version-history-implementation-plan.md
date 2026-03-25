# 글쓰기 버전 관리 — 현재 상태 조사 및 구현 계획

> 작성일: 2026-03-25
> 목적: 버전 기록 UI와 API 연결, 수동 버전 저장 및 복원 기능 완성

---

## 1. 현재 상태 조사

### 1.1 백엔드 (packages/core + packages/database + apps/api) — ✅ 100% 완료

| 항목 | 파일 | 상태 |
|------|------|------|
| 도메인 타입 | `packages/core/src/modules/writings/writing-types.ts` | ✅ `WritingVersionSummary`, `WritingVersionDetail`, `SyncPushInput.restoreFrom` |
| 포트 인터페이스 | `packages/core/src/modules/writings/writing-port.ts` | ✅ `WritingVersionRepository { create, list, getByVersion }` |
| Zod 스키마 | `packages/core/src/modules/writings/writing-schemas.ts` | ✅ `writingVersionSummarySchema`, `writingVersionDetailSchema`, `versionListResponseSchema` |
| 에러 | `packages/core/src/modules/writings/writing-error.ts` | ✅ 4종 에러 팩토리 |
| 연산 | `packages/core/src/modules/writings/writing-operations.ts` | ✅ `applyOperationsToContent`, `computeWritingMetrics` |
| Push UC | `packages/core/src/modules/writings/use-cases/push-transactions.ts` | ✅ 자동 스냅샷(10 버전마다), restoreFrom 지원 |
| Pull UC | `packages/core/src/modules/writings/use-cases/pull-document.ts` | ✅ |
| List Versions UC | `packages/core/src/modules/writings/use-cases/list-versions.ts` | ✅ |
| Get Version UC | `packages/core/src/modules/writings/use-cases/get-version.ts` | ✅ |
| DB 스키마 | `packages/database/src/schema/writing-versions.ts`, `writing-transactions.ts` | ✅ |
| DB Repository | `packages/database/src/repository/writing.repository.ts` | ✅ |
| API 라우트 | `apps/api/src/routes/writings/{push,pull,list,get}-*.ts` | ✅ 4개 엔드포인트 |
| API 서비스 | `apps/api/src/writing-services.ts` | ✅ `WritingApiService` |
| DI 부트스트랩 | `apps/api/src/runtime/bootstrap.ts` | ✅ |

### 1.2 프론트엔드 동기화 인프라 (apps/web) — ✅ 95% 완료

| 항목 | 파일 | 상태 |
|------|------|------|
| 타입 정의 | `apps/web/src/features/writing/sync/types.ts` | ✅ `VersionSummary`, `VersionDetail`, `Operation` |
| 로컬 DB (Dexie) | `apps/web/src/features/writing/sync/local-db.ts` | ✅ `documents`, `pending_transactions`, `versions` |
| 상태 머신 (XState v5) | `apps/web/src/features/writing/sync/sync-machine.ts` | ✅ |
| 동기화 엔진 | `apps/web/src/features/writing/sync/sync-engine.ts` | ✅ |
| HTTP 트랜스포트 | `apps/web/src/features/writing/sync/sync-transport.ts` | ✅ `push`, `pull`, `listVersions`, `getVersion` 메서드 |
| 멀티탭 | `apps/web/src/features/writing/sync/multi-tab-coordinator.ts` | ✅ |
| 충돌 해결 | `apps/web/src/features/writing/sync/conflict-resolver.ts` | ✅ LWW |
| React 훅 | `apps/web/src/features/writing/hooks/use-sync-engine.ts` | ✅ |
| 문서 하이드레이션 | `apps/web/src/features/writing/hooks/use-document-hydration.ts` | ✅ |

### 1.3 프론트엔드 버전 관리 UI — ⚠️ 미완성

| 항목 | 파일 | 상태 | 문제 |
|------|------|------|------|
| 버전 기록 모달 | `writing-version-history-modal.tsx` | ⚠️ **Mock 데이터** | API 미연결, mock `VersionItem[]` 하드코딩 |
| 글쓰기 페이지 훅 | `use-writing-page.ts` | ⚠️ | 버전 관련 상태/액션 없음, `versionHistoryModalOpen`만 존재 |
| 페이지 다이얼로그 | `writing-page-dialogs.tsx` | ⚠️ | 모달에 `getContent`만 전달, 버전 데이터 미전달 |
| 헤더 | `writing-page-header.tsx` | ❌ | 수동 버전 저장 버튼 없음 |
| 복원 기능 | 없음 | ❌ | 버전 복원 UI 미구현 |

### 1.4 테스트 — ❌ 없음

- `packages/core/src/modules/writings/` — 테스트 파일 0개
- `apps/api/src/routes/writings/` — 테스트 파일 0개
- `apps/web/src/features/writing/` — 테스트 파일 0개
- vitest 설정에 `passWithNoTests: true` 활성화

---

## 2. Gap 분석

### 2.1 반드시 필요한 작업

| # | 작업 | 위치 | 상세 |
|---|------|------|------|
| G1 | 버전 기록 모달 API 연결 | `writing-version-history-modal.tsx` | mock 데이터 제거 → `SyncTransport.listVersions()` / `getVersion()` 호출 |
| G2 | 버전 기록 훅 생성 | `hooks/use-version-history.ts` (신규) | 버전 목록 로딩, 특정 버전 상세 조회, 로딩/에러 상태 관리 |
| G3 | 모달에 복원 버튼 추가 | `writing-version-history-modal.tsx` | "이 버전으로 복원" 버튼 + 확인 다이얼로그 |
| G4 | 복원 로직 구현 | `use-writing-page.ts` 또는 `hooks/use-version-history.ts` | `push({ baseVersion, transactions: [{ops: [setTitle, setContent]}], restoreFrom })` |
| G5 | `WritingPageDialogs`에 데이터 연결 | `writing-page-dialogs.tsx` | `draftId` 전달, 훅 연결 |

### 2.2 개선 작업

| # | 작업 | 위치 | 상세 |
|---|------|------|------|
| I1 | 수동 버전 저장 | `writing-page-header.tsx` + push UC | reason: "manual" 스냅샷 생성 |
| I2 | 버전 기록 모달 UX | 모달 컴포넌트 | 로딩 스켈레톤, 에러 표시, 빈 상태 |

---

## 3. 구현 계획

### Phase 1: 버전 기록 훅 + 모달 API 연결

#### 3.1 `use-version-history.ts` 생성

```
apps/web/src/features/writing/hooks/use-version-history.ts
```

- 역할: 버전 목록 fetch, 특정 버전 상세 fetch, 복원 실행
- 의존: `SyncTransport` (listVersions, getVersion, push)
- 상태: `versions`, `selectedVersion`, `loading`, `error`, `restoring`
- 액션: `loadVersions()`, `selectVersion(version)`, `restoreVersion(version)`

#### 3.2 `writing-version-history-modal.tsx` 리팩토링

- mock 데이터 제거
- Props 변경: 외부에서 전달받는 데이터 기반으로 렌더링
  - `versions: VersionSummary[]`
  - `selectedVersionDetail: VersionDetail | null`
  - `onSelectVersion: (version: number) => void`
  - `onRestore: (version: number) => void`
  - `loading: boolean`
  - `restoring: boolean`
- 복원 확인 다이얼로그 추가
- 로딩/에러/빈 상태 표시

#### 3.3 `writing-page-dialogs.tsx` 연결

- `draftId` prop 추가
- `useVersionHistory` 훅 호출
- 모달에 실 데이터 전달

### Phase 2: 수동 버전 저장

#### 3.4 Push UC에 수동 스냅샷 지원

**현재 스냅샷 조건:**

```typescript
const shouldSnapshot =
  nextVersion % VERSION_SNAPSHOT_INTERVAL === 0 ||
  input.restoreFrom !== undefined
```

**변경 필요:** `SyncPushInput`에 `createSnapshot?: boolean` 또는 `reason?: "manual"` 추가

- `packages/core/src/modules/writings/writing-types.ts` — `SyncPushInput`에 `snapshotReason` 필드 추가
- `packages/core/src/modules/writings/use-cases/push-transactions.ts` — 수동 스냅샷 조건 추가
- `packages/core/src/modules/writings/writing-schemas.ts` — 스키마 업데이트

#### 3.5 프론트엔드 수동 저장 트리거

- `writing-page-header.tsx`에 "버전 저장" 메뉴 항목 추가
- `use-writing-page.ts`에 `handleSaveVersion()` 추가
- `SyncTransport.push()`에 수동 스냅샷 파라미터 전달

### Phase 3: 테스트 작성

| 파일 | 범위 |
|------|------|
| `packages/core/src/modules/writings/__tests__/writing-operations.test.ts` | `applyOperationsToContent`, `computeWritingMetrics`, `advanceWritingVersion` |
| `packages/core/src/modules/writings/__tests__/push-transactions.test.ts` | push UC 전체 (성공, 충돌, 스냅샷 생성, 수동 스냅샷, 복원)  |
| `packages/core/src/modules/writings/__tests__/list-versions.test.ts` | list UC |
| `packages/core/src/modules/writings/__tests__/get-version.test.ts` | get UC |
| `packages/core/src/modules/writings/__tests__/pull-document.test.ts` | pull UC |
| `apps/web/src/features/writing/hooks/__tests__/use-version-history.test.ts` | 프론트엔드 훅 |

---

## 4. 파일 변경 목록

### 신규 파일

| 파일 | 설명 |
|------|------|
| `apps/web/src/features/writing/hooks/use-version-history.ts` | 버전 기록 훅 |
| `packages/core/src/modules/writings/__tests__/writing-operations.test.ts` | 연산 단위 테스트 |
| `packages/core/src/modules/writings/__tests__/push-transactions.test.ts` | Push UC 테스트 |
| `packages/core/src/modules/writings/__tests__/list-versions.test.ts` | List UC 테스트 |
| `packages/core/src/modules/writings/__tests__/get-version.test.ts` | Get UC 테스트 |
| `packages/core/src/modules/writings/__tests__/pull-document.test.ts` | Pull UC 테스트 |
| `apps/web/src/features/writing/hooks/__tests__/use-version-history.test.ts` | 버전 기록 훅 테스트 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/core/src/modules/writings/writing-types.ts` | `SyncPushInput`에 `snapshotReason` 추가 |
| `packages/core/src/modules/writings/writing-schemas.ts` | 스키마에 `snapshotReason` 추가 |
| `packages/core/src/modules/writings/use-cases/push-transactions.ts` | 수동 스냅샷 조건 추가 |
| `apps/web/src/features/writing/sync/types.ts` | `SyncPushRequest`에 `snapshotReason` 추가 |
| `apps/web/src/features/writing/components/writing-version-history-modal.tsx` | mock 제거, API 연결, 복원 버튼, 로딩/에러 상태 |
| `apps/web/src/features/writing/components/writing-page-dialogs.tsx` | `draftId` prop, 훅 연결 |
| `apps/web/src/features/writing/components/writing-page-header.tsx` | "버전 저장" 메뉴 항목 |
| `apps/web/src/features/writing/hooks/use-writing-page.ts` | `handleSaveVersion` 추가, 복원 콜백 |
| `docs/02-design/features/version-history.md` | 기능 명세 추가 |
| `docs/04-engineering/editor-sync/workplan.md` | Phase 2 추가 |

---

## 5. 의존성 순서

```
Phase 1 (순차 실행):
  1. docs 업데이트
  2. core types 수정 (snapshotReason)
  3. core schemas 수정
  4. core push UC 수정
  5. web sync types 수정
  6. use-version-history 훅 생성
  7. writing-version-history-modal 리팩토링
  8. writing-page-dialogs 연결
  9. writing-page-header 수동 저장 추가
  10. use-writing-page 수동 저장 / 복원 연결

Phase 2 (테스트):
  11. core 단위 테스트 작성
  12. web 훅 테스트 작성

Phase 3 (검증):
  13. 포매팅 체크
  14. 린팅 체크
  15. 타입 체크
  16. 테스트 실행
```
