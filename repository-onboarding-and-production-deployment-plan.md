# 저장소 온보딩 및 프로덕션 배포 자동화 작업 계획

## 문서 상태

- 작성일: 2026-07-16
- 대상 저장소: `writing-app`
- 대상 런타임: Bun `1.3.10`, Node.js `24.x`
- 최초 배포 대상: Ubuntu `24.04 LTS`, `linux/amd64`
- 상태: 변경 단위 2 로컬 구현·Windows 검증 완료, 변경 단위 3 배포 구성 검증 작업 진행 중
- 기준 배포 구조: 단일 Ubuntu 서버, Docker Compose, Caddy, Cloudflare Tunnel, Litestream, Cloudflare R2, Ansible

## 목적

GitHub에서 저장소를 처음 발견한 사람이 `README.md`에서 프로젝트의 목적과 운영 제약을 이해하고, 저장소를 복제한 뒤 안전한 자동화 명령으로 로컬 환경을 준비하며, 필요한 외부 입력만 제공해 재현 가능한 프로덕션 환경을 구축할 수 있게 한다.

이 계획은 기존 Dockerfile, Docker Compose, Ansible, SQLite 백업·복구 구현을 폐기하거나 교체하지 않는다. 이미 존재하는 배포 구성 요소를 검증 가능한 하나의 사용자 흐름으로 연결하는 데 집중한다.

## 성공 기준

### 신규 사용자 온보딩

- 처음 방문한 사용자가 README에서 제품 목적, 주요 기능, 현재 완성도, 지원 환경과 제한 사항을 확인할 수 있다.
- 저장소 복제 후 `bun run setup` 한 번으로 도구 확인, 의존성 설치, 로컬 환경 파일 준비, 안전한 비밀값 생성, DB migration과 seed를 완료할 수 있다.
- setup은 멱등적이며 기존 환경 파일, 비밀값과 사용자 데이터를 명시적 승인 없이 덮어쓰지 않는다.
- `bun run doctor`가 누락된 도구, 잘못된 버전, 환경 변수 오류와 DB 준비 상태를 해결 방법과 함께 보고한다. port 충돌 진단은 후속 보완 범위다.
- Windows PowerShell과 Linux/macOS 또는 WSL2의 지원 범위와 명령 차이가 README에 명시된다.

### 프로덕션 배포

- 운영자가 도메인, 클라우드와 Cloudflare 계정, 비밀값, 이미지 registry 권한처럼 자동화할 수 없는 필수 입력을 한 곳에서 확인할 수 있다.
- OpenTofu와 cloud-init이 서버, 네트워크, 방화벽과 최초 접근 경계를 재현 가능하게 준비한다.
- GitHub Actions가 네 애플리케이션 이미지를 동일 commit에서 빌드하고 검사한 뒤 변경 불가능한 digest로 게시한다.
- 승인된 배포가 사전 점검, DB 백업, migration, 기동, health check와 smoke test를 순서대로 실행한다.
- 배포 실패 시 신규 이미지를 정상 상태로 기록하지 않으며 직전 정상 이미지로 코드 롤백할 수 있다.
- Litestream/R2 복제 상태와 복구 절차가 실제 Ubuntu 환경의 정기 훈련에서 검증된다.

### 운영

- 운영 버전, 배포 시각, 이미지 digest, migration 결과와 검증 결과를 추적할 수 있다.
- health check, 5xx, latency, SQLite 오류, 백업 지연과 디스크 사용량에 최소 경보가 존재한다.
- 단일 서버와 SQLite 구조의 가용성, 확장성, 배포 중단, RPO와 RTO 제한이 문서화된다.
- 신규 사용자가 이용 조건과 보안 제보 방법을 알 수 있도록 라이선스와 공개 저장소 운영 문서가 존재한다.

## 원칙

