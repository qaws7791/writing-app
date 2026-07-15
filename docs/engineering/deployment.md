# 단일 Ubuntu 서버 배포

이 문서는 단일 Ubuntu 서버에서 Docker Compose로 writing-app을 실행하는 배포 계약과 자동화 경계를 정의한다.

## 구현 상태

- 기준일: 2026-07-16
- 상태: Compose·Caddy·Litestream·Ansible 검증 CI 편입 완료; Ubuntu CI 결과 확인과 image·통합 검증 필요
- 현재 범위: 애플리케이션 Docker 이미지, Docker Compose, Ansible
- 후속 범위: OpenTofu, cloud-init, GitHub Actions 배포 자동화
- 실행 계획: [`repository-onboarding-and-production-deployment-plan.md`](../../repository-onboarding-and-production-deployment-plan.md)

## 배포 기준

- 최초 지원 운영체제는 Ubuntu 24.04 LTS다.
- 최초 지원 아키텍처는 `linux/amd64`다.
- 하나의 서버와 로컬 SQLite 파일을 사용한다.
- 애플리케이션 이미지는 변경 불가능한 tag 또는 digest로 배포한다.
- 프로덕션 서버에서 애플리케이션 이미지를 빌드하지 않는다.
- Cloudflare Tunnel만 외부 연결을 만들며 호스트에 애플리케이션 port를 공개하지 않는다.
- Caddy는 Tunnel과 애플리케이션 사이의 단일 reverse proxy다.
- Caddy 내부 구간은 HTTP이며 외부 TLS는 Cloudflare가 종료한다.

호스트 또는 cloud 방화벽은 SSH 관리 port만 inbound로 허용하고 80, 443과 애플리케이션 port는 열지 않는다. SSH key, 관리 port, root 로그인 차단 같은 접근 정책은 호스트 접근을 끊을 수 있으므로 OpenTofu와 cloud-init의 명시적 입력으로 관리한다.

## 서비스 경계

| 서비스        | 내부 port | 역할                        |
| ------------- | --------: | --------------------------- |
| `web`         |    `3000` | 학습자 Next.js 웹           |
| `admin`       |    `3001` | 관리자 Next.js 웹           |
| `api`         |    `4000` | 학습자 Bun API              |
| `admin-api`   |    `4001` | 관리자 Bun API와 WebSocket  |
| `caddy`       |    `8080` | host 기반 reverse proxy     |
| `cloudflared` |      없음 | Cloudflare Tunnel connector |
| `litestream`  |      없음 | SQLite WAL 연속 복제        |

`api`와 `admin-api`는 `/var/lib/writing-app/api.sqlite`를 공유한다. 두 컨테이너와 Litestream은 같은 데이터 디렉터리를 사용하며 네트워크 파일시스템에 DB를 두지 않는다.

## 저장소 구성

| 경로                                | 책임                                                             |
| ----------------------------------- | ---------------------------------------------------------------- |
| `deploy/docker/`                    | 네 애플리케이션의 production image 정의                          |
| `deploy/compose/compose.yaml`       | 애플리케이션, Caddy, Tunnel, Litestream, 일회성 운영 서비스 정의 |
| `deploy/caddy/caddyfile`            | 네 host route와 trusted proxy 처리                               |
| `deploy/litestream/litestream.yaml` | SQLite와 R2 replica 계약                                         |
| `infra/ansible/playbooks/`          | bootstrap, deploy, verify, rollback, restore 진입점              |
| `infra/ansible/roles/`              | Docker 호스트와 writing-app 배포의 재사용 가능한 역할            |

## 배포 구성 사전 검증

실행 중인 Docker daemon이 있는 저장소 루트에서 다음 명령을 실행한다.

```sh
bun run check:deployment-config
```

