# SQLite 백업·복구 검증

이 문서는 file-backed SQLite 운영 DB의 백업 생성과 복구 가능성 검증 절차를 정의한다. 단순 파일 복사가 아니라 SQLite snapshot을 만들고 별도 임시 경로에서 복구본을 열어 무결성과 애플리케이션 읽기를 확인한다.

## 백업 생성

저장소 루트에서 다음 명령을 실행한다.

```bash
bun run db:backup --source=data/api.sqlite --output="backups/api-2026-07-12.sqlite"
```

- `--source`를 생략하면 `DATABASE_URL` 또는 로컬 기본 DB를 사용한다.
- `--output`은 필수이며 원본과 다른 경로여야 한다.
- 기존 출력 파일은 덮어쓰지 않는다.
- 운영 중 WAL에 남은 commit도 `bun:sqlite` snapshot 직렬화에 포함한다.
- 임시 `.partial` 파일을 검증한 뒤 같은 디렉터리에서 최종 이름으로 원자적으로 바꾼다.

성공 시 표준 출력에 다음 구조의 JSON을 남긴다.

```json
{
  "kind": "database-backup-verified",
  "sourcePath": "절대 원본 경로",
  "backupPath": "절대 백업 경로",
  "backupBytes": 1234,
  "verification": {
    "integrityCheck": "ok",
    "applicationReadSmoke": "ok",
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

직렬화된 WAL 모드 snapshot은 SQLite가 읽기 과정에서 `-wal`과 `-shm` sidecar를 초기화해야 할 수 있다. 따라서 임시 복구본에만 파일 쓰기 권한을 허용한다. sidecar는 임시 디렉터리 안에서만 생성되며 연결을 닫은 뒤 임시 디렉터리와 함께 제거한다. 검증 전후 읽기 전용 원본 백업의 바이트·권한과 원본 옆 sidecar 부재를 회귀 테스트로 확인한다.

운영 복구가 필요한 경우에는 다음 순서를 따른다.

1. 학습자 API와 어드민 API의 신규 요청 수락을 중단하고 진행 중 요청이 끝난 뒤 프로세스를 종료한다.
2. 장애 난 현재 DB 파일과 관련 WAL/SHM 파일을 별도 격리 경로에 보존한다.
3. 검증된 백업을 새 복구 경로에 복사한다. 기존 운영 파일을 제자리에서 덮어쓰지 않는다.
4. 복구 경로를 대상으로 백업 명령을 다시 실행해 독립 열기와 무결성 검증이 통과하는지 확인한다.
5. `DATABASE_URL`을 검증된 복구 파일로 전환하고 API를 시작한다.
6. 로그인, 코스 조회, 학습 진행 저장, 관리자 조회, 자료실 읽기·쓰기를 smoke test한다.

손상 파일, 필수 테이블 누락, 무결성 실패가 발생하면 복구 후보로 채택하지 않는다. 실패한 복구 때문에 현재 운영 파일을 덮어쓰지 않는다.

`restore.yaml`은 SQLite/WAL/SHM 격리를 시작한 뒤 실패하면 `/var/backups/writing-app/restore-<UTC>/recovery.txt`에 실패 단계와 수동 복구 안내를 기록하고 operation lock을 유지한다. 이 상태에서는 자동 재시도나 다른 lifecycle playbook을 실행하지 말고, 격리 파일·R2 복구 결과·Compose runtime을 읽기 전용으로 점검한 뒤 incident 책임자가 복구 방식을 결정한다. lock은 격리 전 실패하거나 DB 무결성과 서비스 health까지 확인한 성공 복구에서만 해제한다.

## 자동 검증

`packages/db/src/database-backup.test.ts`는 다음을 회귀 검증한다.

- 공백이 있는 file-backed 경로와 활성 WAL에서 snapshot 백업
- 백업 뒤 원본 변경과 무관한 독립 백업 열기
- 백업 검증과 복구본 읽기
- 임시 복구본의 WAL/SHM sidecar 생성·제거와 원본 백업 불변성
- 손상 파일 거부
- 기존 출력 파일 비덮어쓰기
