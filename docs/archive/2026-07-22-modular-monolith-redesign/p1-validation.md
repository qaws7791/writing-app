# P1 구현 증거

## Workspace와 config

- root workspace는 기존 `apps/*`, `packages/*`와 target의 `packages/{modules,infra,shared,config}/*`를 함께 발견한다. flat glob 제거는 P15에 연결했다.
- `scripts/workspace-inventory.ts`와 test fixture가 duplicate name, generated-only directory, manifest 누락, target 4개 앱·24개 package 목록을 검증한다.
- `scripts/check-workspace-dependency-versions.ts`가 실제 consumer 수로 exact catalog와 단일 consumer version을 다시 계산하고 내부 dependency의 `workspace:*`와 직접 선언을 강제한다.
- TypeScript, Next.js, env 설정은 각각 `packages/config/typescript-config`, `packages/config/nextjs-config`, `packages/config/env`로 분리했다. env package 이름과 두 public subpath는 유지했고 이전 `@workspace/config`와 경로는 제거했다.
- config의 runtime 상향 dependency는 0이다. TypeScript config 소비를 위한 devDependency만 config package 사이에 허용한다. frontend→server env parser 금지는 dependency-cruiser가 검사한다.

## Task graph와 CI

- `turbo.json`은 build·lint·test·typecheck의 `^task`, build output과 `.env*` input, persistent·non-cache dev 계약을 유지한다. `scripts/turbo-cache-contract.test.ts`가 이를 고정한다.
- root는 `check:architecture`, 읽기 전용 `check:dead-code`를 제공하고 lint에 두 검사와 Oxlint `--deny-warnings`를 포함한다. setup, doctor, DB, Storybook, E2E와 deployment task는 유지했다.
- quality gate의 모든 Bun cache key는 root, app, flat package와 2단계 package manifest를 hash한다.

## Architecture와 dead code

- root devDependency는 dependency-cruiser 18.1.0과 Knip 6.27.0을 exact version으로 선언한다.
- `dependency-cruiser.config.mjs`는 runtime cycle, unresolved·undeclared dependency, config/shared/infra/module 계층, domain 순수성, application adapter, frontend, Storybook과 schema·seed 소비 경계를 소유한다.
- `scripts/check-architecture.ts`는 workspace별 TypeScript config로 private alias와 public subpath를 해석한다. 허용 fixture는 private/public/type-only cycle을, 금지 fixture는 cross-module capture, domain→infra·React, application→adapter, runtime cycle, transitive 미선언 dependency를 검증한다.
- `knip.json`은 root, 앱과 네 target group을 선언하고 실제 dynamic entry만 추가한다. generated output만 제외하며 자동 `--fix`는 사용하지 않는다.
- `scripts/check-package-interfaces.ts`는 explicit export, module schema·seed tooling 제한, root barrel·`src` deep import·자기 public path, forwarding과 삭제 runtime 재도입을 검사한다.

Knip이 확인한 미사용 관리자 preview·workspace source, core load config와 Kwep 비교 script를 제거하고 manifest의 미사용 dependency도 함께 정리했다. 이는 bundle과 유지보수 면적을 줄이지만 public export 제거 위험이 있으므로 typecheck, 전체 test와 package interface snapshot을 함께 실행했다.

## Custom tooling 제거

기존 consumer를 graph·cycle·boundary, workspace inventory, public surface, coverage, CI summary로 분류했다. graph 정책은 dependency-cruiser, unused 검사는 Knip으로 치환했다. workspace inventory와 public surface는 root 소유의 좁은 script로, coverage와 CI summary helper는 각 task owner인 `scripts/`로 옮겼다.

`packages/repository-tooling`, 앱·core architecture test, import cycle·boundary script와 중복 Oxlint graph rule을 제거했다. 새 허용·금지 fixture와 기존 기준선 test 결과를 대조했고, dependency-cruiser가 표현하지 않는 public symbol·삭제 경로 정책만 package interface fixture로 남겼다. 현재 manifest와 source의 `@workspace/repository-tooling` consumer는 0개다.

## Gate

다음 명령이 P1 완료 판정의 권위 실행이다.

```bash
bun install --frozen-lockfile
bun test ./scripts/workspace-inventory.test.ts ./scripts/check-workspace-dependency-versions.test.ts ./scripts/coverage-report.test.ts ./scripts/ci-workspace-inventory.test.ts
bun run check:architecture
bun run check:dead-code
bun run check:package-interfaces
bun run lint
bun run typecheck
bun run build
```

최종 결과는 [P0 검증](./p0-validation.md)에 실행 version·결과와 함께 기록한다. 표준 도구 도입은 자체 parser 유지보수와 정책 중복을 줄이는 장기 선택이다. 반면 workspace별 dependency-cruiser 실행과 Knip entry 관리는 단기 실행 비용이 있으므로 fixture와 명시적 entry로 drift를 통제한다.
