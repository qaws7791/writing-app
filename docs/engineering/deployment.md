# 단일 Ubuntu 서버 배포

이 문서는 단일 Ubuntu 서버에서 Docker Compose로 writing-app을 실행하는 현재 배포 계약과 운영 절차를 정의한다. 실제 운영 적용과 관찰이 끝났다는 증거는 별도 작업 기록으로 남기며 이 문서에서 추정하지 않는다.

## 배포 기준

- 최초 지원 운영체제와 architecture는 Ubuntu 24.04 LTS, `linux/amd64`다.
- 애플리케이션 image는 `web`, `api`, `admin` 세 개다.
- public API는 하나이며 Caddy는 API Host의 모든 요청을 `api:4000`으로 전달한다.
- 관리자 HTTP 표면은 같은 API의 `/api/admin/*`에 있고 별도 service, image, port 또는 traffic rollback runtime은 없다.
- 애플리케이션 port를 host에 공개하지 않고 Cloudflare Tunnel만 외부 연결을 만든다.
- SQLite는 API와 같은 서버의 로컬 디스크에 두고 네트워크 파일시스템에서 공유하지 않는다.
- 운영 image는 변경 불가능한 `name@sha256:...` reference만 사용하고 production 서버에서 빌드하지 않는다.

## Compose topology

| service       | 내부 port | 책임                                               |
| ------------- | --------: | -------------------------------------------------- |
| `web`         |    `3000` | 학습자 Next.js 앱                                  |
| `api`         |    `4000` | 학습자 경로, `/api/admin/*`, 단일 SQLite lifecycle |
| `admin`       |    `3001` | 관리자 Next.js 앱                                  |
| `caddy`       |    `8080` | 내부 reverse proxy                                 |
| `cloudflared` |      없음 | Cloudflare Tunnel 연결                             |
| `litestream`  |      없음 | SQLite WAL을 R2로 연속 복제                        |

`database-restore`, `database-migrate`, `database-check`, `database-backup`은 운영 작업용 Compose service다. 모두 같은 operation lock과 명시적 lifecycle 아래에서만 실행한다.

정상 실행에서 `api`와 Litestream만 `/var/lib/writing-app/api.sqlite`를 사용한다. `apps/api`가 유일한 SQLite writer와 close owner이며 migration, 복구와 backup 작업은 API 쓰기 중지와 operation lock을 전제로 한다.

## 네트워크

- `edge`: Caddy와 Cloudflared만 연결하는 외부 전달 경계.
- `learner`: Caddy, web과 api의 학습자 내부 통신 경계.
- `admin`: Caddy, admin과 같은 api의 관리자 내부 통신 경계.
- `backup`: api 데이터와 Litestream·복구 작업 경계.

학습자와 어드민 SSR은 모두 `API_BASE_URL=http://api:4000`을 사용한다. 브라우저는 같은 public `NEXT_PUBLIC_API_BASE_URL`을 사용한다. 네트워크 분리는 frontend의 접근 범위를 제한하지만 별도 API runtime을 만들지 않는다.

## Caddy와 public Host

Caddy는 다음 세 public Host만 구분한다.

- 학습자 웹 Host → `web:3000`
- API Host → `api:4000`
- 어드민 웹 Host → `admin:3001`

Caddy 관리 API는 container loopback `127.0.0.1:2019`에만 bind하고 host에 노출하지 않는다. 설정 변경은 stateful 작업 전에 고정 Caddy image로 검증하며, file bind mount가 바뀌면 Caddy service를 force recreate해 새 inode를 사용하게 한다.

## 필수 운영 입력

| 입력                      | 의미                           |
| ------------------------- | ------------------------------ |
| `PRODUCTION_WEB_ORIGIN`   | 학습자 웹 HTTPS origin         |
| `PRODUCTION_API_ORIGIN`   | 하나의 public API HTTPS origin |
| `PRODUCTION_ADMIN_ORIGIN` | 어드민 웹 HTTPS origin         |
| `WEB_IMAGE`               | 학습자 웹 digest reference     |
| `API_IMAGE`               | API digest reference           |
| `ADMIN_IMAGE`             | 어드민 웹 digest reference     |

