# WA-29 관리자 seed row 반환 타입 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-29 `응답 객체에 대한 암묵적 타입 추론`
- 조사 범위: `apps/admin-api/src/scripts/seed-admin-user.ts`, `apps/admin-api/src/scripts/seed-admin.ts`, 관리자 인증 schema, seed 테스트와 개발 문서

## 이슈 요약

WA-29는 `apps/admin-api/src/scripts/seed-admin-user.ts`의 `createSeedAdminUserRow()`가 명시적 반환 타입 없이 객체를 반환해 seed row 구조를 암묵적 타입 추론에 맡긴다고 지적한다.

## 코드 조사

현재 `createSeedAdminUserRow()`는 다음 객체를 반환한다.

- `id: "admin-1"`
- `name`
- `email`
- `emailVerified: true`
- `image: null`
- `role: "owner" as const`
- `createdAt: now`
- `updatedAt: now`

반환 타입은 명시되어 있지 않다. `seedAdminUser()`는 이 row를 `adminAuthUsers` insert와 conflict update에 사용한다.

`adminAuthUsers` schema는 `id`, `name`, `email`, `emailVerified`, `role`, `createdAt`, `updatedAt`을 non-null로 정의한다. Drizzle의 `.values(row)`가 일부 구조 검증을 제공하므로 row가 실제 insert에 쓰이는 현재 경로에서는 누락이 곧바로 typecheck 실패로 이어질 가능성이 있다.

하지만 `createSeedAdminUserRow()` 자체의 공개 계약은 여전히 추론에 맡겨져 있다. 이 함수를 테스트나 다른 script가 재사용할 때 “관리자 user insert row”라는 의도가 타입 이름으로 드러나지 않는다. 같은 파일의 credential `accountRow`도 별도 타입 없이 inline 객체로 생성된다.

## 판단

이슈는 타당하다. 다만 “속성이 누락되어도 컴파일러가 전혀 잡지 못한다”는 표현은 과하다.

현재는 `seedAdminUser()` 안에서 Drizzle insert가 row 구조를 다시 요구하므로 일부 누락은 호출 지점에서 잡힐 수 있다. 그러나 함수 경계가 명시적이지 않으면 오류가 row 생성 지점이 아니라 insert 사용 지점에서 드러나고, seed 정책과 DB schema 사이의 계약도 이름 없이 흩어진다. 관리자 인증 seed는 운영/개발 초기 접근권한과 연결되므로 명시적 타입 계약을 두는 편이 안전하다.

## 개선 방안

### 방안 1. schema 기반 insert row 타입을 명시한다

`adminAuthUsers`에서 insert row 타입을 만들어 반환 타입으로 사용한다.

```ts
type AdminAuthUserInsert = typeof adminAuthUsers.$inferInsert
```

`createSeedAdminUserRow(input): AdminAuthUserInsert`처럼 명시하면 row 누락이 함수 내부에서 바로 드러난다. 장점은 schema 변경과 seed row 생성이 같은 타입 계약으로 묶인다.

### 방안 2. seed policy 타입과 DB insert 타입을 분리한다

관리자 seed는 항상 `admin-1`, `owner`, `emailVerified: true`, `image: null` 같은 정책을 가진다. 이를 `SeedAdminUserPolicyRow`로 정의하고, DB insert 타입을 `satisfies typeof adminAuthUsers.$inferInsert`로 검증한다.

장점은 “DB에 넣을 수 있다”와 “seed 정책상 반드시 owner다”라는 의미를 동시에 표현할 수 있다.

### 방안 3. credential account row도 명시 타입으로 분리한다

`seedAdminUser()` 안의 `accountRow`도 `adminAuthAccounts.$inferInsert` 기반 타입이나 builder 함수로 분리한다.

- `createSeedAdminAccountRow({ userRow, password })`
- 반환 타입은 `AdminAuthAccountInsert`

장점은 user row와 credential row가 같은 seed aggregate로 관리되고, Better Auth schema 변경 시 seed script가 명확히 깨진다.

### 방안 4. seed 결과를 aggregate command/result로 모델링한다

`seedAdminUser()`가 내부에서 row를 암묵적으로 조립하지 않도록 다음 구조를 둔다.

- `SeedAdminUserCommand`
- `SeedAdminUserRows`
- `SeedAdminUserResult`

row builder는 pure function으로 user/account rows를 모두 반환하고, DB script는 transaction/upsert만 담당한다. 장점은 seed 정책 테스트가 DB 없이도 강해지고, DB integration test는 upsert 동작만 검증하면 된다.

### 방안 5. schema drift 회귀 테스트를 추가한다

현재 테스트는 row의 값 자체를 검증한다. 여기에 type-level drift를 잡는 compile-time 테스트 또는 `satisfies` 기반 fixture를 추가한다.

- user row가 `adminAuthUsers.$inferInsert`를 만족한다.
- account row가 `adminAuthAccounts.$inferInsert`를 만족한다.
- 필수 Better Auth column이 schema에 추가되면 seed builder typecheck가 실패한다.

## 권장 진행 순서

1. `AdminAuthUserInsert`와 `AdminAuthAccountInsert` type alias를 seed module 또는 DB schema export에 추가한다.
2. `createSeedAdminUserRow()` 반환 타입을 명시한다.
3. `createSeedAdminAccountRow()`를 추가해 credential row 생성도 pure function으로 분리한다.
4. `seedAdminUser()`는 row builder 결과를 transaction/upsert하는 orchestration만 맡긴다.
5. row builder 단위 테스트와 DB integration seed 테스트를 분리한다.
6. 개발/운영 seed 문서에 관리자 seed row 정책을 기록한다.

## 검증 계획

- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/admin-api test -- seed-admin`
- `bun --filter @workspace/admin-api lint`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-29 본문을 읽고 관리자 seed user row builder, seed script, 관리자 인증 schema, seed 테스트를 조사했다.
- 이슈는 타당하다고 판단하되, Drizzle insert가 일부 구조 검증을 제공한다는 nuance를 기록했다.
- `SeedAdminUserRow`, `SeedAdminAccountRow`, `SeedAdminRows`를 schema 기반 insert 타입 위에 명시했다.
- `createSeedAdminUserRow()`에 명시적 반환 타입을 추가하고, credential row 생성을 `createSeedAdminAccountRow()`와 `createSeedAdminRows()`로 분리했다.
- `seedAdminUser()`는 row 조립을 직접 하지 않고 seed aggregate row를 upsert하는 orchestration만 맡도록 정리했다.
- user/account row builder 테스트를 추가해 관리자 seed 정책과 credential row 구조를 고정했다.
