# 런타임 설정 원칙

## 목적

이 문서는 설정의 소유권, 변경 절차와 보안 기준을 정의한다. 현재 환경 변수 이름·기본값·URL·port는 각 runtime의 parser, `.env.example`, 로컬 runtime 설정 source가 소유한다.

## 권위 소스

- 로컬 준비와 진단: `scripts/setup.ts`, `scripts/doctor.ts`
- 공통 로컬 runtime 값: `packages/config/env/src/local-runtime-defaults.ts`
- runtime별 환경 변수 계약: 각 앱의 환경 parser와 `.env.example`
- production 입력: `deploy/compose/`, Ansible inventory와 secret 관리 경계

## 설정 원칙

- 환경 변수는 runtime 경계에서 schema로 parse하고, parse 결과만 내부에 전달한다.
- 실행 진입점은 환경 원문을 한 번만 parse하고, app·container factory에는 검증된 runtime 설정만 전달한다. factory import는 process 시작이나 외부 자원 생성을 유발하지 않는다.
- `packages/infra/*`는 `process.env`를 직접 읽지 않고 조립 경계가 전달한 검증 완료 설정만 소비한다.
- 기본값은 한 source에서만 선언하고, 문서·test fixture·deployment script에 다시 적지 않는다.
- secret, 앱 public origin과 데이터 저장소 설정은 서로 다른 목적과 회전 수명을 가진 값으로 분리한다.
- production parser는 insecure 앱 origin과 약한 secret을 fail-fast해야 한다.
- `NODE_ENV`는 runtime 실행 모드이고 `DEPLOYMENT_ENVIRONMENT`는 운영 대상을 나타낸다. production 모드에서는 staging 또는 production 대상을 명시하고, development/test가 암묵적으로 production을 가리키지 않게 한다.
- 설정 추가·삭제는 parser, `.env.example`, local onboarding, deployment 입력과 검증을 같은 변경에서 갱신한다.

## 로컬 준비와 테스트

`bun run setup`은 누락된 앱 환경 파일을 예시에서 생성하고 API secret을 무작위 값으로 바꾼 뒤, 잠금 파일 기준 설치와 공개 migration·seed 진입점을 순서대로 실행한다. 기존 환경 파일은 수정하지 않는다. migration 전에 실행 중인 개발 서버를 종료하고 보존이 필요한 로컬 DB는 사용자가 직접 백업한다. `bun run doctor`는 필수 환경 파일의 존재와 API의 읽기 전용 DB schema·무결성 진단을 확인한다. 두 진입점은 별도 설정 모델이나 migration 절차를 다시 구현하지 않는다.

기본 seed는 누락된 개발 fixture만 삽입하고 기존 aggregate·인증·profile을 갱신하지 않는다. migration, 학습자·콘텐츠 seed와 관리자 seed는 하나의 transaction이 아니라 순서가 있는 별도 process이며, 중간 실패 뒤 멱등적으로 재실행해 완료하는 모델이다. 관리자 user와 credential fixture가 일부만 존재하거나 credential 계약과 다르면 자동 보정하지 않고 실패한다. 관리자 password 변경은 기본 seed와 분리된 명시적 승인 명령으로만 수행한다. 실제 변수명과 활성화 조건은 권위 source에서 확인한다.

삭제 학습자 정리 명령은 명시적으로 지정한 database URL, destructive 승인, 예상 database URL의 일치를 모두 검증한 뒤 실행한다. 출력은 정리 기준 시각과 삭제 건수로 제한하며 사용자 식별자나 민감 데이터를 기록하지 않는다. 실제 변수명과 실행 계약은 [정리 명령 source](../../apps/api/src/scripts/purge-deleted-learners.ts)가 소유한다.

일일 maintenance는 deleted 학습자, 만료 session, AI pending, DB audit와 orphan 콘텐츠 asset을 bounded batch로 정리하고 request·security 외부 보존 상태를 함께 JSON으로 보고한다. dry-run은 같은 cutoff와 대상 수를 사용하며 actual만 affected 수를 만든다. production actual은 명시한 배포 환경·database 확인과 destructive 승인에 더해 유효한 외부 log class retention 증거 파일이 없으면 실패한다. 배포 timer의 반복 실행 승인은 root 전용 `0600` maintenance 환경 파일에만 저장하고 일반 API 환경에는 넣지 않는다.

