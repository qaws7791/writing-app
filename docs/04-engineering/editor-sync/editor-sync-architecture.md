# Editor Sync Architecture — Local-First 전략

> 에디터는 사용자 상호작용에만 집중하고, 데이터 영속성과 서버 동기화는 독립된 계층이 책임진다.

## 1. 설계 원칙

| 원칙                              | 의미                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| **Local-First**                   | 모든 편집은 IndexedDB에 즉시 기록되며, 네트워크 없이도 에디터가 매끄럽게 작동한다.          |
| **Editor-Agnostic Sync**          | 에디터(Tiptap)는 동기화를 알지 못한다. 에디터 → 로컬 저장 → 서버 전송의 단방향 흐름만 존재. |
| **Transaction-Based Delta**       | Notion처럼 변경 전체가 아닌 트랜잭션(delta) 단위로 서버에 전송하여 네트워크 최적화.         |
| **State Machine Driven**          | XState v5 상태 머신이 동기화 생명주기를 결정적으로 관리한다.                                |
| **Offline-Resilient**             | 네트워크 단절 시 로컬에 트랜잭션을 축적하고, 복구 시 자동 재전송.                           |
| **Multi-Tab / Multi-Device Safe** | BroadcastChannel로 탭 간, 서버 버전으로 디바이스 간 일관성을 보장.                          |

## 2. 계층 구조

```
┌─────────────────────────────────────────────────────────┐
│                   Editor Layer (Tiptap)                  │
│  역할: 순수 편집 UI, JSON 구조 입출력                     │
│  의존: 없음 (onUpdate 콜백만 외부에 노출)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ onUpdate(transaction)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Change Capture Layer                        │
│  역할: Tiptap 트랜잭션에서 delta(변경분)를 추출           │
│  구현: extractDelta(oldDoc, newDoc) → Operation[]        │
│  핵심: ProseMirror Step을 직렬화 가능한 Operation으로 변환│
└──────────────────────┬──────────────────────────────────┘
                       │ Operation[]
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Local Persistence Layer (Dexie/IndexedDB)    │
│  역할:                                                   │
│    1. 현재 문서 스냅샷 저장 (즉시 반영)                   │
│    2. 미전송 트랜잭션 큐 관리 (outbox 패턴)               │
│    3. 버전 기록 저장                                      │
│  테이블: documents, pending_transactions, versions       │
└──────────────────────┬──────────────────────────────────┘
                       │ pendingTx 신호
                       ▼
┌─────────────────────────────────────────────────────────┐
│          Sync State Machine (XState v5)                 │
│  역할: 동기화 생명주기를 결정적으로 관리                    │
│  상태: idle → syncing → success/error → idle            │
│  입력: 로컬 변경 감지, 네트워크 상태, 서버 응답            │
│  출력: flush 명령, 재시도, 충돌 해결                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP request
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Sync Transport Layer                         │
│  역할: 서버와 HTTP 통신, 재시도 로직                      │
│  패턴: POST /sync/transactions (배치 전송)               │
│  응답: 서버 확인 버전 + 리베이스 필요 여부                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│        Multi-Tab Coordination (BroadcastChannel)        │
│  역할: 탭 간 문서 상태 동기화                             │
│  패턴: 리더 선출 → 리더만 서버 동기화 수행                 │
│  나머지 탭: 로컬 DB 변경을 구독하여 에디터 갱신            │
└─────────────────────────────────────────────────────────┘
```

## 3. 데이터 모델

### 3.1 로컬 데이터베이스 (Dexie)

```typescript
// documents 테이블: 현재 문서 스냅샷
interface LocalDocument {
  writingId: number // PK
  title: string
  content: WritingContent // Tiptap JSON
  baseVersion: number // 서버에서 마지막으로 확인된 버전
  localVersion: number // 로컬 편집 카운터
  lastModifiedAt: string // ISO timestamp
  syncStatus: "synced" | "pending" | "conflict"
}

// pending_transactions 테이블: 미전송 변경분 큐 (outbox)
interface PendingTransaction {
  id: string // auto-increment or UUID
  writingId: number
  baseVersion: number // 이 트랜잭션이 기반한 서버 버전
  operations: Operation[] // 직렬화된 변경 연산
  createdAt: string
  status: "pending" | "sending" | "failed"
}

// versions 테이블: 로컬 버전 기록 스냅샷
interface LocalVersion {
  id: string
  writingId: number
  version: number
  title: string
  content: WritingContent
  createdAt: string
  source: "auto" | "server" | "restore"
}
```

