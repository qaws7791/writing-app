# SQLite 백업·복구 검증

이 문서는 file-backed SQLite 운영 DB의 백업 생성과 복구 가능성 검증 절차를 정의한다. 단순 파일 복사가 아니라 SQLite snapshot을 만들고 별도 임시 경로에서 복구본을 열어 무결성과 애플리케이션 읽기를 확인한다.

## 운영 replica와 RPO 경계

[Litestream 설정](../../deploy/litestream/litestream.yaml)은 짧은 replica 동기화, 1분 경계의 checkpoint, 주기적 validation과 compaction 검증을 사용하고 오래된 snapshot·WAL을 최대 30일 경계에서 정리한다. 이 조합은 RPO 1분 이내를 목표로 한 공학적 설정이지만, 외부 저장소 지연·장애까지 포함한 실제 RPO를 보증하는 증거는 아니다. 운영에서는 replica lag, 마지막 성공 동기화와 point-in-time restore 결과를 함께 관측해야 한다.

Production과 staging은 [각 환경 inventory](../../infra/ansible/inventories/)가 별도 host, DB 경로, backup bucket·object path, public asset bucket, private marker bucket·prefix와 credential을 소유한다. public asset은 환경별 bucket 자체를 분리하므로 같은 bucket의 논리 prefix에만 의존하지 않는다. deploy preflight는 backup object path와 marker prefix가 선택한 환경을 포함하는지 검사한다.

## 백업 생성

저장소 루트에서 다음 명령을 실행한다.

```bash
bun run db:backup --source=data/api.sqlite --output="backups/api-2026-07-12.sqlite"
```

- `--source`를 생략하면 `DATABASE_URL` 또는 로컬 기본 DB를 사용한다.
- `--output`은 필수이며 원본과 다른 경로여야 한다.
- 기존 출력 파일은 덮어쓰지 않는다.
- application backup entry는 먼저 DB를 read-only 진단한다. 현재 baseline migration 이력과 무결성 검사를 통과한 DB만 허용하며, 빈 DB·알 수 없거나 변조된 이력·부분 schema는 snapshot 전에 차단한다.
- 진단된 실제 application table 전체를 필수 읽기 대상으로 검증한다. table 목록을 별도 권위 목록으로 복제하지 않는다.
- 운영 중 WAL에 남은 commit도 `bun:sqlite` snapshot 직렬화에 포함한다.
- 생성 중인 임시 snapshot은 `DELETE` journal mode로 정규화해 최종 백업 파일 하나만으로 독립적으로 열 수 있게 한다.
- 임시 `.partial` 파일을 검증하고 원본 연결을 닫은 뒤 같은 디렉터리의 hard link로 최종 이름을 원자적으로 공개한다. 최종 경로가 먼저 생기면 덮어쓰지 않고 실패한다.

성공 시 표준 출력에 다음 구조의 JSON을 남긴다.

```json
{
  "kind": "database-backup-verified",
  "sourcePath": "절대 원본 경로",
  "backupPath": "절대 백업 경로",
  "backupBytes": 1234,
  "verification": {
    "integrityCheck": "ok",
    "requiredTableReadSmoke": "ok",
    "schemaVersion": 1,
    "userVersion": 0
  }
}
```

이 결과와 실행 시각, 배포 버전, 운영자를 함께 보관한다. 명령이 실패하면 최종 출력 경로를 만들지 않으며 기존 파일도 바꾸지 않는다.

## 복구 훈련

백업 명령 자체가 공백이 포함된 별도 임시 디렉터리에 백업 파일을 복사하고 다음을 검사한다.

1. 원본 백업은 쓰기 연결로 열지 않고, 별도 임시 복구본의 권한만 `0600`으로 제한해 `create: false`인 read-write SQLite 연결로 독립적으로 연다.
2. 연결 직후 `PRAGMA query_only = ON`을 적용해 검증 SQL의 논리적 쓰기를 차단한다.
3. `PRAGMA integrity_check` 결과가 `ok`인지 확인한다.
4. 필수 애플리케이션 테이블이 존재하는지 확인한다.
5. 각 필수 테이블에 `COUNT(*)` 읽기 smoke test를 수행한다.
6. `schema_version`과 `user_version`을 결과에 기록한다.

최종 백업은 WAL sidecar에 의존하지 않는 단일 파일이다. generic 검증은 임시 복구본에서 무결성과 필수 table 읽기를 확인하고, API 통합 검증은 migration 이력 table과 현재 application table을 요구한 뒤 실제 content module query를 read-only connection에서 실행한다. 검증 전후 최종 백업의 바이트·권한이 바뀌지 않고 백업 옆에 WAL/SHM이 생기지 않는지 회귀 테스트로 확인한다.

백업 중 원본 DB와 원본 WAL은 바이트 단위로 바뀌지 않아야 한다. SHM은 SQLite connection 간 coordination을 위한 휘발성 파일이라 내용이 바뀔 수 있으므로 존재와 크기만 검사한다. 이는 snapshot이 원본을 mutation하지 않는다는 검증 범위를 과장하지 않기 위한 의도적인 구분이다.

운영 복구가 필요한 경우 [restore playbook](../../infra/ansible/playbooks/restore.yaml)을 다음 순서로 실행한다.

