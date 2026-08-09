# 배포 절차와 안전 기준

## 목적

이 문서는 production과 staging 배포의 승인, 실행, 검증과 복구 절차를 정의한다. 현재 service, image, port, network, proxy와 release 입력은 Compose, proxy 설정, Ansible과 workflow가 소유한다.

새 Ubuntu VPS의 첫 실행 순서, owner·staging fixture seed, 확인 기록과 비상 책임은 [첫 배포 runbook](./release-runbook.md)을 따른다.

## 배포 전제

- production 변경은 검증된 불변 image reference만 사용하고 대상 서버에서 build하지 않는다.
- application listener와 운영 제어 surface는 필요한 공개 경계 밖으로 노출하지 않는다.
- 데이터 저장소는 단일 writer·명시적 lifecycle·독립 복구가 가능한 위치를 사용한다.
- secret과 production 설정은 Git에 저장하지 않고 승인된 secret 관리 경계를 통해 제공한다.
- 현재 topology가 이 전제를 지키는지는 `deploy/compose/`와 proxy 설정을 직접 확인한다.

브라우저 API는 학습자와 관리자 public origin의 `/api` 경로를 사용하고 Caddy가 내부 단일 API runtime으로 전달한다. API 전용 public origin은 배포 입력이 아니며 API container는 호스트 port를 공개하지 않는다. 두 앱 origin은 session과 XSS 영향 범위를 분리하기 위해 서로 다르게 유지한다.

두 public hostname의 DNS A/AAAA는 VPS를 직접 가리키고 Caddy만 호스트의 80/443을 공개한다. Caddy는 두 hostname의 인증서 발급과 갱신을 automatic HTTPS로 관리하며, 별도 tunnel이나 외부 proxy가 전달한 client IP header를 신뢰하지 않는다. API에 전달하는 client IP 전용 header는 Caddy가 직접 연결의 remote address로 항상 덮어쓴다.

## 승인과 실행

Production image release의 유일한 자동 진입점은 [image release workflow](../../.github/workflows/image-release.yml)다. `main` push의 [필수 품질 게이트](../../.github/workflows/quality-gates.yml)가 같은 revision에서 성공한 뒤에만 web, API, admin image를 각각 빌드한다. 각 digest는 [취약점 정책](../../deploy/security/image-vulnerability-policy.json)의 HIGH 이상 기준과 만료되지 않은 명시적 예외를 통과해야 release tag, attestation과 manifest를 만들 수 있다. 외부 Action은 full commit SHA로 고정한다.

Release manifest는 source revision과 세 service의 immutable digest만 소유한다. Main의 deployment smoke는 현재 source Dockerfile을 검증한다. Release workflow는 취약점 검사를 통과해 registry에 게시된 바로 그 digest를 먼저 runner의 격리 Compose에서 실행한 뒤, 분리된 staging inventory에 배포해 실제 container digest·public DNS/TLS를 검증하고 승인된 fixture로 course 조회·lesson 시작·답안 제출 흐름을 실행한다. 이 전체 staging 경로가 통과한 뒤에만 `Production` environment 배포 job을 연다.

Production job은 protected environment 승인만으로 배포를 시작하지 않는다. [준비 증거 검사](../../scripts/production-readiness.ts)가 명시적 deploy 승인, 외부 법률 검토 식별자·검증 시각, 최근 31일 이내 staging 복구 훈련 식별자·검증 시각, 성공한 동일 revision main 전체 E2E run을 모두 확인해 일회성 Ansible 변수 파일을 만든다. Playbook도 호스트 변경 전에 source revision, 승인, evidence 형식과 복구 훈련 유효 기간을 다시 확인한다. 하나라도 없거나 placeholder·production 복구·만료·revision 불일치이면 실패한다.

Production 배포 job은 repository 전체에서 동시에 하나만 실행하며 실행 중 job을 취소하지 않는다. GitHub concurrency는 FIFO 대기열을 보장하지 않고 pending job을 더 최신 요청으로 교체할 수 있으므로, 호스트 변경 직전에 GitHub API의 현재 `main` reference와 release revision을 다시 비교한다. 더 최신 main이 있거나 API 조회에 실패하면 배포를 시작하지 않는다. 이 직렬화는 서로 다른 revision의 image build·scan 병렬성은 유지하면서 오래된 승인 job이 새 revision을 덮어쓰는 것을 막는다.

Evidence 식별자는 외부 기록을 연결하는 감사 reference이지 저장소가 법률 결과나 실제 복구 성공을 스스로 증명한다는 뜻이 아니다. GitHub `Production` environment 관리자는 연결된 결과의 범위와 진위를 확인한 뒤 변수와 reviewer 승인을 관리해야 한다. 현재 [외부 법률 검토 기록](../archive/2026-07-24-confirmed-product-baseline/privacy-legal-review-gate.md)과 [staging 복구 기준](./database-backup-restore.md)에는 실제 성공 증거가 없으므로 production launch gate가 해제됐다고 판정하지 않는다.

