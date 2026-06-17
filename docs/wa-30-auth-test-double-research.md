# WA-30 인증 테스트 더블 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-30 `테스트 더블(Test Double)의 잘못된 사용`
- 조사 범위: `apps/api/src/auth/auth.test.ts`, `apps/api/src/auth/auth.ts`, DB in-memory test helper, admin auth 테스트 사례

## 이슈 요약

WA-30은 `apps/api/src/auth/auth.test.ts`가 `createFakeDatabase()`와 `as never`를 사용해 `KwepDatabase`를 흉내 내고 있어 타입 시스템과 실제 Drizzle schema 변경을 우회한다고 지적한다.

## 코드 조사

`auth.test.ts`는 Better Auth와 Drizzle adapter를 `vi.mock()`으로 대체한다. 이후 `createFakeDatabase(results)`가 다음 메서드만 가진 객체를 만들어 `KwepDatabase`로 캐스팅한다.

- `select`
- `from`
- `get`
- `innerJoin`
- `where`

마지막에는 `} as never`로 전체 객체를 `KwepDatabase`에 강제 대입한다. 이 fake는 `readUserSession()`이 `learnerProfiles`를 조회하는 현재 query chain만 겨우 흉내 낸다. query가 `leftJoin`, `limit`, `orderBy`, `insert` 등으로 바뀌어도 타입 수준에서 미리 드러나지 않는다.

반면 `apps/admin-api/src/auth/admin-auth.test.ts`와 `apps/admin-api/src/scripts/seed-admin.test.ts`는 `createInMemoryKwepDatabase()`와 `runBaselineMigration()`을 사용해 실제 SQLite/Drizzle schema 위에서 테스트한다. 따라서 같은 monorepo 안에 더 안전한 테스트 패턴이 이미 있다.

## 판단

이슈는 타당하다.

현재 테스트의 일부 목적은 Better Auth adapter 설정이 schema key를 올바르게 넘기는지 확인하는 것이므로 Better Auth 자체를 mock하는 것은 가능하다. 하지만 learner session resolver가 DB query를 수행하는 부분까지 구조 없는 fake DB로 흉내 내는 것은 위험하다. 특히 `readUserSession()`은 `learnerProfiles` 상태를 읽어 active/suspended/deleted 상태를 반환하는 인증 경계이므로 실제 DB schema와 함께 검증해야 한다.

## 개선 방안

### 방안 1. 세션 resolver 테스트는 in-memory SQLite로 이동한다

`createLearnerSessionResolver()` 테스트는 `createInMemoryKwepDatabase()`와 `runBaselineMigration()`을 사용한다. 테스트에서 `authUsers`와 `learnerProfiles` row를 실제로 삽입한 뒤 `getSession` mock은 Better Auth session user만 반환하게 한다.

장점은 `learnerProfiles` schema, Drizzle query, status fallback 정책을 실제 DB 위에서 검증한다.

### 방안 2. adapter 설정 테스트와 DB query 테스트를 분리한다

`createLearnerAuth()`가 `drizzleAdapter()`에 schema key를 넘기는 테스트는 DB adapter 자체를 실행할 필요가 없다. 이 테스트는 좁은 `KwepDatabase` 대역을 쓰더라도 명시적 test fixture로 한정한다.

반면 session resolver, profile status, deleted/suspended 차단과 관련된 테스트는 fake DB를 쓰지 않는다. 장점은 테스트 더블의 목적이 명확해진다.

### 방안 3. `as never` 금지 회귀 규칙을 추가한다

테스트 코드라도 `as never`는 타입 시스템을 완전히 무력화한다. repository/auth 테스트에서 `as never`를 금지하고, 정말 필요한 경우에는 작은 port type을 먼저 정의한 뒤 `satisfies`로 검증한다.

장점은 새 테스트가 “타입을 맞추기 위해 억지 캐스팅”으로 흘러가는 것을 막는다.

### 방안 4. 인증 테스트용 DB fixture를 공통화한다

학습자와 어드민 인증 테스트가 반복해서 in-memory DB와 migration을 준비하므로 다음 helper를 둔다.

- `createMigratedTestDatabase()`
- `seedLearnerAuthUser()`
- `seedLearnerProfile()`
- `seedAdminAuthUser()`

장점은 실제 DB 기반 테스트의 비용과 boilerplate를 줄여 fake DB 유혹을 낮춘다.

### 방안 5. 인증 상태 정책 테스트를 core/service 경계로 분리한다

`readUserSession()`이 Better Auth user와 learner profile row를 조합하는 정책을 별도 pure mapper나 repository port로 분리한다. DB integration test는 row 조회를 검증하고, mapper test는 status fallback과 joinedAt 변환을 검증한다.

장점은 모든 테스트를 무겁게 만들지 않으면서도 fake DB를 억지로 만들 필요가 줄어든다.

## 권장 진행 순서

1. `auth.test.ts`에서 session resolver 테스트를 in-memory DB 기반으로 바꾼다.
2. `createFakeDatabase()`와 `as never`를 제거한다.
3. adapter schema key 테스트는 별도 describe로 분리하고, 필요하면 최소 fake를 명시 port로 제한한다.
4. 학습자 인증 DB fixture helper를 추가한다.
5. `as never` 사용 금지 검색 테스트 또는 lint 규칙을 도입한다.
6. suspended/deleted learner profile 상태를 resolver가 반영하는 회귀 테스트를 추가한다.

## 검증 계획

- `bun --filter @workspace/api test -- auth.test.ts`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/api lint`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-30 본문을 읽고 학습자 auth 테스트, 실제 auth 구현, DB 테스트 helper, 어드민 auth 테스트 사례를 조사했다.
- 이슈는 타당하다고 판단했다.
- `apps/api` Vitest 설정에 `bun:sqlite` external 처리를 추가해 실제 DB 기반 테스트를 실행할 수 있게 했다.
- `auth.test.ts`의 `createFakeDatabase()`, fake profile repository, `as never` 캐스팅을 제거했다.
- 세션 resolver 테스트를 `createInMemoryKwepDatabase()`와 baseline migration 기반으로 바꿨다.
- suspended profile 유지와 누락 profile 생성은 mock 호출 검증이 아니라 실제 `learner_profiles` row 상태로 검증한다.
