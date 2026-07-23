# 모듈러 모놀리스 전체 개편 실행 계획

> 상태: P0·P1·P2·P3·P4·P5·P6·P7·P8·P9·P10·P11·P12·P13·P14·P15 완료, P16 이후 미착수
> 기준 문서: [목표 아키텍처 가이드](./architecture-guide.md)  
> 작업 단위: `docs/work/2026-07-22-modular-monolith-redesign/`  
> 완료 처리: 영구 결론을 권위 문서에 반영한 뒤 작업 단위 전체를 `docs/archive/2026-07-22-modular-monolith-redesign/`로 이동

## 1. 문서 목적과 사용법

이 문서는 목표 아키텍처에 도달하기 위한 실행 순서와 검증 게이트를 한 곳에서 추적한다. 현재 package, route, 환경 변수, schema, migration, 배포 topology와 실행 명령의 값은 이 문서가 소유하지 않는다. 각 작업을 시작할 때 [사실별 권위 지도](../../authority-map.md)가 가리키는 코드와 설정을 다시 확인한다.

- 체크박스 하나는 한 사람이 한 번의 review에서 완료 여부를 판정할 수 있는 크기로 유지한다.
- 하위 항목과 단계 게이트가 모두 통과하기 전에는 상위 단계 완료 체크박스를 선택하지 않는다.
- 완료 항목 끝에는 PR, commit, test 출력 또는 artifact 위치를 `증거:` 뒤에 기록한다.
- 차단된 항목 끝에는 원인, 필요한 결정권자와 재개 조건을 `차단:` 뒤에 기록한다.
- 임시 alias, forwarding, allowlist와 이중 경로에는 같은 변경에서 제거 단계 ID를 연결한다.
- 실행 중 목표 구조가 바뀌면 구현보다 먼저 `architecture-guide.md`와 필요한 ADR을 갱신한다.
- 단계 게이트가 실패하면 다음 단계로 넘어가지 않고 해당 단계 안에서 원인을 해결한다.
- production 배포, production migration, 실제 복구와 외부 자원 삭제는 별도 승인 작업으로 취급한다.

## 2. 근거와 판단 경계

### 2.1 권위 문서

- 목표 상태와 완료 조건: [목표 아키텍처 가이드](./architecture-guide.md)
- 현재 사실의 소유자: [사실별 권위 지도](../../authority-map.md)
- 시스템 경계: [시스템 경계 원칙](../../engineering/system-overview.md)
- package 의존성: [Workspace dependency 정책](../../engineering/workspace-dependency-policy.md)
- package 공개 표면: [패키지 Interface와 import 규칙](../../engineering/package-interface-and-import-rules.md)
- architecture 검증: [Repository architecture tooling](../../engineering/repository-architecture-tooling.md)
- API·데이터·보안·운영 절차: [엔지니어링 문서 인덱스](../../engineering/_index.md)

### 2.2 검증된 사실과 추론

- 검증된 목표는 실행 앱 4개와 `modules` 6개, `infra` 8개, `shared` 7개, `config` 3개로 구성된 package 24개의 최종 구조다.
- 검증된 현재 사실은 코드와 설정에 있으며 이 계획에는 고정값으로 복제하지 않는다.
- `packages/core`, `apps/api`의 기존 module·adapter, `packages/db`의 schema를 새 bounded context로 나누는 상세 매핑은 파일 이름과 현재 공개 표면에서 도출한 초기 추론이다. P0에서 route, table, contract와 product invariant를 대조해 확정한다.
- 목표 가이드의 `unified migration`은 하나의 migration 계보와 실행 지점을 뜻하는 것으로 해석한다. 이미 적용된 migration의 squash나 재작성은 별도 승인과 복구 근거가 없는 한 수행하지 않는다.

### 2.3 실행 전략과 trade-off

capability별 수직 슬라이스 전환을 채택한다. 일괄 전환은 이중 경로 기간이 짧지만 회귀 범위와 데이터 위험이 크다. capability별 전환은 짧은 기간 임시 adapter와 병행 검증 비용이 생기지만, route parity·schema 소유권·rollback 경계를 모듈별로 판정할 수 있다. 임시 구조는 제거 ID와 소유자를 기록하고 최종 merge 상태에는 남기지 않는다.

architecture 도구도 짧은 병행 검증 후 교체한다. 기존 custom 검사와 새 표준 검사의 결과를 한 단계에서 대조한 뒤 custom package를 제거한다. 장기 중복 검사는 유지보수 drift를 만들기 때문에 허용하지 않는다.

단일 테스크가 끝날 때마다 모든 프로세스를 정리하고 작업 내역을 푸시하여 언제든 다시 돌아갈 수 있도록 대비한다.

## 3. 전체 단계 현황

- [x] P0. 기준선, 책임 매핑과 안전 조건을 확정한다.
- [x] P1. workspace, task graph와 architecture 도구 기반을 전환한다.
- [x] P2. shared package 기반을 구축한다.
- [x] P3. infra package 기반을 구축한다.
- [x] P4. `identity` 모듈을 전환한다.
- [x] P5. `content` 모듈을 전환한다.
- [x] P6. `ai-feedback` 모듈을 전환한다. 증거: [P6 구현 증거](./p6-validation.md)
- [x] P7. `learning` 모듈을 전환한다. 증거: [P7 구현 증거](./p7-validation.md)
- [x] P8. `resource-library` 모듈을 전환한다. 증거: [P8 구현 증거](./p8-validation.md)
- [x] P9. `operations` 모듈을 전환한다. 증거: [P9 구현 증거](./p9-validation.md)
- [x] P10. API composition root와 lifecycle을 완성한다. 증거: [P10 구현 증거](./p10-validation.md)
- [x] P11. 통합 schema, migration과 seed 경계를 완성한다. 증거: [P11 구현 증거](./p11-validation.md)
- [x] P12. web, admin과 Storybook 소비 경계를 전환한다. 증거: [P12 구현 증거](./p12-validation.md)
- [x] P13. 오류, 보안, 관측성과 외부 I/O 경계를 통합 검증한다. 증거: [P13 구현 증거](./p13-validation.md)
- [x] P14. 배포·운영 automation을 새 경로에 맞춘다. 증거: [P14 구현 증거](./p14-validation.md)
- [x] P15. 이전 구조와 모든 임시 호환 계층을 제거한다. 증거: [P15 구현 증거](./p15-validation.md)
- [ ] P16. 전체 품질·복구·사용자 흐름 검증을 완료한다.
- [ ] P17. 영구 문서 반영과 작업 기록 보관을 완료한다.

## 4. P0 — 기준선, 책임 매핑과 안전 조건

### 4.1 작업 착수 조건

- [x] P0-001 구현 기준 branch와 기준 commit을 기록한다. 증거: [P0 착수 기준](./p0-baseline.md)
- [x] P0-002 시작 시점의 tracked·untracked 변경을 기록하고 이 작업이 소유하지 않는 변경을 표시한다. 증거: [P0 착수 기준](./p0-baseline.md)
- [x] P0-003 작업 owner, architecture reviewer, data migration reviewer와 security reviewer를 정한다. 증거: [P0 착수 기준](./p0-baseline.md)
- [x] P0-004 capability별 PR 또는 commit 경계를 정하고 각 경계의 rollback 단위를 기록한다. 증거: [변경과 rollback 경계](./p0-baseline.md)
- [x] P0-005 임시 호환 항목의 `도입 이유 / owner / 제거 단계 / 만료 조건` 기록 형식을 정한다. 증거: [변경과 rollback 경계](./p0-baseline.md)
- [x] P0-006 production 변경은 별도 승인 전까지 범위 밖임을 작업 참여자와 확인한다. 증거: [P0 착수 기준](./p0-baseline.md)
- [x] P0-007 현재 실행 중인 dev server와 background process를 식별하고 종료 책임자를 정한다. 증거: [P0 착수 기준](./p0-baseline.md)

### 4.2 코드·설정 기준선

- [x] P0-008 root와 workspace manifest에서 현재 workspace inventory를 생성한다. 증거: [Workspace inventory](./p0-dependency-inventory.md)
- [x] P0-009 root manifest에서 catalog, scripts, engines와 package manager 값을 확인한다. 증거: [Workspace inventory](./p0-dependency-inventory.md)
- [x] P0-010 각 workspace의 name, export, import alias와 direct dependency를 목록화한다. 증거: manifest와 [공개 표면](./p0-dependency-inventory.md)
- [x] P0-011 현재 runtime dependency graph와 type-only graph를 분리해 저장한다. 증거: [내부 graph](./p0-dependency-inventory.md)
- [x] P0-012 현재 package public surface snapshot과 consumer를 연결한다. 증거: [공개 표면과 consumer](./p0-dependency-inventory.md)
- [x] P0-013 현재 route registry와 runtime OpenAPI를 저장한다. 증거: [HTTP와 OpenAPI](./p0-route-and-data-inventory.md)
- [x] P0-014 각 route의 method, path, audience, auth middleware, request schema와 response schema를 연결한다. 증거: [HTTP와 OpenAPI](./p0-route-and-data-inventory.md)
- [x] P0-015 web과 admin의 HTTP endpoint 소비 위치를 route inventory에 연결한다. 증거: [HTTP와 OpenAPI](./p0-route-and-data-inventory.md)
- [x] P0-016 현재 DB table, index, trigger, FK와 schema source의 소유 위치를 목록화한다. 증거: [Schema와 migration](./p0-route-and-data-inventory.md)
- [x] P0-017 현재 cross-capability FK와 SQL join을 식별한다. 증거: [Cross-context 접근](./p0-route-and-data-inventory.md)
- [x] P0-018 적용된 migration 순서, checksum 또는 동등한 식별 정보와 실행 지점을 기록한다. 증거: [Schema와 migration](./p0-route-and-data-inventory.md)
- [x] P0-019 seed entry, reset 경로와 destructive guard를 기록한다. 증거: [Seed·환경·배포·test](./p0-route-and-data-inventory.md)
- [x] P0-020 env parser, `.env.example`, local runtime default와 deployment 입력의 연결을 확인한다. 증거: [Seed·환경·배포·test](./p0-route-and-data-inventory.md)
- [x] P0-021 Compose, proxy, image build, release workflow와 rollback automation이 참조하는 source 경로를 기록한다. 증거: [Seed·환경·배포·test](./p0-route-and-data-inventory.md)
- [x] P0-022 test workspace, coverage 대상, Storybook test와 Playwright project를 기록한다. 증거: [Seed·환경·배포·test](./p0-route-and-data-inventory.md)
- [x] P0-023 현재 root quality gate를 실행해 기존 실패와 이번 작업으로 생긴 실패를 구분할 기준선을 만든다. 증거: [시작 품질 기준선](./p0-baseline.md), [최종 gate](./p0-validation.md)

### 4.3 사용자 동작 기준선

- [x] P0-024 test auth 설정이 production에서 fail-closed하는지 확인한다. 증거: env·auth test, [사용자와 데이터 기준선](./p0-validation.md)
- [x] P0-025 학습자 인증, 코스 조회, 레슨 시작, 답안 저장, 레슨 완료 흐름을 기준선으로 고정한다. 증거: [전체 workspace test](./p0-validation.md)
- [x] P0-026 학습자 AI 피드백의 성공, 제한, provider 부재와 timeout 동작을 고정한다. 증거: [전체 workspace test](./p0-validation.md)
- [x] P0-027 관리자 인증, role·owner 거부와 session 폐기 동작을 고정한다. 증거: [전체 workspace test](./p0-validation.md)
- [x] P0-028 콘텐츠 draft 편집, 발행, archive와 reset 동작을 고정한다. 증거: [전체 workspace test](./p0-validation.md)
- [x] P0-029 관리자 dashboard·analytics·설정·AI 대화 동작을 고정한다. 증거: [전체 workspace test](./p0-validation.md)
- [x] P0-030 자료실 tree, 문서 저장, 검색, asset upload·delete와 version conflict 동작을 고정한다. 증거: [전체 workspace test](./p0-validation.md)
- [x] P0-031 learner·admin health와 graceful shutdown 동작을 고정한다. 증거: [전체 workspace·scripts test](./p0-validation.md)
- [x] P0-032 격리된 fixture에서 현재 migration, backup과 restore smoke를 실행한다. 증거: DB 45 tests, [사용자와 데이터 기준선](./p0-validation.md)
- [x] P0-033 기준선에서 발견한 기존 결함을 별도 항목으로 분리하고 architecture 전환 성공 조건을 왜곡하지 않게 한다. 증거: [기존 결함과 실행 환경 분리](./p0-validation.md)

### 4.4 bounded context 책임 확정

