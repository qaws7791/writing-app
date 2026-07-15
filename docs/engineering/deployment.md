# 단일 Ubuntu 서버 배포

이 문서는 단일 Ubuntu 서버에서 Docker Compose로 writing-app을 실행하는 배포 계약과 자동화 경계를 정의한다.

## 구현 상태

- 기준일: 2026-07-16
- 상태: 배포 검증, GHCR image release·digest manifest와 취약점 차단 구현 완료; 새 CI 결과 확인 필요
- 현재 범위: 애플리케이션 Docker 이미지, Docker Compose, Ansible, GitHub Actions image release
- 후속 범위: base image digest·registry 보존 정책, OpenTofu, cloud-init, 승인형 배포 자동화
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

`bun run test:deployment-bootstrap`은 Docker package와 daemon 설정을 실제 호스트에 적용하므로 일반 개발 장비나 운영 서버에서 실행하지 않는다. 이 명령은 `CI=true`, `WRITING_APP_DISPOSABLE_UBUNTU=true`, Ubuntu 24.04, `linux/amd64`, passwordless sudo를 모두 확인한 뒤에만 실행된다. CI는 task 전용 `/var/tmp/writing-app-bootstrap-*` 경로로 `bootstrap.yaml`을 두 번 실행해 두 번째 recap의 `changed=0`을 요구하고 task 전용 경로를 Ansible로 정리한다. Docker package, apt repository와 daemon 설정은 일회성 runner 폐기와 함께 정리되는 시스템 변경이다.

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

## GHCR 이미지 릴리스

GitHub 저장소의 Actions variables에 다음 공개 build 입력을 등록한다. 이 값은 브라우저 bundle과 image metadata에 포함되므로 secret 저장소에 넣지 않지만, 네 값 모두 path 없는 실제 production HTTPS origin이어야 한다. localhost, IP loopback과 `.example`, `.invalid`, `.localhost`, `.test` 예약 hostname은 preflight에서 거부한다.

| Repository variable           | 용도                   |
| ----------------------------- | ---------------------- |
| `PRODUCTION_WEB_ORIGIN`       | 학습자 웹 공개 origin  |
| `PRODUCTION_API_ORIGIN`       | 학습자 API 공개 origin |
| `PRODUCTION_ADMIN_ORIGIN`     | 관리자 웹 공개 origin  |
| `PRODUCTION_ADMIN_API_ORIGIN` | 관리자 API 공개 origin |

`.github/workflows/image-release.yml`은 `main` push의 `필수 품질 게이트`가 성공했을 때만 실행한다. 외부 fork 또는 다른 event의 `workflow_run`은 거부하고, 검증된 `head_sha`를 다시 checkout해 `linux/amd64` 네 이미지를 빌드한다. 수동 실행과 `latest` tag는 제공하지 않는다.

이미지 이름은 `ghcr.io/<lowercase owner>/<lowercase repository>-<service>`이고 tag는 `sha-<40자리 revision>-<공개 설정 SHA-256>`이다. tag는 게시 충돌 방지와 탐색을 위한 값이며 배포 식별자가 아니다. 배포에는 workflow의 `production-image-digests-<revision>-<configuration digest>` artifact 안에 있는 `name@sha256:...` reference만 사용한다. artifact의 `image-release-manifest.json`은 source revision, 네 공개 origin, 공개 설정 digest와 네 image digest를 함께 기록한다.

각 image에는 OCI source·revision·created label, runtime과 공개 origin label을 기록한다. BuildKit은 SBOM과 최대 provenance를 생성하고 GitHub artifact attestation을 GHCR subject digest에 연결한다. 릴리스 workflow의 외부 GitHub Action도 검증한 full commit SHA로 고정한다. 개별 digest record는 30일, 집계 manifest는 90일 보존한다.

workflow는 `GITHUB_TOKEN`의 `packages: write`, attestation용 `attestations: write`, `artifact-metadata: write`와 `id-token: write`만 게시 job 범위에서 추가한다. 저장소 소유자는 Actions의 package 쓰기 허용 여부, 생성된 GHCR package 공개 범위와 운영 서버의 pull 권한을 GitHub 설정에서 확인해야 한다. private package를 사용하는 운영 서버에는 별도의 최소 read 권한 credential 전달 경계가 필요하다.

게시 직후 각 `name@digest`를 full SHA로 고정한 Anchore scan Action과 Grype `0.110.0`으로 검사한다. 수정 버전 존재 여부와 무관하게 `HIGH` 또는 `CRITICAL` 취약점이 하나라도 있으면 job이 실패하며 GitHub attestation, image digest record와 네 image manifest를 만들지 않는다. 검사 JSON은 성공·실패와 무관하게 `image-vulnerability-report-<service>-<revision>` artifact로 90일 보존한다. 스캐너 설치 또는 보고서 생성 자체가 실패해도 release는 실패한다.

검사 예외의 단일 진실 원천은 `deploy/security/image-vulnerability-policy.json`이다. 기본 예외는 0건이다. 예외에는 CVE 또는 GHSA 식별자, 정확한 package 이름, 대상 service, 20자 이상의 사유, GitHub 사용자·팀 owner와 `YYYY-MM-DD` 만료일이 모두 필요하다. 만료일 다음 날부터 preflight가 실패한다. workflow는 이 정책을 service별 최소 Grype 설정으로 변환하고 정책 digest를 image label, digest record와 최종 manifest에 기록한다.

검사 전에 candidate image가 GHCR에 push되므로 취약점 실패 image가 registry에 남을 수는 있지만, attestation과 배포 manifest가 없어 승인된 배포 입력으로 사용할 수 없다. base image digest 고정·갱신과 실패 candidate를 포함한 registry 보존·정리 정책은 아직 구현 전이다. 새 workflow의 실제 GHCR 게시, 스캔, attestation과 artifact 결과도 `main` 반영 후 확인해야 하므로 이 항목들이 끝나기 전에는 컨테이너 공급망 전체가 완료된 것으로 보지 않는다.

네 Dockerfile의 실제 build와 runtime smoke는 다음 canonical 명령으로 실행한다.

```sh
bun run test:deployment-images
```

이 명령은 Buildx로 네 image를 `linux/amd64` 대상의 task 전용 local tag로 빌드한다. image 설정과 실제 container UID가 모두 `10001`인지, 네 `/health` route가 응답하는지, web의 `public`과 web·admin의 `.next/static` 파일이 존재하는지 확인한다. host port를 공개하지 않고 `--network none`으로 실행하며 API에만 disposable SQLite 디렉터리를 연결한다. 성공·실패와 관계없이 이 task가 만든 container, image와 임시 데이터를 정리한다.

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

로컬 Windows 환경에서는 Compose 계약, image smoke 명령 조립·격리·비 root 판정, bootstrap 실행 환경·Ubuntu release·Ansible recap 파싱 unit test를 검증했다. Docker daemon이 실행되지 않아 Caddy·Litestream 설정과 실제 네 image build·runtime smoke는 새 Ubuntu CI 결과 확인이 필요하다. Ansible lint·syntax와 Ubuntu bootstrap 두 번째 실행의 `changed=0`도 새 CI 결과 확인이 필요하다. 실제 image digest와 외부 자격증명이 필요한 deploy 멱등성은 별도 disposable 배포 환경에서 추가로 수행해야 한다.