1. 선택한 inventory와 같은 환경 확인값, live container DB URL, timezone이 포함된 snapshot 시각과 이번 실행의 복구 승인을 extra vars로 전달한다. 이 값은 inventory에 상시 저장하지 않는다.
2. 현재 snapshot을 보존하고 API writer와 Litestream을 중지한 뒤 기존 SQLite·WAL·SHM을 복구 작업별 `current` 경로로 격리한다.
3. 지정 시각의 replica를 live 경로가 아닌 `candidate` 경로에 복원한다. Litestream full check가 실패하면 후보를 채택하지 않는다.
4. migration 전에 별도 read-only 진단으로 SQLite integrity와 foreign key violation을 검사한다. Litestream full check가 FK를 검사한다고 가정하지 않는다.
5. candidate에 현재 migration을 적용하고 application schema·필수 table 읽기를 검사한다.
6. backup directory만 mount한 전용 one-off service에서 candidate와 snapshot 시각을 지정해 삭제 marker dry-run, 일회성 승인 actual, actual 재실행을 순서대로 수행한다. 재실행의 추가 `markedDeletedUsers`와 `purgedUsers`가 모두 0이어야 한다.
7. marker 적용 후 application DB를 다시 검사하고 독립 SQLite snapshot으로 정규화한 뒤 최종 검증본만 live 경로에 설치한다.
8. API와 Litestream을 시작해 health를 기다리고, 시작·완료 시각, 소요 시간, 환경, image digest와 marker 세 결과를 복구 작업의 `result.json`에 남긴다.
9. 학습자 origin의 `/api/health`와 관리자 origin의 `/api/admin/health`, 로그인, 코스 조회, 학습 진행 저장, 관리자 코스·사용자 조회와 변경을 smoke test하고 그 결과를 같은 훈련 기록에 연결한다.

손상 파일, 필수 테이블 누락, 무결성 실패가 발생하면 복구 후보로 채택하지 않는다. 실패한 복구 때문에 현재 운영 파일을 덮어쓰지 않는다.

삭제 marker 재적용의 인자, 대상 확인과 승인 계약은 [복구 명령 source](../../apps/api/src/scripts/reapply-deletion-markers.ts)가 소유한다. marker object는 user ID와 요청 시각만 포함하고 public asset과 분리한 private bucket·prefix에 저장한다. 애플리케이션은 marker를 삭제하지 않으며, 외부 lifecycle이 backup 최대 30일보다 길다는 설정과 실행 증거가 없으면 복구 보호가 검증됐다고 판정하지 않는다.

`restore.yaml`은 SQLite/WAL/SHM 격리를 시작한 뒤 실패하면 `/var/backups/writing-app/restore-<UTC>/recovery.txt`에 실패 단계와 수동 복구 안내를 기록하고 operation lock을 유지한다. 이 상태에서는 자동 재시도나 다른 lifecycle playbook을 실행하지 말고, 격리 파일·R2 복구 결과·Compose runtime을 읽기 전용으로 점검한 뒤 incident 책임자가 복구 방식을 결정한다. lock은 격리 전 실패하거나 DB 무결성과 서비스 health까지 확인한 성공 복구에서만 해제한다.

## 정기 복구 훈련과 출시 gate

최소 월 1회 staging 전용 host의 빈 data 경로에서 staging replica를 지정 시각으로 복원한다. production inventory, DB, bucket, object path나 credential을 훈련 입력으로 재사용하지 않는다. 훈련은 위 playbook의 `result.json`, public smoke 결과, 운영자와 incident·후속 조치 링크를 보존하고 이전 훈련과 소요 시간·replica lag를 비교한다.

저장소의 fixture·정적 검증은 이 실제 외부 복원을 대체하지 않는다. 현재 변경에서는 외부 staging S3 replica 복원이나 Ubuntu host 훈련을 실행했다는 증거가 없으므로, 빈 staging 복원·API 기동·삭제 사용자 비부활은 아직 production 출시 gate다. 최초 성공 증거가 생기기 전에는 GG-1104의 실제 복구 수용 기준을 완료로 판정하지 않는다.

로컬 setup은 기존 DB를 발견하면 application backup entry로 검증된 snapshot을 `data/backups/setup/`에 만든다. 백업이 실패하면 migration과 seed를 시작하지 않는다. 신규 DB에는 백업할 source가 없으므로 명시적인 `source-missing` 결과로 생략한다. 로컬 DB를 쓰는 다른 process가 있으면 snapshot 또는 migration이 충돌할 수 있으므로 사용자는 해당 process를 먼저 종료해야 한다. setup은 설정된 API port 점유를 차단하지만 해당 port를 사용하지 않는 DB writer는 감지하지 못한다.

같은 checkout에서는 저장소 단위 `data/.setup.lock`이 두 번째 setup을 차단한다. 비정상 종료로 남은 lock은 자동 제거하지 않는다. 사용자는 `owner.json`의 PID가 실행 중이 아닌지 확인한 뒤에만 lock을 직접 제거한다. setup은 공개 migration 진입점을 실행한 뒤 read-only application 진단이 `current/ok`인지 확인한다. 알 수 없거나 변조된 migration 이력과 무결성 오류는 자동 보정하지 않고 중단한다.

## 자동 검증

`packages/infra/db/src/database-backup.test.ts`는 다음을 회귀 검증한다.

- 공백이 있는 file-backed 경로와 활성 WAL에서 snapshot 백업
- 백업 뒤 원본 변경과 무관한 단일 파일의 독립 read-only 열기
- 현재 migration 이력·필수 table 검증과 실제 application read
- 원본 DB·WAL 바이트 불변성, SHM 존재·크기와 최종 백업 불변성
- 백업 경로 옆 WAL/SHM sidecar 비생성
- 손상 파일 거부
- 기존 출력 파일과 publish 직전 경쟁 파일 비덮어쓰기
- 원본 연결 종료 실패 시 최종 출력 비생성
