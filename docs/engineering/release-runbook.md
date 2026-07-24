# 첫 배포 runbook

## 책임과 중단 원칙

Release operator는 inventory·Vault·DNS·배포·검증 기록을 준비하고 아래 명령을 실행한다. Incident commander는 장애 영향과 code rollback 여부를 승인하며, release operator만 승인된 playbook을 실행한다. DB 복구는 incident commander와 data owner가 함께 승인하고, 개인정보 복구가 포함되면 privacy owner가 삭제 marker 재적용 결과를 확인한다.

명령 하나라도 실패하면 다음 단계로 진행하지 않는다. Operation lock은 실행 중 작업이 없다는 확인 없이 삭제하지 않는다. Production 성공은 법률 검토, 최근 staging restore drill, 동일 revision 전체 E2E와 protected environment 승인이 모두 연결된 release workflow 결과가 있을 때만 선언한다.

## 새 Ubuntu 24.04 staging

전제는 별도 linux/amd64 VPS, sudo 가능한 SSH 계정, 학습자·관리자 staging DNS, 80/443 inbound, outbound HTTPS와 production과 분리된 Vault·R2 bucket·asset bucket·삭제 marker bucket이다. 실제 값의 권위 소스는 [inventory 예시](../../infra/ansible/inventories/staging/)와 [배포 설정](../../deploy/)이다.

Controller의 검증된 source revision에서 다음을 실행한다.

```bash
set -euo pipefail

python3 -m venv .venv-ansible
. .venv-ansible/bin/activate
pip install --requirement infra/ansible/requirements.txt
ansible-galaxy collection install --requirements-file infra/ansible/requirements.yaml

cp infra/ansible/inventories/staging/hosts.example.yaml \
  infra/ansible/inventories/staging/hosts.yaml
cp infra/ansible/inventories/staging/group_vars/all.example.yaml \
  infra/ansible/inventories/staging/group_vars/all.yaml
cp infra/ansible/inventories/staging/group_vars/vault.example.yaml \
  infra/ansible/inventories/staging/group_vars/vault.yaml
ansible-vault encrypt \
  infra/ansible/inventories/staging/group_vars/vault.yaml
```

세 로컬 파일의 placeholder를 실제 staging host, 서로 다른 public hostname, immutable application digest, 전용 storage와 secret으로 교체한다. 그다음 repository root에서 정적 검사를 통과시키고 Ansible root에서 host를 준비한다.

```bash
set -euo pipefail

bun run check:deployment-ansible

cd infra/ansible
ansible-playbook \
  -i inventories/staging/hosts.yaml \
  --ask-vault-pass \
  playbooks/bootstrap.yaml
```

첫 deploy 전에 observability owner가 실제 외부 sink에서 `application-30d` 최대 30일, `security-90d` 최대 90일 파기 설정과 실행 결과를 확인하고 아래 여섯 필드의 JSON 증거를 승인된 controller 경로에 내보낸다. `sink`와 `evidenceId`는 실제 외부 기록을 가리켜야 하고 `verifiedAt <= 현재 < validUntil`이어야 한다. 예시·placeholder·미래 검증 시각·만료 증거는 사용할 수 없다. Application이 소유하는 parser로 같은 파일을 검증한 뒤 root만 읽을 수 있게 새 host에 배치한다.

```bash
set -euo pipefail

read -r -p "승인된 staging log-retention evidence JSON 절대 경로: " evidence_file
evidence_file="$(realpath "$evidence_file")"

LOG_RETENTION_EVIDENCE_FILE="$evidence_file" bun --cwd ../.. -e '
  import { parseExternalLogRetentionEvidence } from "./apps/api/src/maintenance/log-retention-evidence"
  const path = process.env.LOG_RETENTION_EVIDENCE_FILE
  if (!path) throw new Error("evidence path가 필요합니다.")
  parseExternalLogRetentionEvidence(await Bun.file(path).json(), new Date())
'

ansible writing_app \
  -i inventories/staging/hosts.yaml \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.file \
  -a "path=/etc/writing-app-staging/evidence state=directory owner=root group=root mode=0700"

ansible writing_app \
  -i inventories/staging/hosts.yaml \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.copy \
  -a "src=${evidence_file} dest=/etc/writing-app-staging/evidence/log-retention.json owner=root group=root mode=0600"
```

