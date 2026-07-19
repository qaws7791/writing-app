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
소유하므로 둘을 분리해 선택할 수 없다.

```bash
ansible-playbook infra/ansible/playbooks/rollback.yaml \
  -i infra/ansible/inventories/production/hosts.yaml \
  --ask-vault-pass \
  -e writing_app_rollback_approved=true \
  -e writing_app_rollback_api_image=ghcr.io/example/writing-app-api@sha256:replace-me \
  -e writing_app_rollback_web_image=ghcr.io/example/writing-app-web@sha256:replace-me \
  -e writing_app_rollback_admin_image=ghcr.io/example/writing-app-admin@sha256:replace-me
```

실행 전에는 현재 revision, 대상 digest, DB schema 호환성, 최신 backup을 확인한다.
실행 뒤에는 같은 `API_HOST`의 `/health`, `/api/admin/health`, 두 인증 realm과 관리자 핵심 변경 route를
검증한다. Caddy의 API upstream은 `api:4000` 하나여야 한다.

## DB 복구

DB 복구는 코드 롤백과 별도 승인 작업이다. 통합 API와 Litestream을 중지하고 단일
SQLite writer가 없는 상태에서만 수행한다. 절차와 fail-closed 조건은
[데이터베이스 백업·복구](./database-backup-restore.md)를 따른다.

복구 뒤에는 migration 상태, `foreign_key_check`, learner/admin 인증 테이블, 자료실
문서 ETag와 학습 진행을 확인한 다음 통합 API를 다시 시작한다.

## 작업 잠금과 실패 복구

배포·verify·rollback·restore는 같은 operation lock을 사용한다. controller 종료나 host
단절로 stale lock이 남았다면 자동 삭제하지 않는다. 실행 중인 writer와 Compose 상태,
SQLite integrity, lock metadata를 확인하고 운영 승인 뒤 수동으로 회수한다.

외부 운영 리허설은 사용자 승인으로 이번 아키텍처 작업 범위에서 제외했다. 따라서 이
문서는 source와 실행 계약을 설명하지만 실제 대상 환경의 롤백 성공 증적을 주장하지 않는다.