- [x] P0-034 현재 source를 `identity`, `content`, `ai-feedback`, `learning`, `resource-library`, `operations` 후보로 분류한다. 증거: [책임 배정](./p0-boundary-decisions.md)
- [x] P0-035 각 route를 정확히 하나의 module HTTP interface 또는 공통 platform route에 배정한다. 증거: [HTTP와 OpenAPI](./p0-route-and-data-inventory.md)
- [x] P0-036 각 table과 trigger를 정확히 하나의 module 또는 auth infra에 배정한다. 증거: [Schema와 migration](./p0-route-and-data-inventory.md)
- [x] P0-037 각 canonical wire contract를 정확히 하나의 context subpath에 배정한다. 증거: [Contract·ID·module 협력](./p0-boundary-decisions.md)
- [x] P0-038 공유 ID 중 transport-neutral brand로 이동할 항목을 확정한다. 증거: [Contract·ID·module 협력](./p0-boundary-decisions.md)
- [x] P0-039 module 간 즉시 조회를 공개 query port로 분류한다. 증거: [Contract·ID·module 협력](./p0-boundary-decisions.md)
- [x] P0-040 주요 command에 필수인 동기 협력을 공개 application port로 분류한다. 증거: [Contract·ID·module 협력](./p0-boundary-decisions.md)
- [x] P0-041 commit 이후 비핵심 후속 효과를 domain event로 분류한다. 증거: [Contract·ID·module 협력](./p0-boundary-decisions.md)
- [x] P0-042 반드시 전달되어야 하거나 재생이 필요한 효과를 in-memory event 대상에서 제외한다. 증거: [Contract·ID·module 협력](./p0-boundary-decisions.md)
- [x] P0-043 operations가 직접 읽는 다른 capability table과 repository를 모두 식별한다. 증거: [Cross-context 접근](./p0-route-and-data-inventory.md)
- [x] P0-044 domain·application의 framework, ORM, provider SDK, `process.env`, 시간과 ID 직접 호출을 식별한다. 증거: [순수성 기준선](./p0-boundary-decisions.md)
- [x] P0-045 frontend와 Storybook의 금지 대상 import를 식별한다. 증거: [순수성 기준선](./p0-boundary-decisions.md)
- [x] P0-046 책임이 겹치거나 소유자를 결정하지 못한 source·route·table·contract를 0개로 만든다. 증거: [책임 배정](./p0-boundary-decisions.md)

### 4.5 결정과 위험 통제

- [x] P0-047 modular monolith, package 재편과 migration 계보 변경에 필요한 ADR 범위를 판정한다. 증거: [데이터와 외부 I/O 결정](./p0-boundary-decisions.md)
- [x] P0-048 이미 적용된 migration을 보존하는 append-only 전환 전략을 확정한다. 증거: [Schema와 migration](./p0-route-and-data-inventory.md)
- [x] P0-049 cross-module FK 제거 시 필요한 데이터 사전 검사와 application-level reconciliation을 정한다. 증거: [데이터와 외부 I/O 결정](./p0-boundary-decisions.md)
- [x] P0-050 SQLite 단일 writer, transaction 범위와 외부 I/O 분리 원칙을 확인한다. 증거: [데이터와 외부 I/O 결정](./p0-boundary-decisions.md)
- [x] P0-051 in-memory event bus가 권위 projection을 만들지 않는다는 제한을 확인한다. 증거: [데이터와 외부 I/O 결정](./p0-boundary-decisions.md)
- [x] P0-052 outbox, worker, Redis와 generic queue를 이번 범위에 추가하지 않음을 확인한다. 증거: [데이터와 외부 I/O 결정](./p0-boundary-decisions.md)
- [x] P0-053 route·wire·데이터 호환성의 허용 변경과 금지 변경을 정한다. 증거: [호환성과 중단 조건](./p0-boundary-decisions.md)
- [x] P0-054 각 단계의 중단 조건과 안전한 되돌리기 지점을 위험 기록에 연결한다. 증거: [호환성과 중단 조건](./p0-boundary-decisions.md)
- [x] P0-055 P0 게이트: 미배정 책임, 미분류 cross-module 접근과 기준선 미확보 항목이 0개다. 증거: [P0 경계 결정](./p0-boundary-decisions.md), [검증](./p0-validation.md)

## 5. P1 — workspace, task graph와 architecture 도구

### 5.1 workspace 전환 준비

- [x] P1-001 target group을 포함하는 임시 workspace glob을 설계하고 최종 `packages/*` 제거 단계를 P15에 연결한다. 증거: [Workspace와 config](./p1-validation.md)
- [x] P1-002 같은 package name이 두 workspace에서 동시에 발견되지 않는 fixture를 추가한다. 증거: `scripts/workspace-inventory.test.ts`
- [x] P1-003 source 없는 generated directory가 workspace로 오인되지 않는 fixture를 유지한다. 증거: `scripts/workspace-inventory.test.ts`
- [x] P1-004 target 2단계 glob과 최종 package inventory fixture를 추가한다. 증거: `scripts/fixtures/target-workspace-inventory.json`
- [x] P1-005 root catalog의 공유 dependency 후보를 실제 consumer 수로 다시 계산한다. 증거: `scripts/check-workspace-dependency-versions.ts`
- [x] P1-006 공유 dependency는 root exact catalog, 단일 consumer dependency는 workspace manifest가 소유하게 정리한다. 증거: [Workspace와 config](./p1-validation.md)
- [x] P1-007 runtime import와 test·build import를 dependency와 devDependency로 구분한다. 증거: workspace manifest와 Knip gate
- [x] P1-008 내부 dependency를 `workspace:*`로 통일한다. 증거: `bun run check:workspace-dependency-versions`
- [x] P1-009 transitive dependency에 기대는 import를 검사하는 fixture를 추가한다. 증거: dependency-cruiser 금지 fixture

### 5.2 config package 분리

- [x] P1-010 `@workspace/typescript-config`의 public config entry와 소비 workspace를 확정한다. 증거: package manifest와 [Workspace와 config](./p1-validation.md)
- [x] P1-011 TypeScript config source를 `packages/config/typescript-config`로 이동한다. 증거: `packages/config/typescript-config/`
- [x] P1-012 모든 workspace의 `extends`와 manifest dependency를 새 package에 맞춘다. 증거: `bun run typecheck`
- [x] P1-013 runtime별 strict option과 module resolution이 유지되는지 typecheck한다. 증거: [최종 gate](./p0-validation.md)
- [x] P1-014 `@workspace/nextjs-config`의 CSP·security header helper 공개 표면을 확정한다. 증거: `packages/config/nextjs-config/package.json`
- [x] P1-015 Next.js config source를 `packages/config/nextjs-config`로 이동한다. 증거: `packages/config/nextjs-config/`
- [x] P1-016 web과 admin config 소비 경로와 dependency를 갱신한다. 증거: app manifest·Next config, build gate
- [x] P1-017 `@workspace/env`를 `packages/config/env`로 이동한다. 증거: `packages/config/env/`
- [x] P1-018 env parser와 local runtime default의 public subpath를 유지하거나 명시적으로 전환한다. 증거: `packages/config/env/package.json`, env 26 tests
- [x] P1-019 client bundle이 server env parser를 포함하지 않는지 검사한다. 증거: `frontend-does-not-import-server-env-parser`
- [x] P1-020 config package가 다른 workspace package에 의존하지 않는지 검사한다. 증거: config 상향 runtime edge 0, architecture gate
- [x] P1-021 이전 `@workspace/config` package와 경로를 제거한다. 증거: `bun run check:package-interfaces`

### 5.3 Turborepo와 root task

- [x] P1-022 `build`, `lint`, `test`, `typecheck`의 dependency graph를 target workspace에 맞춘다. 증거: `turbo.json`, [Task graph와 CI](./p1-validation.md)
- [x] P1-023 build output과 cache input이 각 runtime의 실제 output·env 입력을 반영하는지 확인한다. 증거: `scripts/turbo-cache-contract.test.ts`
- [x] P1-024 `dev` task를 persistent·non-cache로 유지한다. 증거: `turbo.json`, lifecycle test
- [x] P1-025 root `check:architecture` entry를 추가한다. 증거: root `package.json`
- [x] P1-026 root `check:dead-code` entry를 추가한다. 증거: root `package.json`
- [x] P1-027 root lint가 architecture, dead-code와 Oxlint warning 실패를 포함하게 한다. 증거: root lint 통과
- [x] P1-028 기존 setup, doctor, DB, Storybook, E2E와 deployment task를 새 workspace graph에서도 보존한다. 증거: root manifest와 scripts 119 tests
- [x] P1-029 CI cache key와 path filter가 2단계 package 경로를 포함하게 한다. 증거: `.github/workflows/quality-gates.yml`

### 5.4 dependency-cruiser

- [x] P1-030 dependency-cruiser를 root 개발 dependency로 선언한다. 증거: root manifest·lockfile
- [x] P1-031 TypeScript config와 private alias를 해석하는 기본 설정을 만든다. 증거: `scripts/check-architecture.ts`
- [x] P1-032 runtime cycle 금지 규칙을 추가하고 type-only edge를 구분한다. 증거: `no-circular-runtime-dependencies`와 fixture
- [x] P1-033 undeclared·unknown dependency 금지 규칙을 추가한다. 증거: `no-unlisted-dependencies`와 fixture
- [x] P1-034 config의 상향 의존 금지 규칙을 추가한다. 증거: `config-does-not-depend-up`
- [x] P1-035 shared의 app·module·infra 의존 금지 규칙을 추가한다. 증거: `shared-does-not-depend-up`
- [x] P1-036 infra의 app·module 의존 금지 규칙을 추가한다. 증거: `infra-does-not-depend-on-modules-or-apps`
- [x] P1-037 module 간 내부 import 금지 규칙을 capture fixture와 함께 추가한다. 증거: `modules-do-not-import-other-module-internals`
- [x] P1-038 domain 순수성 규칙을 허용·금지 fixture와 함께 추가한다. 증거: `domain-is-layer-pure`, runtime framework fixture
- [x] P1-039 application의 concrete adapter·interface 의존 금지 규칙을 추가한다. 증거: `application-does-not-import-concrete-adapters`
- [x] P1-040 frontend의 module·DB·Drizzle import 금지 규칙을 추가한다. 증거: frontend·legacy frontend rules
- [x] P1-041 Storybook의 UI·config 외 package import 금지 규칙을 추가한다. 증거: `storybook-only-consumes-ui-and-config`
- [x] P1-042 package 내부 private alias와 workspace public subpath 해석 fixture를 추가한다. 증거: dependency-cruiser allowed fixture
- [x] P1-043 넓은 directory 예외 대신 파일·edge 단위의 임시 allowlist와 제거 ID를 기록한다. 증거: [Graph 정책](../../engineering/repository-architecture-tooling.md)

### 5.5 Knip과 package interface 검사

- [x] P1-044 Knip을 root 개발 dependency로 선언한다. 증거: root manifest·lockfile
- [x] P1-045 apps와 네 package group의 workspace 설정을 추가한다. 증거: `knip.json`
- [x] P1-046 dynamic entry의 실제 사용 경로를 확인하고 필요한 최소 entry만 선언한다. 증거: `knip.json`
- [x] P1-047 generated output을 source 검사에서 제외하되 source directory 전체를 숨기지 않는다. 증거: `knip.json`
- [x] P1-048 `knip --fix`를 자동 gate에서 제외하고 읽기 전용 검사만 연결한다. 증거: root `check:dead-code`
- [x] P1-049 explicit export subpath만 허용하는 package interface 검사를 target package에 맞춘다. 증거: `scripts/check-package-interfaces.ts`
- [x] P1-050 module `./schema`와 `./seed` consumer를 migration·seed tooling으로 제한한다. 증거: dependency-cruiser rule
- [x] P1-051 broad root barrel, `src` deep import와 자기 public path 역참조 검사를 추가한다. 증거: `scripts/check-package-interfaces.ts`
- [x] P1-052 forwarding file과 삭제된 runtime identifier 재도입 검사를 추가한다. 증거: `scripts/check-package-interfaces.ts`

### 5.6 custom repository tooling 제거

- [x] P1-053 `@workspace/repository-tooling`의 모든 consumer를 기능별로 분류한다. 증거: [Custom tooling 제거](./p1-validation.md)
- [x] P1-054 import graph, cycle과 boundary 검사를 dependency-cruiser로 치환한다. 증거: architecture config·runner
- [x] P1-055 unused file·export·dependency 검사를 Knip으로 치환한다. 증거: `knip.json`, dead-code gate
- [x] P1-056 workspace inventory 검사를 root manifest 기반의 좁은 검사로 치환한다. 증거: `scripts/workspace-inventory.ts`
- [x] P1-057 package public surface 검사를 특정 package를 소유하는 root script로 치환한다. 증거: `scripts/check-package-interfaces.ts`
- [x] P1-058 coverage 집계와 CI summary 해석이 필요한지 재검증하고 각 task owner로 이동한다. 증거: `scripts/coverage-report.ts`, `scripts/ci-workspace-inventory-report.ts`
- [x] P1-059 기존 검사와 새 검사를 같은 commit에서 실행해 허용·금지 fixture 결과를 대조한다. 증거: [Custom tooling 제거](./p1-validation.md), scripts·workspace test
- [x] P1-060 새 도구가 놓치는 정책을 좁은 fixture로 보완한다. 증거: dependency-cruiser fixture와 package interface snapshot
- [x] P1-061 root와 workspace manifest에서 `@workspace/repository-tooling` dependency를 제거한다. 증거: manifest scan·Knip gate
- [x] P1-062 `packages/repository-tooling`과 중복 graph script를 제거한다. 증거: deleted paths guard
- [x] P1-063 architecture 정책이 Oxlint와 custom parser에 중복 구현되지 않았는지 검사한다. 증거: [도구 책임](../../engineering/repository-architecture-tooling.md)
- [x] P1-064 P1 게이트: frozen install, tool fixture, architecture, dead-code, lint와 기존 핵심 build가 통과한다. 증거: [최종 gate](./p0-validation.md)