- README는 모든 세부 절차를 복제하지 않고, 가장 짧은 성공 경로와 canonical 상세 문서의 진입점을 제공한다.
- 자동화할 수 없는 계정 생성, 결제, 도메인 소유권, OAuth 승인과 운영 배포 승인은 사용자 입력으로 명시한다.
- 로컬 setup과 운영 deploy는 서로 다른 명령과 권한 경계를 사용한다.
- 서버 시작 과정에서 migration, seed 또는 reset을 암묵적으로 실행하지 않는다.
- secret은 Git, Docker build argument, 이미지 layer와 일반 로그에 포함하지 않는다.
- `NEXT_PUBLIC_*`와 origin처럼 빌드 결과에 영향을 주는 공개 설정은 이미지 metadata와 배포 전 검증 대상에 포함한다.
- 애플리케이션 이미지는 tag가 아니라 digest로 배포한다.
- 인프라 변경과 애플리케이션 배포는 plan, 승인, 적용, 검증 단계를 분리한다.
- 각 변경 단위는 독립적으로 병합하고 되돌릴 수 있어야 한다.
- CI에서 검증하지 않은 자동화는 완료로 표시하지 않는다.

## 범위

### 포함

- 루트 README와 GitHub 저장소 첫 화면 개선
- 로컬 개발 환경 setup과 진단 자동화
- Dockerfile, Compose, Caddy, Litestream, Ansible 정적·통합 검증
- 애플리케이션 이미지 build, 취약점 검사, SBOM, 게시와 digest 기록
- Ubuntu 서버와 네트워크 경계의 OpenTofu·cloud-init 자동화
- GitHub Actions 기반 승인형 프로덕션 배포
- 운영 smoke test, 코드 롤백, SQLite 백업과 R2 복구 훈련
- 최소 로그 수집, 메트릭, 경보와 배포 기록
- 라이선스, 기여, 보안 제보와 릴리스 정책
- 관련 `/docs` 문서 동기화

### 제외

- Kubernetes 도입
- 다중 region 또는 active-active 구성
- SQLite에서 별도 DB 서버로의 이전
- 단일 서버 제약을 숨기기 위한 임시 고가용성 구현
- Google OAuth나 Cloudflare 계정의 무인 생성
- 운영 데이터의 자동 seed
- 승인 없는 DB 복구 또는 파괴적 migration 자동 롤백

제외 항목이 프로덕션 요구사항이 되면 현재 단일 서버 배포 계약과 분리된 ADR과 migration 계획을 먼저 작성한다.

## 확인된 현재 상태와 격차

| 영역        | 현재 상태                                                          | 목표와의 격차                                                                            |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| README      | 구조, 도구, 수동 env 복사, 개발과 검증 명령을 제공한다.            | clone 명령, 제품 소개, 한 번의 setup, 배포 진입점, 운영 제약과 지원 정책이 없다.         |
| 로컬 setup  | 앱별 env 복사와 두 setup 명령을 사용자가 실행한다.                 | 비밀값 생성, 멱등성, 사전 점검과 성공 smoke가 하나의 흐름으로 연결되지 않는다.           |
| 컨테이너    | 네 Dockerfile, Next.js standalone, 비 root 사용자가 구현되어 있다. | CI image build, 취약점 검사, SBOM, 게시와 실제 실행 smoke가 없다.                        |
| Compose     | 앱, Caddy, cloudflared, Litestream과 운영 job이 정의되어 있다.     | 예제 env만으로 검증할 수 없고 Ansible이 만드는 설정 파일 fixture가 필요하다.             |
| Ansible     | bootstrap, deploy, verify, rollback, restore playbook이 있다.      | Linux syntax/lint, Ubuntu 멱등성, 실패 주입과 복구 통합 검증이 없다.                     |
| 인프라      | 운영 구조와 지원 OS가 문서에 정의되어 있다.                        | VM, firewall, SSH, DNS와 최초 host 준비를 생성하는 OpenTofu·cloud-init이 없다.           |
| CI          | lint, format, typecheck, test, E2E, build, audit을 실행한다.       | 인프라 검증, image release, environment 승인과 CD workflow가 없다.                       |
| 비밀값      | Ansible Vault 예시와 root 소유 환경 파일 정책이 있다.              | 초기 생성, 전달, rotation, CI 사용 경계와 운영자 절차가 하나의 계약으로 정리되지 않았다. |
| 백업·롤백   | SQLite snapshot, Litestream/R2, rollback/restore 절차가 있다.      | 실제 Ubuntu와 실제 R2 호환 endpoint에서 주기적으로 복구한 증거가 없다.                   |
| 관측성      | 구조화 API 요청 로그와 이벤트 계약이 있다.                         | 로그 수집기, metric backend, dashboard와 alert manager가 없다.                           |
| 공개 저장소 | 코드와 엔지니어링 문서가 공개 사용을 전제로 탐색 가능하다.         | LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT와 release 정책이 없다.                  |

