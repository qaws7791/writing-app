# ADR-0012: 단일 API 런타임으로 통합

## 상태

채택됨 — 저장소 구현 완료, 운영 검증(MTA-40) 대기

## 날짜

2026-07-17

## 맥락

이 ADR을 채택할 때에는 학습자 API와 관리자 API가 각각 `api:4000`, `admin-api:4001` runtime으로 나뉘어 같은 Ubuntu 호스트와 `/var/lib/writing-app/api.sqlite`, release workflow, migration·backup 절차를 공유했다. 별도 runtime과 Caddy upstream·network를 유지하는 비용은 source와 배포 설정에서 직접 확인됐다.

현재 저장소의 Compose·Caddy source configuration은 learner/admin public Host를 모두 `apps/api:4000`으로 전달하고 `apps/admin-api`를 rollback profile의 legacy runtime으로 제한한다. 이 source configuration이 실제 production에 배포되어 traffic을 처리했는지와 운영 관찰 결과는 저장소에 증거가 없다. MTA-40이 이를 별도 운영 절차로 검증하고, MTA-41은 그 조건이 충족된 뒤 legacy runtime 제거를 수행한다.

저장소에는 API별 production traffic, latency, 오류율, SQLite busy/lock, 독립 SLO 또는 독립 release cadence를 입증하는 측정 자료가 없다. 따라서 독립 확장이나 배포가 실제 요구라는 근거는 확인되지 않았다. 반대로 별도 image, health check, environment 변환, DB connection, 종료 수명주기와 rollback 경로를 두 벌 운영한다는 비용은 source와 배포 설정에서 직접 확인된다.

학습자 API는 진행 요청 drain과 close-once를 검증하지만 관리자 API는 즉시 `server.stop(true)` 후 runtime을 닫는다. 단순히 route를 합치면 관리자 SSE와 장기 요청을 끊거나 인증·origin 경계를 섞을 수 있다.

## 결정

- 최종 backend runtime은 `apps/api`가 소유하는 단일 Hono/Bun 프로세스로 통합한다.
- 학습자와 관리자 hostname, URL, cookie 이름, Better Auth secret·table, trusted origin, CORS, actor와 권한 정책은 서로 다른 sub-app과 configuration으로 유지한다.
- host dispatcher는 raw `Host`와 `Request.url` authority가 같은 allowlist 항목일 때만 learner/admin sub-app을 선택한다. Origin과 forwarded host는 dispatch 입력이 아니며, 알 수 없는 host는 fail-closed로 거부한다.
- 단일 composition root가 SQLite client, migration compatibility와 종료 lifecycle을 한 번만 소유한다. route와 middleware는 concrete DB adapter를 직접 import하지 않는다.
- 통합 lifecycle은 종료 중 신규 요청을 `503`으로 거부하고 learner 요청, 관리자 요청, SSE를 정해진 한도까지 drain한 뒤 server와 DB를 정확히 한 번 닫는다.
- `apps/admin-api`는 local/rollback/parity 비교 runtime으로만 유지한다. MTA-40의 운영 관찰과 승인된 rollback rehearsal 전에는 삭제하지 않으며, MTA-41이 그 뒤 제거를 수행한다.
- production 수치가 없다는 사실은 통합을 막는 SLO 근거로 사용하지 않는다. 같은 host·DB·release unit이라는 확인된 결합과 중복 운영 비용을 현재 규모의 결정 근거로 사용한다. 이는 운영 데이터가 아닌 architecture 판단이다.

## 고려한 대안

### 대안 1. 두 API runtime 유지

- 장점: 관리자 장애와 종료를 프로세스 수준에서 격리하고 현재 network 구성을 보존한다.
- 단점: 같은 SQLite와 배포 절차를 공유해 독립 확장·복구 이점이 제한되며 image, lifecycle, 설정과 DB owner가 계속 중복된다.

### 대안 2. 운영 지표가 쌓일 때까지 결정 보류

- 장점: traffic과 latency에 근거해 결정할 수 있다.
- 단점: 현재 관측이 구현되지 않았고 보류 기간 동안 모든 adapter·route 작업이 두 target을 함께 지원해야 한다. 독립 SLO 요구가 문서화되지 않은 현재 상황에서는 보류 자체가 더 큰 확정 비용을 만든다.

### 대안 3. 별도 DB를 가진 두 service로 분리

- 장점: 장애와 확장의 독립성이 가장 강하다.
- 단점: 현재 단일 서버·SQLite 제품에 분산 transaction, 복제와 운영 복잡성을 추가한다. 확인된 요구에 비해 과도하다.

## 결과

- 저장소 target 구성은 배포 image와 backend lifecycle, SQLite writer/close owner를 하나로 줄여 유지보수성과 장애 진단 경로를 단순화한다.
- 하나의 process 장애가 학습자와 관리자 API 모두에 영향을 주는 blast radius가 생긴다. host별 sub-app failure isolation, readiness, 구조화 로그와 승인된 조합 rollback으로 완화한다.
- network 이름을 합치는 것이 인증 경계를 합치는 것은 아니다. security fixture는 hostname, cookie, origin과 권한을 계속 별도로 검증한다.
- 단일 process는 SQLite connection과 lock 경쟁을 줄일 수 있지만 성능 개선 수치는 아직 추론이다. 전환 전후 지표를 관측해 재검토한다.

## 실행 Gate와 롤백

1. learner/admin HTTP·auth·security characterization fixture가 통과해야 한다.
2. 단일 dispatcher와 lifecycle에서 route 등록 parity, host isolation, body limit, SSE drain과 DB close-once를 검증해야 한다.
3. 기존 `admin-api`와 새 runtime에 같은 관리자 fixture를 실행해 status, body, header와 side effect가 같아야 한다.
4. Compose·Caddy source configuration은 learner/admin Host를 모두 `apps/api:4000`으로 보내고 legacy image·rollback profile을 관찰 기간 동안 보존해야 한다. 실제 적용과 host별 smoke는 승인된 운영 절차에서 수행한다.
5. 오류율, p95 latency, SQLite busy와 종료 실패가 기존 기준보다 악화되면 Caddy만 되돌리지 않는다. 관리자 SSR 내부 base URL, Caddy route, legacy rollback profile과 SQLite writer 상태를 함께 조정하는 승인된 rollback 절차를 실행한다.
6. 독립 SLO, 독립 release 승인 또는 network 격리가 실제 요구로 확정되면 후속 ADR로 이 결정을 대체한다.

## 구현 상태

MTA-38~40 및 MTA-59~64의 저장소 작업으로 단일 `apps/api` runtime, 여섯 관리자 capability route, route parity fixture와 Compose·Caddy source configuration은 구현됐다. 그러나 실제 production 배포, public Host별 traffic 전환, 관찰 결과와 rollback rehearsal는 저장소에 기록되지 않았다. MTA-40이 그 운영 증거를 남기고, MTA-41은 그 뒤에만 legacy runtime 제거를 판단한다.
