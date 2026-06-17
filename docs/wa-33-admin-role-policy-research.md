# WA-33 관리자 권한 문자열 정책 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-33 `권한 체크 시 하드코딩된 문자열 의존`
- 조사 범위: `apps/admin-api/src/routes/route-helpers.ts`, admin auth/session, DB schema, seed script/test, core admin module

## 이슈 요약

WA-33은 `resolveOwnerAdminSession()`이 `sessionResult.session.admin.role !== "owner"`처럼 문자열 literal로 권한을 검사한다고 지적한다.

## 코드 조사

현재 admin role은 여러 곳에 흩어져 있다.

- `apps/admin-api/src/auth/admin-session.ts`
  - `export type AdminRole = "operator" | "owner"`
- `apps/admin-api/src/auth/admin-auth.ts`
  - Better Auth additional field `defaultValue: "operator"`
  - `type: ["owner", "operator"]`
  - `readAdminRole(role)`에서 `"owner" || "operator"` 검사
- `apps/admin-api/src/routes/route-helpers.ts`
  - owner 권한 검사에서 `"owner"` 비교
- `packages/db/src/schema/admin-auth.schema.ts`
  - `role: text("role", { enum: ["owner", "operator"] })`
  - default `"operator"`
- `apps/admin-api/src/scripts/seed-admin-user.ts`
  - seed owner role `"owner"`
- route tests
  - `"operator" | "owner"` 문자열 반복

`packages/core/src/admin`에는 사용자 관리용 DTO와 service는 있지만 관리자 인증 role 정책은 없다.

## 판단

이슈는 타당하다.

이미 `AdminRole` union type은 존재하지만, 값의 단일 출처가 아니다. schema enum, Better Auth config, role parser, owner check, seed, tests가 각자 literal을 들고 있다. role 값이 늘어나거나 이름이 바뀌면 여러 파일을 동시에 수정해야 하고, 일부 문자열은 타입 추론 밖에 있어 drift가 생길 수 있다.

권한은 보안 경계이므로 단순 상수화보다 role 값, parser, capability policy를 한 module로 모으는 편이 안전하다.

## 2026-06-17 구현 시작

- 선택한 방향: `packages/core/src/admin/admin-role.ts`를 단일 출처로 두고 role 값, schema, parser, owner route capability를 함께 관리한다.
- 적용 범위: DB schema, Better Auth additional field, admin session resolver, route helper, seed script, route/test fixture가 모두 core role 정책을 참조하게 한다.
- 안전성 목표: unknown role은 session resolver에서 null로 접고, route helper는 문자열 비교 대신 capability policy를 호출한다.

## 개선 방안

### 방안 1. `AdminRole` 값 객체와 schema를 core 또는 auth policy module로 이동한다

다음 값을 한 곳에 둔다.

```ts
export const adminRoles = {
  operator: "operator",
  owner: "owner",
} as const
export type AdminRole = (typeof adminRoles)[keyof typeof adminRoles]
```

DB schema, Better Auth config, seed, route helper가 모두 이 값을 참조한다. 장점은 role literal drift가 줄어든다.

### 방안 2. role parser를 Zod schema로 통합한다

`readAdminRole()`의 수동 비교 대신 `adminRoleSchema.safeParse(role)`를 사용한다. 같은 schema를 core/admin 또는 admin auth policy에서 export한다.

장점은 unknown role 처리와 type narrowing이 한 곳에 모인다.

### 방안 3. owner 체크를 capability policy로 바꾼다

`role === owner` 직접 비교 대신 권한 정책 함수를 둔다.

- `canManageCourses(role)`
- `canManageUsers(role)`
- `canManageSettings(role)`
- `isOwnerRole(role)`

초기에는 owner만 쓰더라도 route helper는 capability를 물어본다. 장점은 역할이 늘어날 때 route별 조건문을 직접 수정하지 않아도 된다.

### 방안 4. DB schema와 Better Auth additional field를 같은 role source에서 생성한다

`adminRoleValues = [adminRoles.owner, adminRoles.operator] as const`를 만들고 다음에서 재사용한다.

- Drizzle enum
- Better Auth `type`
- Zod schema
- tests

장점은 schema와 auth runtime 설정이 같은 role 목록을 공유한다.

### 방안 5. 권한 정책 테스트를 route별이 아니라 policy별로 추가한다

현재 tests는 owner/operator를 route fixture에 넣어 결과 status를 검증한다. 추가로 role policy 자체를 테스트한다.

- owner는 course/settings/users destructive action 가능
- operator는 destructive action 불가
- unknown role은 session resolver에서 null 처리

장점은 보안 정책이 route fixture에 묻히지 않는다.

## 권장 진행 순서

1. `adminRoles`, `adminRoleValues`, `adminRoleSchema`, `AdminRole`을 단일 module로 만든다.
2. DB schema, Better Auth config, seed script, tests가 이 module을 사용하게 한다.
3. `readAdminRole()`를 schema 기반 parser로 바꾼다.
4. `resolveOwnerAdminSession()`을 `canAccessOwnerAdminRoute(role)` 같은 policy 함수로 교체한다.
5. 권한 정책 단위 테스트와 route integration 테스트를 분리한다.
6. 관리자 권한 모델을 `docs/admin-site.md`에 기록한다.

## 검증 계획

- `bun --filter @workspace/admin-api test -- admin-auth route-helpers courses.route users.route settings.route`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/admin-api typecheck`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-33 본문을 읽고 route helper, admin auth/session, DB schema, seed, tests, core admin module을 조사했다.
- 이슈는 타당하다고 판단했다.
- 개선 방향은 단순 literal 상수화가 아니라 role schema, parser, capability policy, schema/runtime 공유 값으로 정리했다.

## 2026-06-17 구현 완료

- `packages/core/src/admin/admin-role.ts`에 `adminRoles`, `adminRoleValues`, `adminRoleSchema`, `parseAdminRole()`, `canAccessOwnerAdminRoute()`를 추가했다.
- `apps/admin-api/src/auth/admin-session.ts`의 `AdminRole`은 core role type을 재사용하게 했다.
- Better Auth additional field, DB schema enum/default, 관리자 seed row, route guard, 테스트 fixture가 core role 정책을 참조하게 했다.
- `readAdminRole()` 수동 비교를 제거하고 `parseAdminRole()` 기반 session resolver로 통합했다.
- owner 전용 route guard는 문자열 비교 대신 `canAccessOwnerAdminRoute()`를 호출한다.
- `docs/admin-site.md`에 owner/operator 권한 모델과 unknown role 처리 정책을 기록했다.

## 검증 결과

- `bun --filter @workspace/core test src/admin/admin-role.test.ts`
- `bun --filter @workspace/admin-api test src/auth/admin-auth.test.ts src/routes/courses.route.test.ts src/routes/settings.route.test.ts src/app.test.ts src/scripts/seed-admin.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/core lint`
- `bun --filter @workspace/db lint`
- `bun --filter @workspace/admin-api lint`
