# Migration 원칙

## 목적

이 문서는 schema와 데이터 migration의 안전한 변경 절차를 정의한다. 각 module과 auth infra는 최종 Drizzle schema를 소유하고, API의 append-only SQL만 application migration 계보와 실행을 소유한다. DB infra는 application table을 알지 않는 SQLite migration primitive와 current-schema test fixture만 제공한다.

## 원칙

- migration은 순서가 보존되는 append-only 변경 기록으로 관리한다.
- 적용된 migration의 ID와 정규화된 내용 checksum은 바꾸지 않는다. 실행기는 알 수 없는 ID, checksum 불일치와 순서가 잘못된 manifest를 거부한다.
- application과 schema가 공존해야 하는 기간에는 backward-compatible 변경을 우선한다.
- migration, seed, backup·restore, health 검증은 하나의 운영 판단 단위다.
- destructive migration과 이전 코드가 읽을 수 없는 변경은 자동 code rollback 대상으로 취급하지 않는다.
- API는 DB connection을 만든 직후 module·adapter를 조립하기 전에 migration을 한 번 실행한다. module factory는 migration을 실행하지 않는다.
- 알려진 schema만 명시적으로 적용하거나 채택한다. 출처를 판정할 수 없는 부분 schema는 추측해 고치지 않고 fail-closed한다.
- migration 전에 integrity, 기존 FK, 중복과 유효하지 않은 상태를 검사한다. 새 FK를 만드는 재구성은 transaction 종료 전 `foreign_key_check`로 orphan을 검출한다.
- FK 재구성이 필요한 migration은 한 transaction 안에서 FK 검사를 일시 중지하고 데이터 복사·검증·이력 기록을 함께 확정한다. 완료 전 `foreign_key_check`가 실패하면 전체 transaction을 되돌린다.
- 현재 migration 목록이나 실행 결과를 living guide에 복제하지 않는다.

## 호환성 경계

통합 실행기는 빈 DB, 변경 불가능한 baseline, 이전 단계의 module schema와 명시적으로 식별 가능한 legacy schema만 지원한다. 기존 schema를 채택할 때도 같은 최종 schema 검증과 migration 이력 기록을 거친다. legacy curriculum 이관에는 content module의 legacy 정규화 정책이 반드시 주입돼야 하며, 활성 여부와 무관하게 course·unit·lesson·step 전체 hierarchy와 학습자 참조를 보존한다. 현재 payload validator를 완화하지 않고 식별 가능한 legacy 표현만 migration 경계에서 정규화한다. 식별 가능한 legacy 자료실 schema도 module 소유 구조로 이관하되, 출처가 불명확한 부분 schema는 변환하지 않는다.

새 코드는 위 상태를 현재 schema로 올릴 수 있다. 현재 schema는 credential에서 제품 role을 제거하고 교차 module FK를 복원하므로 이전 전체 API image가 그대로 읽을 수 있다고 가정하지 않는다. 이 경계를 넘은 뒤 되돌리려면 코드 image 교체가 아니라 migration 전 검증 백업 복구가 필요하다.

## 실행 절차

1. 영향받는 데이터·consumer, 양방향 code/schema 호환성과 복구 가능성을 확인한다.
2. append-only SQL의 table 재구성, data copy, index, trigger와 FK 변화를 사람이 검토한다.
3. 격리된 fresh·baseline·지원 legacy fixture에서 migration, row 보존, 최종 schema와 application read/write를 검증한다.
4. production 전 검증된 backup과 `integrity_check`·`foreign_key_check` 결과를 확보한다.
5. 승인된 automation으로 API의 통합 migration entry와 기동 검증을 실행한다.
6. migration이나 사후 검증이 실패하면 service 기동을 중단하고 새 상태를 정상으로 기록하지 않는다. code rollback과 data recovery를 분리해 판단한다.

## 검증 기록

실제 migration 실행과 복구 훈련의 commit, 데이터 source, 환경, 명령, 무결성 결과와 소요 시간은 archive 보고서에 고정한다.