## 6. P2 — shared package 기반

### 6.1 `@workspace/types`

- [x] P2-001 transport-neutral brand와 ID의 canonical 목록을 P0 contract inventory와 대조한다. 증거: `packages/shared/types/src/ids.ts`, [P2 검증](./p2-validation.md)
- [x] P2-002 `packages/shared/types` workspace와 private alias를 만든다. 증거: `packages/shared/types/package.json`
- [x] P2-003 `Brand`를 runtime 없는 type으로 구현한다. 증거: `packages/shared/types/src/brand.ts`
- [x] P2-004 module 간에 전달되는 ID를 의미별 brand로 정의한다. 증거: `packages/shared/types/src/ids.ts`
- [x] P2-005 string→brand 변환을 Zod transform 또는 신뢰 경계 factory로 제한한다. 증거: contract ID schema와 adapter·DB ID factory, [P2 검증](./p2-validation.md)
- [x] P2-006 기존 contracts·core의 중복 brand 정의를 소비자별로 전환한다. 증거: `scripts/check-package-interfaces.ts`
- [x] P2-007 서로 다른 ID의 오용을 거부하는 typecheck fixture를 추가한다. 증거: `packages/shared/types/src/ids.typecheck.ts`
- [x] P2-008 root barrel 없이 필요한 subpath만 export한다. 증거: `packages/shared/types/package.json`, package interface gate

### 6.2 `@workspace/kernel`

- [x] P2-009 `packages/shared/kernel` workspace와 private alias를 만든다. 증거: `packages/shared/kernel/package.json`
- [x] P2-010 neverthrow를 direct dependency로 선언하고 필요한 Result API만 재노출한다. 증거: `packages/shared/kernel/package.json`, `packages/shared/kernel/src/result.ts`
- [x] P2-011 `Clock` 계약을 정의한다. 증거: `packages/shared/kernel/src/clock.ts`
- [x] P2-012 generic `IdGenerator` 계약을 정의한다. 증거: `packages/shared/kernel/src/clock.ts`
- [x] P2-013 immutable `DomainEvent` 계약을 정의한다. 증거: `packages/shared/kernel/src/domain-event.ts`
- [x] P2-014 immutable `DomainDecision` 계약을 정의한다. 증거: `packages/shared/kernel/src/domain-event.ts`
- [x] P2-015 mutable event queue API를 공개하지 않는 interface test를 추가한다. 증거: `packages/shared/kernel/src/domain-event.typecheck.ts`
- [x] P2-016 기존 core shared Result 소비자를 새 subpath로 전환한다. 증거: core·API import와 387개 회귀 test, [P2 검증](./p2-validation.md)
- [x] P2-017 kernel이 framework, DB, provider와 `process.env`에 의존하지 않는지 검사한다. 증거: `kernel-does-not-import-*` architecture 규칙과 package interface gate

### 6.3 `@workspace/errors`

- [x] P2-018 공통 infrastructure·transport 오류 vocabulary의 최소 범위를 확정한다. 증거: `packages/shared/errors/src/infrastructure-error.ts`, `transport-error.ts`
- [x] P2-019 `packages/shared/errors` workspace를 만든다. 증거: `packages/shared/errors/package.json`
- [x] P2-020 오류를 immutable discriminated union으로 정의한다. 증거: errors source와 typecheck fixture
- [x] P2-021 module domain error가 shared package로 새어 나오지 않게 검사한다. 증거: `scripts/check-package-interfaces.ts`, `error-vocabulary.typecheck.ts`
- [x] P2-022 public error에 cause, stack, SQL, credential과 개인정보가 포함되지 않는 test를 추가한다. 증거: `packages/shared/errors/src/error-vocabulary.test.ts`

### 6.4 `@workspace/event-contracts`

- [x] P2-023 P0에서 분류한 cross-module event만 canonical event map에 포함한다. 증거: `packages/shared/event-contracts/src/workspace-event.ts`, [P2 검증](./p2-validation.md)
- [x] P2-024 `packages/shared/event-contracts` workspace를 만든다. 증거: `packages/shared/event-contracts/package.json`
- [x] P2-025 event name을 `<context>.<past-tense-kebab>` 형식으로 정의한다. 증거: `WorkspaceEventMap`
- [x] P2-026 payload가 brand ID와 immutable 값만 포함하게 한다. 증거: `WorkspaceEventMap`, kernel immutable event fixture
- [x] P2-027 entity, repository, use case와 HTTP DTO import를 금지한다. 증거: `event-contracts-only-import-kernel-and-types` architecture 규칙
- [x] P2-028 event name과 payload의 exhaustive type fixture를 추가한다. 증거: `packages/shared/event-contracts/src/workspace-event.typecheck.ts`

### 6.5 `@workspace/contracts`

- [x] P2-029 기존 contract 소비자와 public subpath를 기준선 inventory와 대조한다. 증거: exact export snapshot과 [P2 검증](./p2-validation.md)
- [x] P2-030 package를 `packages/shared/contracts`로 이동한다. 증거: 새 manifest와 이전 경로 삭제 guard
- [x] P2-031 `learning`, `content`, `identity`, `ai-feedback`, `resource-library`, `operations` subpath를 만든다. 증거: `packages/shared/contracts/package.json`
- [x] P2-032 기존 `admin` umbrella contract를 새 context owner로 분리한다. 증거: context별 source와 broad `admin` export 부재
- [x] P2-033 request, response와 공개 오류를 canonical Zod schema로 정의한다. 증거: contracts 56 tests
- [x] P2-034 schema에서 타입을 추론하고 별도 수기 wire type 중복을 제거한다. 증거: context contract source와 dead-code gate
- [x] P2-035 성공 response도 endpoint schema로 parse하도록 consumer contract를 고정한다. 증거: `scripts/check-package-interfaces.ts`, web·admin HTTP transport test
- [x] P2-036 root barrel과 broad context barrel을 제거하거나 좁은 subpath로 교체한다. 증거: exact export snapshot과 package interface gate
- [x] P2-037 module domain·application이 HTTP contract를 import하지 않는 fixture를 추가한다. 증거: dependency-cruiser forbidden fixture와 `module-domain-and-application-do-not-import-http-contracts`
- [x] P2-038 frontend와 HTTP interface가 같은 schema instance를 소비하는 contract test를 추가한다. 증거: canonical schema consumer guard와 전체 app test
- [x] P2-039 정적 OpenAPI 사본과 generated client가 생기지 않는 guard를 추가한다. 증거: `scripts/check-package-interfaces.ts`

### 6.6 `@workspace/resource-document`

- [x] P2-040 package를 `packages/shared/resource-document`로 이동한다. 증거: 새 manifest와 이전 경로 삭제 guard
- [x] P2-041 GFM Markdown을 canonical document source로 유지한다. 증거: `resource-markdown.ts`와 Markdown test
- [x] P2-042 AST parse·serialize와 validation public surface를 좁게 정의한다. 증거: resource-document exact export snapshot
- [x] P2-043 Lexical headless 변환과 React editor dependency를 분리한다. 증거: resource-document manifest와 admin editor 소비 경계
- [x] P2-044 tree, 저장, 권한, asset lifecycle 코드가 package에 남지 않는지 검사한다. 증거: package interface ownership file guard
- [x] P2-045 기존 Markdown round-trip과 invalid input test를 통과시킨다. 증거: 3개 파일·71개 test 통과

### 6.7 `@workspace/ui`

- [x] P2-046 package를 `packages/shared/ui`로 이동한다. 증거: 새 manifest와 이전 경로 삭제 guard
- [x] P2-047 접근성 primitive와 학습 표현 component의 export를 분류한다. 증거: UI export category guard
- [x] P2-048 React와 React DOM의 peer·dev dependency 관계를 정리한다. 증거: `packages/shared/ui/package.json`
- [x] P2-049 API, auth, DB, module, HTTP client와 Next navigation import를 제거한다. 증거: `shared-ui-does-not-import-application-boundaries` architecture 규칙
- [x] P2-050 component가 data와 command를 props로만 받는지 검사한다. 증거: UI 직접 I/O·server command guard와 component test
- [x] P2-051 root barrel 없이 primitive 단위 public subpath를 유지한다. 증거: UI manifest와 export category guard
- [x] P2-052 Storybook story, interaction과 a11y test를 새 경로로 전환한다. 증거: Storybook 42개 파일·179개 test, 정적 build 통과
- [x] P2-053 P2 게이트: shared package가 app·module·infra를 import하지 않고 package test·typecheck·Storybook build가 통과한다. 증거: [P2 검증](./p2-validation.md), root lint·typecheck·test·build 통과

## 7. P3 — infra package 기반

### 7.1 `@workspace/db`

- [x] P3-001 connection, transaction, migration runner, backup·restore와 destructive guard source를 식별한다. 증거: `packages/infra/db/src`, [P3 검증](./p3-validation.md)
- [x] P3-002 DB package를 `packages/infra/db`로 이동한다. 증거: 새 manifest와 이전 경로 삭제 guard
- [x] P3-003 Bun SQLite connection과 close lifecycle을 명시적 factory로 만든다. 증거: `sqlite-database.ts`와 client test
- [x] P3-004 transaction primitive가 module schema나 business policy를 알지 않게 한다. 증거: generic `runInSqliteTransaction`, package interface gate
- [x] P3-005 기존 domain policy와 content normalization을 content module 이동 대상으로 표시한다. 증거: DB transition inventory의 P5 제거 ID
- [x] P3-006 기존 module schema의 임시 잔존 항목마다 P4~P9 제거 ID를 연결한다. 증거: `scripts/fixtures/infra-db-module-schema-transition.json`
- [x] P3-007 DB package가 최종적으로 module schema를 import·re-export하지 않는 interface test를 준비한다. 증거: transition inventory·`scripts/check-package-interfaces.ts`, P11 제거 단계
- [x] P3-008 backup·restore와 destructive guard 회귀 테스트를 새 경로에서 통과시킨다. 증거: DB 8개 file·46개 test

### 7.2 `@workspace/auth`

- [x] P3-009 auth package를 `packages/infra/auth`로 이동한다. 증거: 새 manifest와 이전 경로 삭제 guard
- [x] P3-010 Better Auth direct import를 이 package 안으로 제한한다. 증거: provider ownership architecture·interface gate
- [x] P3-011 learner Google OAuth와 admin ID/password runtime을 분리한다. 증거: `learner/server.ts`, `admin/server.ts`와 통합 test
- [x] P3-012 credential, cookie, token과 session lifecycle의 public subpath를 좁게 정의한다. 증거: auth manifest exact export snapshot
- [x] P3-013 Better Auth schema와 DB rate-limit counter의 소유권을 auth에 둔다. 증거: auth `./schema`, auth-owned migration·schema test
- [x] P3-014 제품 profile, user status와 admin role policy를 auth에서 제거할 대상으로 연결한다. 증거: P4-001·005·007·033
- [x] P3-015 client subpath가 server, DB와 ORM을 번들하지 않는 test를 통과시킨다. 증거: auth client boundary interface gate와 6개 client test
- [x] P3-016 test auth가 production configuration에서 fail-closed하는지 회귀 테스트한다. 증거: API env test와 test-auth plugin test

### 7.3 `@workspace/http-client`

- [x] P3-017 package를 `packages/infra/http-client`로 이동한다. 증거: 새 manifest와 이전 경로 삭제 guard
- [x] P3-018 network, HTTP, contract와 success variant를 구분한다. 증거: `json-transport.ts` discriminated union
- [x] P3-019 consumer가 전달한 Zod success schema를 실행하게 한다. 증거: HTTP client·web·admin contract test
- [x] P3-020 internal cause가 UI message로 직접 노출되지 않는 test를 추가한다. 증거: `json-transport.test.ts`
- [x] P3-021 server와 browser 소비자가 공유할 수 있는 transport-neutral surface만 export한다. 증거: `./api-result`, `./json-transport` exact exports와 bundle boundary gate

### 7.4 `@workspace/ai`

- [x] P3-022 apps/api의 OpenAI·Mastra runtime과 lifecycle source를 식별한다. 증거: API AI adapter와 [P3 검증](./p3-validation.md)
- [x] P3-023 `packages/infra/ai` workspace를 만든다. 증거: AI manifest·workspace inventory
- [x] P3-024 OpenAI client와 Mastra runtime을 명시적 factory로 이동한다. 증거: `openai-client.ts`, `mastra-runtime.ts`
- [x] P3-025 validated config, timeout과 AbortSignal을 factory input으로 받는다. 증거: AI config schema와 test
- [x] P3-026 provider exception을 typed infrastructure error로 정규화한다. 증거: `AiInfrastructureError`, provider error test
- [x] P3-027 provider key 부재를 fail-closed Result로 반환한다. 증거: AI infrastructure test
- [x] P3-028 prompt, coaching policy, attempt와 제품 DTO가 infra package에 들어오지 않는지 검사한다. 증거: P3 infrastructure ownership gate
- [x] P3-029 close가 idempotent하고 partial initialization failure에서 호출되는지 test한다. 증거: AI lifecycle test 2건

