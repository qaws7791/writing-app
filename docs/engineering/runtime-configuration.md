# 런타임 설정 원칙

## 목적

이 문서는 설정의 소유권, 변경 절차와 보안 기준을 정의한다. 현재 환경 변수 이름·기본값·URL·port는 각 runtime의 parser, `.env.example`, 로컬 runtime 설정 source가 소유한다.

## 권위 소스

- 로컬 준비와 진단: `scripts/setup.ts`, `scripts/local-onboarding.ts`, `scripts/doctor.ts`
- 공통 로컬 runtime 값: `packages/config/env/src/local-runtime-defaults.ts`
- runtime별 환경 변수 계약: 각 앱의 환경 parser와 `.env.example`
- production 입력: `deploy/compose/`, Ansible inventory와 secret 관리 경계

## 설정 원칙

- 환경 변수는 runtime 경계에서 schema로 parse하고, parse 결과만 내부에 전달한다.
- 실행 진입점은 환경 원문을 한 번만 parse하고, app·container factory에는 검증된 runtime 설정만 전달한다. factory import는 process 시작이나 외부 자원 생성을 유발하지 않는다.
- `packages/infra/*`는 `process.env`를 직접 읽지 않고 조립 경계가 전달한 검증 완료 설정만 소비한다.
- 기본값은 한 source에서만 선언하고, 문서·test fixture·deployment script에 다시 적지 않는다.
- secret, cookie, public origin과 데이터 저장소 설정은 서로 다른 목적과 회전 수명을 가진 값으로 분리한다.
- production parser는 insecure origin, 약한 secret, 상충하는 Host·cookie 설정과 test-only 설정을 fail-fast해야 한다.
- 설정 추가·삭제는 parser, `.env.example`, local onboarding, deployment 입력과 검증을 같은 변경에서 갱신한다.

## 로컬 준비와 테스트

`bun run setup`은 안전한 초기 준비 진입점이고 `bun run doctor`는 변경 없는 진단 진입점이다. setup은 API 환경 파일과 상속된 shell의 같은 키가 다르면 값은 출력하지 않고 중단하며, 검증한 환경을 migration과 seed 자식 process에 그대로 전달한다. 로컬 setup은 개발 환경과 관리자 password 보존 설정에서만 허용하고 database 경로의 환경 변수 보간은 거부한다.

기본 seed는 누락된 개발 fixture만 삽입하고 기존 aggregate·인증·profile·권한을 갱신하지 않는다. 관리자 fixture가 일부만 존재하거나 owner credential 계약과 다르면 자동 보정하지 않고 실패한다. password 변경, content reset과 전체 초기화는 명시적인 승인 명령으로 분리한다. 실제 변수명과 활성화 조건은 권위 source에서 확인한다.

## 변경 검토

1. 값이 build-time, server runtime, browser public runtime, 운영 secret 중 어디에 속하는지 먼저 결정한다.
2. browser에 노출되는 값에는 secret이나 내부 topology를 포함하지 않는다.
3. 기존 환경 파일을 덮어쓰지 않고 누락 값만 보충하는지 확인한다.
4. 로그·진단·artifact가 secret 원문을 출력하지 않는지 검증한다.
5. 현재 기본값과 실제 연결 대상은 문서가 아니라 parser와 실행 smoke로 확인한다.