## 필수 사용자 입력 계약

자동화 구현 전에 다음 입력을 하나의 표와 schema로 정의한다. 같은 값이 README, OpenTofu, Ansible과 GitHub Actions에서 서로 다른 이름으로 중복되지 않게 한다.

| 분류         | 입력                                                                | 필수 여부            | 보관 위치                          |
| ------------ | ------------------------------------------------------------------- | -------------------- | ---------------------------------- |
| GitHub       | repository, container registry, production environment              | 필수                 | GitHub 설정                        |
| 클라우드     | provider, project/account, region, instance 규격, SSH bootstrap key | 필수                 | OpenTofu 변수와 secret 저장소      |
| 도메인       | 학습자 웹/API, 관리자 웹/API hostname                               | 필수                 | OpenTofu 비민감 변수               |
| Cloudflare   | account/zone, Tunnel 자격 증명, R2 bucket과 API 자격 증명           | 필수                 | secret 저장소와 Ansible Vault 경계 |
| 인증         | 서로 다른 학습자·관리자 auth secret                                 | 필수                 | secret 저장소                      |
| Google OAuth | client ID와 client secret                                           | 기능 사용 시 필수    | secret 저장소                      |
| OpenAI       | API key와 지원 model                                                | AI 기능 사용 시 필수 | secret 저장소와 비민감 설정 분리   |
| 운영 정책    | deploy 승인자, backup 보존, RPO/RTO, alert 수신자                   | 필수                 | GitHub environment와 운영 문서     |

클라우드 provider, OpenTofu provider 버전, GitHub environment 보호 규칙과 secret 전달 방식은 저장소만으로 확정할 수 없으므로 구현 전에 확인이 필요하다. 확정된 버전은 lock file과 문서에 기록한다.

## 변경 단위와 의존성

| 변경 단위 | 작업                                 | 우선순위 | 선행 조건                  |
| --------- | ------------------------------------ | -------- | -------------------------- |
| 1         | 자동화 Interface와 사용자 입력 계약  | P0       | 없음                       |
| 2         | 로컬 setup·doctor와 README 빠른 시작 | P0       | 변경 단위 1                |
| 3         | 배포 구성 정적 검증과 CI 편입        | P0       | 변경 단위 1                |
| 4         | 컨테이너 release 공급망              | P0       | 변경 단위 3                |
| 5         | OpenTofu·cloud-init 인프라 생성      | P0       | 변경 단위 1, provider 결정 |
| 6         | 승인형 CD와 배포·롤백 연결           | P0       | 변경 단위 4, 5             |
| 7         | 운영 관측성·백업·복구 훈련           | P1       | 변경 단위 6                |
| 8         | 공개 저장소 운영 문서와 최종 인수    | P1       | 변경 단위 2~7              |

하나의 대규모 PR로 합치지 않는다. 각 변경 단위는 코드, 테스트와 해당 문서가 함께 완료된 상태로 병합한다.

## 변경 단위 1. 자동화 Interface와 입력 계약

### 작업

1. 로컬 setup, 진단, 인프라 plan, image release, deploy, verify, rollback의 책임과 입력을 정의한다.
2. 환경 변수와 인프라 변수의 canonical 이름을 정하고 중복 alias를 만들지 않는다.
3. 자동 생성 가능한 값과 사용자가 제공해야 하는 값을 구분한다.
4. production, staging 도입 여부를 확정한다. production에 직접 최초 검증하지 않도록 최소한의 disposable 검증 환경을 우선 검토한다.
5. 단일 서버 배포의 예상 중단 범위, 데이터 경계와 비용 항목을 README에 노출할 수준으로 정리한다.

### 산출물