### 3.2 서버 데이터베이스 (확장)

기존 `writings` 테이블에 `version` 컬럼을 추가하고, `writing_transactions` 테이블을 신설:

```sql
-- writings 테이블 확장
ALTER TABLE writings ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- 트랜잭션 기록 (이벤트 소싱)
CREATE TABLE writing_transactions (
  id          SERIAL PRIMARY KEY,
  writing_id  INTEGER NOT NULL REFERENCES writings(id) ON DELETE CASCADE,
  user_id     TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,  -- 이 트랜잭션 적용 후 버전
  operations  JSONB   NOT NULL,  -- Operation[]
  created_at  TIMESTAMPTZ NOT NULL,
  UNIQUE(writing_id, version)
);

-- 버전 스냅샷 (특정 시점 복원용)
CREATE TABLE writing_versions (
  id          SERIAL PRIMARY KEY,
  writing_id  INTEGER NOT NULL REFERENCES writings(id) ON DELETE CASCADE,
  user_id     TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  title       TEXT    NOT NULL,
  content     JSONB   NOT NULL,  -- WritingContent
  created_at  TIMESTAMPTZ NOT NULL,
  reason      TEXT    NOT NULL DEFAULT 'auto'  -- 'auto' | 'manual' | 'restore'
);
```

### 3.3 Operation (Delta) 형식

ProseMirror 트랜잭션의 Step을 기반으로 직렬화 가능한 형식:

```typescript
type Operation =
  | { type: "replace"; from: number; to: number; content: TiptapNode[] }
  | {
      type: "replaceAround"
      from: number
      to: number
      gapFrom: number
      gapTo: number
      content: TiptapNode[]
    }
  | { type: "addMark"; from: number; to: number; mark: TiptapMark }
  | { type: "removeMark"; from: number; to: number; mark: TiptapMark }
  | { type: "setTitle"; title: string }
```

## 4. 동기화 플로우

### 4.1 편집 → 로컬 저장 → 서버 전송

```
[사용자 입력]
     │
     ▼
[Tiptap onUpdate] ──→ WritingContent(JSON) 추출
     │
     ├──→ [Dexie] documents 테이블 즉시 갱신 (UI 즉시 반영)
     │
     └──→ [Change Capture] delta 추출 → PendingTransaction 생성
              │
              └──→ [Dexie] pending_transactions에 enqueue
                        │
                        └──→ [XState] CHANGE_DETECTED 이벤트 발행
                                  │
                                  ▼
                           [상태 머신 판단]
                           ├─ idle → syncing: 즉시 flush
                           ├─ syncing: 현재 전송 완료 후 재flush
                           └─ error: 재시도 대기 중 큐잉
```

### 4.2 Flush (서버 전송)

```
[XState: syncing 진입]
     │
     ▼
[pending_transactions에서 배치 추출]
     │   status: 'pending' → 'sending'
     ▼
[POST /writings/{id}/sync/push]
  Body: {
    baseVersion: number,
    transactions: { operations: Operation[], createdAt: string }[]
  }
     │
     ├─ 200 OK ──→ { serverVersion, accepted: true }
     │              ├─ pending_transactions 삭제
     │              ├─ documents.baseVersion 갱신
     │              └─ XState → SYNC_SUCCESS
     │
     ├─ 409 Conflict ──→ { serverVersion, serverContent }
     │                    ├─ 리베이스: 서버 상태 기반으로 로컬 보류 트랜잭션 재적용
     │                    ├─ documents 갱신
     │                    └─ XState → CONFLICT_RESOLVED → 재flush
     │
     └─ 네트워크 오류 ──→ XState → SYNC_ERROR
                          ├─ 지수 백오프 재시도 (1s, 2s, 4s, ... 최대 30s)
                          └─ 최대 재시도 후 SYNC_FAILED
```

### 4.3 콜드 스타트 / 하이드레이션

