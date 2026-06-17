# WA-21 어드민 로그인 SPA 라우팅 우회 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-21 `SPA 라우팅을 우회하는 Native 할당`
- 조사 범위: `apps/admin/src/features/auth/admin-auth-page.tsx`, `apps/admin/src/lib/auth/*`, 어드민/학습자 앱 navigation 사용처

## 이슈 요약

WA-21은 `apps/admin/src/features/auth/admin-auth-page.tsx`가 로그인 성공 후 `window.location.assign(redirectPath)`를 호출해 Next.js SPA navigation을 우회한다고 지적한다.

## 코드 조사

`AdminAuthPage`는 client component이며 로그인 submit 후 다음 흐름을 수행한다.

1. `requestAdminPasswordLogin({ email, password, nextPath })` 호출
2. 성공 시 `redirectPath` 문자열을 받음
3. `window.location.assign(redirectPath)` 호출

`requestAdminPasswordLogin()`은 Better Auth email/password endpoint를 `fetch`로 호출하고, 성공하면 정규화한 `safeNextPath`를 반환한다. `apps/admin/src/lib/auth/admin-auth-navigation.ts`도 별도의 `createAdminLoginPath()`에서 비슷한 safe next path 검증을 다시 수행한다.

검색 결과 어드민 앱의 native location 할당은 이 로그인 화면 한 곳에서만 발견됐다. 학습자 앱과 다른 화면 이동은 대부분 `next/navigation`의 `useRouter().push()` 또는 server component의 `redirect()`를 사용한다.

## 판단

이슈는 타당하다.

관리자 로그인 후 이동은 같은 Next.js 앱 내부 경로로 제한된다. 따라서 browser native navigation을 직접 호출할 이유가 약하다. 전체 페이지 reload는 client state, app shell, prefetch, transition 흐름을 끊고, 로그인 화면 테스트도 실제 navigation 의도를 검증하지 못하게 만든다.

또한 문제의 핵심은 단순 API 하나가 아니라 navigation 정책이 흩어져 있다는 점이다. safe next path 검증이 `admin-auth-client.ts`와 `admin-auth-navigation.ts`에 중복되어 있고, 로그인 client는 인증 요청과 redirect path 결정을 함께 수행한다. 이 구조는 향후 logout, session 만료, 권한 부족 redirect에서 같은 native navigation 패턴이 재발할 수 있다.

## 개선 방안

### 방안 1. 인증 화면은 `useRouter().replace()` 또는 `push()`만 사용하게 한다

`AdminAuthPage`에서 `useRouter`를 사용하고 로그인 성공 후 `router.replace(redirectPath)`를 호출한다. 로그인 화면으로 되돌아가는 history를 남기지 않으려면 `replace`가 더 적합하다. 사용자가 로그인 후 이전 로그인 페이지로 돌아갈 필요가 있는 흐름이라면 `push`를 선택한다.

장점은 SPA navigation, Next.js cache/prefetch 모델, 테스트 패턴이 프로젝트의 다른 화면과 일관된다. 단점은 인증 쿠키가 API origin에서 설정된 직후 admin app route guard가 즉시 세션을 읽는지 통합 테스트가 필요하다.

### 방안 2. `admin-auth-navigation`을 인증 redirect 정책의 단일 출처로 만든다

현재 safe next path 검증은 `requestAdminPasswordLogin()` 내부와 `createAdminLoginPath()` 내부에 중복되어 있다. `resolveSafeAdminNextPath()`를 공개 helper로 이동하고 다음 정책을 한 곳에서 관리한다.

- 내부 경로만 허용한다.
- `//` 외부 URL 형태를 거부한다.
- `/login` 순환 redirect를 거부한다.
- 권한 부족, session 만료, logout 후 이동도 같은 helper를 사용한다.

장점은 redirect 보안 정책이 화면과 API client에 흩어지지 않는다. 단점은 기존 테스트를 helper 중심으로 재배치해야 한다.