- 입력 변수 표와 validation schema
- 자동화 명령 Interface 문서
- 필요한 경우 되돌리기 어려운 provider·secret 결정에 대한 ADR
- 구현 변경 단위별 책임자와 승인자

### 완료 조건

- 같은 의미의 URL, image reference와 secret이 계층마다 다른 이름을 사용하지 않는다.
- 필수 입력 누락은 apply나 deploy 이전 preflight에서 발견된다.
- secret과 공개 build 설정의 경계가 명시된다.
- 미확정 외부 상태가 `확인 필요`로 남고 기본값으로 추측되지 않는다.

## 변경 단위 2. 로컬 setup과 README 빠른 시작

### 작업

1. `bun run setup`을 멱등적 repository script로 구현한다.
2. toolchain 검사와 frozen lockfile 설치를 실행한다.
3. 앱별 `.env.example`에서 누락된 `.env`만 만들고 로컬 auth secret을 안전한 난수로 생성한다.
4. 기존 `.env`가 있으면 변경 내용을 먼저 보고하고 명시적 옵션 없이는 덮어쓰지 않는다.
5. 학습자 DB migration, 콘텐츠 seed와 관리자 seed를 기존 명령을 재사용해 실행한다.
6. `bun run doctor`로 버전, 환경 변수와 DB 상태를 진단한다. 파일 권한, port와 필수 route 진단은 후속 보완으로 분리한다.
7. README를 제품 소개, 지원 상태, 요구 도구, clone, 5분 빠른 시작, 테스트 로그인, 검증, 배포, 운영 제약, 문제 해결 순서로 재구성한다.
8. PowerShell과 POSIX 명령이 다르면 별도 tab 또는 블록으로 명시한다.
9. setup 실패를 네트워크, toolchain, env, DB 단계로 구분하고 재실행 가능성을 보장한다.

### 변경 예상 파일

- `README.md`
- `package.json`
- `scripts/setup.ts`
- `scripts/doctor.ts`
- `scripts/*.test.ts`
- `docs/engineering/runtime-configuration.md`
- `docs/engineering/testing.md`

파일 이름은 구현 중 기존 스크립트 구조를 확인한 뒤 확정한다. 동일 책임의 utility가 이미 있으면 새로 만들지 않고 재사용한다.

### 완료 조건

- 빈 clone에서 문서에 적힌 명령만으로 네 앱의 로컬 실행 준비가 끝난다.
- setup을 두 번 실행해도 두 번째 실행이 secret과 DB를 파괴하거나 불필요하게 변경하지 않는다.
- placeholder secret과 잘못된 production 값은 명시적으로 거부된다.
- `ENABLE_TEST_AUTH=true` 경로로 학습자 로그인을 검증하며 Google OAuth를 요구하지 않는다.
- Windows와 Ubuntu CI fixture에서 setup 핵심 흐름이 검증된다.

### 구현 상태

2026-07-16에 `bun run setup`, `bun run doctor`와 disposable 로컬 온보딩 fixture를 구현했다. setup은 기존 toolchain·migration·seed 명령을 조립하고 누락된 `.env`에만 난수 credential을 기록한다. doctor는 비밀값 원문을 출력하지 않고 toolchain, 환경 파일, 인증 분리, 테스트 인증과 공유 DB 경계를 확인한다. 학습자 API가 저장소 루트에서 실행되는 실제 경계에 맞게 `apps/api/.env.example`의 DB 경로를 `file:data/api.sqlite`로 교정했다.

Windows에서 멱등성 fixture, root tooling 전체 테스트, 전체 workspace test·typecheck·build, lint, format과 현재 로컬 환경 doctor를 통과했다. Ubuntu에서는 기존 GitHub Actions의 root tooling test가 같은 fixture를 실행한 결과를 확인한 뒤 변경 단위 2를 최종 완료로 표시한다. 실제 사용자 DB를 보존하기 위해 현재 작업공간에서 전체 setup 명령을 재실행하지 않았다.

## 변경 단위 3. 배포 구성 검증과 CI 편입

### 작업