```
[/writing/[id] 페이지 진입]
     │
     ├─ 1. Dexie에서 로컬 문서 조회
     │      ├─ 있음 → 로컬 데이터로 에디터 즉시 렌더링
     │      └─ 없음 → 로딩 스피너 표시
     │
     ├─ 2. 서버에서 최신 문서 fetch
     │      GET /writings/{id}/sync/pull
     │      Response: { version, title, content, lastSavedAt }
     │
     └─ 3. 합류(merge)
            ├─ 로컬 없음: 서버 데이터를 Dexie에 저장 → 에디터 렌더링
            ├─ 로컬 있음 + 보류 트랜잭션 없음: 서버가 최신이면 덮어쓰기
            └─ 로컬 있음 + 보류 트랜잭션 있음: 서버 상태 위에 보류분 리베이스
```

### 4.4 멀티 탭 동기화

```
[BroadcastChannel: 'writing-sync']

탭 A (리더):
  - 서버 동기화를 수행하는 유일한 탭
  - 동기화 완료 시 BroadcastChannel로 { type: 'SYNC_COMPLETE', writingId, version } 전파
  - 리더는 탭 가시성/timestamp 기반 선출

탭 B, C (팔로워):
  - 로컬 편집 → Dexie에 저장 + pending_transactions 생성
  - BroadcastChannel로 { type: 'LOCAL_CHANGE', writingId } 리더에게 알림
  - SYNC_COMPLETE 수신 시 → Dexie에서 최신 문서 읽기 → 에디터 갱신

리더 교체:
  - 리더 탭 종료 시 나머지 탭이 새 리더 선출
  - 미전송 pending_transactions는 새 리더가 자동 이어받음
```

### 4.5 멀티 디바이스 동기화

- 폴링 기반: 에디터 포커스 시 또는 주기적(30초)으로 서버 버전 확인
- `GET /writings/{id}/sync/pull?since={localVersion}` 로 서버 변경분 확인
- 서버가 더 높은 버전이면 서버 상태를 로컬에 동기화

## 5. XState v5 상태 머신 설계

```
┌──────────────────────────────────────────────────────┐
│                  SyncMachine                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│   ┌───────┐    CHANGE_DETECTED     ┌─────────┐      │
│   │       │ ────────────────────→  │         │      │
│   │ idle  │                        │ debounce│      │
│   │       │ ←──── FLUSH_COMPLETE   │ (300ms) │      │
│   └───────┘                        └────┬────┘      │
│       ▲                                 │            │
│       │                            TIMER_DONE        │
│       │                                 ▼            │
│       │                          ┌───────────┐       │
│       │                          │           │       │
│       │              ┌───────── │  syncing   │       │
│       │              │           │           │       │
│       │              │           └─────┬─────┘       │
│       │              │                 │             │
│       │         SYNC_ERROR        SYNC_SUCCESS       │
│       │              │                 │             │
│       │              ▼                 │             │
│       │        ┌───────────┐           │             │
│       │        │           │           │             │
│       │        │  retrying │           │             │
│       │        │ (backoff) │           │             │
│       │        └─────┬─────┘           │             │
│       │              │                 │             │
│       │         RETRY_TIMER            │             │
│       │              │                 │             │
│       │              ▼                 │             │
│       │        ┌───────────┐           │             │
│       │        │  syncing   │──────────┘             │
│       │        └───────────┘                         │
│       │                                              │
│       │    CONFLICT_DETECTED                         │
│       │              │                               │
│       │              ▼                               │
│       │     ┌──────────────┐                         │
│       │     │  resolving   │                         │
│       │     │  (rebase)    │                         │
│       │     └──────┬───────┘                         │
│       │            │ CONFLICT_RESOLVED               │
│       │            ▼                                 │
│       └───── (syncing으로 재진입)                      │
│                                                      │
│   병렬 상태:                                          │
│   ┌──────────────────────────┐                       │
│   │  networkMonitor          │                       │
│   │  online ←→ offline       │                       │
│   └──────────────────────────┘                       │
│   ┌──────────────────────────┐                       │
│   │  periodicPull            │                       │
│   │  waiting → pulling → ... │                       │
│   └──────────────────────────┘                       │
└──────────────────────────────────────────────────────┘
```

### Context (상태 데이터)

```typescript
type SyncContext = {
  writingId: number
  baseVersion: number // 서버에서 확인된 마지막 버전
  retryCount: number // 현재 재시도 횟수
  maxRetries: number // 최대 재시도 (기본 5)
  lastSyncedAt: string | null // 마지막 성공 동기화 시점
  pendingCount: number // 미전송 트랜잭션 수
  error: string | null // 마지막 오류 메시지
  isOnline: boolean // 네트워크 상태
}
```

