# ADR-0014: 실행 앱 소유 persistence adapter 전환

## 상태

채택됨. 단, Better Auth integration 위치 결정은 ADR-0018이 대체하며 app-owned persistence adapter 결정은 유지한다.

## 날짜

2026-07-17

## 맥락

결정 시점의 `packages/core`는 순수 정책과 application port뿐 아니라 DB·Drizzle·Better Auth·OpenAI adapter와 두 API composition root를 함께 소유했다. production source에는 core runtime dependency edge 67개가 있었고 core manifest는 `@workspace/db`, `drizzle-orm`, `better-auth`, `openai`에 의존했다. 반대로 `packages/db → packages/core` edge는 0개였다.

adapter를 바로 `packages/db`로 옮기고 core port를 import하게 하면 남은 core adapter가 `packages/db`를 사용하는 전환 기간에 workspace cycle이 생긴다. 모든 adapter를 한 번에 옮기는 atomic flip은 임시 surface가 없지만 변경량과 rollback 범위가 너무 크다. port type을 복제하거나 private core path를 공개하는 migration bridge는 의미 drift와 영구 호환 surface를 만든다.

## 결정

- concrete persistence, Better Auth와 provider adapter는 해당 executable app이 소유한다.
  - learner adapter: `apps/api/src/adapters/<capability>`
  - 전환 중 관리자 adapter: `apps/admin-api/src/adapters/<capability>`
  - 단일 API runtime 전환 시 관리자 adapter도 `apps/api`의 같은 capability 경계로 이동한다.
- `packages/core`는 immutable domain data, 순수 policy, use case와 좁은 application port만 소유한다.
- `packages/db`는 SQLite client, Drizzle schema, migration, seed와 transport/domain에 독립적인 persisted-value helper만 소유하고 `packages/core`를 import하지 않는다.
- 실행 앱의 composition root만 core port, app-owned concrete adapter와 `packages/db`를 함께 알고 조립한다. HTTP route와 middleware는 DB·Drizzle을 직접 import하지 않는다.
- capability별 전환은 adapter source와 test를 복제하지 않고 core에서 app으로 원자적으로 이동한다. 같은 merge에서 composition consumer와 exact architecture allowance를 전환한다.
- app adapter가 구현해야 하는 port가 core private 경로에 있으면 해당 port와 필요한 transport-neutral data만 capability public API로 공개한다. migration 전용 wildcard export, concrete factory와 DB type은 공개하지 않는다.
- TypeScript `satisfies` 또는 명시적 반환 타입으로 adapter의 port conformance를 compile time에 검증한다. 구조가 비슷하다는 이유로 duplicate type을 만들지 않는다.

### 구현 전 source audit 보정

MTA-15·16 착수 전 실제 bootstrap import를 다시 확인한 결과, composition을 먼저 완전히 옮기려면 아직 core에 있는 private concrete factory를 새로 공개하거나 모든 adapter를 runtime 단위로 한 번에 옮겨야 했다. 전자는 public surface 부채를 만들고 후자는 rollback 범위와 병렬성을 지나치게 키웠다. 따라서 당시 존재하던 learner·admin API bootstrap export 두 개만 축소형 전환 seam으로 허용했다.

- exact production consumer는 각각 `apps/api`와 `apps/admin-api` 하나다.
- MTA-15·16에서 DB 생성·close와 top-level runtime 설정의 owner를 먼저 실행 앱으로 옮긴다.
- seam은 아직 이동하지 않은 application service 조립만 제공하며 DB 생성·close, concrete adapter export, private path와 service locator를 노출하지 않는다.
- capability adapter를 옮기는 같은 변경에서 seam의 해당 입력·출력을 줄이고 exact architecture allowance를 제거한다.
- 새 migration subpath나 wildcard export는 추가하지 않으며 두 seam은 MTA-26에서 package export와 함께 삭제한다.

이 보정은 최종 graph를 바꾸지 않는다. 기존 공개 seam을 단조 축소해 capability별 rollback을 유지하는 전환 순서만 구체화한다.

## 전환 중 허용 topology

각 capability merge에서 다음 두 상태만 허용한다.

1. 아직 이동하지 않은 adapter: `core → db` exact allowance가 제거 MTA와 함께 남아 있다.
2. 이동한 adapter: `app composition → core port + app adapter → db`이며 해당 core allowance는 0이다.

`db → core`, route→DB, private core deep import, duplicate port와 동일 adapter의 core/app 이중 구현은 어떤 중간 상태에서도 허용하지 않는다. 위 두 축소형 bootstrap seam 외의 migration export도 금지한다. 이 topology는 capability별 작은 rollback을 가능하게 하고 workspace cycle을 만들지 않는다.