1. Compose 정적 검증용 임시 env, caddyfile, Litestream 설정 fixture를 만든다.
2. 네 Dockerfile을 BuildKit으로 빌드하고 image 내부 사용자, entrypoint, health route와 정적 asset을 검사한다.
3. Caddy 설정과 Litestream 설정을 고정된 대상 버전에서 검증한다.
4. Ansible dependency를 고정 설치하고 `ansible-lint`, syntax check와 inventory validation을 실행한다.
5. disposable Ubuntu 24.04 환경에서 bootstrap과 deploy를 두 번 실행해 멱등성을 검증한다.
6. 컨테이너 기동 후 내부 health와 Caddy host route smoke를 실행하고 종료 시 모든 task 소유 리소스를 정리한다.
7. 검증을 root의 canonical 명령과 GitHub Actions quality gate에 연결한다.

### 검증 Interface

- `bun run check:deployment-config`
- `bun run check:deployment-ansible`
- `bun run test:deployment-images`
- `bun run test:deployment-integration`

앞의 두 정적 검증 Interface는 구현됐다. image와 Ubuntu 통합 검증 Interface는 아직 존재하지 않는 예정 Interface이며 구현 시 목적이 겹치면 더 작은 명령으로 통합한다.

### 구현 상태

2026-07-16에 disposable production fixture를 만드는 `check:deployment-config`를 구현했다. 이 검사는 `operations` profile을 포함한 Compose 렌더링 결과에서 서비스, port 비공개, health check, network와 SQLite volume 계약을 확인하고 Docker daemon이 있는 환경에서는 고정된 Caddy와 Litestream image로 설정을 로드한다. 실패 경로에서도 임시 fixture를 정리한다.

Linux 전용 `check:deployment-ansible`은 전체 `ansible-lint`와 저장소의 모든 playbook syntax check를 실행한다. 두 명령을 Ubuntu GitHub Actions 품질 게이트에 연결했다. Windows에서는 Compose 계약과 unit test를 통과했으며 Docker daemon 부재로 컨테이너 설정 검사와 Linux Ansible 검사는 새 CI 결과 확인이 필요하다. Dockerfile image smoke와 disposable Ubuntu 멱등성·통합 검증은 다음 하위 작업으로 남아 있다.

### 완료 조건

- example 값만 사용하는 clean checkout에서 Compose와 Ansible 정적 검증이 통과한다.
- 네 image가 `linux/amd64`에서 빌드되고 비 root 사용자로 실행된다.
- Next.js standalone의 `public`과 `.next/static` asset이 실제 image smoke에서 제공된다.
- Ubuntu bootstrap/deploy 두 번째 실행이 허용된 runtime 조회 외에 불필요한 변경을 만들지 않는다.
- 배포 파일 변경 PR은 관련 검증을 통과하지 않으면 병합할 수 없다.

## 변경 단위 4. 컨테이너 release 공급망

### 작업

1. main commit 또는 명시적 release에서 네 이미지를 같은 revision으로 빌드한다.
2. production build에 필요한 공개 origin을 검증된 workflow 입력으로 전달한다.
3. 이미지에 source revision, build time, runtime version과 공개 origin metadata를 기록한다.
4. container registry에 commit SHA tag와 digest를 게시하되 배포는 digest만 사용한다.
5. OS package와 application dependency 취약점 검사를 실행하고 차단 기준을 문서화한다.
6. 각 이미지의 SBOM과 provenance를 생성해 release artifact에 연결한다.
7. base image와 배포용 third-party image의 digest 고정 및 갱신 정책을 수립한다.
8. 동시 release의 tag 충돌과 오래된 image 정리 정책을 정의한다.

### 완료 조건

- 네 이미지가 하나의 commit과 공개 설정 집합으로 추적된다.
- workflow 결과에서 각 image digest를 기계 판독 가능한 artifact로 얻을 수 있다.
- 취약점 예외는 식별자, 사유, 만료일 없이 추가할 수 없다.
- build secret이 image history와 artifact에 존재하지 않는다.
- 동일 source와 동일 입력의 재빌드 차이가 있으면 원인을 관찰할 수 있다.

## 변경 단위 5. OpenTofu와 cloud-init 인프라 생성

### 작업