## 6. 서비스 워커 백그라운드 동기화

```typescript
// 서비스 워커에서 Background Sync API 활용
// 탭이 비활성이거나 닫힌 후에도 미전송 트랜잭션을 전송

self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "writing-sync") {
    event.waitUntil(flushPendingTransactions())
  }
})

// 미전송 트랜잭션이 있을 때 sync 등록
navigator.serviceWorker.ready.then((reg) => {
  reg.sync.register("writing-sync")
})
```

서비스 워커 역할:

1. **Background Sync**: 탭 비활성/종료 시에도 미전송분 전송
2. **Periodic Sync**: 주기적으로 서버 상태 확인 (Periodic Background Sync API)
3. **Offline Queue**: 오프라인 중 전송 요청을 가로채어 큐잉

## 7. 버전 기록 관리

### 자동 스냅샷 정책

| 조건                | 동작                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| 서버 동기화 성공 시 | 매 N번째 동기화(기본 10)마다 또는 마지막 스냅샷 후 5분 경과 시 스냅샷 저장 |
| 사용자 비활동 감지  | 5분 이상 편집 없으면 현재 상태 스냅샷                                      |
| 페이지 이탈 시      | beforeunload에서 로컬 스냅샷 저장                                          |

### 버전 복원 플로우

```
[버전 기록 목록 조회]
  GET /writings/{id}/versions
  Response: { versions: [{ version, title, createdAt, reason }] }
     │
     ▼
[특정 버전 선택]
  GET /writings/{id}/versions/{version}
  Response: { version, title, content }
     │
     ▼
[복원 실행]
  POST /writings/{id}/sync/push
  Body: {
    baseVersion: currentVersion,
    transactions: [{ operations: [{ type: 'replace', ... 전체 교체 }] }],
    restoreFrom: selectedVersion
  }
     │
     ▼
[로컬 상태 갱신]
  - Dexie documents 갱신
  - pending_transactions 초기화
  - 에디터에 새 content 반영
```

## 8. 충돌 해결 (단일 사용자 리베이스)

단일 사용자 환경에서 충돌은 멀티 탭/멀티 디바이스 시나리오에서 발생:

```
디바이스 A: baseVersion 5 → 편집 → push(v5 기반 트랜잭션)
디바이스 B: baseVersion 5 → 편집 → push(v5 기반 트랜잭션) ← 이미 v6이 존재, 409 Conflict

리베이스 전략:
1. 서버에서 v5→v6 변경분(서버 트랜잭션) 수신
2. 로컬 보류 트랜잭션의 position을 서버 변경분만큼 조정
3. 조정된 트랜잭션을 v6 기반으로 재전송

단순화 규칙 (단일 사용자):
- 같은 영역 수정 시: 로컬(최신 편집)을 우선 채택 (Last-Writer-Wins)
- 다른 영역 수정 시: 양쪽 모두 적용 (리베이스)
```

## 9. API 엔드포인트

| Method | Path                                | 설명                       |
| ------ | ----------------------------------- | -------------------------- |
| `POST` | `/writings/{id}/sync/push`          | 트랜잭션 배치 전송         |
| `GET`  | `/writings/{id}/sync/pull`          | 최신 문서 상태 + 버전 확인 |
| `GET`  | `/writings/{id}/versions`           | 버전 기록 목록             |
| `GET`  | `/writings/{id}/versions/{version}` | 특정 버전 스냅샷           |

### Push 요청/응답

```typescript
// Request
type SyncPushRequest = {
  baseVersion: number
  transactions: {
    operations: Operation[]
    createdAt: string
  }[]
  restoreFrom?: number // 버전 복원 시
}

// Response (성공)
type SyncPushResponse = {
  accepted: true
  serverVersion: number
}

// Response (충돌)
type SyncPushConflictResponse = {
  accepted: false
  serverVersion: number
  serverContent: WritingContent
  serverTitle: string
}
```

### Pull 요청/응답

```typescript
// GET /writings/{id}/sync/pull?since=5
type SyncPullResponse = {
  version: number
  title: string
  content: WritingContent
  lastSavedAt: string
  hasNewerVersion: boolean
}
```

