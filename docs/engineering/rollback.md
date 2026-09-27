# Rollback 기준

코드 복구와 데이터 복구를 별도로 판단한다. D1 migration 적용 후에는 이전 코드의 schema 호환성을 먼저 확인한다. 호환성을 확인하지 않고 코드를 되돌리면 읽기·쓰기가 실패할 수 있다. 이 경우 데이터 복구 계획을 먼저 확정한다.

로컬 상태 보존은 [데이터 백업·복구 기준](./database-backup-restore.md)을 따른다. 원격 Worker rollback과 D1 복구 절차는 아직 검증하지 않았다. 원격 재개 조건은 [배포 기준](./deployment.md)이 소유한다.