이 명령은 임시 디렉터리에 비밀값이 아닌 production 형태의 fixture를 만들고 `operations` profile을 포함한 Compose JSON을 해석한다. 필수 서비스, host port 비공개, 앱 health check와 `init`, network 격리, 공유 SQLite volume을 검사한다. 이어서 고정된 Caddy `2.11.4`와 Litestream `0.5.11` image로 각 설정을 로드하고 성공·실패와 관계없이 fixture를 정리한다. `--skip-container-validation`은 Docker daemon을 사용할 수 없는 환경에서 Compose 해석만 진단하기 위한 선택지이며 전체 배포 품질 게이트를 충족하지 않는다.

Ansible 제어 노드는 Linux 또는 WSL2를 사용한다.

```sh
python3 -m pip install -r infra/ansible/requirements.txt
ansible-galaxy collection install -r infra/ansible/requirements.yaml
bun run check:deployment-ansible
```

Ansible 검사는 저장소에 고정된 `ansible-core 2.21.2`, `ansible-lint 26.6.0`, `community.docker 5.2.1`을 기준으로 전체 lint와 모든 playbook의 syntax check를 실행한다. GitHub Actions의 `배포 구성 검증` job은 Docker가 제공되는 Ubuntu에서 두 canonical 명령을 모두 실행한다.

## 배포 순서

1. 대상 이미지와 설정을 검증한다.
2. 신규 이미지를 pull한다.
3. 기존 SQLite snapshot 백업을 생성하고 검증한다.
4. `api`와 `admin-api`의 신규 쓰기를 중지한다.
5. 배포할 API 이미지로 migration을 한 번 실행한다.
6. SQLite `PRAGMA integrity_check`가 `ok`인지 확인한다.
7. Compose 서비스를 기동한다.
8. 컨테이너 health check와 Caddy route smoke test를 실행한다.
9. 배포 image reference를 기록한다.

서버 프로세스 시작은 migration이나 seed를 암묵적으로 실행하지 않는다. 운영 seed는 배포와 분리된 명시적 승인 절차를 사용한다.

## 설정과 비밀값

- 공개 URL과 port 같은 비민감 설정은 Ansible inventory 변수로 관리한다.
- 비밀값은 Git에 평문으로 저장하지 않는다.
- 현재 애플리케이션은 환경 변수 계약을 사용하므로 Ansible이 root 소유 `0600` 환경 파일을 대상 서버에 만든다.
- 비밀값을 포함하는 Ansible task에는 `no_log: true`를 적용한다.
- `NEXT_PUBLIC_*` 값은 Next.js build 시 이미지에 포함되는 공개 설정이며 secret을 build argument로 전달하지 않는다.

## 이미지 build

저장소 루트에서 다음 Dockerfile을 사용한다. 실제 registry와 변경 불가능한 tag는 CI/CD가 결정한다.

```sh
docker build -f deploy/docker/web.dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$API_ORIGIN" \
  --build-arg WEB_API_BASE_URL=http://api:4000 \
  --build-arg WEB_ORIGIN="$WEB_ORIGIN" \
  -t "$REGISTRY/writing-app-web:$IMAGE_TAG" .
docker build -f deploy/docker/admin.dockerfile \
  --build-arg NEXT_PUBLIC_ADMIN_API_BASE_URL="$ADMIN_API_ORIGIN" \
  --build-arg NEXT_PUBLIC_LEARNER_WEB_ORIGIN="$WEB_ORIGIN" \
  --build-arg ADMIN_API_BASE_URL=http://admin-api:4001 \
  --build-arg ADMIN_ORIGIN="$ADMIN_ORIGIN" \
  -t "$REGISTRY/writing-app-admin:$IMAGE_TAG" .
docker build -f deploy/docker/api.dockerfile -t "$REGISTRY/writing-app-api:$IMAGE_TAG" .
docker build -f deploy/docker/admin-api.dockerfile -t "$REGISTRY/writing-app-admin-api:$IMAGE_TAG" .
```