Image release workflow의 k6 baseline은 release digest를 staging에 배포·공개 검증한 뒤 GitHub `staging` environment가 제공하는 staging·production origin, 전용 학습자 session과 고정 lesson fixture만 사용해 한 번 실행한다. 실행 source는 staging 부하 승인이 없거나 두 origin이 같으면 요청 전에 실패해야 한다. 상태를 전진시키지 않는 multiple-choice 오답 제출만 허용하고 AI provider 호출과 production 부하 실행은 이 gate의 범위에서 제외한다. Main 품질 workflow에서 같은 suite를 선행 실행하지 않아, 기존 staging 장애를 수정하는 release가 이전 상태의 부하 gate에 막히는 교착을 피한다.

1. 배포 대상 revision, image reference, 두 앱 공개 origin과 대상 inventory의 일치 여부를 확인하고 production deploy 승인 입력을 명시한다. 승인 입력이 없으면 playbook은 호스트 변경 전에 중단해야 한다.
2. 신규 DB는 빈 파일에서 [현재 `0000` baseline](../../apps/api/drizzle/0000-current-schema-baseline.sql)을 적용하는 경로만 지원한다. 이력 없는 비어 있지 않은 DB와 지원하지 않는 migration 이력은 일반 deploy가 채택하거나 변환하지 않는다.
3. 실행 중 DB의 SQLite snapshot을 격리 디렉터리에 복제하고 candidate API image로 migration과 read-only application 진단을 리허설한다. 이 단계가 실패하면 기존 writer를 중지하지 않는다.
4. migration 호환성과 rollback 가능 여부를 판정한다. 이전 코드와 호환되지 않는 데이터 변경은 별도 승인 없이는 진행하지 않는다.
5. 리허설 성공 뒤 operation lock을 보존 상태로 전환하고 writer를 중지한다. 중지된 DB의 최종 검증 백업을 만든 뒤 실제 migration, DB 진단, 기동과 health·주요 읽기 smoke를 실행한다.
6. Deploy가 획득한 operation lock은 공개 DNS·TLS·핵심 route 검증까지 유지한다. 실행 중인 web·api·admin container의 실제 image reference가 release manifest digest와 모두 일치하고 공개 검증도 성공한 뒤에만 revision record와 검증 fingerprint를 기록하고 lock을 해제한다.

## Ansible 입력

현재 변수 이름과 기본값은 [defaults](../../infra/ansible/vars/defaults.yaml), 환경별 비밀이 아닌 입력과 Vault 계약은 [production](../../infra/ansible/inventories/production/)과 [staging](../../infra/ansible/inventories/staging/) inventory 예시가 소유한다. 디렉터리·container identity·고정 infrastructure image, AI quota·timeout과 계산된 origin은 defaults, public host·application image·provider·storage 위치는 group variables, 인증·서명·Resend·Google·OpenAI·S3 credential은 환경별 Vault에서 관리한다. deploy role은 runtime 파일을 렌더링하기 전에 이 입력, 환경별 backup path·marker prefix와 public/private bucket 분리를 값 비노출로 검증한다.

GitHub Actions의 repository·environment 입력 이름은 [release 입력 계약](../../deploy/github-release-inputs.json)이 소유한다. `bun run check:release-input-contract`는 계약과 workflow 참조의 이름·environment 대소문자를 정적으로 비교한다. `bun run preflight:release`는 현재 GitHub 설정을 읽기 전용으로 조회하고 누락된 이름만 scope별로 출력한다. 이 명령은 secret과 variable 값을 출력하지 않는다. 누락이 하나라도 있으면 staging 또는 production 배포를 시도하지 않는다.

Staging은 production과 다른 host, config·data·backup·deployment 경로, Vault, backup bucket·object path, public asset bucket과 private marker bucket·prefix를 사용한다. 별도 public asset bucket은 논리 prefix보다 강한 접근 경계를 제공한다. `NODE_ENV`는 최적화된 실행 모드이고 `DEPLOYMENT_ENVIRONMENT`는 실제 production/staging 대상을 나타낸다. API schema와 파괴적 maintenance·restore guard는 두 의미를 섞지 않고 대상 환경 확인값을 후자와 비교한다.

동일한 web·admin image digest를 staging에서 검증한 뒤 production으로 승격하려면 두 환경의 public asset origin을 image build 시점에 정확한 HTTPS origin 목록으로 고정한다. Wildcard, credential, path, query와 fragment는 허용하지 않으며, staging·production inventory는 같은 목록을 사용하고 각 환경의 runtime public asset base URL origin이 목록에 포함되지 않으면 배포 전에 실패한다. 이 목록은 공개 image 최적화 입력일 뿐 storage credential이나 bucket 접근 권한을 포함하지 않는다.