DNS A/AAAA가 새 VPS를 가리킨 뒤 동일 source revision과 inventory digest를 한 operation lock 아래 배포·공개 검증한다.

```bash
set -euo pipefail

revision="$(git -C ../.. rev-parse HEAD)"
umask 077
handoff_vars="$(mktemp)"
handoff_token="$(openssl rand -hex 32)"
printf '{"writing_app_operation_handoff_token":"%s"}\n' \
  "$handoff_token" > "$handoff_vars"
unset handoff_token
trap 'rm -f "$handoff_vars"' EXIT

ansible-playbook \
  -i inventories/staging/hosts.yaml \
  --ask-vault-pass \
  playbooks/deploy.yaml \
  --extra-vars "@$handoff_vars" \
  -e writing_app_allow_deploy=true \
  -e writing_app_hold_operation_lock_for_verify=true \
  -e writing_app_source_revision="$revision"

ansible-playbook \
  -i inventories/staging/hosts.yaml \
  --ask-vault-pass \
  playbooks/verify.yaml \
  --extra-vars "@$handoff_vars" \
  -e writing_app_source_revision="$revision" \
  -e writing_app_verify_uses_existing_operation_lock=true \
  -e writing_app_verify_finalize_deployment=true \
  -e writing_app_verify_public_routes=true
```

첫 staging fixture와 owner는 staging host의 root shell에서 immutable API image의 Compose one-shot service로 만든다. 표준 CLI를 직접 사용해 Ansible playbook은 다섯 개로 유지한다. 아래 블록은 atomic shared lock을 직접 획득하며, 기존 lock이 있으면 어떤 seed도 실행하지 않는다. Owner credential은 숨김 입력으로만 받고 Git, Vault, shell 인자나 history에 남기지 않는다.

```bash
sudo -i
set -euo pipefail

compose_directory=/opt/writing-app-staging
operation_lock=/var/lock/writing-app-staging-operation.lock
mkdir -m 0700 "$operation_lock"
cleanup_seed() {
  unset ADMIN_SEED_EMAIL ADMIN_SEED_NAME ADMIN_SEED_PASSWORD
  rmdir "$operation_lock" || true
}
trap cleanup_seed EXIT

cd "$compose_directory"
export DATABASE_SEED_PRODUCTION_APPROVED=true
docker compose --env-file .env --file compose.yaml --profile operations \
  run --rm --no-deps \
  -e DATABASE_SEED_PRODUCTION_APPROVED \
  database-seed
unset DATABASE_SEED_PRODUCTION_APPROVED

read -r -p "Owner email: " ADMIN_SEED_EMAIL
read -r -p "Owner name: " ADMIN_SEED_NAME
read -r -s -p "Owner password: " ADMIN_SEED_PASSWORD
printf "\n"
export ADMIN_SEED_EMAIL ADMIN_SEED_NAME ADMIN_SEED_PASSWORD
export ADMIN_SEED_PRODUCTION_APPROVED=true
docker compose --env-file .env --file compose.yaml --profile operations \
  run --rm --no-deps \
  -e ADMIN_SEED_EMAIL \
  -e ADMIN_SEED_NAME \
  -e ADMIN_SEED_PASSWORD \
  -e ADMIN_SEED_PRODUCTION_APPROVED \
  owner-seed
unset ADMIN_SEED_PRODUCTION_APPROVED
```