### 7.5 `@workspace/event-bus`

- [x] P3-030 Emittery를 event-bus workspace의 direct dependency로 선언한다. 증거: event-bus manifest·lockfile
- [x] P3-031 `packages/infra/event-bus` workspace를 만든다. 증거: manifest·workspace inventory
- [x] P3-032 typed `publish`가 listener 완료를 기다리는 `ResultAsync`를 반환하게 한다. 증거: `in-memory-event-bus.ts`와 async completion test
- [x] P3-033 listener 다중 실패가 관측 가능한 error cause로 보존되는지 test한다. 증거: 다중 cause test
- [x] P3-034 기본 dispatch가 listener 순서에 의존하지 않는지 test한다. 증거: slow·fast listener test
- [x] P3-035 `subscribe`가 teardown용 unsubscribe를 반환하게 한다. 증거: idempotent unsubscribe test
- [x] P3-036 in-memory delivery의 한계를 public contract와 test 이름에 명시한다. 증거: `best-effort-process-local` delivery 계약
- [x] P3-037 durable projection consumer가 event bus를 사용하지 않는지 검사한다. 증거: package interface durable consumer guard

### 7.6 `@workspace/storage`

- [x] P3-038 기존 R2·S3 client source와 asset policy source를 분리한다. 증거: infra object adapter와 API `resource-image-file.ts`
- [x] P3-039 `packages/infra/storage` workspace를 만든다. 증거: storage manifest·workspace inventory
- [x] P3-040 AWS SDK client와 object adapter를 validated config로 생성한다. 증거: `createS3ObjectStorage`
- [x] P3-041 SDK exception을 typed infrastructure error로 변환한다. 증거: `ObjectStorageError`와 cause test
- [x] P3-042 object key, MIME, ownership과 document relation이 module에 남도록 한다. 증거: storage ownership interface gate
- [x] P3-043 provider retry와 application retry가 중복되지 않는 test·설명을 추가한다. 증거: single operation test와 [P3 검증](./p3-validation.md)

### 7.7 `@workspace/observability`

- [x] P3-044 apps/api의 logger와 audit event source를 식별한다. 증거: observability source 이동과 [P3 검증](./p3-validation.md)
- [x] P3-045 `packages/infra/observability` workspace를 만든다. 증거: observability manifest·workspace inventory
- [x] P3-046 Pino root·child logger를 validated config로 생성한다. 증거: `logger.ts`와 JSON logger test
- [x] P3-047 request, security, owner mutation, provider와 event dispatch event type을 정의한다. 증거: `events.ts`
- [x] P3-048 secret, credential, session token, 원문 답안과 불필요한 개인정보 redaction test를 추가한다. 증거: recursive redaction test
- [x] P3-049 product source의 `console.log`·`console.error`를 logger 호출로 전환한다. 증거: production console guard
- [x] P3-050 logger package의 `process.env` 직접 접근을 제거한다. 증거: P3 infrastructure ownership gate
- [x] P3-051 flush 실패와 shutdown 동작을 관측 가능하게 한다. 증거: logger lifecycle Result·test

### 7.8 `@workspace/http-platform`

- [x] P3-052 apps/api의 Hono context, route helper와 공통 security source를 식별한다. 증거: HTTP platform source 이동과 [P3 검증](./p3-validation.md)
- [x] P3-053 `packages/infra/http-platform` workspace를 만든다. 증거: HTTP platform manifest·workspace inventory
- [x] P3-054 Hono env와 request context 타입을 이동한다. 증거: `context.ts`와 API env alias
- [x] P3-055 runtime OpenAPI helper를 이동하고 endpoint contract 소유권은 module에 남긴다. 증거: `openapi.ts`, API endpoint schema
- [x] P3-056 body limit, trusted origin과 private no-store middleware를 이동한다. 증거: `security` exact export와 4개 security test
- [x] P3-057 request ID와 logger 연결 기반을 이동한다. 증거: request-logging middleware와 6개 test
- [x] P3-058 global unexpected error handler가 내부 원인을 숨기고 request ID를 반환하는지 test한다. 증거: HTTP platform create-app·API learner/admin error test
- [x] P3-059 module error mapping, authorization policy와 repository가 package에 들어오지 않는지 검사한다. 증거: HTTP platform ownership interface gate
- [x] P3-060 모든 infra package의 `process.env` 직접 접근을 0개로 만든다. 증거: P3 infrastructure ownership gate
- [x] P3-061 P3 게이트: infra가 modules·apps를 import하지 않고 package test·typecheck와 관련 API test가 통과한다. 증거: [P3 검증](./p3-validation.md)

## 8. P4 — `identity` 모듈 전환

### 8.1 경계와 domain

- [x] P4-001 기존 auth capability, learner profile, admin identity·role source를 identity 후보로 확정한다. 증거: [P4 구현 증거](./p4-validation.md)
- [x] P4-002 auth-owned credential·session source와 identity-owned 제품 사용자 source를 분리한다. 증거: API auth directory adapter의 neutral identity port와 identity의 auth package 무의존 guard
- [x] P4-003 identity가 소유할 route, contract, table, seed와 consumer를 확정한다. 증거: identity manifest·schema·HTTP interface와 [P4 구현 증거](./p4-validation.md)
- [x] P4-004 `packages/modules/identity` manifest, private alias, test config와 explicit exports를 만든다. 증거: `packages/modules/identity/package.json`, `vitest.config.ts`
- [x] P4-005 learner profile entity와 invariant를 정의한다. 증거: `learner-profile.ts`
- [x] P4-006 user `active | suspended | deleted` 상태 전이를 정의한다. 증거: `user-status.ts`, learner profile domain test
- [x] P4-007 admin role과 owner authorization policy를 정의한다. 증거: `admin-role.ts`와 3개 domain test
- [x] P4-008 비식별화 정책과 삭제 이후 허용 동작을 정의한다. 증거: deleted profile 변경 거부·owner 상태 복구·비식별화 domain test
- [x] P4-009 예상 가능한 identity 실패를 discriminated union으로 정의한다. 증거: `identity-error.ts`
- [x] P4-010 상태 전이가 새 aggregate와 immutable event를 반환하게 한다. 증거: `DomainDecision`과 `identity.user-status-changed`
- [x] P4-011 domain unit test에 성공, 권한 거부, 잘못된 상태 전이와 비식별화를 포함한다. 증거: identity domain 2 files·7 tests

### 8.2 application과 persistence

- [x] P4-012 인증 identity를 제품 사용자로 provisioning하는 command를 만든다. 증거: identity application `provisionLearner`, auth hook 주입 test
- [x] P4-013 profile 조회·변경 query와 command를 분리한다. 증거: identity application·query 공개 표면
- [x] P4-014 user status·admin role 변경 command에 owner policy를 적용한다. 증거: identity service와 admin role policy test
- [x] P4-015 session 폐기를 auth port로 선언하고 concrete auth type을 노출하지 않는다. 증거: `IdentitySessionRevocationPort`, API auth adapter test
- [x] P4-016 learning용 identity query port를 공개한다. 증거: `IdentityLearningQuery`
- [x] P4-017 operations용 identity reporting query port를 공개한다. 증거: `OperationsIdentityReportingQuery`, dashboard·analytics adapter
- [x] P4-018 application test에서 repository, auth와 clock port fake를 사용한다. 증거: identity application 2 files·10 tests
- [x] P4-019 identity table과 같은 module 내부 FK를 module schema로 이동한다. 증거: DB baseline table 제거, legacy cross-module FK 재구성 test와 identity `schema.ts`
- [x] P4-020 Better Auth table을 identity schema에서 제외한다. 증거: identity auth package 무의존·schema exact export와 package interface gate
- [x] P4-021 identity Drizzle repository를 module infrastructure로 이동한다. 증거: 자체 profile·role table만 읽는 `identity-drizzle-repository.ts`
- [x] P4-022 suspended·deleted 상태와 role 변경의 optimistic conflict를 Result로 반환한다. 증거: version 조건 update와 repository·application test
- [x] P4-023 임시 SQLite에서 repository와 transaction 통합 test를 통과시킨다. 증거: identity repository 3 tests

### 8.3 HTTP, 조립과 제거

- [x] P4-024 identity canonical request·response·public error schema를 확정한다. 증거: `@workspace/contracts/identity/*`
- [x] P4-025 profile과 admin identity route를 module HTTP interface로 이동한다. 증거: learner/admin identity route factory
- [x] P4-026 learner와 admin actor 추출을 auth platform에서 받아 제품 identity로 변환한다. 증거: identity session resolver와 API composition
- [x] P4-027 모든 protected read·write에 server-side authorization을 적용한다. 증거: learner active-session·admin owner middleware test
- [x] P4-028 identity Result를 status와 public error code로 exhaustive mapping한다. 증거: identity HTTP route switch mapping
- [x] P4-029 HTTP contract test에 unauthenticated, forbidden, conflict와 success를 포함한다. 증거: identity HTTP 6 tests, API parity target
- [x] P4-030 `module.ts`에서 repository, use case, route와 public port를 조립한다. 증거: `packages/modules/identity/src/module.ts`
- [x] P4-031 apps/api에서 auth hook과 identity provisioning port를 주입한다. 증거: `learner-api-core.ts`, identity composition
- [x] P4-032 기존 profile·admin identity route와 새 route의 parity를 확인한다. 증거: API app·admin identity target contract test
- [x] P4-033 기존 core auth/admin role, API identity adapter와 중복 route source를 제거한다. 증거: package interface P4 ownership gate와 dead-code 통과
- [x] P4-034 `identity.user-status-changed` event 발행과 실패 관측을 검증한다. 증거: identity service publish·observer test
- [x] P4-035 P4 게이트: domain·application·repository·HTTP·interface·architecture test와 관련 앱 build가 통과한다. 증거: [P4 구현 증거](./p4-validation.md)

## 9. P5 — `content` 모듈 전환

### 9.1 경계와 domain

- [x] P5-001 기존 content core, DB content policy, admin content와 learner curriculum read source를 확정한다. 증거: [P5 경계 inventory](./p5-validation.md)
- [x] P5-002 content가 소유할 route, contract, table, seed와 consumer를 확정한다. 증거: [P5 경계 inventory](./p5-validation.md)
- [x] P5-003 `packages/modules/content` manifest, private alias, test config와 explicit exports를 만든다. 증거: `packages/modules/content/package.json`, `tsconfig.json`, `vitest.config.ts`
- [x] P5-004 course, curriculum draft와 published revision의 entity·value object를 정의한다. 증거: `content-model.ts`, `curriculum.ts`
- [x] P5-005 course당 단일 draft invariant를 domain과 DB 보장으로 나눈다. 증거: `selectSingleDraft`, partial unique index와 SQLite 통합 test
- [x] P5-006 published revision 불변성과 archive 정책을 정의한다. 증거: domain decision, module-owned trigger와 archive 보존 통합 test
- [x] P5-007 version 범위 lesson·step reference invariant를 정의한다. 증거: version 복합 key·FK, stable ID와 target validation test
- [x] P5-008 content normalization policy를 DB primitive에서 domain으로 이동한다. 증거: `@workspace/content/normalization`, API가 DB legacy migration에 정책을 주입하는 fail-closed test
- [x] P5-009 예상 가능한 not-found, conflict, validation과 immutable revision 실패를 union으로 정의한다. 증거: `content-error.ts`와 exhaustive HTTP mapping
- [x] P5-010 publish decision이 새 상태와 `content.curriculum-published` event를 반환하게 한다. 증거: immutable `DomainDecision` test
- [x] P5-011 domain unit test에 draft, publish, archive, reset과 version conflict를 포함한다. 증거: content domain 2 files·10 tests

### 9.2 application과 persistence

- [x] P5-012 course·curriculum command와 query를 파일별 단일 use case로 분리한다. 증거: `application/use-cases/`의 7개 use case
- [x] P5-013 published curriculum을 learning에 제공하는 query port를 공개한다. 증거: `ContentLearningQuery`
- [x] P5-014 operations용 content reporting query port를 공개한다. 증거: `OperationsContentReportingQuery`
- [x] P5-015 admin AI 변경안이 기존 content command만 호출하게 application port를 제공한다. 증거: `ContentChangeCommandPort`
- [x] P5-016 reset command에 명시적 환경 확인과 destructive guard port를 적용한다. 증거: `ContentResetGuardPort`, production·확인 거부 domain/application test
- [x] P5-017 application test에 owner 거부, optimistic conflict와 event 발행 전후를 포함한다. 증거: content application 5 tests
- [x] P5-018 content table, index, trigger와 module 내부 FK를 module schema로 이동한다. 증거: `@workspace/content/schema`, idempotent trigger 복구 test
- [x] P5-019 cross-module FK와 join을 제거할 migration 전제 검사를 추가한다. 증거: duplicate draft·learning/AI orphan 사전 검사와 fail-closed test
- [x] P5-020 content Drizzle repository를 module infrastructure로 이동한다. 증거: `content-drizzle-repository.ts`
- [x] P5-021 transaction이 content table만 변경하고 commit 뒤 event를 반환하게 한다. 증거: publish rollback과 `commit → publish → observe` test
- [x] P5-022 published content 불변식을 임시 SQLite 통합 test로 검증한다. 증거: published version·계층 trigger 통합 test