삭제 marker 복구는 timezone이 포함된 snapshot 시각, `DEPLOYMENT_ENVIRONMENT`와 같은 대상 환경, 격리 candidate DB 확인과 actual 승인을 요구한다. 복구·rollback처럼 작업마다 판단해야 하는 승인은 inventory나 지속 환경 파일에 저장하지 않고 해당 Ansible 실행의 extra vars와 container command에만 전달한다. 정확한 인자·변수와 guard는 [일일 명령](../../apps/api/src/scripts/maintenance-daily.ts), [복구 명령](../../apps/api/src/scripts/reapply-deletion-markers.ts)과 [restore playbook](../../infra/ansible/playbooks/restore.yaml)이 소유한다.

production의 앱 공개 URL은 HTTPS를 사용한다. 브라우저는 API base URL 설정 없이 앱별 상대 `/api` 경로를 사용하며, `API_BASE_URL`은 Next server와 개발 rewrite가 내부 API에 연결할 때만 사용한다. 실제 production build를 loopback에서 검증할 때만 HTTP를 허용하며, 이 경우 CSP nonce와 `strict-dynamic`은 유지하고 insecure request 승격만 제외한다. Web과 Admin의 직접 production 실행은 Next가 생성한 standalone server를 사용하며 정적·public asset 포함 여부를 smoke test한다.

AI feedback의 사용자별·전체 일일 request/success 한도, provider timeout과 pending TTL은 API 환경 parser가 검증해 module composition에 값으로 주입한다. success 한도는 대응하는 request 한도를 넘을 수 없고 provider timeout은 pending TTL보다 짧아야 한다. 변수명과 기본값의 권위 source는 [API 환경 parser](../../apps/api/src/config/env.ts), 로컬 예시는 [API 환경 예시](../../apps/api/.env.example)다. 현재 일일 quota 기본량은 제품 승인값이 아니라 출시 전 부하·비용 검증을 위해 둔 운영 초기 추론값이므로 production 확정 전에 별도 승인이 필요하다.

인증 메일은 API 조립 경계가 검증한 설정을 `@workspace/auth` 전달 Port에 주입한다. development와 test에서 provider 설정이 없으면 인메모리 adapter를 사용한다. production API는 Resend, Google OAuth, OpenAI, public content asset과 private 삭제 marker 설정이 완전하지 않으면 server를 열기 전에 실패한다. private marker는 public asset과 다른 bucket을 사용하고 production endpoint는 HTTPS여야 한다. Litestream credential과 replica 위치는 API 설정과 분리한 전용 runtime 파일로만 전달하며 Ansible이 service 시작 전에 검증한다.

Next image build에는 공개 origin과 비밀이 아닌 내부 routing 값만 전달한다. 인증·provider·storage credential은 build argument나 `NEXT_PUBLIC_` 변수로 전달하지 않고 배포 host의 권한 제한 runtime 파일에서만 주입한다. release smoke는 web/admin container에 API 전용 변수가 전달되지 않는지도 확인한다.

환경별 API 입력 예시는 [local](../../apps/api/.env.example), [test](../../apps/api/.env.test.example), [staging](../../apps/api/.env.staging.example), [production](../../apps/api/.env.production.example)으로 분리한다. staging과 production 예시의 placeholder는 실행값이 아니며, 실제 production 입력은 Ansible inventory와 Vault가 소유한다.

## 변경 검토

1. 값이 build-time, server runtime, browser public runtime, 운영 secret 중 어디에 속하는지 먼저 결정한다.
2. browser에 노출되는 값에는 secret이나 내부 topology를 포함하지 않는다.
3. 기존 환경 파일을 덮어쓰지 않고 누락 값만 보충하는지 확인한다.
4. 로그·진단·artifact가 secret 원문을 출력하지 않는지 검증한다.
5. 현재 기본값과 실제 연결 대상은 문서가 아니라 parser와 실행 smoke로 확인한다.