## 고려한 대안

### 대안 1. 모든 adapter를 한 번에 `packages/db`로 이동

- 장점: 최종 persistence 위치가 한 package이고 임시 topology가 없다.
- 단점: composition, 20개가 넘는 adapter, 테스트와 manifest를 한 번에 바꿔야 하며 부분 rollback과 병렬 merge가 어렵다.

### 대안 2. 제한된 migration export로 `packages/db`에 순차 이동

- 장점: capability별로 옮길 수 있다.
- 단점: core↔db cycle을 피하려면 callback, duplicate port 또는 migration-only public export가 필요하고 제거 전까지 두 package의 책임이 불투명하다.

### 대안 3. `packages/db`가 core public port를 영구 import

- 장점: adapter를 persistence package에 집중하고 type conformance가 직접적이다.
- 단점: 범용 schema/client package가 업무 capability 변경에 결합되며 runtime별 adapter 설정과 lifecycle owner가 다시 숨는다. 현재 adapter는 단일 executable 소비자만 가진다.

## 결과

- capability별 source move가 독립적이고 `core → db` allowance를 단조 감소시킬 수 있다.
- 실행 앱의 코드량은 늘지만 concrete technology와 lifecycle이 실제 실행 owner 가까이에 위치한다.
- `packages/db`는 안정적인 storage primitive 경계로 남고 core와 cycle을 만들지 않는다.
- runtime 통합 때 관리자 adapter 경로 이동이 한 번 더 필요하다. 그러나 이미 app-owned이므로 core/package graph를 다시 바꾸지 않는 local move다.

## 완료 조건

- MTA-15·16이 composition root를 실행 앱으로 옮긴다.
- 두 기존 bootstrap seam은 앱의 DB·lifecycle owner 이동 뒤 단조 축소되고 MTA-26에서 제거된다.
- MTA-17~25·50~51이 이 ADR의 app-owned adapter 위치와 단일 topology를 사용한다.
- MTA-26에서 core source·test·manifest의 DB·ORM·Auth·AI·HTTP·UI dependency와 runtime allowance가 모두 0이다.
- `packages/db → packages/core`, API transport→DB와 frontend→DB edge가 0이고 import cycle 검사가 통과한다.
- 임시 seam, duplicate adapter, migration export와 compatibility wrapper가 남지 않는다.

## 구현 상태

### 2026-07-17 당시 구현 상태

MTA-15·16에서 두 executable의 DB lifecycle과 app-local composition entrypoint를 확정했다. `apps/api`는 MTA-17의 learner Better Auth·test auth, MTA-18의 OpenAI provider, MTA-19의 학습 전이, MTA-20의 learner read model·profile/progress reader, MTA-22의 learner profile과 MTA-23의 AI feedback persistence adapter를 소유한다. `apps/admin-api`는 MTA-21의 course/content reset, MTA-22의 identity, MTA-24의 자료실 네 adapter, MTA-25의 dashboard·analytics, MTA-50의 settings와 MTA-51의 AI chat adapter를 소유한다. MTA-26은 production consumer가 없던 content Drizzle adapter·테스트와 두 bootstrap seam을 삭제하고 app composition을 공개 capability facade에 직접 연결했다. core manifest에서 DB·Drizzle dependency를 제거했고 workspace rule을 core infrastructure hard-fail로 전환했다. MTA-31·35의 공개 capability 경계 전환까지 반영한 당시 architecture ratchet 실측은 runtime allowance 0개와 MTA-37이 소유한 capability allowance 1개이며, `packages/core → packages/db`, `packages/db → packages/core`와 import cycle은 모두 0이었다.

### 2026-07-18 현행 source 상태

MTA-59~64로 관리자 content, identity, dashboard/analytics, settings, AI chat, 자료실의 adapter·route가 모두 `apps/api`의 admin Host sub-app으로 이동했다. `apps/api/src/composition/admin-route-composition.ts`가 여섯 capability group을 명시적으로 조립하며, `apps/admin-api`는 parity suite, 로컬 개발, 명시적 rollback 및 관리자 seed/audit script를 위한 legacy workspace로만 유지한다.

Compose/Caddy source는 두 public API Host를 `apps/api`로 전달하고 legacy service를 `rollback` profile로 격리한다. 이 ADR에서 확인하는 것은 source topology와 app-owned adapter 경계다. 실제 production 적용·관찰 및 rollback rehearsal은 외부 운영 증거가 필요하므로 완료된 traffic 전환으로 기록하지 않는다.
