# ADR-0019: 애플리케이션 통합 migration 계보

## 상태

대체됨 — 과거 계보 보존과 known-state adoption은 [ADR-0022](./ADR-0022-current-schema-era-baseline.md)의 현재 schema era와 단일 baseline 결정이 대체한다.

## 날짜

2026-07-23

## 맥락

모듈 전환 과정에서 최종 Drizzle schema는 auth infra와 여섯 module로 이동했지만 baseline SQL, migration 실행과 seed는 DB infra와 module factory에 분산돼 있었다. 이 구조에서는 API 한 번의 기동에서 여러 migration owner가 같은 SQLite 파일을 순서 의존적으로 바꾸고, DB infra가 content 정규화 정책과 application table을 알아야 했다. 이전 baseline의 cross-module FK와 일부 runtime SQL join도 새 module 경계를 물리적으로 다시 결합했다.

이미 배포됐을 수 있는 baseline을 squash하거나 과거 SQL을 새 최종 schema로 바꾸면 기존 DB의 적용 상태를 판정할 근거가 사라진다. 반대로 module별 migration 실행을 계속 두면 원자적인 사전 검사, 전체 계보 checksum과 기동 실패 지점이 분산된다. production DB에 실제로 어떤 schema 변형이 존재하는지는 이번 저장소 검증만으로 입증할 수 없으므로, 지원 상태는 source와 고정 fixture로 식별 가능한 범위로 제한해야 한다.

## 결정

- auth infra와 각 module은 자기 최종 Drizzle schema와 도메인별 migration 사전 조건을 소유한다.
- API의 단일 schema entry가 이 공개 schema를 tooling 용도로 조립하고, API의 Drizzle config와 migration directory가 하나의 SQLite 계보를 소유한다.
- 변경 불가능한 baseline은 첫 migration으로 보존하고 schema 소유권 전환은 다음 append-only migration으로 추가한다. migration ID와 LF로 정규화한 SQL의 SHA-256 checksum을 실행 전 검증한다.
- 과거 baseline 파일은 이동 과정에서 line ending이 정규화됐다. 따라서 raw byte 동일성은 주장하지 않으며, SQL 순서·내용의 보존은 과거 source와 현재 source를 같은 line ending으로 정규화한 checksum으로 검증한다.
- DB infra는 schema-neutral connection·transaction·migration runner·backup·destructive guard만 제공한다. runner는 manifest 순서와 checksum을 검사하고 schema 변경, 최종 검증과 이력 row를 같은 transaction으로 확정한다.
- API container는 module과 adapter를 만들기 전에 migration을 한 번 실행한다. module factory의 개별 migration 실행은 제거한다.
- 빈 DB에는 전체 계보를 적용한다. baseline, 이전 module migration 상태와 명시적으로 식별 가능한 legacy 상태는 검증 후 기존 단계를 채택한다. 출처를 판정할 수 없는 부분 schema와 알 수 없는 migration ID는 fail-closed한다.
- migration 전 integrity·FK·dangling reference·중복·유효하지 않은 상태를 검사한다. cross-module FK는 제거하고 module 내부 FK만 남기며, 제거된 관계는 별도 reconciliation query로 관측한다.
- seed 의미는 auth·content·identity owner에 남기고 API가 실행 순서를 명시한다. 기본 seed는 content aggregate와 identity·auth row를 누락된 경우에만 삽입하고 기존 application state를 갱신하지 않는다. 관리자 fixture의 부분 상태나 owner가 아닌 role은 자동 보정하지 않고 실패한다. password 변경과 전체 reset은 분리하며 reset에는 환경 승인, 명시적 force와 production 대상 fingerprint가 필요하다.
- 현재 schema의 backup은 migration 이력과 필수 table을 포함한 단일 SQLite 파일로 만들고 독립 read-only application query로 검증한다.

## 대안과 트레이드오프

### module factory별 migration 유지

- 장점: 각 schema 변경 코드가 module 가까이에 있고 기존 함수를 그대로 재사용할 수 있다.
- 단점: 실행 순서, transaction, 실패 관찰과 migration 이력이 여러 owner로 분산된다. module 하나의 기동이 다른 module의 물리 schema 상태에 의존해 장애 격리가 어려워진다.