### 9.3 HTTP, 조립과 제거

- [x] P5-023 content canonical contract를 context subpath로 전환한다. 증거: `@workspace/contracts/content/*`, operations reset 계약 제거 guard
- [x] P5-024 admin course·curriculum·archive·reset route를 module interface로 이동한다. 증거: content HTTP interface 7개 operation
- [x] P5-025 request parse, actor 확인, command·query 호출과 Result mapping만 route에 남긴다. 증거: content route factory와 HTTP architecture gate
- [x] P5-026 HTTP contract test에 ETag, version conflict, forbidden과 immutable revision 거부를 포함한다. 증거: content HTTP 5 tests와 API target contract
- [x] P5-027 `module.ts`에서 schema, repository, use case, route와 공개 port를 조립한다. 증거: `packages/modules/content/src/module.ts`
- [x] P5-028 apps/api에서 identity authorization과 content module을 주입한다. 증거: `content-module.composition.ts`, `admin-content.composition.ts`, API runtime
- [x] P5-029 기존 admin content와 learner content route의 parity를 확인한다. 증거: admin target contract와 전체 API 회귀 test
- [x] P5-030 기존 core content, DB content policy, API content adapter와 중복 route를 제거한다. 증거: P5 ownership interface guard와 dead-code gate
- [x] P5-031 P5 게이트: domain·application·repository·HTTP·interface·architecture test와 관련 앱 build가 통과한다. 증거: [P5 구현 증거](./p5-validation.md)

## 10. P6 — `ai-feedback` 모듈 전환

### 10.1 경계와 domain

