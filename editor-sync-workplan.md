# Editor Sync 구현 작업 계획

> 생성일: 2026-03-23
> 아키텍처 문서: docs/04-engineering/editor-sync/editor-sync-architecture.md

## 진행 상태

| 단계 | 작업 | 상태 | 비고 |
|------|------|------|------|
| 0 | 아키텍처 문서 작성 | ✅ 완료 | editor-sync-architecture.md |
| 1 | packages/core — writings 도메인 모델 | ✅ 완료 | 타입, 포트, 에러, 스키마 |
| 2 | packages/core — writings 유스케이스 | ✅ 완료 | push, pull, versions |
| 3 | packages/database — 스키마 확장 | ✅ 완료 | writing_transactions, writing_versions, drafts.version |
| 4 | packages/database — 레포지토리 구현 | ✅ 완료 | WritingRepository, WritingTransactionRepository |
| 5 | apps/api — sync 라우트 | ✅ 완료 | push, pull, versions 엔드포인트 |
| 6 | apps/api — 부트스트랩 통합 | ✅ 완료 | DI 연결 |
| 7 | apps/web — Dexie 로컬 DB | ✅ 완료 | 스키마, CRUD |
| 8 | apps/web — change-capture | ✅ 완료 | Tiptap → Operation 변환 |
| 9 | apps/web — sync 상태 머신 (XState v5) | ✅ 완료 | setup().createMachine() 패턴 |
| 10 | apps/web — sync 트랜스포트 | ✅ 완료 | HTTP 통신 계층 |
| 11 | apps/web — 멀티 탭 코디네이터 | ✅ 완료 | BroadcastChannel + 리더 선출 |
| 12 | apps/web — sync 엔진 조합 | ✅ 완료 | 전체 조립 |
| 13 | apps/web — React 훅 | ✅ 완료 | useSyncEngine, useDocumentHydration |
| 14 | apps/web — 충돌 해결 / 리베이스 | ✅ 완료 | conflict-resolver (LWW) |
| 15 | apps/web — 서비스 워커 | ✅ 완료 | 백그라운드 동기화 |
| 16 | apps/web — 동기화 상태 UI | ✅ 완료 | SyncStatusIndicator |
| 17 | 통합 점검 | ✅ 완료 | 타입체크 통과 (기존 draft-content-schema 에러 6개 제외) |

## 의존성 그래프

```
단계 1 → 단계 2 → 단계 5
단계 1 → 단계 3 → 단계 4 → 단계 5 → 단계 6
단계 7 ─┐
단계 8 ─┤
단계 9 ─┼→ 단계 12 → 단계 13
단계 10 ┤
단계 11 ┘
단계 14 → 단계 12
단계 15 (독립)
단계 16 (단계 13 이후)
단계 17 (전체 완료)
```

## 변경 이력

- 2026-03-23: 작업 계획 초안 작성
- 2026-03-23: 전체 구현 완료, 타입체크 통과