## 10. 프론트엔드 모듈 구조

```
apps/web/
  lib/
    sync/
      sync-machine.ts          # XState v5 상태 머신 정의
      sync-engine.ts           # 동기화 엔진 (머신 + 트랜스포트 조합)
      sync-transport.ts        # HTTP 통신 계층
      change-capture.ts        # Tiptap 트랜잭션 → Operation 변환
      conflict-resolver.ts     # 충돌 감지 및 리베이스
      multi-tab-coordinator.ts # BroadcastChannel 리더 선출
      local-db.ts              # Dexie 스키마 및 CRUD
      types.ts                 # 동기화 관련 타입 정의
  hooks/
    use-sync-engine.ts         # React 훅: 동기화 엔진 바인딩
    use-document-hydration.ts  # React 훅: 콜드 스타트 하이드레이션
  components/
    sync-status-indicator.tsx  # 동기화 상태 표시 UI
  public/
    sw.js                      # 서비스 워커
```

## 11. 백엔드 모듈 구조

```
packages/core/
  src/modules/writings/
    writing-types.ts           # Writing, WritingVersion 도메인 타입
    writing-port.ts            # WritingRepository, WritingTransactionRepository 포트
    writing-operations.ts      # applyOperations, rebaseTransactions 순수 함수
    writing-error.ts           # 도메인 에러 정의
    contracts/
      sync-push-schema.ts     # Push API Zod 스키마
      sync-pull-schema.ts     # Pull API Zod 스키마
      version-schema.ts       # 버전 관련 스키마
    use-cases/
      push-transactions.ts    # 트랜잭션 적용 유스케이스
      pull-document.ts        # 문서 상태 조회 유스케이스
      list-versions.ts        # 버전 기록 조회
      get-version.ts          # 특정 버전 조회

packages/database/
  src/
    schema/
      writing-transactions.ts # writing_transactions 테이블 정의
      writing-versions.ts     # writing_versions 테이블 정의
    repository/
      writing.repository.ts   # WritingRepository 구현
      writing-transaction.repository.ts

apps/api/
  src/routes/writings/
    push-transactions.ts      # POST /writings/{id}/sync/push
    pull-document.ts          # GET /writings/{id}/sync/pull
    list-versions.ts          # GET /writings/{id}/versions
    get-version.ts            # GET /writings/{id}/versions/{version}
```

## 12. 에디터 업데이트 흐름 (매끄러운 UX)

에디터는 외부 상태 변경(서버 동기화, 다른 탭) 시에도 커서 위치와 선택 영역을 보존:

```typescript
function applyRemoteUpdate(editor: Editor, newContent: WritingContent) {
  // 1. 현재 커서/선택 위치 기억
  const { from, to } = editor.state.selection

  // 2. ProseMirror 트랜잭션으로 변경 적용 (undo stack에 포함되지 않도록)
  editor.commands.setContent(newContent, false, {
    preserveWhitespace: "full",
  })

  // 3. 커서 위치 복원 (문서 범위 초과 방지)
  const maxPos = editor.state.doc.content.size
  const safeFrom = Math.min(from, maxPos)
  const safeTo = Math.min(to, maxPos)
  editor.commands.setTextSelection({ from: safeFrom, to: safeTo })
}
```

## 13. 성능 고려사항

| 항목           | 전략                                                                |
| -------------- | ------------------------------------------------------------------- |
| 디바운스       | 편집 후 300ms 디바운스 후 트랜잭션 생성 (키 입력마다 생성하지 않음) |
| 배치 전송      | 여러 트랜잭션을 하나의 Push 요청으로 묶어 전송                      |
| IndexedDB 쓰기 | 디바운스된 스냅샷만 저장 (매 키 입력이 아닌 변경 묶음 단위)         |
| 메모리         | 로컬 버전 기록은 최대 50개 유지, 오래된 것은 서버에만 보관          |
| Delta 크기     | Operation이 전체 문서 크기의 50% 이상이면 전체 스냅샷으로 대체      |

## 14. 보안 고려사항

- 모든 sync API는 인증 필수 (`requireUserId` 미들웨어)
- `writingId → userId` 소유권 검증 (기존 패턴 유지)
- IndexedDB는 같은 origin에서만 접근 가능 (브라우저 샌드박스)
- 서비스 워커 전송도 쿠키 기반 인증 사용