1. 확정된 cloud provider의 network, Ubuntu instance, volume, firewall과 최소 metadata를 OpenTofu module로 정의한다.
2. inbound는 확정된 SSH 관리 경계만 허용하고 애플리케이션 port 80, 443, 3000, 3001, 4000, 4001은 공개하지 않는다.
3. cloud-init은 deploy 사용자, SSH key, 시간 동기화와 Ansible 연결에 필요한 최소 bootstrap만 수행한다.
4. 애플리케이션 설치와 Docker 구성은 기존 Ansible role이 소유하게 해 cloud-init과 책임을 중복하지 않는다.
5. production state backend, state locking, encryption, 접근 권한과 복구 절차를 정의한다.
6. `tofu fmt`, `tofu validate`, provider lock, plan artifact와 정책 검사를 CI에 추가한다.
7. plan과 apply를 분리하고 production apply에는 GitHub environment 승인을 요구한다.
8. DNS, Tunnel과 R2 중 provider API로 안전하게 관리할 수 있는 범위를 확정하고 수동 선행 설정을 최소화한다.
9. destroy는 기본 배포 흐름에 포함하지 않고 데이터 volume과 R2 삭제를 별도 승인 경계로 둔다.

### 완료 조건

- 빈 계정 또는 격리된 테스트 project에서 plan과 apply가 재현된다.
- apply를 두 번 실행했을 때 두 번째 plan에 의도하지 않은 변경이 없다.
- SSH 접근을 잃지 않는 bootstrap과 방화벽 순서가 검증된다.
- secret이 state에 저장되는 항목과 저장되지 않는 항목이 문서화된다.
- instance 교체 뒤 Ansible bootstrap과 deploy를 다시 수행할 수 있다.
- production state를 로컬 파일이나 Git에 저장하지 않는다.

## 변경 단위 6. 승인형 CD와 배포·롤백 연결

### 작업

1. image release와 production deploy workflow를 분리한다.
2. deploy workflow는 네 image digest, 공개 origin, 대상 inventory와 현재 정상 배포 기록을 입력으로 받는다.
3. GitHub environment 승인 뒤 Ansible deploy를 실행한다.
4. 배포 전에 image metadata와 inventory origin 일치, secret 존재, DB와 disk 상태, backup 대상과 SSH 연결을 preflight한다.
5. 기존 SQLite snapshot 백업, API 쓰기 중지, migration, integrity check, Compose 기동과 verify 순서를 유지한다.
6. health와 주요 읽기 smoke가 실패하면 신규 버전을 정상 상태로 기록하지 않고 코드 롤백 playbook을 실행한다.
7. destructive migration 또는 이전 코드와 호환되지 않는 migration은 자동 코드 롤백 대상에서 제외하고 별도 승인 계획을 요구한다.
8. 성공한 digest 집합과 검증 결과를 서버 deployment record와 GitHub artifact에 함께 기록한다.
9. workflow 재실행, 동시 배포와 중간 취소가 배포 상태를 손상하지 않도록 concurrency를 제한한다.

### 완료 조건

- 운영자는 source를 서버에서 build하지 않고 승인된 digest만 배포한다.
- 동일 digest 재배포가 안전하고 결과가 관찰 가능하다.
- 실패 주입 시 직전 정상 코드로 돌아가며 DB는 자동으로 과거 시점으로 되돌리지 않는다.
- GitHub Actions와 서버 로그에 secret이 노출되지 않는다.
- 배포 성공과 실패에서 현재 실행 중인 네 digest를 확인할 수 있다.

## 변경 단위 7. 운영 관측성과 복구 훈련

### 작업

1. 구조화 로그의 수집, 보존, 검색 backend를 선택하고 API log field 계약을 유지한다.
2. health, request count, 5xx, latency, SQLite busy/locked, disk, container restart, Litestream replication lag와 마지막 정상 백업 시각을 수집한다.
3. `docs/engineering/observability.md`의 초기 임계값을 실제 alert rule로 구현한다.
4. alert 수신자, 무응답 escalation, 점검 시간과 false positive 조정 절차를 정한다.
5. production과 격리된 경로에 R2 복제본을 복구하고 integrity와 application read/write smoke를 실행하는 정기 훈련을 만든다.
6. 실제 측정 결과로 RPO와 RTO를 기록하고 README의 운영 제한에 반영한다.
7. disk full, image pull 실패, migration 실패, health 실패, 손상 백업과 R2 접근 실패를 순서대로 주입해 runbook을 검증한다.