### 기존 baseline을 최종 schema로 squash

- 장점: fresh DB용 SQL이 짧고 현재 schema만 보면 이해하기 쉽다.
- 단점: 이미 적용된 DB와 파일 checksum의 관계가 끊기며 upgrade와 rollback 판단을 신뢰할 수 없다. 실제 production 상태를 모두 증명하지 못한 상황에서는 비가역 위험이 가장 크다.

### DB infra가 모든 application schema와 migration 소유

- 장점: 실행 경로가 한 package에 모인다.
- 단점: infra가 module schema와 content 정책에 상향 의존하고 변경 영향 범위가 커진다. 재사용 가능한 SQLite primitive와 제품 migration의 책임도 섞인다.

### 선택한 API 통합 계보

- 장점: application 전체 변경 순서와 기동 실패 지점이 하나이며 module schema 소유권과 infra 독립성을 함께 유지한다. known-state adoption으로 기존 fixture를 append-only 계보에 편입할 수 있다.
- 단점: API composition이 schema export와 migration 사전 조건을 알아야 하고, 지원할 legacy 상태마다 명시적 판별과 회귀 fixture가 필요하다. cross-module FK 제거 뒤 관계 무결성은 DB만으로 완결되지 않아 application 검증과 reconciliation 운영 비용이 생긴다.

## 호환성과 롤백

새 API는 빈 DB, baseline, 이전 module schema와 고정된 legacy fixture를 현재 schema로 올린다. 이전 module migration 함수가 현재 schema에서 멱등적으로 동작하는 것은 검증하지만, 이전 API image 전체의 호환성은 보장하지 않는다. 현재 migration은 credential의 제품 role column을 제거하고 table을 재구성하므로 그 column을 기대하는 이전 image로 code-only rollback할 수 없다.

사전 검사나 migration transaction이 실패하면 API 기동을 중단하고 이력 row를 남기지 않는다. 적용 후 이전 image가 필요하거나 복구 검증이 실패하면 writer를 중지하고 migration 전 검증 백업을 새 경로로 복구한다. 역방향 임의 SQL이나 migration 이력 삭제는 지원하지 않는다.

## 영향

- 확장성: 새 module schema도 같은 application 계보에 순서대로 추가해야 한다. 독립 DB migration은 지원하지 않지만 현재 단일 SQLite 배포 경계와 일치한다.
- 유지보수성: 최종 schema는 module 가까이에 있고 실행·checksum·호환성 판단은 API에 모인다. 대신 schema 변경은 module과 API migration을 같은 변경 단위로 검토해야 한다.
- 보안과 안전성: 알 수 없는 상태, orphan, invalid value와 승인 없는 reset을 fail-closed한다. checksum은 의도하지 않은 SQL 변경을 탐지하지만 운영 DB 자체의 출처를 증명하지는 않는다.
- 성능: 기동 시 전체 사전 검사와 reconciliation용 set 구성이 추가된다. 이는 정상 request 경로 비용이 아니라 migration 시점의 안전 비용이며, 대형 production 데이터에서의 실행 시간은 측정되지 않았다.
- 장애 격리: migration이 완료되기 전 module을 만들지 않아 부분 기동을 막는다. 단일 SQLite 계보 실패는 API 전체 기동을 중단하므로 가용성보다 일관성을 우선한다.

## 검증

fresh DB와 baseline·이전 module·legacy fixture upgrade, schema snapshot·핵심 row count, checksum mismatch·transaction rollback, orphan·중복·invalid state, seed 보존, reset 승인과 current-schema backup·독립 application read를 자동화한다. 정적 검사는 schema tooling consumer, DB infra dependency, migration 위치·checksum과 cross-module SQL join 재유입을 거부한다.

이 검증은 저장소 source와 임시 SQLite fixture에 대한 사실이다. production DB migration, 실제 운영 백업 복구, 대용량 lock 시간과 이전 배포 image 실행은 수행하지 않았으므로 성공했다고 주장하지 않는다.
