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
- application backup entry는 먼저 DB를 read-only 진단한다. 현재 schema era와 무결성 검사를 통과한 DB만 허용하며, 빈 DB·이전 계보·부분 schema는 snapshot 전에 차단한다.
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

운영 복구가 필요한 경우에는 다음 순서를 따른다.

1. 단일 `api` 서비스의 신규 요청 수락을 중단하고 진행 중 요청이 끝난 뒤 프로세스를 종료한다.
2. 장애 난 현재 DB 파일과 관련 WAL/SHM 파일을 별도 격리 경로에 보존한다.
3. 검증된 백업을 새 복구 경로에 복사한다. 기존 운영 파일을 제자리에서 덮어쓰지 않는다.
4. 복구 경로를 대상으로 백업 명령을 다시 실행해 독립 열기와 무결성 검증이 통과하는지 확인한다.
5. `DATABASE_URL`을 검증된 복구 파일로 전환하고 API를 시작한다.
6. 학습자 origin의 `/api/health`와 관리자 origin의 `/api/admin/health`, 로그인, 코스 조회, 학습 진행 저장, 관리자 조회와 자료실 읽기·쓰기를 smoke test한다.

손상 파일, 필수 테이블 누락, 무결성 실패가 발생하면 복구 후보로 채택하지 않는다. 실패한 복구 때문에 현재 운영 파일을 덮어쓰지 않는다.

`restore.yaml`은 SQLite/WAL/SHM 격리를 시작한 뒤 실패하면 `/var/backups/writing-app/restore-<UTC>/recovery.txt`에 실패 단계와 수동 복구 안내를 기록하고 operation lock을 유지한다. 이 상태에서는 자동 재시도나 다른 lifecycle playbook을 실행하지 말고, 격리 파일·R2 복구 결과·Compose runtime을 읽기 전용으로 점검한 뒤 incident 책임자가 복구 방식을 결정한다. lock은 격리 전 실패하거나 DB 무결성과 서비스 health까지 확인한 성공 복구에서만 해제한다.

로컬 setup도 같은 application backup entry를 사용한다. 현재 schema era의 기존 DB에 다음 migration이 필요하면 파일 크기와 관계없이 검증 백업을 먼저 만들고, recovery backup은 쓰기 연결로 열지 않는다. 별도 임시 candidate에 복제한 뒤 실제 DB와 같은 migration entrypoint를 실행하고 read-only application 진단이 `current/ok`인지 확인한다. 이전 계보 DB는 setup이 자동 변환하지 않는다. 백업·사본 migration·진단 중 하나라도 실패하면 실제 DB migration과 seed를 시작하지 않으며, candidate만 삭제하고 recovery backup은 보존한다.

저장소 단위 operation lock은 같은 checkout의 setup 전체를 직렬화한다. 비정상 종료로 lock이 남으면 자동 삭제하지 않으며, 실행 중인 setup process가 없음을 확인한 뒤에만 수동으로 제거한다. 이 lock은 API·Web·Admin process의 DB 접근을 중지시키지 않으므로 setup 전에 개발 서버를 종료해야 한다.

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