### 완료 조건

- 사용자가 신고하기 전에 핵심 서비스 불능과 백업 중단을 운영자가 알 수 있다.
- 경보에서 배포 version과 request ID를 따라 관련 로그를 찾을 수 있다.
- 정기 복구 훈련이 운영 DB를 덮어쓰지 않고 별도 경로에서 수행된다.
- 마지막 성공 복구 시각, 복구 source, 무결성 결과와 소요 시간이 기록된다.
- 문서의 RPO/RTO가 추측값이 아니라 훈련 결과를 근거로 한다.

## 변경 단위 8. 공개 저장소 운영 문서와 최종 인수

### 작업

1. 프로젝트 목적, 기능, 화면, 기술 구조, 지원 상태와 배포 제한을 README 첫 화면에 제공한다.
2. 저장소 사용 의도에 맞는 라이선스를 소유자가 선택한 뒤 `LICENSE`를 추가한다. 라이선스 종류는 저장소만으로 결정하지 않는다.
3. `CONTRIBUTING.md`에 setup, 브랜치, 검증, 문서 동기화와 PR 기준을 정리한다.
4. `SECURITY.md`에 지원 버전, 비공개 취약점 제보 채널과 응답 범위를 명시한다.
5. 필요한 경우 `CODE_OF_CONDUCT.md`, issue/PR template와 CODEOWNERS를 추가한다.
6. release version, changelog, image 보존과 지원 정책을 문서화한다.
7. 저장소 소유자와 무관한 새 GitHub 계정 또는 격리 환경에서 README만 보고 전체 인수 테스트를 수행한다.
8. 인수 과정의 모든 막힘, 암묵적 지식과 수동 단계를 문서 또는 자동화로 환원한다.

### 완료 조건

- README의 모든 명령과 링크가 clean checkout에서 검증된다.
- 신규 사용자가 저장소 내부 구현 지식 없이 로컬 앱을 실행할 수 있다.
- 승인된 운영자가 canonical 문서와 workflow만으로 신규 서버 배포와 코드 롤백을 수행할 수 있다.
- 프로젝트 이용 조건, 기여 방법과 보안 제보 경로가 명확하다.
- 현재 미지원 기능과 운영 한계를 과장 없이 확인할 수 있다.

## 검증 매트릭스

| 계층                     | PR 검증                         | main/release 검증                  | 정기 검증                     |
| ------------------------ | ------------------------------- | ---------------------------------- | ----------------------------- |
| 문서                     | 링크, 명령 존재, document drift | clean checkout README smoke        | 신규 사용자 인수              |
| 로컬 setup               | unit, fixture, 멱등성           | Windows·Ubuntu setup smoke         | 지원 toolchain 변경 시 재검증 |
| Docker                   | lint/build, non-root, health    | 네 image 게시와 취약점 검사        | base image 갱신               |
| Compose/Caddy/Litestream | config validation               | production-like smoke              | dependency 갱신               |
| Ansible                  | lint, syntax                    | Ubuntu bootstrap/deploy 멱등성     | 분기별 재배포 훈련            |
| OpenTofu                 | fmt, validate, plan             | 승인 apply와 drift 확인            | 정기 drift 탐지               |
| 배포                     | workflow schema와 fixture       | 실제 deploy, verify, rollback gate | rollback 훈련                 |
| 데이터                   | backup unit/integration         | 배포 전 snapshot과 integrity       | 정기 R2 복구 훈련             |
| 운영                     | alert rule test                 | 배포 annotation과 health           | 경보·RPO·RTO 검토             |

## 위험과 통제