`writing_app_verify_public_routes`는 [verify](../../infra/ansible/playbooks/verify.yaml)의 DNS·TLS를 포함한 public health, GET-only 핵심 route, 배포 origin이 실제로 반영된 색인 정책 출력과 공개 페이지의 강제 CSP header 검증을 켠다. 색인 정책과 CSP는 설정 리터럴이 아니라 실제 응답으로만 확인할 수 있으므로 이 단계가 유일한 검증 지점이다. Production inventory에서는 활성화하고, 외부 경계를 검증할 수 없는 격리 bootstrap fixture에서만 비활성화한다. Production deploy의 승인·증거 변수와 `writing_app_allow_code_rollback`, `writing_app_code_rollback_database_compatible`, `writing_app_allow_database_restore`는 각각 해당 [deploy](../../infra/ansible/playbooks/deploy.yaml), [rollback](../../infra/ansible/playbooks/rollback.yaml), [restore](../../infra/ansible/playbooks/restore.yaml) 실행에만 전달하는 fail-closed 입력이며 inventory의 상시 secret으로 저장하지 않는다.

## 일일 maintenance timer

[maintenance role](../../infra/ansible/roles/writing_app_maintenance/)은 API process 내부 scheduler 대신 환경별 systemd oneshot service와 timer를 설치한다. timer는 deploy·rollback·restore와 같은 operation lock을 사용하며, immutable API image의 `maintenance-daily` 실행 파일을 bounded batch로 호출한다. 실제 일정과 batch는 defaults와 환경 inventory가 소유한다.

반복 실행 권한은 root 전용 `0600` maintenance 환경 파일에만 두고 API 환경 파일이나 일반 service에는 넣지 않는다. systemd unit은 Docker Unix socket에 필요한 범위만 남기고 privilege·device·filesystem 접근을 제한한다. Production actual은 외부 log sink의 class별 보존 검증 증거가 유효하지 않으면 애플리케이션 guard에서 실패하며, Ansible deploy도 증거 파일이 없으면 timer를 설치하기 전에 중단한다.

## 실패와 복구

- health, 실제 container digest 일치 또는 공개 smoke가 실패하면 새 revision을 정상 상태로 기록하지 않는다. 실제 DB 변경 뒤 시작한 공개 검증이 실패하면 operation lock을 보존하고 운영자가 상태와 복구 방향을 확인한다.
- 렌더링된 배포 입력의 fingerprint는 DB 검증과 서비스 health가 모두 성공한 뒤에만 검증 성공 marker로 기록한다. marker가 없거나 현재 입력과 다르면 같은 설정의 재실행도 전체 리허설·백업·migration 경로를 다시 거치고, bind-mounted 설정까지 반영되도록 서비스를 재생성해야 한다.
- 실제 DB 변경이 시작된 뒤 실패하면 operation lock을 자동 해제하지 않고 배포별 backup 디렉터리에 실패 단계와 수동 복구 안내를 기록한다.
- 코드 rollback과 데이터 복구는 별도 절차다. 코드 rollback이 데이터를 과거 시점으로 되돌리는 근거가 되지 않는다.
- 복구는 현재 실행 중인 revision, backup source, migration 상태와 영향 범위를 기록한 뒤 승인된 runbook으로 실행한다.
- 실패한 배포와 복구 결과는 기준 commit, 환경, 명령, 결과를 고정한 검증 기록으로 남긴다.

사고 분류·증거는 [관찰·운영 기준](./observability.md), DB 복구는 [백업·복구 절차](./database-backup-restore.md), code rollback은 [rollback 기준](./rollback.md), 탈퇴·삭제와 marker 처리는 [개인정보 기준](./privacy.md)을 따른다. 각 절차의 승인과 데이터 변경 의미를 하나의 편의 명령으로 합치지 않는다.

## 검증 경계

정적 설정 검증, image smoke, host bootstrap, 실제 deploy와 복구 훈련은 서로 다른 위험 수준이다. 각 명령의 현재 이름·입력·실행 환경은 root task, CI workflow와 deployment automation source를 확인한다. 운영 서버나 개발자의 기존 데이터를 대상으로 destructive 검증을 실행하지 않는다. Windows의 YAML parse와 fixture unit test는 Ubuntu에서의 `ansible-lint`, syntax check, bootstrap·maintenance role 두 번째 실행 `changed=0`을 대체하지 않는다. 실제 외부 staging replica 복원과 Ubuntu 재적용 증거가 없으면 해당 출시 gate는 미충족이다.

OpenAPI와 Orval client는 runtime과 같은 route source에서 build task로 결정적으로 재생성하며 산출물을 Git에 보존하지 않는다. 생성 순서와 schema 검증은 Turbo dependency와 계약 테스트로 확인한다. migration SQL은 application migration source를 Git에 보존한다. Astro UI 문서와 registry 정적 산출물은 source가 아니며 필요할 때 `apps/ui` manifest의 build task로 재생성한다. 현재 source는 API route, migration directory와 `apps/ui` manifest를 직접 확인한다.

## 변경 검토

- topology나 외부 연결 경계를 바꾸면 Compose·proxy·automation과 보안·관찰·rollback 문서를 함께 검토한다.
- image, base image, secret store, cloud provider 또는 데이터 저장소를 바꾸면 재현성·복구 가능성·비용·운영 복잡도를 ADR에서 비교한다.
- production 적용 성공은 실제 검증 보고서가 있을 때만 주장한다.
