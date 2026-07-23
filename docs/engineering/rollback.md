# 롤백 운영 계약

## 원칙

제품 backend executable은 학습자 HTTP 표면과 `/api/admin` 경로 sub-app을 함께 실행하는 `apps/api` 하나다.
따라서 코드 롤백도 두 인증 realm을 같은 immutable API image로 되돌린다. 관리자
traffic만 별도 runtime으로 분기하는 rollback 경로는 유지하지 않는다.

- 코드 롤백과 DB 복구를 구분한다. schema·데이터가 호환되면 코드 image만 되돌린다.
- 모든 변경 작업은 host-local operation lock으로 직렬화한다.
- 배포, 코드 롤백, DB 복구를 동시에 실행하지 않는다.
- 실패 시 원래 writer와 Caddy topology를 확인한 뒤 public health를 다시 검증한다.
- 실제 운영 실행에는 별도 승인, maintenance/drain, backup 확인이 필요하다.

## 통합 API 코드 롤백

`infra/ansible/playbooks/rollback.yaml`은 web, 통합 API, admin image를 승인된 이전
digest로 전환한다. API image는 learner/admin route와 하나의 SQLite lifecycle을 함께
소유하므로 둘을 분리해 선택할 수 없다. playbook은 root 소유의 직전 Compose 환경을
Compose로 해석하고, 최종 web·통합 API·admin image가 모두 digest인지 확인한 뒤에만 이를
복구한다. 따라서 중복 환경 변수의 앞선 안전한 값이 뒤의 가변 tag를 가리지 못한다.

```bash
ansible-playbook infra/ansible/playbooks/rollback.yaml \
  -i infra/ansible/inventories/production/hosts.yaml \
  --ask-vault-pass \
  -e writing_app_allow_code_rollback=true \
  -e writing_app_code_rollback_database_compatible=true
```

실행 전에는 현재 revision, 직전 환경의 대상 digest, DB schema 호환성, 최신 backup을 확인한다.
DB 호환성 확인 입력은 운영자의 판단을 기록하는 fail-closed 승인이지 자동 호환성 증명이 아니다.
호환되지 않으면 이 playbook을 실행하지 않고 별도 승인된 데이터 복구 절차를 사용한다.
실행 뒤에는 같은 `API_HOST`의 `/health`, `/api/admin/health`, 두 인증 realm과 관리자 핵심 변경 route를
검증한다. Caddy의 API upstream은 `api:4000` 하나여야 한다.

## 통합 schema 이후 호환성

현재 API migration은 빈 DB, 보존된 baseline, 이전 module schema와 명시적으로 식별한 legacy schema를 현재 상태로 올릴 수 있다. 이전 module migration 함수가 현재 schema에서 멱등적으로 끝나는 것도 테스트하지만, 이는 이전 API image 전체가 현재 DB와 호환된다는 뜻이 아니다.

현재 schema는 cross-module FK를 제거하기 위해 여러 table을 재구성하고 제품 role을 auth credential table에서 identity table로 옮긴 뒤 기존 role column을 제거한다. 따라서 이 migration이 적용된 DB에 role column을 기대하는 이전 API image를 배치하는 code-only rollback은 지원하지 않는다. 이전 image가 필요한 경우에는 writer를 중지하고 그 image와 호환되는 migration 전 검증 백업을 새 경로로 복구해야 한다. 운영 DB에서 역방향 SQL을 즉석 작성하거나 migration 이력만 삭제하는 방식은 허용하지 않는다.

## DB 복구

DB 복구는 코드 롤백과 별도 승인 작업이다. 통합 API와 Litestream을 중지하고 단일
SQLite writer가 없는 상태에서만 수행한다. 절차와 fail-closed 조건은
[데이터베이스 백업·복구](./database-backup-restore.md)를 따른다.

복구 뒤에는 migration 상태, `foreign_key_check`, learner/admin 인증 테이블, 자료실
문서 ETag와 학습 진행을 확인한 다음 통합 API를 다시 시작한다.

통합 migration의 사전 검사, 적용 transaction 또는 최종 schema 검증이 실패하면 API 기동을 계속하지 않는다. 백업 생성·검증이 실패하면 migration과 배포를 시작하지 않으며, 복구 검증이 실패하면 해당 파일로 writer를 전환하지 않는다. 이 세 중단 조건은 migration runner가 데이터 변경을 rollback하는 범위와 운영자가 검증 백업을 선택하는 범위를 분리한다.

## 작업 잠금과 실패 복구

배포·verify·rollback·restore는 같은 operation lock을 사용한다. controller 종료나 host
단절로 stale lock이 남았다면 자동 삭제하지 않는다. 실행 중인 writer와 Compose 상태,
SQLite integrity, lock metadata를 확인하고 운영 승인 뒤 수동으로 회수한다.

외부 운영 리허설은 사용자 승인으로 이번 아키텍처 작업 범위에서 제외했다. 따라서 이
문서는 source와 실행 계약을 설명하지만 실제 대상 환경의 롤백 성공 증적을 주장하지 않는다.