| 위험                                   | 통제                                                           |
| -------------------------------------- | -------------------------------------------------------------- |
| setup이 기존 로컬 데이터를 덮어씀      | 존재 검사, dry-run, 명시적 승인, DB reset과 분리               |
| 공개 build URL과 runtime origin 불일치 | release metadata 기록과 deploy preflight 비교                  |
| 방화벽 변경으로 SSH 접근 상실          | bootstrap 순서 검증, 기존 세션 유지, 단계별 apply              |
| secret이 GitHub log나 image에 노출     | masked secret, `no_log`, build secret 금지, artifact 검사      |
| migration 뒤 코드 롤백 불가능          | backward-compatible migration 기본, 배포 전 별도 rollback 판정 |
| 단일 서버 장애                         | 명시적 제한, 재생성 가능한 IaC, R2 복제와 측정된 복구 훈련     |
| SQLite 동시 쓰기 한계                  | lock metric과 alert, 부하 기준 초과 시 DB 이전 ADR             |
| mutable image로 재현성 상실            | digest 배포, provider lock, base image 갱신 절차               |
| CI가 production을 무단 변경            | 최소 권한, environment 승인, plan/apply 분리, concurrency 제한 |
| 자동 롤백이 데이터 손실을 확대         | 코드 롤백과 DB 복구 분리, DB 복구 별도 승인                    |

## 보류 항목과 도입 조건

### 다중 서버와 관리형 DB

현재 범위에 포함하지 않는다. 단일 서버의 가용성 또는 SQLite lock이 측정된 목표를 충족하지 못할 때 별도 ADR로 검토한다. 이때 Next.js cache, WebSocket, session, background 작업과 DB migration 전략을 함께 재설계해야 한다.

### 무중단 배포

현재 공유 SQLite migration과 단일 서버 구조에서 완전한 무중단을 약속하지 않는다. 실제 배포 중단 시간이 허용 기준을 초과할 때 blue/green 또는 별도 데이터 계층을 실험적 제안으로 평가한다. 평가에는 추가 비용, 데이터 호환성, rollback과 실패 주입 검증이 포함되어야 한다.

### 완전 무인 프로덕션 배포

운영 배포 승인과 파괴적 데이터 작업 승인은 제거하지 않는다. 반복 가능한 자동화의 목표는 수동 명령을 없애는 것이 아니라 사람이 결정해야 하는 지점과 기계가 결정적으로 실행할 지점을 분리하는 것이다.

## 문서 동기화 대상

각 변경 단위를 시작할 때 관련 문서의 현재 상태를 확인하고 완료 시 실제 Interface와 검증 결과를 반영한다.

- 저장소 진입점: `README.md`
- 배포 계약: `docs/engineering/deployment.md`
- 런타임과 환경 변수: `docs/engineering/runtime-configuration.md`
- 테스트와 CI: `docs/engineering/testing.md`
- 백업·복구: `docs/engineering/database-backup-restore.md`
- 롤백: `docs/engineering/rollback.md`
- 관측성: `docs/engineering/observability.md`
- 보안: `docs/engineering/security.md`
- 기술 결정: `docs/engineering/adr/`
- 엔지니어링 인덱스: `docs/engineering/_index.md`

## 최종 완료 기준

- GitHub의 README에서 제품, 지원 상태, 빠른 시작, 배포 진입점과 운영 한계를 확인할 수 있다.
- clean clone에서 예정된 setup과 doctor Interface가 Windows와 Ubuntu에서 통과한다.
- Docker, Compose, Caddy, Litestream과 Ansible 변경이 CI에서 검증된다.
- OpenTofu plan/apply로 새 Ubuntu host를 재현하고 Ansible로 멱등 배포할 수 있다.
- GitHub Actions가 검사된 네 image를 게시하고 승인된 digest를 배포한다.
- 배포 전 백업, migration, integrity, health와 smoke가 자동으로 연결된다.
- 실패한 배포는 정상 상태로 기록되지 않으며 검증된 코드 롤백 경로가 있다.
- R2 복구 훈련 결과로 RPO와 RTO가 기록된다.
- 핵심 장애와 백업 중단에 대한 로그, 메트릭과 경보가 동작한다.
- 라이선스, 기여와 보안 제보 정책이 저장소 사용 의도와 일치한다.
- 모든 문서가 실제 명령, 버전, 지원 범위와 자동화 상태를 과장 없이 설명한다.
