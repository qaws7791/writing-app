---
title: 상태 관리 가이드
description: FSD 4-Layer 아키텍처 기반 apps/web의 상태 관리 원칙과 현재 구현 상태를 정리합니다.
---

## 상태

- 기준 시점: 2026-03-25
- 전역 클라이언트 상태 라이브러리(Zustand 등)는 도입되어 있지 않습니다.
- 글쓰기 초안 동기화 상태는 **XState 상태 머신**(`features/writing/sync/sync-machine.ts`)으로 관리합니다.
- 테마 상태는 `next-themes`(`foundation/ui/theme-provider.tsx`)가 전담합니다.
- 화면별 UI 상태는 `features/*/hooks/` 내 커스텀 훅의 로컬 상태로 관리합니다.

## 기본 원칙

- 상태는 가능한 한 가장 가까운 컴포넌트에 둡니다.
- 한 정보에는 하나의 소유자만 둡니다.
- 렌더링 중 계산할 수 있는 값은 상태로 저장하지 않습니다.
- Effect는 외부 시스템 동기화에만 씁니다. 렌더링용 데이터 가공이나 이벤트 처리는 Effect로 옮기지 않습니다.

## 상태 종류별 위치

| 상태 종류               | 위치                                                     |
| ----------------------- | -------------------------------------------------------- |
| 에디터 초안 동기화 상태 | `features/writing/sync/sync-machine.ts` (XState)         |
| 글쓰기 화면 UI 상태     | `features/writing/hooks/use-writing-page.ts` (로컬 상태) |
| 편집 이탈 가드 상태     | `features/writing/hooks/use-editor-leave-guard.ts`       |
| 동기화 엔진 상태        | `features/writing/hooks/use-sync-engine.ts`              |
| 테마 상태               | `foundation/ui/theme-provider.tsx` (next-themes)         |
| 인증/세션 상태          | 서버 컴포넌트 + 쿠키 (`features/auth/repositories/`)     |

## 글쓰기 동기화 상태 머신

`features/writing/sync/sync-machine.ts`는 XState `setup`으로 선언된 상태 머신입니다.

**주요 상태 흐름**

```
idle → capturing → syncing → idle (성공)
                          → conflict (충돌)
                          → error → retrying → idle
offline 상태에서는 capturing에 대기, NETWORK_ONLINE 이벤트로 재개
```

**이벤트 종류**

| 이벤트                   | 의미                    |
| ------------------------ | ----------------------- |
| `CHANGE_DETECTED`        | 에디터 콘텐츠 변경 감지 |
| `FLUSH`                  | 즉시 동기화 요청        |
| `SYNC_SUCCESS`           | 서버 동기화 성공        |
| `SYNC_CONFLICT`          | 서버 충돌 감지          |
| `SYNC_ERROR`             | 동기화 오류             |
| `CONFLICT_RESOLVED`      | 충돌 해결 완료          |
| `NETWORK_ONLINE/OFFLINE` | 네트워크 상태 변경      |
| `FORCE_PULL`             | 강제 서버 상태 반영     |

상태 머신 인스턴스는 `features/writing/hooks/use-sync-engine.ts`에서 생성·구독합니다.

## 로컬 IndexedDB 상태

- `features/writing/sync/local-db.ts`: 초안 변경 내역을 IndexedDB에 저장합니다.
- 오프라인 중 누적된 변경은 네트워크 복구 시 자동으로 서버에 전송합니다.
- 멀티탭 조율은 `features/writing/sync/multi-tab-coordinator.ts`가 담당합니다.

## 화면 UI 상태 (`use-writing-page.ts`)

`features/writing/hooks/use-writing-page.ts`는 글쓰기 화면의 모든 UI 상태를 하나로 오케스트레이션합니다.

- 제목 입력 상태, 모달 open/close 상태 (삭제·내보내기·버전 기록)
- 에디터 초안 스냅샷(`EditorDraftSnapshot`)
- 동기화 상태(`DraftSyncState`) 구독

이 훅은 `views/writing-page-view.tsx`에서 단 한 번 호출됩니다.

## 전역 스토어 도입 기준

다음 조건이 생겼을 때에만 전역 스토어(Zustand 등) 도입을 검토합니다:

- 서로 먼 클라이언트 서브트리 두 곳 이상이 같은 상태를 읽고 써야 할 때
- URL이나 서버 데이터로 표현하기 어려운 상태가 라우트 이동 후에도 유지돼야 할 때
- 실시간 연결 상태, 알림 큐처럼 앱 전체에 영향을 주는 클라이언트 상태가 생길 때

## 도입하지 말아야 하는 경우

- 단순 모달 open/close
- props로 한두 단계만 전달하면 되는 상태
- 서버에서 다시 조회하면 되는 데이터
- 선택 텍스트, hover, 현재 탭처럼 화면 수명이 짧은 상태

## 관련 문서

- [[README]]
- [[frontend-architecture-guide]]
- [[environment-variables]]
- [[editor-sync/]]
- [[03-architecture/data-flow]]

## 출처

- [Choosing the State Structure | React](https://react.dev/learn/choosing-the-state-structure)
- [Sharing State Between Components | React](https://react.dev/learn/sharing-state-between-components)
- [You Might Not Need an Effect | React](https://react.dev/learn/you-might-not-need-an-effect)
- [Server and Client Components | Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