- [x] P6-001 기존 AI feedback core, provider adapter, attempt repository와 route를 확정한다. 증거: [P6 경계와 소유권](./p6-validation.md#경계와-소유권)
- [x] P6-002 ai-feedback이 소유할 contract, table, 제한 정책과 consumer를 확정한다. 증거: [P6 경계와 소유권](./p6-validation.md#경계와-소유권)
- [x] P6-003 `packages/modules/ai-feedback` manifest, private alias, test config와 explicit exports를 만든다. 증거: `packages/modules/ai-feedback/package.json`, `tsconfig.json`, `vitest.config.ts`
- [x] P6-004 coaching prompt policy와 입력 최소화 규칙을 domain으로 이동한다. 증거: `ai-feedback-prompt.ts`와 prompt 최소화 test
- [x] P6-005 attempt 제한, 상태와 재시도 가능성 invariant를 정의한다. 증거: `ai-feedback-attempt.ts`
- [x] P6-006 provider response validation과 허용 결과를 정의한다. 증거: `ai-feedback.ts`와 strict response test
- [x] P6-007 quota, provider unavailable, timeout과 invalid response 오류 union을 정의한다. 증거: `ai-feedback-error.ts`
- [x] P6-008 domain test에 attempt 허용·거부와 prompt 최소화를 포함한다. 증거: `ai-feedback.test.ts`, `ai-feedback-prompt.test.ts`

### 10.2 application과 persistence

- [x] P6-009 AI provider를 application port로 선언한다. 증거: `application/ports/ai-feedback-provider.ts`
- [x] P6-010 learning이 주입받을 `requestFeedback` application port를 공개한다. 증거: `application/ai-feedback-application.ts`, `@workspace/ai-feedback/application`
- [x] P6-011 provider I/O와 DB transaction을 분리한 orchestration을 구현한다. 증거: application orchestration과 provider-I/O transaction 격리 test
- [x] P6-012 provider 성공 뒤 attempt 저장 실패의 의미와 보상 가능성을 명시한다. 증거: [P6 선택과 trade-off](./p6-validation.md#선택과-trade-off), persistence 실패·composition replay test
- [x] P6-013 provider SDK retry, module retry와 quota 영향이 중복되지 않게 한다. 증거: `createOpenAiClient({ maxRetries: 0 })` composition과 AI infra test
- [x] P6-014 application test에 timeout, abort, provider error, invalid response와 persistence error를 포함한다. 증거: `ai-feedback-application.test.ts`
- [x] P6-015 feedback attempt table과 index를 module schema로 이동한다. 증거: `infrastructure/persistence/schema.ts`
- [x] P6-016 branded learner·lesson ID만 저장하고 cross-module FK를 제거한다. 증거: module schema migration·repository 통합 test와 package interface guard
- [x] P6-017 attempt repository를 module infrastructure로 이동한다. 증거: `ai-feedback-drizzle-repository.ts`
- [x] P6-018 `@workspace/ai`를 사용하는 module-local provider adapter를 이동한다. 증거: `infrastructure/adapters/openai-feedback-provider.ts`
- [x] P6-019 repository와 provider adapter 통합 test를 각각 격리한다. 증거: `ai-feedback-drizzle-repository.test.ts`, `openai-feedback-provider.test.ts`

### 10.3 HTTP, 조립과 제거

- [x] P6-020 ai-feedback canonical contract와 안정된 제한 error code를 확정한다. 증거: `@workspace/contracts/ai-feedback/*`와 learner API contract test
- [x] P6-021 독립 route가 제품 요구상 필요한지 확인하고 learning command와 중복되지 않게 한다. 증거: [REQ-LRN-6](../../product/requirements/platform/req-lrn-6-ai-coaching.md)과 기존 step-scoped canonical path parity test
- [x] P6-022 유지되는 route를 module HTTP interface로 이동한다. 증거: `interface/http/ai-feedback-routes.ts`
- [x] P6-023 제한 응답에 올바른 `Retry-After`를 제공한다. 증거: pending lease HTTP contract test와 [API contract](../../engineering/api-contract.md)
- [x] P6-024 provider 원문과 prompt가 HTTP response·log에 노출되지 않는 test를 추가한다. 증거: application observer·provider adapter·HTTP 비노출 test
- [x] P6-025 `module.ts`에서 provider adapter, repository, use case와 공개 application port를 조립한다. 증거: `packages/modules/ai-feedback/src/module.ts`
- [x] P6-026 apps/api에서 AI infra와 validated config를 주입한다. 증거: `ai-feedback-module.composition.ts`, API runtime과 composition replay test
- [x] P6-027 기존 core ai-feedback, API adapter와 중복 route를 제거한다. 증거: P6 ownership interface guard, dependency graph와 dead-code gate
- [x] P6-028 P6 게이트: domain·application·repository·provider·HTTP·interface·architecture test와 관련 API build가 통과한다. 증거: [P6 구현 증거](./p6-validation.md)

## 11. P7 — `learning` 모듈 전환

### 11.1 경계와 domain

- [x] P7-001 기존 learning core, course·lesson·progress·transition route와 adapter를 확정한다. 증거: [P7 경계와 제거 목록](./p7-validation.md#경계와-소유권)
- [x] P7-002 learning이 소유할 route, contract, table, seed와 frontend consumer를 확정한다. 증거: [P7 경계와 소유권](./p7-validation.md#경계와-소유권)
- [x] P7-003 `packages/modules/learning` manifest, private alias, test config와 explicit exports를 만든다. 증거: `packages/modules/learning/package.json`, `tsconfig.json`, `vitest.config.ts`
- [x] P7-004 lesson progress, attempt와 submission entity·value object를 정의한다. 증거: `domain/lesson-progress.ts`, `domain/learning-types.ts`
- [x] P7-005 start, answer, complete와 AI feedback 상태 전이 invariant를 정의한다. 증거: `domain/start-lesson-decision.ts`, `complete-step-effect-plan.ts`, `ai-feedback-transition-decision.ts`
- [x] P7-006 step grading policy를 transport와 persistence에서 분리한다. 증거: `domain/step-grading-policy.ts`
- [x] P7-007 `Asia/Seoul` 학습 활동일 계산을 Clock 기반 policy로 이동한다. 증거: `domain/learning-date.ts`, 경계 시각 test
- [x] P7-008 expected failure를 answer rejected, not-found, conflict와 invalid transition union으로 정의한다. 증거: `domain/learning-error.ts`, `learner-transition.ts`
- [x] P7-009 모든 aggregate 전이가 immutable `DomainDecision`을 반환하게 한다. 증거: start·complete·AI finalize decision과 freeze 회귀 test
- [x] P7-010 domain에서 `new Date`, `Date.now`, random UUID 직접 호출을 제거한다. 증거: architecture·package interface gate와 domain source 검색
- [x] P7-011 domain test에 경계 시각, 중복 완료, 오답, conflict와 event payload를 포함한다. 증거: `src/test/domain/`, SQLite repository·application event test

### 11.2 application과 module 협력

- [x] P7-012 course·lesson read query를 learning 사용자 관점 projection으로 정의한다. 증거: `application/learning-queries.ts`, `learner-read-projection.ts`
- [x] P7-013 lesson start, answer, complete와 AI feedback request command를 분리한다. 증거: `application/learning-application.ts`
- [x] P7-014 content published curriculum query port를 주입받는다. 증거: `application/ports/learning-ports.ts`, API learning composition
- [x] P7-015 identity status·profile query port를 주입받는다. 증거: learning identity query port와 learning profile stats query 조립
- [x] P7-016 ai-feedback application port를 주입받는다. 증거: learning AI application port와 API learning composition
- [x] P7-017 operations용 learning reporting query port를 공개한다. 증거: `@workspace/learning/reporting`, reporting application test
- [x] P7-018 transaction port가 learning table만 변경하게 한다. 증거: module-local transition repository와 architecture·interface gate
- [x] P7-019 commit 뒤 `learning.lesson-completed` event를 발행 대상으로 반환한다. 증거: immutable domain event intent, repository·application test
- [x] P7-020 event dispatch 실패가 commit을 rollback한 것으로 표현되지 않게 한다. 증거: event publish·observer 실패 application test
- [x] P7-021 application test에 모든 port의 성공·거부·실패 조합을 포함한다. 증거: `src/test/application/learning-application.test.ts`

### 11.3 persistence와 HTTP

- [x] P7-022 learning table, index와 module 내부 FK를 module schema로 이동한다. 증거: `infrastructure/persistence/schema.ts`, schema migration test
- [x] P7-023 content·identity·feedback reference를 branded ID로 저장하고 cross-module FK를 제거한다. 증거: module schema·migration과 FK 회귀 test
- [x] P7-024 read model과 transition repository를 module infrastructure로 이동한다. 증거: `learning-read-drizzle-repository.ts`, `learning-transition-drizzle-repository.ts`
- [x] P7-025 cursor, sorting과 persisted value mapping을 module persistence에 둔다. 증거: `learner-cursor.ts`, `published-curriculum-mapper.ts`, read repository
- [x] P7-026 temporary SQLite에서 read, transition, conflict와 transaction rollback을 test한다. 증거: `learning-drizzle-repository.test.ts`
- [x] P7-027 learning canonical contract를 request·response·error schema로 정리한다. 증거: `@workspace/contracts/learning/*`, learning HTTP mapper
- [x] P7-028 course, lesson, progress와 transition route를 module HTTP interface로 이동한다. 증거: `interface/http/learning-routes.ts`
- [x] P7-029 route에서 domain entity를 직접 직렬화하지 않고 presenter·contract mapper를 사용한다. 증거: step presenter, read projection, `learning-http-mapper.ts`
- [x] P7-030 HTTP contract test에 auth, validation, not-found, conflict와 provider failure를 포함한다. 증거: learning·ai-feedback HTTP test와 API contract test

### 11.4 조립과 제거

- [x] P7-031 `module.ts`에서 repository, command, query, route와 reporting port를 조립한다. 증거: `packages/modules/learning/src/module.ts`
- [x] P7-032 apps/api에서 content query, identity query와 ai-feedback application port를 주입한다. 증거: `apps/api/src/composition/learning-module.composition.ts`
- [x] P7-033 learner route registry와 runtime OpenAPI parity를 확인한다. 증거: learning HTTP registry test, API runtime OpenAPI parity test
- [x] P7-034 web의 핵심 학습 흐름을 새 module route로 실행한다. 증거: test auth 핵심 learner E2E와 Web production build
- [x] P7-035 기존 core learning, API learning adapter와 course·lesson·progress·transition 중복 route를 제거한다. 증거: package interface ownership guard와 dead-code gate
- [x] P7-036 P7 게이트: domain·application·repository·HTTP·interface·architecture test, web build와 핵심 learner E2E가 통과한다. 증거: [P7 구현 증거](./p7-validation.md)

## 12. P8 — `resource-library` 모듈 전환

### 12.1 경계와 domain

- [x] P8-001 기존 resource core, route, repository, asset runtime과 document codec 소비를 확정한다. 증거: [P8 경계와 소유권](./p8-validation.md#경계와-소유권)
- [x] P8-002 resource-library가 소유할 route, contract, table, asset metadata와 consumer를 확정한다. 증거: [P8 경계와 소유권](./p8-validation.md#경계와-소유권)
- [x] P8-003 `packages/modules/resource-library` manifest, private alias, test config와 explicit exports를 만든다. 증거: module `package.json`, `tsconfig.json`, `vitest.config.ts`
- [x] P8-004 tree node, document, asset와 trash 상태 entity를 정의한다. 증거: `domain/resource-tree-node.ts`, `resource-document.ts`, `resource-asset.ts`
- [x] P8-005 tree cycle, parent, sort와 ownership policy를 정의한다. 증거: `resource-tree-policy.ts`, `resource-access-policy.ts`
- [x] P8-006 Markdown 저장, ETag와 version conflict invariant를 정의한다. 증거: document domain·application, `resource-library-etag.ts`
- [x] P8-007 deterministic object key, MIME, byte size와 alt text policy를 정의한다. 증거: `resource-asset.ts`
- [x] P8-008 upload, delete와 reconciliation 상태 전이를 정의한다. 증거: asset·tree application과 reconciliation
- [x] P8-009 not-found, forbidden, validation, conflict와 storage failure union을 정의한다. 증거: `resource-library-error.ts`
- [x] P8-010 domain test에 tree cycle, stale ETag, trash와 asset policy를 포함한다. 증거: resource tree·document·asset domain test

### 12.2 application과 persistence

- [x] P8-011 tree, document, search, asset와 reconciliation use case를 각각 분리한다. 증거: application tree·document·asset·query·reconciliation source
- [x] P8-012 storage를 application port로 선언한다. 증거: `application/ports/resource-library-ports.ts`
- [x] P8-013 upload를 `검증 → R2 → DB → 실패 시 보상 삭제` 순서로 구현한다. 증거: asset application 순서·보상 test
- [x] P8-014 DB와 보상 삭제가 모두 실패할 때 orphan audit event를 기록한다. 증거: asset application failure test와 API 구조화 logger composition
- [x] P8-015 delete를 pending 상태, object 삭제와 metadata 완료 단계로 분리한다. 증거: tree application 순서·실패 test와 repository transaction
- [x] P8-016 reconciliation의 dry-run과 mutation command를 분리한다. 증거: `resource-reconciliation.ts`와 test
- [x] P8-017 관리자 AI가 기존 document command만 호출할 공개 application port를 제공한다. 증거: `./commands`의 `ResourceDocumentCommandPort`와 module `commands`
- [x] P8-018 application test에 upload·DB·보상·delete 각 실패 조합을 포함한다. 증거: asset·tree application test
- [x] P8-019 resource table, index와 module 내부 FK를 module schema로 이동한다. 증거: module `schema.ts`, `schema-migration.ts`
- [x] P8-020 resource repository를 module infrastructure로 이동한다. 증거: module persistence의 tree·document·search·asset repository
- [x] P8-021 storage adapter와 repository 통합 test를 외부 provider fake와 임시 SQLite로 분리한다. 증거: API storage adapter test, module temporary SQLite repository test

### 12.3 HTTP, 조립과 제거

- [x] P8-022 resource-library canonical contract를 context subpath로 전환한다. 증거: `@workspace/contracts/resource-library/*` exports와 contract test
- [x] P8-023 tree, document, search와 asset route를 module HTTP interface로 이동한다. 증거: module `interface/http`의 14개 route
- [x] P8-024 모든 read·write에 admin authorization과 private no-store를 적용한다. 증거: 공통 resource session middleware와 전체 route metadata·response test
- [x] P8-025 ETag와 `If-Match` conflict를 canonical status·error로 mapping한다. 증거: document route stale `412`·최신 ETag test
- [x] P8-026 upload의 MIME, size와 alt text validation을 HTTP와 domain 경계에서 검증한다. 증거: asset domain test와 HTTP 선행 검증 test
- [x] P8-027 HTTP contract test에 stale ETag, forbidden, storage failure와 compensation 결과를 포함한다. 증거: `resource-library-http.test.ts`
- [x] P8-028 `module.ts`에서 repository, storage, codec, use case, route와 command port를 조립한다. 증거: resource-library `module.ts`
- [x] P8-029 apps/api에서 storage infra와 validated config를 주입한다. 증거: `resource-library-module.composition.ts`와 adapter test
- [x] P8-030 기존 core resource-library, API adapter, resource-assets와 중복 route를 제거한다. 증거: package interface 제거 경로 guard와 dead-code gate
- [x] P8-031 P8 게이트: domain·application·repository·storage·HTTP·interface·architecture test와 admin resource flow가 통과한다. 증거: [P8 구현 증거](./p8-validation.md)

## 13. P9 — `operations` 모듈 전환

### 13.1 경계와 domain

- [x] P9-001 기존 admin dashboard, analytics, settings, AI chat와 공지·법적 문서 source를 확정한다. 증거: [P9 경계와 소유권](./p9-validation.md#경계와-소유권)
- [x] P9-002 identity 소유 role policy와 operations 소유 운영 use case를 분리한다. 증거: identity capability adapter와 [P9 경계](./p9-validation.md#경계와-소유권)
- [x] P9-003 operations가 소유할 route, contract, table, rate limit과 consumer를 확정한다. 증거: [P9 ownership inventory](./p9-validation.md#경계와-소유권)
- [x] P9-004 `packages/modules/operations` manifest, private alias, test config와 explicit exports를 만든다. 증거: operations manifest·tsconfig·Vitest config
- [x] P9-005 settings, notice·legal document와 AI conversation entity를 정의한다. 증거: operations domain과 [검증된 구현](./p9-validation.md#검증된-구현)
- [x] P9-006 관리자 AI 제안, 검토와 승인 상태 전이를 정의한다. 증거: `ai-change-proposal.ts`와 domain test
- [x] P9-007 AI가 발행, 영구 삭제, 권한과 운영 설정을 직접 바꾸지 못하는 policy를 정의한다. 증거: AI command policy·Mastra tool inventory
- [x] P9-008 관리자·IP별 limit와 in-flight 중복 정책을 정의한다. 증거: quota repository·request guard와 동시성 test
- [x] P9-009 expected failure를 permission, quota, provider, validation과 conflict union으로 정의한다. 증거: `operations-error.ts`
- [x] P9-010 domain test에 승인 경계, 금지 command와 rate-limit decision을 포함한다. 증거: `operations-domain.test.ts`

### 13.2 application과 reporting

- [x] P9-011 dashboard query가 identity·content·learning reporting port를 병렬 호출하게 한다. 증거: reporting parallel-start test
- [x] P9-012 operations가 다른 module repository와 table을 직접 읽지 않게 한다. 증거: architecture·P9 package interface gate
- [x] P9-013 부분 reporting 실패의 public 의미와 관측 방식을 정한다. 증거: fail-closed 503·source observer test와 [trade-off](./p9-validation.md#선택과-trade-off)
- [x] P9-014 settings·notice·legal command와 query를 분리한다. 증거: `operations-settings.ts`
- [x] P9-015 AI conversation·streaming·approval use case를 분리한다. 증거: operations application public surface
- [x] P9-016 content와 resource 변경안 승인이 대상 module의 기존 command port를 호출하게 한다. 증거: operations API composition·approval application test
- [x] P9-017 Git, repository code와 docs를 AI context source에서 제외하는 guard를 유지한다. 증거: module-local Mastra adapter·package interface guard
- [x] P9-018 provider key 부재 시 conversation을 저장하지 않게 한다. 증거: application·HTTP provider 부재 test
- [x] P9-019 application test에 reporting partial failure, quota, provider 부재와 승인 거부를 포함한다. 증거: operations application·reporting test
- [x] P9-020 operations-owned table과 rate-limit counter를 module schema로 이동한다. 증거: operations schema·migration과 temporary SQLite test
- [x] P9-021 dashboard projection용 cross-module table과 in-memory event projection을 제거한다. 증거: 요청 시 reporting join과 architecture gate
- [x] P9-022 settings·AI conversation repository와 module-local AI adapter를 이동한다. 증거: operations infrastructure와 제거 경로 guard
- [x] P9-023 temporary SQLite와 provider fake로 repository·streaming 통합 test를 분리한다. 증거: operations repository·provider fake test

### 13.3 HTTP, 조립과 제거

- [x] P9-024 operations canonical contract에 dashboard, analytics, settings와 AI streaming variant를 정의한다. 증거: `@workspace/contracts/operations/*` exact export gate
- [x] P9-025 dashboard, analytics, settings와 AI route를 module HTTP interface로 이동한다. 증거: operations HTTP route group·API registry test
- [x] P9-026 streaming이 canonical contract의 허용 event만 전송하게 한다. 증거: SSE schema·HTTP success/error test
- [x] P9-027 limit response에 안정된 error code와 `Retry-After`를 제공한다. 증거: operations HTTP quota contract test
- [x] P9-028 owner mutation, AI quota와 승인 동작을 security audit event로 기록한다. 증거: settings·AI HTTP audit adapter와 contract test
- [x] P9-029 HTTP contract test에 auth, owner, quota, streaming error와 no-store를 포함한다. 증거: `operations-http.test.ts`
- [x] P9-030 `module.ts`에서 reporting port, repository, AI runtime, use case와 route를 조립한다. 증거: operations `module.ts`
- [x] P9-031 apps/api에서 세 reporting port와 resource·content command port를 주입한다. 증거: `operations-module.composition.ts`
- [x] P9-032 기존 core admin, API dashboard·analytics·settings·AI adapter와 중복 route를 제거한다. 증거: P9 ownership guard·dead-code gate
- [x] P9-033 P9 게이트: domain·application·repository·AI·HTTP·interface·architecture test와 admin operations flow가 통과한다. 증거: [P9 자동 검증](./p9-validation.md#자동-검증)

## 14. P10 — API composition root와 lifecycle

### 14.1 config와 runtime adapter

- [x] P10-001 apps/api의 env parser가 실제 runtime 입력을 한 번만 검증하게 한다. 증거: `apps/api/src/main.ts`, package interface gate
- [x] P10-002 원문 env가 module·infra 경계 너머로 전달되지 않게 한다. 증거: `create-container.ts`, package interface gate
- [x] P10-003 system Clock adapter를 apps/api runtime에 둔다. 증거: `runtime/system-clock.ts`
- [x] P10-004 UUID generator adapter를 apps/api runtime에 둔다. 증거: `runtime/uuid-generator.ts`
- [x] P10-005 import 시점 singleton과 side effect를 제거한다. 증거: `main.ts`의 `import.meta.main`, container factory test

### 14.2 container

- [x] P10-006 logger, DB, event bus, AI, storage와 auth의 생성 순서를 정의한다. 증거: `composition/create-container.ts`
- [x] P10-007 identity module에 auth, DB, Clock, ID와 event bus를 주입한다. 증거: `identity-module.composition.ts`, auth identity bridge
- [x] P10-008 content module에 DB, Clock, ID와 event bus를 주입한다. 증거: `content-module.composition.ts`
- [x] P10-009 ai-feedback module에 AI, DB, Clock과 ID를 주입한다. 증거: `ai-feedback-module.composition.ts`
- [x] P10-010 learning module에 content·identity query와 ai-feedback application port를 주입한다. 증거: `learning-module.composition.ts`
- [x] P10-011 resource-library module에 storage, DB, Clock, ID와 event bus를 주입한다. 증거: `resource-library-module.composition.ts`, resource document event test
- [x] P10-012 operations module에 reporting, 대상 command, AI와 DB port를 주입한다. 증거: `operations-module.composition.ts`
- [x] P10-013 module이 다른 module factory나 내부 source를 직접 import하지 않는지 검사한다. 증거: dependency-cruiser와 package interface gate
- [x] P10-014 partial initialization 실패 시 생성 역순으로 resource를 정리한다. 증거: `composition/container-cleanup.ts`
- [x] P10-015 container test에서 각 실패 지점의 cleanup 호출을 검증한다. 증거: `composition/container-cleanup.test.ts`

### 14.3 Hono app 조립

- [x] P10-016 공통 request context와 request ID middleware를 가장 먼저 적용한다. 증거: `http/unified-app.ts`, request ID 회귀 test
- [x] P10-017 body limit, trusted origin, Host·CORS·no-store 경계를 audience에 맞게 적용한다. 증거: learner·admin·unified app HTTP test
- [x] P10-018 learner와 admin auth route를 분리된 realm으로 mount한다. 증거: `composition/create-app.ts`, auth proxy·unified app test
- [x] P10-019 각 module route를 기존 public path와 method에 맞게 mount한다. 증거: runtime OpenAPI exact parity test
- [x] P10-020 global handler가 예상하지 못한 결함만 500으로 처리하게 한다. 증거: `http/learner-error-response.ts`, expected security error test
- [x] P10-021 expected Result가 global handler로 새지 않는 test를 추가한다. 증거: module HTTP error test와 learner expected error logger test
- [x] P10-022 runtime OpenAPI를 실제 등록 route에서 생성한다. 증거: learner·admin OpenAPI route test
- [x] P10-023 기준선 OpenAPI와 route parity 차이를 승인된 변경과 결함으로 분류한다. 증거: `test-support/p10-route-parity.ts`, [P10 parity](./p10-validation.md#routeopenapifrontend-parity)
- [x] P10-024 frontend가 사용하는 route의 method·path·wire schema parity를 100% 확인한다. 증거: Web·Admin HTTP adapter contract test, [P10 parity](./p10-validation.md#routeopenapifrontend-parity)

### 14.4 health와 shutdown

- [x] P10-025 health가 process 생존과 DB readiness를 구분하게 한다. 증거: `runtime/api-health.ts`, learner·admin health routes
- [x] P10-026 learner·admin health surface가 같은 API runtime 상태를 반영하게 한다. 증거: unified app shared-readiness test
- [x] P10-027 shutdown 시 새 요청 수락을 먼저 중단한다. 증거: lifecycle 신규 요청 503 test
- [x] P10-028 진행 요청 drain의 timeout과 결과를 기록한다. 증거: lifecycle drain·timeout observation test
- [x] P10-029 모든 event subscription을 해제한다. 증거: container subscription cleanup과 lifecycle 순서 test
- [x] P10-030 AI runtime을 정리한다. 증거: operations `closeAi`와 lifecycle cleanup test
- [x] P10-031 DB connection을 닫는다. 증거: lifecycle unit·child process test
- [x] P10-032 log를 flush하고 각 cleanup 실패를 구조화해 기록한다. 증거: lifecycle phase failure test, `main.ts`
- [x] P10-033 signal 중복 수신에서 cleanup을 중복 실행하지 않게 한다. 증거: lifecycle·signal 멱등 test
- [x] P10-034 factory test가 실제 process를 시작하지 않게 한다. 증거: `composition/create-container.test.ts`, `import.meta.main` guard
- [x] P10-035 기존 apps/api app-owned repository, module과 platform 중복 구현을 제거한다. 증거: package interface ownership guard와 제거 source 목록
- [x] P10-036 P10 게이트: API unit·integration·HTTP·lifecycle test, OpenAPI parity와 API build가 통과한다. 증거: [P10 자동 검증](./p10-validation.md#자동-검증)

## 15. P11 — 통합 schema, migration과 seed

### 15.1 schema composition

- [x] P11-001 auth와 6개 module의 schema export를 apps/api tooling consumer에 연결한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-002 `@workspace/db`의 module schema re-export를 제거한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-003 apps/api Drizzle config가 허용된 `./schema` subpath만 수집하게 한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-004 tooling 외 consumer의 `./schema` import를 거부한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-005 table 이름이 context prefix와 snake_case 규칙을 따르는지 검사한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-006 module 내부 FK만 남기고 cross-module FK·cascade를 0개로 만든다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-007 cross-module SQL join을 0개로 만들고 공개 query·reporting port로 치환한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-008 제거된 FK가 만들 수 있는 dangling reference를 reconciliation query로 관측한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)
- [x] P11-009 DB에서 보장할 invariant와 application에서 보장할 invariant를 test로 분리한다. 증거: [P11 schema composition](./p11-validation.md#schema-composition과-불변식)

### 15.2 migration 계보

- [x] P11-010 기존 적용 migration과 production 호환 범위를 다시 확인한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-011 migration directory를 apps/api의 통합 실행 지점으로 이동하되 순서와 내용을 보존한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-012 이미 적용된 migration을 수정·재정렬하지 않았는지 checksum 또는 diff로 검증한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-013 schema 소유권 변경에 필요한 새 append-only migration을 생성한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-014 생성 SQL의 table, index, trigger, FK drop과 data copy를 사람이 review한다. 증거: [P11 SQL 검토](./p11-validation.md#migration-계보와-호환성)
- [x] P11-015 migration 전 데이터 사전 검사에서 orphan·중복·invalid state를 fail-closed한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-016 빈 DB에 전체 migration을 적용한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-017 기준선 버전 DB에 incremental migration을 적용한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-018 migration 전후 schema와 핵심 row count·invariant를 비교한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성)
- [x] P11-019 새 code와 이전 schema, 이전 code와 새 schema의 호환 한계를 기록한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성), [롤백 계약](../../engineering/rollback.md#통합-schema-이후-호환성)
- [x] P11-020 destructive 변경이 code rollback만으로 복구되지 않음을 명시한다. 증거: [P11 migration 계보](./p11-validation.md#migration-계보와-호환성), [ADR-0019](../../engineering/adr/ADR-0019-unified-application-migration-lineage.md#호환성과-롤백)

### 15.3 seed, backup과 restore

- [x] P11-021 실제 seed가 있는 module만 `./seed`를 export하게 한다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-022 apps/api seed composition이 module seed provider를 명시적으로 호출하게 한다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-023 seed가 기존 사용자 학습 기록을 암묵적으로 삭제하지 않게 한다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-024 reset이 환경 확인과 destructive-operation guard를 통과하게 한다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-025 production reset이 별도 승인 없이는 fail-closed하는지 test한다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-026 새 schema에서 backup snapshot을 생성하고 독립 경로에서 연다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-027 restore fixture에서 integrity, 필수 table과 application read smoke를 검증한다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-028 WAL·SHM과 원본 파일 불변성 회귀 test를 통과시킨다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore)
- [x] P11-029 migration 실패, backup 실패와 restore 실패의 운영 중단 조건을 runbook과 대조한다. 증거: [P11 seed·reset·backup](./p11-validation.md#seedresetbackuprestore), [롤백 계약](../../engineering/rollback.md)
- [x] P11-030 P11 게이트: fresh·upgrade migration, seed, backup·restore와 schema architecture 검사가 통과한다. 증거: [P11 자동 검증](./p11-validation.md#자동-검증)

## 16. P12 — web, admin과 Storybook 소비 경계

### 16.1 공통 frontend 경계

- [x] P12-001 web과 admin의 module, DB, Drizzle import를 0개로 만든다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-002 feature 간 내부 path import를 public feature interface 또는 상위 조립으로 치환한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-003 `app → features → entities → shared` 의존 방향을 architecture fixture로 고정한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-004 server-only auth·env·request client가 client bundle에 포함되지 않게 한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-005 최초 조회와 SEO 화면은 Server Component가 feature DAL을 호출하게 한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-006 Server Component가 자기 Next Route Handler를 다시 fetch하지 않게 한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-007 browser interaction 이후 요청만 client HTTP adapter를 사용하게 한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-008 server→client boundary에 serializable props만 전달한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-009 URL, server data, local draft와 theme 상태의 owner를 화면별로 확인한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-010 같은 server response를 cache와 local state에 중복 저장하지 않게 한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-011 성공 response를 endpoint별 canonical Zod schema로 parse한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-012 network, HTTP와 contract error를 서로 다른 UI 처리 경로로 유지한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-013 error는 `role="alert"`, 일반 status는 `role="status"` 기준을 적용한다. 증거: [공통 frontend 경계](./p12-validation.md#공통-frontend-경계)
- [x] P12-014 destructive action에 확인 UI와 server-side authorization을 함께 적용한다. 증거: [admin](./p12-validation.md#admin)

### 16.2 web

- [x] P12-015 학습자 auth client·server import를 새 infra 경로로 전환한다. 증거: [web](./p12-validation.md#web)
- [x] P12-016 course·lesson·progress feature DAL을 새 learning contract에 맞춘다. 증거: [web](./p12-validation.md#web)
- [x] P12-017 AI feedback mutation과 제한·provider 오류 UI를 새 contract에 맞춘다. 증거: [web](./p12-validation.md#web)
- [x] P12-018 학습 상태 전이 후 navigation을 router API로 처리한다. 증거: [web](./p12-validation.md#web)
- [x] P12-019 landing과 핵심 학습 route의 bundle guard를 유지한다. 증거: [web](./p12-validation.md#web)
- [x] P12-020 learner UI test에 loading, empty, validation, contract error와 auth expiry를 포함한다. 증거: [web](./p12-validation.md#web)
- [x] P12-021 `ENABLE_TEST_AUTH=true`로 learner 핵심 E2E를 통과시킨다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)

### 16.3 admin

- [x] P12-022 admin auth client·server import를 새 infra 경로로 전환한다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-023 identity, content, resource와 operations feature adapter를 새 contract에 맞춘다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-024 owner-only mutation의 disabled UI와 server 거부를 독립 검증한다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-025 Lexical React editor를 admin resource feature 안에 둔다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-026 shared resource-document에는 headless codec만 남긴다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-027 Lexical, chart와 무거운 client runtime을 실제 route에서 dynamic import한다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-028 resource와 chart route의 bundle guard를 유지한다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-029 admin UI test에 version conflict, permission, provider error와 destructive confirm을 포함한다. 증거: [admin](./p12-validation.md#admin)
- [x] P12-030 `ENABLE_TEST_AUTH=true`로 admin 핵심 E2E를 통과시킨다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)

### 16.4 Storybook

- [x] P12-031 Storybook manifest가 UI와 config만 내부 dependency로 선언하게 한다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)
- [x] P12-032 story에서 제품 API, auth와 module import를 제거한다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)
- [x] P12-033 shared UI state·variant story를 새 public subpath로 전환한다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)
- [x] P12-034 interaction과 a11y test를 통과시킨다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)
- [x] P12-035 static Storybook build를 통과시킨다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)
- [x] P12-036 P12 게이트: frontend architecture, unit·UI·Storybook test, 두 Next build와 핵심 E2E가 통과한다. 증거: [Storybook과 자동 검증](./p12-validation.md#storybook과-자동-검증)

## 17. P13 — 오류, 보안, 관측성과 외부 I/O 통합 검증

### 17.1 오류와 결정성

- [x] P13-001 domain의 예상 가능한 실패가 모두 `Result` union인지 검사한다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)
- [x] P13-002 application의 async 실패가 모두 `ResultAsync` 또는 명시적 Result variant인지 검사한다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)
- [x] P13-003 infrastructure exception이 typed error로 변환되는지 검사한다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)
- [x] P13-004 HTTP Result mapping의 switch가 exhaustive한지 typecheck fixture로 검증한다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)
- [x] P13-005 expected failure를 `null`, 빈 배열과 generic success boolean으로 병합하지 않는지 검사한다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)
- [x] P13-006 domain·application의 직접 시간·ID 생성을 0개로 만든다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)
- [x] P13-007 mutable aggregate와 mutable event payload를 0개로 만든다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)
- [x] P13-008 범용 JSON stringify equality를 domain value object에서 사용하지 않는지 검사한다. 증거: [오류와 결정성](./p13-validation.md#오류와-결정성)

### 17.2 인증·인가와 browser security

- [x] P13-009 learner와 admin credential, cookie와 session lifecycle 분리를 회귀 검증한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)
- [x] P13-010 공개 admin signup이 존재하지 않는지 검증한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)
- [x] P13-011 모든 protected read·write가 server authorization을 통과하는지 route inventory로 검증한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)
- [x] P13-012 role, credential와 user status 변경 시 session 폐기 영향을 검증한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)
- [x] P13-013 reverse proxy가 정제한 client IP만 rate-limit 입력으로 신뢰하게 한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)
- [x] P13-014 auth, operations와 ai-feedback rate-limit owner가 겹치지 않는지 검증한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)
- [x] P13-015 CORS, trusted origin, Host, cookie, CSRF, CSP와 no-store를 통합 검토한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)
- [x] P13-016 public error에 stack, SQL, provider 원문, credential과 개인정보가 없는지 fuzz·fixture로 검증한다. 증거: [인증·인가와 browser security](./p13-validation.md#인증인가와-browser-security)

### 17.3 AI·storage·event 안전성

- [x] P13-017 AI provider에 필요한 최소 텍스트만 전달되는지 검증한다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-018 prompt, 원문 답안과 provider response가 기본 log에 남지 않는지 검증한다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-019 모든 provider call에 timeout과 AbortSignal이 적용되는지 검증한다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-020 transaction 안에서 OpenAI 또는 R2를 기다리는 경로를 0개로 만든다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-021 R2 upload·delete compensation과 reconciliation이 멱등 key를 유지하는지 검증한다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-022 event가 DB commit 이후에만 publish되는지 application test로 검증한다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-023 listener 순서 의존과 `emitSerial` 사용을 0개로 만든다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-024 event dispatch 실패가 이미 commit된 상태를 rollback으로 오표현하지 않는지 검증한다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)
- [x] P13-025 in-memory event 기반 권위 projection을 0개로 만든다. 증거: [AI·storage·event 안전성](./p13-validation.md#aistorageevent-안전성)

### 17.4 관측성과 운영

- [x] P13-026 request log에 request ID, audience, actor type, 결과, duration과 오류 분류를 포함한다. 증거: [관측성과 운영](./p13-validation.md#관측성과-운영)
- [x] P13-027 owner mutation, auth failure, authorization denial과 AI quota를 security audit event로 남긴다. 증거: [관측성과 운영](./p13-validation.md#관측성과-운영)
- [x] P13-028 event·provider·storage와 reconciliation 실패를 분류해 기록한다. 증거: [관측성과 운영](./p13-validation.md#관측성과-운영)
- [x] P13-029 secret·credential·session·원문 답안 redaction test를 통과시킨다. 증거: [관측성과 운영](./p13-validation.md#관측성과-운영)
- [x] P13-030 health에서 DB readiness와 사용자 영향 판단 신호를 확인한다. 증거: [관측성과 운영](./p13-validation.md#관측성과-운영)
- [x] P13-031 shutdown에서 request drain, unsubscribe, AI, DB와 log flush 순서를 확인한다. 증거: [관측성과 운영](./p13-validation.md#관측성과-운영)
- [x] P13-032 OpenTelemetry·Sentry·새 dashboard를 owner·보존·비용 결정 없이 추가하지 않았는지 확인한다. 증거: [관측성과 운영](./p13-validation.md#관측성과-운영)
- [x] P13-033 P13 게이트: security, failure-path, audit, health와 shutdown test가 통과한다. 증거: [자동 검증](./p13-validation.md#자동-검증)

## 18. P14 — 배포·운영 automation 경로 전환

### 18.1 build와 CI

- [x] P14-001 Docker build context와 COPY path가 2단계 package 구조를 포함하게 한다. 증거: [build와 CI](./p14-validation.md#build와-ci)
- [x] P14-002 web, admin과 API image가 필요한 workspace만 포함하는지 확인한다. 증거: [build와 CI](./p14-validation.md#build와-ci)
- [x] P14-003 image build가 hoisted transitive dependency에 기대지 않는지 확인한다. 증거: [build와 CI](./p14-validation.md#build와-ci)
- [x] P14-004 CI path filter가 modules, infra, shared와 config 변경을 감지하게 한다. 증거: [build와 CI](./p14-validation.md#build와-ci)
- [x] P14-005 CI가 architecture, dead-code, lint, typecheck, test와 build를 실행하게 한다. 증거: [build와 CI](./p14-validation.md#build와-ci)
- [x] P14-006 generated OpenAPI·migration·Storybook artifact의 source와 보존 위치를 확인한다. 증거: [build와 CI](./p14-validation.md#build와-ci)
- [x] P14-007 dependency audit 예외의 근거·owner·만료 조건을 재검토한다. 증거: [build와 CI](./p14-validation.md#build와-ci)

### 18.2 deployment와 recovery

- [x] P14-008 Compose가 통합 API runtime 하나를 계속 사용하게 한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-009 proxy가 learner·admin API를 같은 API upstream에 연결하게 한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-010 environment·secret 이름 변경이 parser, example과 deployment automation에 함께 반영되게 한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-011 migration automation이 apps/api의 통합 migration entry를 사용하게 한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-012 seed·reset 명령이 production에서 fail-closed하게 한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-013 backup script와 restore playbook의 새 package 경로를 갱신한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-014 rollback이 learner·admin API를 같은 immutable image로 되돌리게 한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-015 migration 비호환 시 code rollback과 data recovery를 분리하게 한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-016 operation lock과 stale lock의 fail-closed 동작을 유지한다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-017 정적 deployment config·Ansible·image smoke를 비운영 환경에서 검증한다. 증거: [자동 검증과 증거 한계](./p14-validation.md#자동-검증과-증거-한계)
- [x] P14-018 실제 production deploy·rollback·restore는 별도 승인 없이는 실행하지 않는다. 증거: [deployment와 recovery](./p14-validation.md#deployment와-recovery)
- [x] P14-019 P14 게이트: deployment 정적 검사, image build·smoke와 recovery source test가 통과한다. 증거: [자동 검증과 증거 한계](./p14-validation.md#자동-검증과-증거-한계)

## 19. P15 — 이전 구조와 임시 호환 계층 제거

### 19.1 package와 source 제거

- [x] P15-001 모든 `@workspace/core/*` consumer를 0개로 만든다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-002 `packages/core` package와 public surface fixture를 제거한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-003 모든 `@workspace/repository-tooling` consumer를 0개로 재확인한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-004 기존 평면 `packages/*` source workspace를 target group으로 이동하거나 제거한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-005 root workspace에서 임시 `packages/*` glob을 제거한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-006 apps/api의 이전 adapter, module, route, platform과 composition 중복 source를 제거한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-007 packages/db의 이전 schema, domain policy, migration과 seed 중복 source를 제거한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-008 이전 config package와 중복 설정을 제거한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-009 모든 forwarding file과 deprecated alias를 제거한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-010 임시 compatibility adapter와 allowlist를 제거한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-011 제거 ledger의 미완료 항목을 0개로 만든다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)

### 19.2 정적 잔존물 검사

- [x] P15-012 `@workspace/core`, `@workspace/repository-tooling`과 이전 package path 문자열을 전체 검색한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-013 `src` deep import, 상대 workspace import와 file extension import를 전체 검색한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-014 broad root barrel과 같은 package public path 역참조를 전체 검색한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-015 cross-module schema, repository와 table import를 전체 검색한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-016 domain의 Hono, Drizzle, React, provider SDK와 `process.env` import를 전체 검색한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-017 frontend의 module, DB와 Drizzle import를 전체 검색한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-018 product source의 generic `utils`, `common`, `service` 신규 항목을 검토한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-019 directory·file PascalCase와 non-kebab-case 신규 항목을 검사한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-020 source 없는 legacy·generated directory와 빈 target directory를 정리한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-021 이전 runtime identifier, package-manager·DB 전제와 삭제 route 문자열을 검색한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)

### 19.3 manifest와 lockfile

- [x] P15-022 최종 workspace inventory가 앱 4개와 package 24개인지 검사한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-023 모든 내부 package name이 `@workspace/*`인지 검사한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-024 package가 `modules`, `infra`, `shared`, `config` 아래에만 존재하는지 검사한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-025 모든 external import가 importing workspace manifest에 직접 선언됐는지 검사한다. 증거: [정적 잔존물 감사](./p15-validation.md#정적-잔존물-감사)
- [x] P15-026 불필요 dependency, export와 source를 Knip으로 제거한다. 증거: [검증 환경과 게이트](./p15-validation.md#검증-환경과-게이트)
- [x] P15-027 lockfile을 새 workspace와 manifest 상태로 갱신한다. 증거: [제거와 최종 구조](./p15-validation.md#제거와-최종-구조)
- [x] P15-028 frozen install을 새 checkout 또는 격리된 환경에서 통과시킨다. 증거: [검증 환경과 게이트](./p15-validation.md#검증-환경과-게이트)
- [x] P15-029 P15 게이트: 이전 구조, 임시 예외, 중복 package와 undeclared dependency가 0개다. 증거: [검증 환경과 게이트](./p15-validation.md#검증-환경과-게이트)

## 20. P16 — 전체 검증과 완료 판정

### 20.1 정적 품질 gate

- [ ] P16-001 실행 시점의 root manifest에서 authoritative 검증 명령을 다시 확인한다. 증거:
- [ ] P16-002 toolchain과 engine floor를 확인한다. 증거:
- [ ] P16-003 `bun install --frozen-lockfile`을 통과시킨다. 증거:
- [ ] P16-004 setup이 기존 env와 데이터를 덮어쓰지 않는지 검증한다. 증거:
- [ ] P16-005 doctor가 새 workspace와 runtime dependency를 정상 판정하는지 검증한다. 증거:
- [ ] P16-006 architecture 검사를 통과시킨다. 증거:
- [ ] P16-007 dead-code 검사를 통과시킨다. 증거:
- [ ] P16-008 package interface와 runtime cycle 검사를 통과시킨다. 증거:
- [ ] P16-009 formatting check와 lint를 warning 없이 통과시킨다. 증거:
- [ ] P16-010 전체 typecheck를 통과시킨다. 증거:
- [ ] P16-011 전체 unit·integration·HTTP·UI test를 통과시킨다. 증거:
- [ ] P16-012 web, admin, API와 Storybook build를 통과시킨다. 증거:
- [ ] P16-013 dependency audit와 repository 정책 검사를 통과시킨다. 증거:
- [ ] P16-014 pre-commit hook 전체를 통과시킨다. 증거:

### 20.2 데이터와 운영 gate

- [ ] P16-015 빈 DB migration과 seed를 반복 실행해 deterministic 결과를 확인한다. 증거:
- [ ] P16-016 기준선 DB upgrade와 application read·write smoke를 통과시킨다. 증거:
- [ ] P16-017 schema에서 cross-module FK와 join이 0개인지 최종 확인한다. 증거:
- [ ] P16-018 backup·독립 restore·integrity와 필수 table smoke를 통과시킨다. 증거:
- [ ] P16-019 rollback 한계와 data recovery 필요 조건을 reviewer가 승인한다. 증거:
- [ ] P16-020 API health, readiness와 graceful shutdown을 실제 process로 검증한다. 증거:
- [ ] P16-021 image build·smoke와 deployment static test를 통과시킨다. 증거:

### 20.3 사용자 흐름과 비기능 gate

- [ ] P16-022 `ENABLE_TEST_AUTH=true`로 학습자 인증과 핵심 학습 E2E를 통과시킨다. 증거:
- [ ] P16-023 `ENABLE_TEST_AUTH=true`로 관리자 인증·권한과 핵심 운영 E2E를 통과시킨다. 증거:
- [ ] P16-024 AI success, provider unavailable, timeout과 quota E2E 또는 경계 test를 통과시킨다. 증거:
- [ ] P16-025 자료실 upload·저장·conflict·delete·reconciliation 흐름을 통과시킨다. 증거:
- [ ] P16-026 route registry와 runtime OpenAPI가 승인된 기준선 차이만 포함하는지 확인한다. 증거:
- [ ] P16-027 frontend 주요 route의 bundle guard와 Storybook a11y를 통과시킨다. 증거:
- [ ] P16-028 구조화 로그와 audit event에서 민감 정보가 redaction되는지 확인한다. 증거:
- [ ] P16-029 시작한 Node, Bun, dev server와 background process를 모두 안전하게 종료한다. 증거:

### 20.4 목표 구조 완료 조건

- [ ] P16-030 모듈마다 domain·application·infrastructure·interface 수직 슬라이스가 실제 책임을 소유한다. 증거:
- [ ] P16-031 module 간 협력이 공개 query port, application port 또는 domain event로만 이뤄진다. 증거:
- [ ] P16-032 expected failure가 Result union으로 표현된다. 증거:
- [ ] P16-033 aggregate event가 immutable DomainDecision으로 반환된다. 증거:
- [ ] P16-034 frontend의 module·DB import가 0개다. 증거:
- [ ] P16-035 unified migration, seed, backup·restore 경계가 검증됐다. 증거:
- [ ] P16-036 deprecated alias, forwarding, 장기 dual architecture와 compatibility facade가 0개다. 증거:
- [ ] P16-037 P16 게이트: 목표 아키텍처 가이드의 완료 조건을 전부 충족한다. 증거:

## 21. P17 — 영구 문서 반영과 archive

### 21.1 권위 문서 갱신

- [ ] P17-001 `docs/authority-map.md`의 package, API, schema와 test 권위 경로를 새 구조에 맞춘다. 증거:
- [ ] P17-002 `docs/engineering/system-overview.md`에 최종 module·composition 경계 원칙을 반영한다. 증거:
- [ ] P17-003 workspace dependency와 package interface 문서를 새 group·public subpath 규칙에 맞춘다. 증거:
- [ ] P17-004 repository architecture tooling 문서를 dependency-cruiser·Knip 책임에 맞춘다. 증거:
- [ ] P17-005 tech stack과 runtime configuration 문서의 변경 원칙을 검토한다. 증거:
- [ ] P17-006 API contract 문서에 module-owned route와 canonical contract 원칙을 반영한다. 증거:
- [ ] P17-007 auth·permission·security 문서에 auth/identity 분리와 rate-limit owner를 반영한다. 증거:
- [ ] P17-008 data model·schema convention 문서에 module schema와 cross-module reference 원칙을 반영한다. 증거:
- [ ] P17-009 frontend development 문서에 새 package 소비 경계를 반영한다. 증거:
- [ ] P17-010 testing 문서에 계층별 module test와 architecture fixture 원칙을 반영한다. 증거:
- [ ] P17-011 observability 문서에 request·security·provider·event audit 경계를 반영한다. 증거:
- [ ] P17-012 migration·backup·rollback·deployment 문서를 새 실행 지점과 안전 절차에 맞춘다. 증거:
- [ ] P17-013 되돌리기 어려운 결정의 ADR을 작성하거나 기존 ADR을 갱신한다. 증거:
- [ ] P17-014 문서가 manifest·route·schema·명령의 현재 값을 중복 소유하지 않는지 review한다. 증거:
- [ ] P17-015 모든 내부 문서 링크와 document drift 검사를 통과시킨다. 증거:

### 21.2 검증 기록과 보관

- [ ] P17-016 기준 commit, 실행 시각, 환경, 명령, 결과와 artifact 위치를 이 작업 기록에 정리한다. 증거:
- [ ] P17-017 production 미실행 항목과 별도 승인이 필요한 후속 작업을 명확히 표시한다. 증거:
- [ ] P17-018 미완료 checkbox, 차단 항목과 임시 예외를 0개로 만든다. 증거:
- [ ] P17-019 `docs/work/_index.md`에서 작업 상태를 완료로 갱신할 준비를 한다. 증거:
- [ ] P17-020 영구 결론이 권위 문서에 반영됐는지 최종 reviewer가 확인한다. 증거:
- [ ] P17-021 작업 디렉터리 전체를 같은 이름의 `docs/archive` 경로로 이동한다. 증거:
- [ ] P17-022 `docs/work/_index.md`에서 진행 중 작업 항목을 제거한다. 증거:
- [ ] P17-023 `docs/archive/_index.md`에 완료 작업과 검증 기록 링크를 추가한다. 증거:
- [ ] P17-024 이동 뒤 문서 링크와 document drift 검사를 다시 통과시킨다. 증거:
- [ ] P17-025 최종 git diff에 unrelated refactor, formatting-only 변경과 생성물이 없는지 확인한다. 증거:
- [ ] P17-026 P17 게이트: implementation, 검증, 영구 문서와 archive 생명주기가 모두 완료됐다. 증거:
