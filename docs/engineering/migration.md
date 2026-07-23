# Migration 원칙

## 목적

이 문서는 schema와 데이터 migration의 안전한 변경 절차를 정의한다. 각 module과 auth infra는 최종 Drizzle schema를 소유하고, API의 현재 baseline과 이후 append-only SQL이 application migration 계보를 소유한다. DB infra는 application table을 알지 않는 SQLite migration primitive와 current-schema test fixture만 제공한다.

## 현재 계보

- 신규 DB는 현재 baseline 하나로 생성한다. 삭제된 과거 migration을 재생하지 않는다.
- 현재 schema era는 migration 이력의 baseline ID와 checksum으로 선언한다.
- 런타임은 빈 DB와 현재 schema era의 연속된 migration prefix만 지원한다. 이전 계보, 알 수 없는 ID, checksum 불일치와 순서가 잘못된 이력은 추측해 채택하지 않고 기동을 중단한다.
- API는 DB connection을 만든 직후 module·adapter를 조립하기 전에 migration을 한 번 실행한다. module factory는 migration을 실행하지 않는다.
- 적용된 migration SQL과 checksum은 바꾸지 않는다. 다음 변경은 새 migration으로만 추가한다.
- migration, seed, backup·restore와 health 검증은 하나의 운영 판단 단위다.

현재 baseline 파일, manifest와 실행 함수는 `apps/api/drizzle`, `apps/api/src/db/migrate.ts`가 소유한다. living 문서에는 현재 ID·checksum 목록을 복제하지 않는다.

## Schema era 전환

현재 era 이전 DB는 application runtime이 업그레이드하지 않는다. 일회성 전환 도구만 다음 조건을 모두 확인한 뒤 기존 migration 이력을 현재 baseline 선언으로 바꾼다.

1. 최종 이전 migration 계보의 ID와 checksum이 정확히 일치한다.
2. `integrity_check`와 `foreign_key_check`가 통과한다.
3. 현재 DB의 검증된 독립 백업을 새 경로에 만든다.
4. writer가 중지되고 operation lock이 유지된 상태에서 이력 교체를 한 transaction으로 확정한다.

이 작업은 table이나 제품 데이터를 변환하지 않는다. 부분 schema, 중간 migration 상태와 변조된 이력은 지원하지 않는다. 현재 명령과 image entrypoint는 API manifest, 전환 script와 Compose source가 소유한다.

운영·스테이징 DB와 보존 backup의 전환 증적이 아직 이 저장소 작업에서 확인되지 않았으므로 일회성 도구는 남겨 둔다. 모든 대상의 baseline ID, SQLite 검사와 복원 가능한 백업이 archive 보고서로 확인되면 일회성 script·image binary·Compose service를 같은 후속 변경에서 제거한다.

## 이후 변경 절차

1. 영향받는 데이터·consumer, 양방향 code/schema 호환성과 복구 가능성을 확인한다.
2. append-only SQL의 table 재구성, data copy, index, trigger와 FK 변화를 사람이 검토한다.
3. 격리된 fresh DB와 현재 계보의 직전 fixture에서 migration, row 보존, 최종 schema와 application read/write를 검증한다.
4. production 전 검증된 backup과 `integrity_check`·`foreign_key_check` 결과를 확보한다.
5. 승인된 automation으로 API migration entry와 기동 검증을 실행한다.
6. migration이나 사후 검증이 실패하면 service 기동을 중단한다. code rollback과 data recovery를 분리해 판단한다.

## 검증 기록

실제 전환, migration 실행과 복구 훈련의 commit, 데이터 source, 환경, 명령, 무결성 결과와 소요 시간은 archive 보고서에 고정한다. 저장소 fixture 통과는 운영 DB 전환 성공의 증거가 아니다.
