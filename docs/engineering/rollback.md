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

`infra/ansible/playbooks/rollback.yaml`은 web, 통합 API, admin image를 승인된 검증
digest로 함께 전환한다. API image는 learner/admin route와 하나의 SQLite lifecycle을 함께
소유하므로 둘을 분리해 선택할 수 없다. Playbook은 root 소유 Compose 환경의 SHA-256을
비교한다. 현재 `.env`가 마지막 검증 성공 `.env.verified`와 같으면 정상 rollback으로
`.env.previous`를 선택하고, 미검증 candidate와 달라졌다면 복구 rollback으로
`.env.verified`를 선택한다. 전자는 검증 완료 뒤 rollback 직전 환경을 다음 후보로 승격하지만,
후자는 기존 `.env.previous`를 보존한다. 이 구분 덕분에 실패한 candidate 복구가 이전 검증
release 이력을 덮어쓰거나 다음 rollback을 no-op으로 만들지 않는다.

운영자는 두 후보를 임의로 편집하거나 candidate·가변 tag·임의의 과거 release로 대체하지
않는다. `.env.previous`는 candidate render 시점이 아니라 실제 container digest와 public
route 검증이 모두 성공할 때 직전 `.env.verified`에서만 승격한다. 실행 전에는 선택될 release
manifest와 deployment record를 대조해 세 digest가 staging smoke와 이전 production 검증을
통과한 revision인지 확인한다. Playbook은 선택한 Compose 환경을 Compose로 해석하고 최종
web·통합 API·admin image가 모두 digest인지 확인한 뒤에만 복구한다. 따라서 중복 환경 변수의
앞선 안전한 값이 뒤의 가변 tag를 가리지 못한다.

```bash
set -euo pipefail

umask 077
handoff_vars="$(mktemp)"
handoff_token="$(openssl rand -hex 32)"
automation_revision="$(git rev-parse HEAD)"
printf \
  '{"writing_app_operation_handoff_token":"%s","writing_app_source_revision":"%s"}\n' \
  "$handoff_token" \
  "$automation_revision" > "$handoff_vars"
unset handoff_token
trap 'rm -f "$handoff_vars"' EXIT

ansible-playbook infra/ansible/playbooks/rollback.yaml \
  -i infra/ansible/inventories/production/hosts.yaml \
  --ask-vault-pass \
  --extra-vars "@$handoff_vars" \
  -e writing_app_allow_code_rollback=true \
  -e writing_app_code_rollback_database_compatible=true \
  -e writing_app_hold_operation_lock_for_verify=true

ansible-playbook infra/ansible/playbooks/verify.yaml \
  -i infra/ansible/inventories/production/hosts.yaml \
  --ask-vault-pass \
  --extra-vars "@$handoff_vars" \
  -e writing_app_verify_uses_existing_operation_lock=true \
  -e writing_app_verify_expected_images_from_compose_environment=true \
  -e writing_app_verify_finalize_rollback=true \
  -e writing_app_verify_public_routes=true
```

실행 전에는 현재 revision, 직전 환경의 대상 digest, DB schema 호환성, 최신 backup을 확인한다.
이전 API image의 migration 계약과 현재 DB schema가 동일하거나 backward-compatible하다는
검증 증적이 있을 때만 `writing_app_code_rollback_database_compatible=true`를 전달한다.
DB 호환성 확인 입력은 운영자의 판단을 기록하는 fail-closed 승인이지 자동 호환성 증명이 아니다.
호환되지 않으면 이 playbook을 실행하지 않고 별도 승인된 데이터 복구 절차를 사용한다.
첫 playbook이 획득한 operation lock은 두 번째 verify가 실제 container digest와 학습자
origin의 `/api/health`, 관리자 origin의 `/api/admin/health`, 두 인증 경계를 검증할 때까지
유지한다. 검증 실패 시 lock과 recovery 기록을 보존하고 다음 운영 변경을 차단한다. 두 origin의
Caddy API upstream은 `api:4000` 하나여야 한다. Controller token 파일이 사라진 뒤 verify를
재시도할 때는 [handoff 복구 절차](./release-runbook.md#배포rollback-후-verify-실패-복구)로
root 전용 marker를 비노출 회수하고 같은 automation revision에서 rollback verify만 실행한다.

## Baseline 이후 호환성

현재 API runtime은 빈 DB에 새 baseline을 적용하거나 현재 baseline부터 정확히 이어지는 migration prefix만 적용한다. 이력 없는 비어 있지 않은 DB, 알 수 없는 migration ID와 checksum 불일치는 자동 채택하거나 변환하지 않는다.

이전 image가 현재 DB의 migration ID나 schema와 호환되지 않으면 code-only rollback 대상으로 간주하지 않는다. 필요한 경우 writer를 중지하고 호환되는 검증 백업을 새 경로로 복구해야 한다. 운영 DB에서 역방향 SQL을 즉석 작성하거나 migration 이력만 수동 편집하는 방식은 허용하지 않는다.

## DB 복구

DB 복구는 코드 롤백과 별도 승인 작업이다. 통합 API와 Litestream을 중지하고 단일
SQLite writer가 없는 상태에서만 수행한다. 절차와 fail-closed 조건은
[데이터베이스 백업·복구](./database-backup-restore.md)를 따른다.

복구 뒤에는 migration 상태, `foreign_key_check`, learner/admin 인증 테이블, 콘텐츠 revision과 학습 진행을 확인한 다음 통합 API를 다시 시작한다.

통합 migration의 사전 검사, 적용 transaction 또는 최종 schema 검증이 실패하면 API 기동을 계속하지 않는다. 백업 생성·검증이 실패하면 migration과 배포를 시작하지 않으며, 복구 검증이 실패하면 해당 파일로 writer를 전환하지 않는다. 이 세 중단 조건은 migration runner가 데이터 변경을 rollback하는 범위와 운영자가 검증 백업을 선택하는 범위를 분리한다.

## 작업 잠금과 실패 복구

배포·verify·rollback·restore는 같은 operation lock을 사용한다. controller 종료나 host
단절로 stale lock이 남았다면 자동 삭제하지 않는다. 실행 중인 writer와 Compose 상태,
SQLite integrity, lock metadata를 확인하고 운영 승인 뒤 수동으로 회수한다.

외부 운영 리허설은 사용자 승인으로 이번 아키텍처 작업 범위에서 제외했다. 따라서 이
문서는 source와 실행 계약을 설명하지만 실제 대상 환경의 롤백 성공 증적을 주장하지 않는다.
