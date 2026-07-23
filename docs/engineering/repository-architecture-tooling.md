# 저장소 아키텍처 검증 도구

## 책임

아키텍처 정책은 하나의 도구에 중복 구현하지 않는다.

| 책임                                                              | 권위 source                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| import graph, runtime cycle, 계층·package 경계, 미선언 dependency | `dependency-cruiser.config.mjs`, `scripts/check-architecture.ts`         |
| 미사용 file·export·dependency                                     | `knip.json`                                                              |
| workspace 발견과 test·coverage 대상                               | `scripts/workspace-inventory.ts`, `scripts/check-workspace-inventory.ts` |
| 명시적 package export와 제거된 구조의 재도입 방지                 | `scripts/check-package-interfaces.ts`, 각 package manifest               |
| coverage 집계와 CI task 결과 해석                                 | `scripts/coverage-report.ts`, `scripts/ci-workspace-inventory-report.ts` |

Oxlint custom rule은 import graph를 다시 해석하지 않고 TypeScript 표현 수준의 `workspace/no-unsafe-unknown-cast`만 검사한다. workspace inventory, coverage와 CI summary helper도 자기 task에 필요한 좁은 입력만 해석하며 범용 repository graph를 만들지 않는다.

## Graph 정책

- runtime cycle은 실패하고 type-only edge는 cycle 판정에서 제외한다.
- 미해결 import와 manifest에 직접 선언하지 않은 package import는 실패한다.
- `config → 상위 계층`, `shared → module·infra·app`, `infra → module·app` 의존을 거부한다.
- Better Auth, OpenAI·Mastra, AWS SDK, Pino와 Emittery 직접 import는 각각의 infra 소유 package로 제한한다.
- shared 안에서도 kernel은 외부 workspace runtime과 framework에 의존하지 않고, event-contracts는 kernel과 types만 의존한다.
- module 내부는 `domain → application → infrastructure/interface` 방향을 지키며 다른 module의 내부 경로를 import하지 않는다.
- module의 domain·application은 shared HTTP contract를 import하지 않는다.
- web·admin은 module·DB·Drizzle을 직접 import하지 않고 `app → features → entities → shared` 방향과 feature 격리를 지킨다. client-facing source는 server 경계를 import하지 않는다.
- Storybook은 UI·config 외 package를 직접 import하지 않는다.
- generated output만 제외하고 source directory 전체를 숨기는 예외는 두지 않는다.
- private alias, 공개 subpath, type-only cycle과 금지 edge는 `scripts/fixtures/dependency-cruiser/`의 허용·금지 fixture로 함께 검증한다.

package는 `modules`, `infra`, `shared`, `config` 네 그룹 아래에만 존재한다. 이전 flat package, `core`, app-owned module·검증 전 env·private import와 API transport→persistence edge의 재도입은 대상 규칙과 package interface 검사로 거부한다. 디렉터리 전체를 통과시키는 임시 allowlist는 허용하지 않으며 새 예외에는 정확한 edge, owner, 제거 단계와 만료 조건이 필요하다.

operations repository의 module schema 직접 조회 예외는 제거하고 identity·content·learning reporting query port로 치환했다. learning과 ai-feedback의 예외도 제거했으며 DB infra에서 content 정책으로 향하는 예외는 두지 않는다. legacy curriculum 정규화는 반대 방향 의존을 만들지 않고 API migration composition이 content 공개 정책을 API-owned 이관에 주입한다.

## Dead code와 공개 표면

Knip gate는 읽기 전용이며 `--fix`를 실행하지 않는다. 실제 runtime·tooling 진입점만 `knip.json`에 선언하고 generated output은 Git ignore 경계로 제외한다. cycle은 dependency-cruiser, 의미상 중복 schema는 계약 검사가 소유하므로 Knip의 해당 reporter는 중복 실행하지 않는다.

package 소비자는 manifest의 명시적 subpath만 사용한다. 공개 subpath의 추가·삭제는 소유 package의 export 목록을 함께 갱신해야 하며, broad root barrel, `src` deep import, 자기 공개 경로 역참조와 제거된 forwarding/runtime의 재도입은 `check:package-interfaces`가 거부한다. 같은 검사는 shared·identity·content·ai-feedback·learning·resource-library·operations package의 exact export key와 target 유효성, canonical ID 중복, canonical 오류 schema 소비, 성공 response runtime parse와 제거된 module 소유권 source의 재유입도 고정한다.

module infrastructure는 자기 private schema를 import할 수 있다. 공개 `./schema`는 API의 단일 Drizzle schema entry와 격리된 E2E content seed fixture만 소비하고, 공개 `./migration`은 API migration composition과 호환성 test만 소비한다. 실제 seed가 있는 package의 `./seed`는 API seed composition과 seed tooling만 소비한다. Better Auth schema는 공식 adapter mapping과 API 인증 persistence adapter가 사용하는 별도 infra 예외다. 다른 module이나 app repository가 module table을 직접 읽는 예외는 두지 않는다.

package interface 검사는 이 allowlist와 함께 API Drizzle config의 schema·output 경로, immutable migration의 정규화 checksum, 통합 migration 선실행, 제거된 DB schema·migration·seed 경로와 DB infra의 business dependency 부재를 검사한다. schema ownership 검사는 context table 이름, cross-module FK 부재와 reconciliation 구현의 SQL join 부재를 runtime test와 나눠 검증한다. frontend 검사는 server source의 `server-only` marker와 Storybook 내부 dependency 범위도 고정한다.

## 실행

```bash
bun run check:architecture
bun run check:dead-code
bun run check:package-interfaces
bun run check:workspace-inventory
```

root `lint`와 pre-commit은 위 검사를 포함한다. dependency-cruiser는 workspace별 TypeScript config를 사용하므로 실행 비용은 단일 root scan보다 크지만 private alias와 runtime별 module resolution을 정확히 따른다. 이 비용은 정책 parser를 자체 유지하는 장기 유지보수 비용보다 작다고 판단한다.

정적 검사의 통과는 source graph를 증명할 뿐 production traffic, 외부 provider와 실제 배포 상태를 증명하지 않는다.