운영 inventory에는 세 public Host, 학습자·관리자 cookie domain, 서로 다른 학습자 인증·관리자 인증·cursor secret, registry credential, Cloudflare Tunnel token과 R2 설정을 제공한다. secret은 Git에 저장하지 않고 Ansible Vault 또는 승인된 secret store로 관리한다.

## 설정 검증

```bash
bun run check:deployment-config
bun run check:container-image-lock
bun run test:deployment-images
```

`check:deployment-config`는 Compose service, host port 비공개, network, SQLite volume, Caddy와 Litestream 설정을 검사한다. `test:deployment-images`는 `web`, `api`, `admin` 세 image를 `linux/amd64`로 빌드해 non-root UID/GID, health와 frontend 정적 자산을 검증한다. container 검증에는 Docker daemon이 필요하다.

## Image release

`main`의 필수 품질 게이트가 성공하면 같은 commit에서 세 application image를 빌드한다. 각 image는 고정 Grype 정책으로 검사하고 `HIGH` 이상 취약점이 있으면 release manifest 생성을 차단한다. 성공한 세 digest와 source revision, 세 public origin, 공개 설정 digest를 하나의 `production-image-digests-*` artifact에 기록한다.

각 image에는 OCI revision, source, version과 public origin label을 기록하고 BuildKit SBOM·provenance와 GitHub artifact attestation을 digest에 연결한다. `latest` tag는 배포 입력으로 사용하지 않는다.

## 배포 순서

1. operation lock을 획득하고 현재 배포와 DB 경로를 기록한다.
2. 고정 digest의 `web`, `api`, `admin` image를 pull한다.
3. 현재 Caddy 설정과 environment 조합을 별도 container로 검증한다.
4. API의 신규 쓰기를 중지하고 WAL checkpoint 뒤 SQLite snapshot을 만든다.
5. migration service를 한 번 실행하고 schema check를 통과시킨다.
6. 정상 Compose service를 기동한다.
7. Caddy 설정이 바뀌었으면 Caddy만 force recreate한다.
8. 세 application container health와 public web, API, `/api/admin/health`를 확인한다.
9. Litestream 상태와 배포 digest를 확인한 뒤 operation lock을 해제한다.

stateful 단계가 시작된 뒤 실패하면 자동으로 다음 단계를 계속하지 않는다. 실패 단계, DB snapshot, 현재·목표 digest와 수동 복구 절차를 남기고 incident 책임자가 코드 rollback 또는 DB restore를 결정한다.

## Rollback

코드 rollback은 이전에 검증된 `web`, `api`, `admin` digest로 Compose를 다시 기동하는 절차다. schema 호환이 확인되지 않으면 코드만 되돌리지 않고 배포 직전 snapshot을 새 경로에 복구한 뒤 `DATABASE_URL`을 전환한다.

제거된 별도 관리자 runtime을 다시 시작하는 traffic rollback은 지원하지 않는다. 인증, 관리자 경로 또는 API 장애도 같은 단일 API image의 이전 digest와 검증된 DB snapshot을 사용한다. 상세 판단 기준은 `rollback.md`, DB 절차는 `database-backup-restore.md`를 따른다.

## 아직 외부 확인이 필요한 항목

- 실제 Ubuntu 24.04 runner에서 세 image build·smoke와 Ansible lint·syntax 검증
- bootstrap 두 번째 실행의 `changed=0`
- 실제 registry 권한, Cloudflare와 R2 credential을 사용한 배포 멱등성
- public Host별 운영 관찰과 코드 rollback·DB restore rehearsal

진행 순서와 미완료 작업은 [`docs/work/2026-07-16-repository-onboarding-production-deployment/plan.md`](../work/2026-07-16-repository-onboarding-production-deployment/plan.md)에서 관리한다. 완료된 검증 결과는 해당 작업 단위를 `docs/archive`로 이동해 보존한다.
