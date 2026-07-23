# ADR-0021: 단일 SQLite 무결성과 런타임 소유권 단순화

## 상태

채택됨

## 날짜

2026-07-24

## 맥락

API는 한 process와 한 SQLite writer로 배포되지만 module 경계를 이유로 교차 module FK를 제거했다. 그 결과 잘못된 reference는 쓰기 시점이 아니라 전체 row를 읽는 reconciliation에서 발견됐고, application SQL과 module별 TypeScript migration이 같은 최종 schema를 중복 생성했다. 구독자가 없는 domain event 배관과 server/container의 중복 cleanup도 현재 동작 없이 변경 비용을 만들었다.

운영 DB와 보존 backup의 실제 inventory는 이번 저장소 작업으로 검증하지 못했다. 따라서 legacy 입력 경로의 제거 가능성은 추론하지 않고 기존 호환 경로를 유지한다.

## 결정

- `apps/api/drizzle`의 append-only SQL과 `runApplicationMigrations`를 유일한 migration 이력 권위자로 둔다. module별 migration 구현과 공개 `./migration` entrypoint는 제거한다.
- 기존 `0000`, `0001`은 수정하지 않고 `0002-cross-module-reference-integrity`에서 교차 module FK를 복원한다.
- 학습자·관리자 profile은 credential 삭제에 `CASCADE`를 사용한다. 학습 진행, AI attempt, resource actor와 operations actor는 기록 보존을 위해 `RESTRICT`를 사용한다. learning aggregate 내부 종속 row는 기존 `CASCADE`를 유지한다.
- schema package 간 의존은 공개 `./schema`에 한해 허용한다. 이는 table 쓰기 소유권을 넘기는 것이 아니라 동일 DB의 참조 무결성을 Drizzle과 SQL에 함께 선언하기 위한 tooling/runtime 의존이다.
- current schema 진단은 `integrity_check`, `foreign_key_check`, migration history를 사용한다. 별도 dangling-reference 전체 스캔과 `db:reconcile` 명령은 제거한다.
- production subscriber가 없는 event bus, event contract와 command 발행 배관은 제거한다. 첫 실제 consumer가 생기면 전달 보장, 재시도와 순서 요구를 먼저 정한 뒤 다시 도입한다.
- server lifecycle은 요청 차단·drain·취소·server stop만 소유한다. AI·DB·logger 정리는 역순·멱등 cleanup을 제공하는 `container.dispose()` 하나가 소유한다.

## 트레이드오프

- 쓰기 시점 실패와 DB 보장이 생기고 reconciliation 코드와 migration 중복이 사라져 안전성과 유지보수성이 개선된다.
- module schema 사이 compile-time 의존이 늘어난다. 독립 DB 분리가 확정되면 이 FK와 의존을 제거하고 outbox/API 기반 무결성으로 전환해야 한다.
- `0002`는 여러 table을 재구성하므로 migration lock 시간과 backup 복구 검증이 중요하다. 저장소의 임시 SQLite fixture는 통과했지만 production 데이터 크기와 실행 시간은 검증된 사실이 아니다.
- forced shutdown deadline은 container disposal 전체에 적용된다. deadline이 먼저 끝나면 lifecycle은 timeout을 기록하고 종료하지만 이미 시작된 cleanup promise를 취소하지는 못한다.

## 호환성과 검증

fresh, baseline, 식별 가능한 legacy fixture에서 row 보존, checksum, `foreign_key_check`, application read/write를 검증한다. FK 위반과 중복 draft는 migration 이력 기록 전에 fail-closed한다. 운영 DB와 backup inventory가 확인되기 전에는 legacy MFA·curriculum·resource 변환과 schema adoption 경로를 삭제하지 않는다.

이 결정은 ADR-0019의 module migration 사전 조건·교차 module FK 제거 결정과 ADR-0020의 domain event 협력·교차 module FK 금지 결정을 대체한다. 두 문서의 나머지 역사적 맥락은 유지한다.
