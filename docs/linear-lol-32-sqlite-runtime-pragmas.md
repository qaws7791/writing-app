# Linear LOL-32 SQLite 런타임 PRAGMA 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-32 SQLite 동시성 처리 누락`
- 조사 범위: `packages/db/src/client.ts`, DB client 테스트
- 목표: SQLite 연결 생성 시 쓰기 동시성에 필요한 WAL, busy timeout, synchronous 설정이 적용되는지 확인하고 기본값으로 고정한다.

## 판단

이슈는 타당하다.

- 기존 `createKwepDatabase`는 `PRAGMA foreign_keys = ON`만 실행했다.
- 파일 기반 SQLite DB의 기본 `journal_mode`는 `delete`였고, busy timeout과 synchronous 정책도 애플리케이션 기본값으로 명시되어 있지 않았다.
- Hono API, 세션, 진행률 저장처럼 쓰기가 겹칠 수 있는 경로에서는 WAL과 busy timeout을 기본 연결 정책으로 두는 편이 안전하다.

## 2026-06-15 완료

- DB client 생성 시 다음 PRAGMA를 순서대로 적용한다.
  - `foreign_keys = ON`
  - `journal_mode = WAL`
  - `busy_timeout = 5000`
  - `synchronous = NORMAL`
- 파일 기반 SQLite URL 테스트에서 `journal_mode`, `busy_timeout`, `synchronous` 값을 검증하도록 추가했다.

## 검증

- `bun --filter @workspace/db test src/client.test.ts`
- `bun --filter @workspace/db typecheck`