web과 admin 이미지는 Dockerfile에 선언된 공개 URL build argument를 운영 origin으로 명시해야 한다. 기본 `.test` 값으로 만든 이미지는 운영에 배포하지 않는다.

## Ansible 실행

Ansible 제어 노드는 Linux 또는 WSL2를 사용한다. `infra/ansible/inventories/production/hosts.example.yaml`을 `hosts.yaml`로, `group_vars/all.example.yaml`을 `all.yaml`로, `group_vars/vault.example.yaml`을 `vault.yaml`로 복사한다. `all.yaml`의 비민감 변수를 환경에 맞게 수정하고 `vault.yaml`은 실제 값을 넣은 뒤 Ansible Vault로 암호화한다. 애플리케이션 image reference는 registry에 push한 뒤 확인한 `@sha256:` digest를 사용한다.

```sh
cd infra/ansible
python3 -m pip install -r requirements.txt
ansible-galaxy collection install -r requirements.yaml
ansible-vault encrypt inventories/production/group_vars/vault.yaml
ansible-playbook playbooks/bootstrap.yaml
ansible-playbook playbooks/deploy.yaml --ask-vault-pass
ansible-playbook playbooks/verify.yaml
```

직전 정상 이미지로 코드만 롤백할 때는 `writing_app_allow_code_rollback=true`와 네 이미지 reference를 명시한다. R2 복제본에서 DB를 복구할 때는 데이터 손실 범위를 확인한 뒤 `writing_app_allow_database_restore=true`를 명시한다.

```sh
ansible-playbook playbooks/rollback.yaml -e writing_app_allow_code_rollback=true --ask-vault-pass
ansible-playbook playbooks/restore.yaml -e writing_app_allow_database_restore=true --ask-vault-pass
```

## Cloudflare 선행 설정

- Tunnel public hostname 네 개가 동일한 origin `http://caddy:8080`을 가리키도록 구성한다.
- Cloudflare에서 각 hostname의 DNS proxy와 외부 TLS를 활성화한다.
- Tunnel token은 Ansible Vault 변수 `vault_writing_app_cloudflare_tunnel_token`으로 전달한다.
- R2 API token은 대상 bucket에 필요한 object read/write 권한만 부여한다.

## 롤백 경계

- 코드 롤백은 직전 정상 image reference로 Compose 서비스를 다시 만든다.
- 코드 롤백은 SQLite 파일을 자동으로 되돌리지 않는다.
- DB 복구는 두 API를 중지하고 별도 승인을 받은 뒤 `database-backup-restore.md` 절차로 수행한다.
- migration이 이전 코드와 호환되지 않으면 배포 전에 별도 migration 및 rollback 계획을 작성한다.

## 완료 기준

- 네 애플리케이션 이미지가 비 root 사용자로 실행된다.
- Next.js standalone 산출물이 정적 asset을 포함해 실행된다.
- `docker compose config --quiet`가 성공한다.
- 애플리케이션 port가 호스트에 공개되지 않는다.
- 컨테이너 재생성 및 서버 재부팅 뒤 SQLite 데이터가 유지된다.
- Ansible bootstrap과 deploy playbook을 두 번 실행했을 때 두 번째 실행은 불필요한 변경을 만들지 않는다.
- 실패한 신규 배포를 직전 정상 image reference로 되돌릴 수 있다.
- Litestream 복제본에서 별도 경로로 복구하고 SQLite 무결성 검증을 통과한다.

로컬 Windows 환경에서는 임시 fixture의 Compose 정적 해석과 계약 unit test를 검증했다. Docker daemon이 실행되지 않아 이번 변경의 Caddy·Litestream 컨테이너 검증은 로컬에서 실행할 수 없었으며 새 Ubuntu CI job의 결과 확인이 필요하다. Docker image build, Ansible lint·syntax와 두 번째 실행의 멱등성 검증도 Linux 제어 노드와 Ubuntu 24.04 대상 호스트에서 추가로 수행해야 한다.
