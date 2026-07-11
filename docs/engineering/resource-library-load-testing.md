# 자료실 동시성 부하 검증

## 문서 상태

- 상태: 구현 완료
- 기준일: 2026-07-12

이 문서는 file-backed SQLite와 다중 client에서 자료 문서 HTTP transaction의 지연, 재시도, snapshot fallback과 최종 수렴을 검증하는 예약 부하 suite의 기준을 정의한다. 일반 `bun run test`에는 포함하지 않고 배포 전이나 동기화·SQLite 정책 변경 시 명시적으로 실행한다.

## 실행 명령

```bash
bun run test:load:resource-library
bun run test:e2e:resource-library-load
```

부하 명령은 기본 3회 실행한다. 빠른 진단에는 `RESOURCE_LIBRARY_LOAD_RUNS=1`을 사용할 수 있고 artifact 경로는 `RESOURCE_LIBRARY_LOAD_ARTIFACT`로 바꿀 수 있다. 기본 artifact는 `artifacts/resource-library-load/latest.json`이며 저장소에는 커밋하지 않는다.

## workload

- 시스템 임시 디렉터리 아래에 전용 SQLite 파일을 만들고 WAL connection 2개를 연다.
- 같은 서버 snapshot에서 20개 논리 client가 독립 Yjs update를 만든 뒤 두 connection에 동시에 transaction을 보낸다.
- stale state version은 같은 transaction ID와 update를 유지한 채 client당 최대 25회만 재시도한다.
- 모든 승인 update를 각 client에 적용한 Yjs 전체 상태와 Markdown이 durable snapshot과 같은지 확인한다.
- update log의 첫 구간을 제거해 증분 누락 시 snapshot fallback을 확인한다.
- 별도 문서에서 `BEGIN IMMEDIATE` 잠금을 주입하고 25ms busy timeout으로 `SQLITE_BUSY`를 만든 뒤 잠금 해제 후 같은 transaction을 한 번 재시도한다.
- Playwright smoke는 Node runner가 격리된 browser context 2개를 만들고, 별도 Bun HTTP fixture process의 file-backed transaction과 pull 경계를 호출한다.

## artifact와 실패 threshold

각 실행은 다음 값을 JSON과 표준 출력에 남긴다.

- transaction end-to-end latency `p50`, `p95`, `p99`
- `SQLITE_BUSY` 횟수
- stale와 busy를 합친 retry 횟수
- snapshot fallback 횟수
- 승인 transaction과 최종 수렴 client 수

초기 단일 서버·로컬 SQLite 운영 목표는 다음과 같다.

| 항목              | 실패 threshold                                  |
| ----------------- | ----------------------------------------------- |
| client 수렴       | 20개 중 하나라도 durable Yjs/Markdown과 다름    |
| transaction 승인  | 20개 중 하나라도 미승인                         |
| p95               | 10,000ms 초과                                   |
| p99               | 15,000ms 초과                                   |
| 전체 retry        | 실행당 500회 초과                               |
| lock fault        | busy 1회와 잠금 해제 후 retry 1회가 아니면 실패 |
| snapshot fallback | 의도한 누락 구간에서 1회 발생하지 않으면 실패   |

이 값은 현재 전체 snapshot 투영 worker를 포함한 보수적 기준이다. 기준을 완화할 때는 artifact 세 건과 운영 지표를 함께 검토한다.

## 정리 보장

fixture는 `finally`에서 두 DB connection을 닫고 WAL checkpoint를 시도한 뒤 임시 디렉터리를 재귀 삭제한다. 삭제 대상은 정규화된 시스템 임시 디렉터리 내부인지 먼저 확인한다. Windows의 일시적인 file handle 해제 지연은 상한이 있는 재시도로 처리한다. Playwright는 성공과 실패 모두에서 browser context를 닫고 Bun fixture process의 shutdown endpoint를 호출한 뒤 process 종료를 기다린다. 종료가 10초를 넘으면 강제 종료하고 suite를 실패시킨다.
