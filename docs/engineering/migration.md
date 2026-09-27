# Migration 원칙

API의 [SQL migration](../../apps/api/migrations/)이 D1 schema 변경 순서를 소유한다. 각 module과 auth infra의 Drizzle 선언은 최종 schema를 설명한다. 보고용 view와 FTS 선언은 직접 조회하지 않는 경우에도 schema 계약으로 유지한다.

1. schema 변경은 다음 번호의 SQL 파일로 추가한다.
2. SQL의 외래 키, trigger, index와 기존 row 보존을 검토한다.
3. 로컬 migration은 `bun --filter @workspace/api db:migrate`로 적용한다.
4. 실제 D1 에뮬레이터에서 읽기·쓰기와 실패 시 rollback을 검증한다.

Worker 요청은 migration을 실행하지 않는다. 테스트는 [migration fixture](../../packages/infra/db/src/test-support/application-migration.ts)를 통해 같은 SQL을 적용한다. 운영 데이터가 없는 전환을 전제로 새 baseline을 만들었다. 기존 SQLite 파일을 자동으로 이관하지 않는다.

여러 테이블을 함께 바꾸는 작업은 D1 SQL batch를 사용한다. [batch 구현](../../packages/infra/db/src/batch.ts)은 조건 검사 실패 시 같은 batch의 변경을 취소한다. 읽은 값에 의존하는 쓰기는 version 또는 상태 조건으로 경합을 검사한다.

원격 migration은 보류 상태다. 로컬 검증 결과는 운영 복구 검증을 대신하지 않는다.