Production에는 fixture database seed를 실행하지 않는다. Owner가 승인된 실제 콘텐츠를 관리자 UI에서 생성·발행한다.

## 배포 후 검증

`verify.yaml`은 실행 중인 web·api·admin digest, Compose health, Caddy 내부 경계, public DNS·TLS, learner/admin health와 인증 경계 GET을 검사한다. 이어 승인된 staging session과 고정 fixture로 [k6 핵심 흐름](../../scripts/k6-staging-smoke.js)을 실행해 course 조회, lesson 시작과 답안 제출을 확인한다. 입력 이름과 실패 기준은 해당 실행 source를 따른다.

출시 기록에는 다음을 남긴다.

- 기준 revision과 세 image digest
- learner/admin DNS·TLS와 service health 결과
- owner seed와 production content seed 생략 결정
- migration·DB integrity 결과와 최신 backup/restore drill 식별자
- 구조화 로그 수집, disk·container restart·maintenance timer와 alert 전달 확인
- k6 핵심 흐름과 full E2E run URL

외부 log sink, 실제 alert 전달, 새 VPS idempotency, staging 복구 성공과 사용자 흐름은 repository 정적 검사로 증명할 수 없다. 실행 결과가 없으면 해당 항목은 미충족으로 기록한다.

## 배포·rollback 후 verify 실패 복구

Deploy 또는 rollback 성공 뒤 public verify가 실패하면 원격 operation lock, exact target digest와 root 전용 handoff marker는 유지되고 controller의 token 파일은 폐기된다. 같은 workflow나 rollback을 처음부터 재실행하지 않는다. Release operator는 incident commander 승인 아래 handoff의 `automationRevision`과 정확히 같은 commit을 checkout하고, 실행 중인 Ansible·verify process가 없으며 `verify.claim`이 반환됐음을 확인한 뒤 marker를 로그에 출력하지 않는 `fetch`로 회수해 operation에 맞는 verify만 재실행한다. 아래 정상 복구 블록은 `verify.claim`을 삭제하지 않는다. `stat` 결과 claim이 존재하면 즉시 중단하며, verifier의 atomic claim이 동시 또는 살아 있는 두 번째 실행을 fail-closed한다.

```bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
read -r -p "복구 대상(staging|production): " target
case "$target" in
  staging)
    inventory=infra/ansible/inventories/staging/hosts.yaml
    operation_lock=/var/lock/writing-app-staging-operation.lock
    ;;
  production)
    inventory=infra/ansible/inventories/production/hosts.yaml
    operation_lock=/var/lock/writing-app-operation.lock
    ;;
  *)
    exit 2
    ;;
esac

ansible writing_app \
  -i "$inventory" \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.stat \
  -a "path=${operation_lock}/verify.claim"

umask 077
handoff_marker="$(mktemp)"
handoff_vars="$(mktemp)"
trap 'rm -f "$handoff_marker" "$handoff_vars"' EXIT

ansible writing_app \
  -i "$inventory" \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.fetch \
  -a "src=${operation_lock}/handoff.json dest=${handoff_marker} flat=true"

current_revision="$(git rev-parse HEAD)"
operation="$(
  CURRENT_REVISION="$current_revision" \
  HANDOFF_MARKER="$handoff_marker" \
  HANDOFF_VARS="$handoff_vars" \
  bun -e '
  const marker = await Bun.file(process.env.HANDOFF_MARKER).json()
  const digest = /^.+@sha256:[0-9a-f]{64}$/
  if (!["deployment", "rollback"].includes(marker.operation)) {
    throw new Error("지원하는 handoff operation이 아닙니다.")
  }
  if (marker.automationRevision !== process.env.CURRENT_REVISION) {
    throw new Error("handoff와 controller checkout revision이 다릅니다.")
  }
  if (marker.operation === "deployment" && marker.revision !== process.env.CURRENT_REVISION) {
    throw new Error("release revision과 controller checkout이 다릅니다.")
  }
  if (
    marker.operation === "rollback" &&
    typeof marker.promoteVerifiedToPrevious !== "boolean"
  ) {
    throw new Error("rollback history 정책이 올바르지 않습니다.")
  }
  if (!/^[0-9a-f]{64}$/.test(marker.token)) throw new Error("token이 올바르지 않습니다.")
  for (const key of ["webImage", "apiImage", "adminImage"]) {
    if (!digest.test(marker[key])) throw new Error(`${key} digest가 올바르지 않습니다.`)
  }
  await Bun.write(process.env.HANDOFF_VARS, JSON.stringify({
    writing_app_admin_image: marker.adminImage,
    writing_app_api_image: marker.apiImage,
    writing_app_operation_handoff_token: marker.token,
    writing_app_source_revision: marker.automationRevision,
    writing_app_web_image: marker.webImage,
  }))
  console.log(marker.operation)
'
)"

case "$operation" in
  deployment)
    finalization_args=(
      -e writing_app_verify_finalize_deployment=true
    )
    ;;
  rollback)
    finalization_args=(
      -e writing_app_verify_expected_images_from_compose_environment=true
      -e writing_app_verify_finalize_rollback=true
    )
    ;;
  *)
    exit 2
    ;;
esac

ansible-playbook infra/ansible/playbooks/verify.yaml \
  -i "$inventory" \
  --ask-vault-pass \
  --extra-vars "@$handoff_vars" \
  -e writing_app_verify_uses_existing_operation_lock=true \
  "${finalization_args[@]}" \
  -e writing_app_verify_public_routes=true
```