### 방안 3. 로그인 client는 인증 요청 결과만 반환하고 navigation은 화면/route adapter가 담당하게 한다

`requestAdminPasswordLogin()`은 `AdminLoginResult` 같은 명시적 결과를 반환한다.

- `type: "authenticated"`
- `nextPath`

인증 client가 browser navigation을 알지 않고, 화면이 `router.replace(result.nextPath)`를 수행한다. 장점은 인증 API 통신과 UI navigation 경계가 분리되고, server action 또는 다른 client 화면에서 같은 인증 함수를 재사용하기 쉬워진다.

### 방안 4. 어드민 앱 navigation adapter를 만든다

어드민 앱의 login, logout, 권한 부족, session 만료 이동을 `useAdminNavigation()` 같은 작은 adapter로 모은다.

- `goAfterLogin(nextPath)`
- `goToLogin(currentPath)`
- `goAfterLogout()`

내부에서는 `next/navigation`만 사용한다. 이 adapter에 테스트를 붙이면 `window.location.*` 같은 escape hatch가 화면에 직접 들어오는 것을 줄일 수 있다.

### 방안 5. native navigation 금지 회귀 테스트를 추가한다

어드민 앱 source에 대해 `window.location.assign`, `window.location.href`, `window.location.replace` 사용을 금지하는 테스트를 둔다. 외부 도메인 이동이 필요한 경우에는 주석 예외가 아니라 명시적 wrapper를 통하게 한다.

장점은 SPA 라우팅 우회가 다시 들어오는 것을 빠르게 발견한다. 단점은 외부 결제, OAuth provider 이동처럼 진짜 full navigation이 필요한 흐름이 생기면 예외 정책을 문서화해야 한다.

## 권장 진행 순서

1. `admin-auth-navigation.ts`에 `resolveSafeAdminNextPath()`를 공개 함수로 추가한다.
2. `requestAdminPasswordLogin()`은 같은 helper를 사용해 인증 결과와 `nextPath`만 반환한다.
3. `AdminAuthPage`는 `useRouter().replace()`로 로그인 성공 후 이동한다.
4. `AdminAuthPage` 테스트에 login submit 후 router navigation 검증을 추가한다.
5. `window.location.*` 사용 금지 회귀 테스트를 어드민 앱에 추가한다.
6. 어드민 인증 문서에 내부 redirect 정책과 full navigation 예외 기준을 기록한다.

## 검증 계획

- `bun --filter @workspace/admin test -- admin-auth`
- `bun --filter @workspace/admin test`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-21 본문을 읽고 어드민 인증 화면, 인증 client, redirect helper, 전체 앱 navigation 패턴을 조사했다.
- 이슈는 타당하다고 판단했다.
- 개선 방향은 `router.replace()` 적용, redirect 정책 단일화, navigation adapter, native navigation 금지 회귀 테스트로 정리했다.
- `resolveSafeAdminNextPath()`를 `admin-auth-navigation.ts`의 공개 helper로 이동해 로그인 URL 생성과 로그인 client가 같은 정책을 사용하게 했다.
- `AdminAuthPage`는 로그인 성공 후 `window.location.assign()` 대신 Next.js `useRouter().replace()`로 이동한다.
- 로그인 성공 테스트는 `requestAdminPasswordLogin()` 호출과 `router.replace()` 이동을 함께 검증한다.
- 어드민 앱 source에서 `window.location.assign`, `window.location.replace`, `window.location.href` 사용을 금지하는 회귀 테스트를 추가했다.

## 검증 결과

- `bun --filter @workspace/admin test src/features/auth/admin-auth-page.test.tsx src/lib/auth/admin-auth-client.test.ts src/lib/auth/admin-auth-navigation.test.ts`
- `bun --filter @workspace/admin typecheck`
- `bun --filter @workspace/admin lint`