Controller 비정상 종료로 claim만 남은 경우는 정상 복구와 분리한다. Incident commander가 원래 Actions·controller 실행 종료, 실행 중인 Ansible·SSH session 부재와 claim 생성 시각을 확인하고 incident 기록에 증거를 남긴 뒤에만 아래 stale-claim 회수를 승인한다. 이 절차도 global operation lock과 `handoff.json`은 삭제하지 않는다.

```bash
set -euo pipefail

read -r -p "Incident ID: " incident_id
test -n "$incident_id"
read -r -p "stale claim 대상(staging|production): " target
case "$target" in
  staging)
    inventory=infra/ansible/inventories/staging/hosts.yaml
    operation_lock=/var/lock/writing-app-staging-operation.lock
    ;;
  production)
    inventory=infra/ansible/inventories/production/hosts.yaml
    operation_lock=/var/lock/writing-app-operation.lock
    ;;
  *)
    exit 2
    ;;
esac

ansible writing_app \
  -i "$inventory" \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.stat \
  -a "path=${operation_lock}/verify.claim"

read -r -p "위 실행 부재 증적을 확인했습니다. REMOVE STALE VERIFY CLAIM 입력: " approval
test "$approval" = "REMOVE STALE VERIFY CLAIM"
ansible writing_app \
  -i "$inventory" \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.file \
  -a "path=${operation_lock}/verify.claim state=absent"
```

## Production과 비상 rollback

첫 image workflow 전에 `main` 필수 품질 check를 branch protection에 연결하고 `staging`·`production` protected environment, reviewer, 변수와 secret을 [image release workflow](../../.github/workflows/image-release.yml)의 현재 입력 계약에 맞춰 설정한다. 두 환경의 public asset origin은 workflow build 입력과 각 Ansible inventory의 정확 origin 목록에서 일치해야 한다. 보호 설정이나 필수 입력이 하나라도 없으면 release를 시작하지 않는다.

첫 production workflow 전에 observability owner는 staging과 분리된 production sink의 실제 파기 설정을 검증해 별도 evidence JSON을 만든다. 위와 같은 application parser로 검증한 뒤 production inventory로 `/etc/writing-app/evidence/log-retention.json`에 root:root 0600으로 배치한다. 이 파일이 없거나 schema·유효기간·소유권이 틀리면 모든 production deploy가 호스트 변경 전에 실패한다.

```bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
read -r -p "승인된 production log-retention evidence JSON 절대 경로: " evidence_file
evidence_file="$(realpath "$evidence_file")"

LOG_RETENTION_EVIDENCE_FILE="$evidence_file" bun -e '
  import { parseExternalLogRetentionEvidence } from "./apps/api/src/maintenance/log-retention-evidence"
  const path = process.env.LOG_RETENTION_EVIDENCE_FILE
  if (!path) throw new Error("evidence path가 필요합니다.")
  parseExternalLogRetentionEvidence(await Bun.file(path).json(), new Date())
'

ansible writing_app \
  -i infra/ansible/inventories/production/hosts.yaml \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.file \
  -a "path=/etc/writing-app/evidence state=directory owner=root group=root mode=0700"

ansible writing_app \
  -i infra/ansible/inventories/production/hosts.yaml \
  --ask-vault-pass \
  --become \
  -m ansible.builtin.copy \
  -a "src=${evidence_file} dest=/etc/writing-app/evidence/log-retention.json owner=root group=root mode=0600"
```

Production은 수동 명령이 아니라 [image release workflow](../../.github/workflows/image-release.yml)의 production environment job으로만 배포한다. Workflow가 최근 staging 배포·핵심 흐름, 외부 법률 검토, restore drill과 동일 revision full E2E를 확인하지 못하면 진행하지 않는다.

Protected environment 배포와 공개 검증이 끝나면 release operator와 security owner가 production host의 root shell에서 첫 owner만 만든다. 아래 one-shot은 exact production DB URL guard와 atomic operation lock을 사용하고 secret 값을 command 인자에 넣지 않는다. 첫 로그인 확인 뒤 secret manager가 새 장기 password를 발급하면 같은 명령에 `ADMIN_SEED_RESET_PASSWORD=true`를 추가해 즉시 회전하고 초기 password를 폐기한다.

```bash
sudo -i
set -euo pipefail

compose_directory=/opt/writing-app
operation_lock=/var/lock/writing-app-operation.lock
mkdir -m 0700 "$operation_lock"
cleanup_owner_seed() {
  unset ADMIN_SEED_EMAIL ADMIN_SEED_NAME ADMIN_SEED_PASSWORD
  unset ADMIN_SEED_PRODUCTION_APPROVED ADMIN_SEED_RESET_PASSWORD
  rmdir "$operation_lock" || true
}
trap cleanup_owner_seed EXIT

read -r -p "Production owner email: " ADMIN_SEED_EMAIL
read -r -p "Production owner name: " ADMIN_SEED_NAME
read -r -s -p "Production owner password: " ADMIN_SEED_PASSWORD
printf "\n"
export ADMIN_SEED_EMAIL ADMIN_SEED_NAME ADMIN_SEED_PASSWORD
export ADMIN_SEED_PRODUCTION_APPROVED=true

cd "$compose_directory"
docker compose --env-file .env --file compose.yaml --profile operations \
  run --rm --no-deps \
  -e ADMIN_SEED_EMAIL \
  -e ADMIN_SEED_NAME \
  -e ADMIN_SEED_PASSWORD \
  -e ADMIN_SEED_PRODUCTION_APPROVED \
  owner-seed
```

장애 시 incident commander가 영향, 현재/직전 검증 digest, DB 호환성과 backup을 확인해 code rollback을 승인한다. Release operator는 [rollback 절차](./rollback.md)의 명령만 실행하고 public verify와 핵심 흐름을 다시 확인한다. DB 호환성이 증명되지 않으면 code rollback을 실행하지 않고 [restore 절차](./database-backup-restore.md)로 전환한다. 사고 기록은 [관찰 기준](./observability.md), 개인정보 삭제 복원은 [개인정보 기준](./privacy.md)을 따른다.
