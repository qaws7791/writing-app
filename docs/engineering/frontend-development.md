# 프론트엔드 개발 가이드

이 문서는 `apps/web`, `apps/admin`, `packages/shared/ui`를 개발할 때 따르는 프론트엔드 원칙을 정리한다. 모든 문서와 사용자 노출 텍스트는 한국어를 기본으로 하며, 기술 고유명사와 코드 식별자는 원문을 유지한다.

## 기본 원칙

- 기능 기준으로 파일을 모은다. 기술 종류별 전역 `components`, `hooks`, `utils` 묶음보다 `features/course-catalog`, `features/lesson-session`처럼 변경 이유가 같은 코드를 가까이 둔다.
- 앱은 조립자 역할을 한다. 서버 비즈니스 규칙은 소유 module에, 화면에만 필요한 상태 전이는 feature 내부 순수 함수에 둔다.
- 외부 API 응답은 canonical runtime schema로 먼저 검증한다. 화면 모델과 의미가 같으면 canonical 타입을 직접 사용하고, 실제 UI 모델 차이가 있을 때만 mapper를 둔다.
- 클라이언트 컴포넌트는 상호작용 상태가 필요할 때만 사용한다. 서버 컴포넌트에서 충분한 조회는 서버에서 처리한다.
- 공유 UI는 `packages/shared/ui`에 둔다. `components/ui`는 shadcn 프리미티브, `components/<domain>`은 순수 도메인 프레젠테이션이다. API 호출, 세션, 채점, 라우팅은 각 앱 feature에서 조합한다.
- 학습자 공개 모델과 답안 payload는 `@workspace/contracts/learning/learner-content`와 `@workspace/contracts/learning/learner-transition`을 직접 사용한다. `apps/web/src/features/lesson-session`은 입력 중 상태, 세션 event와 `LessonStepRenderer` 조립만 소유하며 채점 정책은 소유하지 않는다.

## 기술과 적용 범위

- 학습자 웹과 어드민 웹은 manifest가 선언한 Next.js App Router와 React를 사용한다. 기본 서버 런타임은 현재 앱 설정을 따르며, Edge runtime은 지연 개선이 실측되고 모든 의존성이 호환되는 좁은 경계에서만 검토한다.
- 패키지 관리와 workspace 실행은 Bun과 Turborepo, 정적 타입 검사는 TypeScript strict, 런타임 신뢰 경계 검증은 Zod를 사용한다.
- 스타일과 공용 프리미티브는 Tailwind CSS와 `packages/shared/ui`, 형식과 lint는 루트 Oxfmt와 Oxlint 설정을 단일 기준으로 사용한다.
- Better Auth integration과 credential·session schema는 auth infra, 제품 profile·role policy와 repository는 identity module이 소유한다. API composition은 두 경계를 vendor-neutral port로 연결하며, Next.js 앱은 DB나 ORM에 직접 접근하지 않고 공개 HTTP API를 호출한다.
- TanStack Query, Zustand, React Hook Form, `next-intl` 같은 라이브러리는 기본 전제가 아니다. 현재 feature의 요구와 기존 도구로 해결할 수 없는 문제가 확인되고 소유권·번들·운영 비용이 정당화될 때만 별도 결정으로 도입한다.

## 소스 구조와 의존성

`apps/web/src`와 `apps/admin/src`는 다음 책임을 따른다. 모든 하위 디렉터리를 기계적으로 만들지 않고 실제 capability가 있을 때만 추가한다.

| 계층       | 책임                                                       | 금지                                             |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `app`      | URL, layout, metadata, redirect, 입력 파싱, 화면 조립      | 비즈니스 규칙, 브라우저 API, 거대 조회·변경 로직 |
| `features` | 사용자 능력 단위의 `model`, `server`, `api`, `hooks`, `ui` | 다른 feature의 내부 경로 import                  |
| `entities` | 둘 이상의 feature가 같은 의미로 공유하는 안정된 표현       | 세션, HTTP, DB, 특정 화면 상태                   |
| `shared`   | 도메인 중립 HTTP, 설정, 인증 표현과 작은 공용 코드         | 특정 도메인 정책, 포괄적인 `utils`·`common` 묶음 |
| `server`   | 서버 인증, 환경 변수, 요청별 API client factory            | Client Component, UI, 브라우저 API               |

- 의존성은 `app → features → entities → shared` 방향으로 흐르고 `server`는 서버 전용 플랫폼 경계다. 순환 의존, 하위 계층의 상위 계층 import, Client Component의 `server` import는 허용하지 않는다.
- `server`와 feature의 `server` source는 `server-only` marker를 사용한다. 단위 테스트는 package의 빈 server 구현만 대체하며 production build의 client graph 차단은 완화하지 않는다.
- feature 내부 `model`은 React, fetch, 세션과 I/O를 모르는 순수 규칙·상태 전이·schema를 소유한다. `server`는 Server Component용 DAL, `api`는 브라우저 HTTP adapter, `hooks`는 React lifecycle 연결, `ui`는 표현을 소유한다.
- Server Component는 자기 앱의 Route Handler를 다시 `fetch`하지 않는다. 각 feature의 server DAL을 통해 `apps/api`를 직접 호출한다.
- 파일과 디렉터리는 Next.js 예약 파일을 제외하고 kebab-case를 사용한다. 앱 내부 import는 각 앱의 절대 경로 alias를 사용하고 package 간 import는 공개 subpath만 사용한다.
- 패키지 추출은 실제로 둘 이상의 앱이 소비하고, 작은 공개 API와 독립된 변경 이유를 정의할 수 있을 때만 수행한다. 예상 재사용만으로 `packages/common`이나 `packages/utils`를 만들지 않는다.

## App Router와 컴포넌트 경계

### 라우팅 레이어

- `page.tsx`와 `layout.tsx`는 비동기 `params`·`searchParams`를 기다린 뒤 Zod로 파싱하고, 인증·redirect, feature DAL 호출, `notFound`, metadata와 화면 조립만 담당한다.
- manifest가 선언한 App Router의 `cookies()`, `headers()`, `params`, `searchParams`는 비동기 API로 취급한다. 동기 접근에 의존하지 않는다.
- 라우트에서만 사용하는 조립 view는 해당 segment의 `_views` 같은 private folder에 둔다. 사용자 능력으로 재사용되면 feature로 이동한다.
- `layout.tsx`는 모든 하위 route가 필요로 하는 shell과 provider만 소유한다. 특정 page에만 필요한 조회를 상위 layout으로 끌어올리지 않는다.
- `loading.tsx`는 route shell에 맞는 skeleton, `error.tsx`는 예상하지 못한 segment 오류의 복구 UI, `global-error.tsx`는 root 오류를 담당한다. `error.tsx`와 `global-error.tsx`는 Client Component이며 다시 시도는 `reset()`을 사용한다.
- `proxy.ts`는 CSP nonce, 세션 cookie 존재 확인과 조기 redirect 같은 요청 전처리만 담당한다. 최종 인증·인가는 API와 데이터 접근 경계가 다시 검증한다.
- `route.ts`는 health, metadata asset처럼 Next.js 앱 자체의 HTTP endpoint가 필요한 경우에만 둔다. 제품 조회·변경 API를 Next.js Route Handler로 복제하지 않는다.

### Server Component와 Client Component

- Server Component가 기본값이다. 이벤트 handler, React client hook, 브라우저 API 또는 실시간 상호작용이 필요한 최소 leaf에만 `"use client"`를 선언한다.
- Client Component는 async component가 될 수 없다. 초기 서버 데이터는 상위 Server Component가 조회해 직렬화 가능한 props로 전달하고, 브라우저 재조회가 필요하면 feature의 `api` adapter를 사용한다.
- Server Component에서 Client Component로 함수, class instance, `Date`, `Map`, `Set` 같은 비직렬화 값을 넘기지 않는다. 날짜는 계약의 ISO 8601 문자열처럼 경계에서 정규화된 값을 사용한다. Server Action은 직렬화 가능한 공개 진입점으로 취급하는 예외다.
- provider는 필요한 최소 client boundary만 소유하고 server-rendered `children`을 그대로 받는다. root layout 전체를 Client Component로 전환하지 않는다.
- `metadata`와 `generateMetadata`는 Server Component가 소유한다. metadata와 본문이 같은 데이터를 읽으면 React request cache로 요청 내 조회를 공유한다.
- `useSearchParams` 또는 동적 route의 `usePathname`처럼 client-side rendering 전환을 일으킬 수 있는 hook은 사용 범위를 좁히고 의미 있는 `Suspense` 경계 안에 둔다.

## 타입과 신뢰 경계

- URL, form·JSON 입력, API 응답과 환경 변수는 신뢰하지 않은 값으로 받고 canonical Zod schema로 파싱한다. 검증 전 타입 캐스팅으로 계약을 우회하지 않는다.
- schema와 타입이 같은 의미를 가지면 `z.infer` 또는 계약 package의 추론 타입을 사용한다. wire DTO와 화면 의미가 같으면 identity mapper나 복제 타입을 만들지 않는다.
- 식별자는 도메인 brand type을 사용하고, 예상 가능한 상태와 실패는 discriminated union 또는 명시적 Result variant로 표현한다. 여러 boolean으로 불가능한 상태 조합을 만들지 않는다.
- 예상 가능한 실패는 호출자가 분기할 수 있는 값으로, 예상하지 못한 인프라 실패와 불변식 위반은 throw로 구분한다. Result를 복구가 필요하지 않은 모든 함수에 일괄 적용하지 않는다.
- 날짜는 직렬화 경계에서 ISO 8601 문자열, 금액은 통화와 정수 최소 단위를 기본 표현으로 사용한다. 배열과 객체는 불변으로 다루고 원본을 직접 변경하지 않는다.

## HTTP 응답 계약

- 학습자 웹과 어드민 웹의 HTTP 클라이언트는 성공 응답 JSON을 타입 캐스팅만 하지 않고 endpoint별 런타임 스키마로 검증한다.
- 성공 응답이 계약과 다르면 network 오류가 아니라 contract 오류로 분리한다.
- 실패 응답은 서버의 canonical `SCREAMING_SNAKE_CASE` code와 한국어 message를 그대로 사용한다.

- 어드민 HTTP 클라이언트는 context별 canonical contract 스키마로 모든 성공 응답을 검증한다.
- 학습자 HTTP 클라이언트는 콘텐츠, 프로필, 진행, 레슨 상태 전이와 AI 코칭 성공 응답을 런타임 스키마로 검증한다.
- JSON 파싱 실패와 스키마 불일치는 `CONTRACT_ERROR`로 반환하고, fetch 실패만 `NETWORK_ERROR`로 반환한다.
- 학습자 웹과 어드민 웹의 HTTP adapter는 `fetch` 예외를 `null`로 병합하지 않고 `@workspace/http-client`의 명시적 result로 처리한다.
- `network-error`는 사용자 메시지와 별개로 원인, method, query가 제거된 URL, 실패 분류를 보존한다.
- 화면은 네트워크 오류 원인을 직접 노출하지 않는다. 로깅, 리포팅, 재시도 정책만 구조화된 `network` 값을 사용한다.

## 화면 구현 탐색

화면 목적과 정보 구조는 [IA 명세](../design/ia-spec.md)와 screen 문서가 소유한다. 현재 URL과 route file은 각 앱의 route source가 소유한다. 화면 구현은 URL 목록을 이 문서에 복제하지 않고, 화면 식별자·feature 경계·공개 contract를 따라 탐색한다.

- 화면은 metadata, 접근성, 오류·loading·not-found 상태를 사용자 흐름의 일부로 구현한다.
- 공개 화면과 보호 화면은 검색 노출, cache와 인증 실패 처리를 목적에 맞게 분리한다.
- 자산 경로와 cache header의 현재 값은 route·asset source에서 확인하고, 화면은 허용된 식별자만 소비한다.
- 자료실은 tree 상태, 편집 상태와 명령 UI를 분리하고, 화면 목적·편집 정책은 `SCR-110`과 제품 요구사항을 따른다.

## 데이터 접근 경계

`apps/web`의 공통 HTTP transport는 `src/shared/http`에 있고, 서버 요청 factory는 `src/server/http`가 소유한다. 각 브라우저 화면은 자기 `features/*/api`의 좁은 포트를 사용하고, Server Component는 `features/*/server/dal`을 직접 호출한다. 정적 OpenAPI JSON과 generated TypeScript 타입은 사용하지 않는다. HTTP 응답은 `@workspace/contracts/learning/learner-api`, `@workspace/contracts/learning/learner-read-model`, `@workspace/contracts/learning/learner-transition`의 canonical runtime schema로 검증하며 course·progress·lesson·profile은 identity 변환 없이 화면에 전달한다. 코스 목록의 검색·분류·정렬은 Zod로 파싱한 URL 조건을 API query로 전달하고 `/course-categories` 결과를 별도로 사용한다.

`apps/admin`의 공통 HTTP result와 transport는 `src/shared/http`, 요청별 인증 transport factory는 `src/server/http`가 소유한다. Server Component는 자기 `features/*/server`의 좁은 DAL을 호출하고, 브라우저 재조회가 필요한 코스 편집기와 자료실만 자기 `features/*/api` adapter를 사용한다. 각 DAL과 adapter는 `@workspace/contracts/content/admin-courses`, `@workspace/contracts/identity/admin-users`, `@workspace/contracts/operations/admin-dashboard`, `@workspace/contracts/resource-library/admin-resource-documents`처럼 endpoint 소유 context의 canonical schema로 응답을 검증한다. 중앙 `AdminApi`와 조회용 Server Action은 사용하지 않는다.

어드민의 공개 런타임 설정도 공통 `NEXT_PUBLIC_API_BASE_URL`을 Zod로 검증한 뒤 Server Component가 직렬화 가능한 값만 Client Component에 전달한다. 클라이언트에는 URL 브랜드와 순수 조립 함수만 포함해 Zod parser가 초기 번들에 들어가지 않게 한다.

서로 의존하지 않는 서버 조회는 같은 렌더 주기에서 먼저 시작한 뒤 함께 기다린다. 관리자 AI 채팅은 목록과 선택 대화를 병렬로 조회한다. 학습자 코스 목록은 course page와 category를 병렬 조회한다. 레슨 진입은 레슨과 프로필만 병렬 조회하고, 초기 step은 레슨 응답의 `learning`에서 읽는다. 별도 `/progress` join이나 course detail 조회를 시작하지 않는다. 각 요청의 기존 오류·redirect 의미는 병렬화 전과 동일하게 유지한다.

### 데이터 소유권

| 데이터 종류                           | 소유자                                                 | 기준                                               |
| ------------------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| 서버 렌더 시점 조회                   | Server Component와 feature server DAL                  | `apps/api`를 서버에서 직접 호출한다.               |
| 사용자 상호작용 뒤 브라우저 재조회    | 해당 feature의 `api` adapter와 가까운 Client Component | 전역 server-state cache를 기본으로 두지 않는다.    |
| 공유·새로고침·북마크 가능한 화면 상태 | URL route params 또는 query                            | Zod로 파싱하고 navigation API로 전이한다.          |
| 입력 중 draft·dialog·drag 상태        | 가장 가까운 component, hook 또는 reducer               | 서버 응답이나 URL 상태를 복제하지 않는다.          |
| 테마 같은 제한된 subtree 환경         | 범위가 좁은 provider                                   | provider를 root client boundary로 확장하지 않는다. |

같은 사실을 Server Component props, local state와 별도 cache에 동시에 복제하지 않는다. 초기값 복사가 필요하면 이후 소유권과 동기화 규칙을 명시해야 하며, 서버가 렌더한 값을 하위 Client Component가 mount 즉시 같은 endpoint에서 다시 조회하는 이중 소유권을 만들지 않는다.

### 쓰기 경로와 폼

- 제품 상태 변경의 canonical contract, 인가와 transaction은 해당 module의 HTTP·application·infrastructure 경계가 소유하고 API executable은 이를 조립해 공개한다. 브라우저에서 직접 갱신해야 하는 feature는 자기 `api` adapter로 공개 API를 호출한다.
- Server Action은 어드민 폼처럼 Next.js 서버 경계가 사용자 입력을 받아 기존 API command를 호출하는 경우 사용할 수 있다. Action도 외부에서 호출 가능한 공개 진입점으로 보고 입력 파싱과 인증을 수행하며, 비즈니스 규칙이나 DB 접근을 복제하지 않는다.
- Server Action을 조회용 `queryFn`처럼 사용하지 않는다. 외부 client, webhook과 공개 REST endpoint는 `apps/api`가 소유하며 Next.js Route Handler로 중복 구현하지 않는다.
- 단순 폼은 native form과 명시적인 pending·결과 상태를 우선한다. 동적 필드나 즉시 검증이 충분히 복잡할 때만 form library를 검토하며, 클라이언트와 서버 검증은 같은 canonical schema를 공유한다.
- optimistic update는 실패 가능성이 낮고 rollback snapshot, version 또는 idempotency, 충돌 처리와 실패 UI가 모두 있을 때만 사용한다. 계정 삭제, 권한 변경과 발행처럼 복구 비용이 큰 변경은 서버 확인 전에 성공으로 표시하지 않는다.

### 캐시와 스트리밍

- 동적 사용자·운영 데이터는 기본적으로 동적으로 조회한다. 요청 간 재사용 가치, 무효화 주체와 보안 범위가 확인된 읽기만 Next data cache 또는 HTTP cache 대상으로 삼는다.
- 같은 request 안에서 metadata와 본문처럼 동일한 조회가 반복되면 React `cache`로 요청 범위 중복을 제거한다. 요청 간 cache와 request memoization을 혼동하지 않는다.
- cache key와 tag에는 결과에 영향을 주는 리소스 식별자와 보안 범위를 모두 포함한다. 광범위한 path 무효화나 근거 없는 무기한 cache를 사용하지 않는다.
- 서로 독립적인 I/O는 먼저 시작한 뒤 함께 기다리고, 순차 의존이 있는 요청만 직렬화한다. 응답 속도 차이를 사용자가 이해할 수 있는 section은 `Suspense`로 스트리밍하되 작은 텍스트마다 경계를 만들지 않는다.
- 현재 단일 instance 배포 계약을 넘어 여러 Next.js instance에서 ISR 또는 tag 무효화를 사용하려면 공유 cache handler와 일관성 검증을 먼저 설계한다.

## 인증과 redirect

학습자 앱의 보호 라우트는 `apps/web/src/server/auth/server-session-token.ts`로 현재 세션을 확인하고, 각 데이터 접근 직전에 인증 실패를 `/login`으로 보낸다. 로그인 `next` 값은 `src/features/authentication/model/auth-navigation.ts`의 허용 규칙을 통과해야 한다. `app`의 page와 layout은 URL·redirect·DAL 호출·화면 조립만 담당한다.

학습자 feature adapter는 안전한 `next` 검증, runtime URL과 Next.js navigation만 소유하고 `@workspace/auth/learner/client`에 인증 요청을 위임한다. 브라우저 요청은 `credentials: "include"`를 사용하고, API는 `CORS_ORIGIN`과 Better Auth `trustedOrigins`로 학습자 웹 origin을 허용한다.

어드민 앱의 보호 라우트는 `apps/admin/src/app/(admin)/layout.tsx`에서 `GET /api/admin/session` 결과를 확인한다. 인증·인가 실패만 어드민 로그인 경로로 redirect한다.

두 앱은 root `loading.tsx`, `error.tsx`, `global-error.tsx`와 보호 route group skeleton을 제공한다. error boundary의 다시 시도는 Next `reset()`을 호출한다. 어드민은 세션 응답의 `unauthorized | forbidden`만 로그인으로 보내고 network·contract·5xx 오류는 로그인 상태를 유지한 서비스 오류 UI로 표시한다. 로그아웃 요청 실패는 화면 alert와 같은 버튼의 재시도로 처리하며 unhandled rejection을 만들지 않는다. 어드민은 알 수 없는 경로에 전용 not-found 화면을 제공한다.

관리자 feature adapter는 안전한 `next` 검증과 runtime URL만 소유하고 `@workspace/auth/admin/client`에 ID/password 로그인·비밀번호 변경·로그아웃을 위임한다. 다른 관리자 세션 폐기 옵션은 auth client가 강제한다. 브라우저 요청은 `credentials: "include"`를 사용하고, API는 공통 CORS 설정과 관리자 인증의 `trustedOrigins`로 어드민 웹 origin을 허용한다. 로그인 `next` 경로 검증은 `src/features/authentication/model/admin-auth-navigation.ts`가 단일 출처이며, 로그인 성공 후 이동은 `next/navigation`의 router를 사용한다. 어드민 앱 source에서 `window.location.*` 직접 이동은 금지한다.

## 오류 처리

- 입력 검증 실패, 도메인 거절, 인증, 인가, 충돌, not-found, network·contract 오류와 예상하지 못한 인프라 오류를 서로 다른 타입과 사용자 상태로 유지한다.
- 예상 가능한 오류는 action state, 명시적 Result 또는 inline feedback으로 렌더링한다. `error.tsx`는 렌더링과 로딩 중 발생한 예상하지 못한 오류를 격리하고 복구하는 경계다.
- `redirect`, `notFound` 같은 Next.js navigation API는 내부 제어 흐름을 throw로 구현하므로 일반 오류로 삼키지 않는다. `try` 밖에서 호출하거나 catch가 필요하면 Next.js 제어 흐름을 다시 throw한다.
- catch에서 실패를 `null`이나 빈 배열로 바꿔 의미를 제거하지 않는다. 오류 code를 분기하는 `switch`는 exhaustive하게 처리하고 알 수 없는 값은 관측 가능한 실패로 남긴다.
- 사용자 화면에는 내부 원인, stack, credential과 PII를 노출하지 않는다. 로그는 구조화된 분류와 request·trace 식별자를 사용하고 원본 개인정보를 남기지 않는다.

## UI와 접근성

레슨의 선택형 답안은 키보드와 보조 기술이 선택 상태를 식별할 수 있도록 네이티브 `button`과 `aria-pressed`를 사용한다. 관리자 분석 표는 검색 입력의 명시적 이름, 행·열 머리글, 정렬 상태, 페이지 이동 버튼 이름을 제공한다.

- 버튼, dialog, dropdown, form control은 `packages/shared/ui` 컴포넌트를 우선 사용한다.
- 내부 페이지로 이동하는 보이는 UI는 `next/link`의 `Link`를 사용한다. 카드, 메뉴, 탭처럼 버튼 모양이어도 목적지가 있는 탐색이면 링크로 표현한다.
- `router.push`와 `router.replace`는 로그인 완료, 저장 완료, 모달 종료 후 이동처럼 사용자의 명령 또는 비동기 결과에 따른 화면 전이에만 사용한다.
- 탐색 목적으로 클릭 가능한 `div`를 만들지 않는다. 현재 페이지를 가리키는 내부 탐색 링크는 가능한 `aria-current="page"`를 사용한다.
- destructive 동작은 즉시 실행하지 않고 `AlertDialog` 같은 화면 계층 확인 UI를 거친다.
- 성공/오류 상태는 문자열 포함 여부로 판단하지 않는다. `{ kind; message }` 같은 명시적 타입을 사용한다.
- 오류 안내는 가능한 `role="alert"`를 사용하고, 일반 상태 안내는 `role="status"`를 사용한다.
- 화면 텍스트와 `aria-label`은 한국어로 작성한다.
- `/app/profile`의 3분할 segmented control로 라이트, 다크, 시스템 테마 전환을 지원한다.
- 재사용은 boolean prop을 계속 추가하는 방식보다 `children`, slot과 작은 subcomponent의 composition을 우선한다. prop 전달이 길어지면 소비 위치 조정, composition, 좁은 view model, scoped context 순서로 해결한다.
- 재사용 컴포넌트는 controlled와 uncontrolled 계약을 혼합하지 않는다. 접근성, token과 variant는 `packages/shared/ui`, 도메인 상태와 명령 조립은 각 앱 feature가 소유한다.

## 성능과 번들

- 정적 표현과 초기 조회는 서버에 두고 client boundary를 상호작용 leaf까지 내린다. 브라우저 API를 사용하는 package는 좁은 Client Component 안에서만 import한다.
- 코스 이미지와 사용자 콘텐츠 이미지는 `next/image`를 기본으로 사용하고 실제 표시 크기를 반영한 `sizes`를 제공한다. 화면 상단의 LCP 후보만 우선 로드하고 나머지는 기본 지연 로딩을 유지한다.
- 폰트는 root layout의 `next/font`에서 한 번 선언하고 CSS variable로 공유한다. 외부 stylesheet link나 CSS `@import`로 같은 font를 다시 불러오지 않는다.
- Lexical, Recharts처럼 route별로 무거운 client runtime은 실제 소비 route 또는 viewport 근처에서 동적 import한다. barrel import로 사용하지 않는 client module이 함께 번들되지 않게 한다.
- hydration mismatch를 숨기지 않는다. browser-only 값, 시간·난수, 잘못된 HTML 중첩과 server/client 분기처럼 결정성이 깨지는 원인을 제거한다.
- 성능 최적화는 bundle 검사, Web Vitals 또는 trace 같은 측정 근거를 우선한다. 광범위한 memoization, cache와 client state 도입은 복잡도와 무효화 비용을 함께 평가한다.

## 학습자 경험

- 공개 랜딩은 제품명, 가치 제안, 코스 미리보기, 학습 방식, 로그인 CTA를 제공한다.
- 공개 랜딩 구현은 `features/landing/ui/landing-page.tsx`가 최상위 조립만 맡고, section component, 정적 콘텐츠, motion hook, SVG/preview primitive를 같은 feature의 `ui`에 분리한다.
- 공개 랜딩의 정적 section은 Server Component로 렌더링하고 nav scroll, pointer glow, preview parallax, count-up만 client island로 둔다. pointer·scroll 값은 React 상위 state가 아니라 ref와 DOM transform으로 rAF당 한 번 갱신하며 listener는 passive/cleanup 규칙을 따른다. `prefers-reduced-motion: reduce`에서는 marquee·pebble·pointer·parallax·count-up animation을 비활성화한다.
- 홈은 진행 중인 코스, 다음 레슨, 전체 학습 맥락, 현재 연속 학습일을 보여주며 진행 중·완료 목록의 `nextCursor`로 다음 페이지를 추가 로딩한다.
- 홈 코스 카드는 breakpoint별 복제 마크업을 만들지 않고 하나의 링크·이미지 DOM을 반응형 CSS로 배치한다. 첫 코스 이미지만 우선 로드하며 `sizes`는 모바일 전체 폭과 데스크톱 176px 폭을 함께 명시한다.
- 코스 상세는 유닛별 커리큘럼과 레슨의 완료, 진행 가능, 잠금 상태를 보여준다.
- 레슨은 시작 화면을 먼저 보여주고 사용자가 시작한 뒤 첫 스텝으로 진입한다.
- 답변 가능 스텝은 stable item ID 기반 제출을 `completeStep`으로 보내며, 서버의 `retry | advanced | lesson_completed` 결과를 세션 event로 소비한다.
- 글쓰기 초안은 메모리 캐시와 브라우저 영구 저장을 구분한다. 영구 저장 결과는 `saved`, `unavailable`, `quota-exceeded`로 전달하며 실제 `localStorage` 쓰기가 성공한 경우에만 저장 완료를 표시한다. 브라우저 저장 실패는 답안의 서버 제출을 막지 않는다.
- 채점, 진도율, 다음 레슨과 완료 여부는 서버 결과를 표시하며 프론트엔드가 다시 계산하지 않는다.
- 매칭 스텝의 로컬 선택 전이와 stable ID 제출 변환은 web feature가 소유하고, 정답 pair와 verdict는 제출 후 서버 evaluation만 사용한다.
- AI 코칭 스텝은 `target`이 가리키는 같은 레슨의 앞선 WRITE 초안을 작성 내용으로 보여주고, 요청에는 레슨 ID와 AI 코칭 스텝 ID만 전달한다. 서버 저장 답변 없음, 콘텐츠 target 오류, 네트워크 실패, AI 제공자 실패는 서로 다른 한국어 오류로 표시한다.
- AI 코칭 성공 결과는 총평, 잘된 점, 개선점, 다음 시도, 남은 재시도 횟수를 보여준다.

## 어드민 경험

- 어드민은 학습자 인증과 분리된 관리자 로그인을 사용한다.
- 콘텐츠 관리는 코스 검색, 카테고리 필터, 페이지 크기, 페이지 이동, 새 코스 생성, 코스 보관을 제공한다.
- 코스 편집은 유닛, 레슨 배치, 레슨 추가/보관, 순서 변경, 표준 10개 스텝 타입별 편집 폼을 제공한다. AI 코칭 대상은 같은 레슨에서 앞선 WRITE 스텝만 선택할 수 있다.
- 코스 편집 저장은 draft의 `editVersion`을 `If-Match`로 전달한다. 저장과 발행을 분리하고 미저장 변경이 없을 때만 명시적 `초안 발행` 행동을 제공한다.
- stale 저장·발행은 자동 병합하지 않는다. 최신 draft로 교체하거나 로컬 변경을 최신 `curriculumVersionId`, `editVersion`, `revision`에 재기준화해 다시 검토한다.
- 사용자 관리는 검색, 상태 필터, 정렬, 페이지 이동, 정지/복구, 삭제 요청 처리를 제공한다.
- 분석 화면의 차트는 새 의존성 없이 SVG 또는 CSS 기반 컴포넌트로 우선 구현한다.
- 대시보드와 분석 화면의 Recharts 시각화는 viewport 200px 이내에서 동적으로 불러온다. 같은 데이터의 기간 합계와 semantic table을 먼저 렌더링해 JavaScript·차트 로딩 실패와 screen reader 환경에서도 핵심 값을 전달한다.
- 자료실은 reui 기반 Tree 프리미티브로 최대 3단계 폴더·문서 계층을 이름순으로 한 번에 조회하고 데스크톱 사이드바를 제공한다. 작은 화면에서는 데스크톱 브라우저 사용 안내를 표시한다.
- 자료실 트리 shell은 문서 편집기 모듈을 정적 import하지 않는다. Lexical 편집기 경계는 `/resources/[documentId]`에서만 동적으로 불러오며, 빈 자료실과 휴지통의 초기 chunk는 CI에서 편집기 런타임 부재와 275,000 bytes gzip 예산을 검증한다.
- 자료 본문은 Lexical에서 최종 문서 형태로 GFM을 편집하고 제목과 본문을 저장 버튼으로 함께 확정한다. 슬래시 메뉴, Markdown shortcut, 블록 이동, 선택 서식 도구와 R2 이미지 업로드를 제공한다.
- 문서를 열 때 받은 버전을 `If-Match`로 보내고 `412 Precondition Failed`이면 로컬 편집본을 유지한 채 최신 저장본을 함께 제시한다. 자동 병합하지 않으며 브라우저 포커스 복귀 때 전체 트리와 열린 문서를 HTTP로 재검증한다.

## 상태 관리

- URL에서 복원 가능한 선택 상태는 URL query 또는 route params로 둔다.
- 서버에서 조회한 데이터는 서버 컴포넌트에서 먼저 가져온다.
- 입력 중인 draft, dialog open 여부, drag 상태처럼 화면 상호작용에 묶인 값은 가까운 client component나 전용 hook에 둔다.
- 저장 실패처럼 사용자에게 알려야 하는 상태는 fire-and-forget으로 숨기지 않고 화면 상태로 노출한다.
- render 중 계산할 수 있는 파생값은 state로 저장하지 않는다. 사용자 event 결과는 event handler, 연관된 복합 전이는 reducer에서 처리한다.
- `useEffect`는 DOM event, observer, timer, WebSocket과 browser storage처럼 React 바깥 시스템과 동기화할 때만 사용한다. 데이터 조회, 사용자 event 처리, props에서 계산 가능한 값과 state 연쇄를 effect로 구현하지 않는다.
- 먼 subtree가 실제로 같은 일시적 상태를 공유하기 전에는 전역 store를 도입하지 않는다. 서버 데이터와 URL 상태를 client store에 복사하지 않는다.

## 테스트 기준

- feature 동작은 사용자가 보는 UI와 command 경계 위주로 검증한다.
- 외부 API는 포트 mock으로 대체한다.
- mapper와 URL 정책처럼 작은 순수 로직은 단위 테스트로 고정한다.
- overlay 계열 컴포넌트는 `apps/*/src/test`의 테스트 mock을 사용해 포털과 포커스 구현 세부사항에 테스트가 묶이지 않게 한다.
- 순수 규칙과 상태 전이는 구현 파일 가까이의 Vitest, 컴포넌트 행위는 Testing Library와 `user-event`, 공용 UI 상태와 접근성은 Storybook interaction, 핵심 사용자 여정은 Playwright로 검증한다.
- 컴포넌트 테스트는 구현 세부사항보다 role, accessible name과 실제 command 결과를 조회한다. loading, empty, error, permission과 version conflict처럼 복구 경로가 다른 상태를 포함한다.
- E2E는 모든 조합이 아니라 인증, 학습 상태 전이, 발행, 권한 변경과 자료 저장처럼 제품·보안·데이터 정합성에 중요한 여정을 우선한다. 로컬 브라우저와 E2E 인증은 Google OAuth 대신 `ENABLE_TEST_AUTH=true`를 사용한다.
- runtime 순환 참조, 미선언 dependency와 frontend의 server·DB import는 `check:architecture`로 차단한다. package 공개 Interface와 feature 내부 방향은 TypeScript, production build와 코드 리뷰에서 확인한다.

## 코드 리뷰 체크리스트

- 경계: 파일이 하나의 변경 이유를 갖는가, feature 내부 import가 새지 않는가, client graph에 server module이 포함되지 않는가.
- 데이터: source of truth가 하나인가, 모든 외부 입력과 응답을 검증하는가, Server Component와 client state가 같은 값을 중복 소유하지 않는가.
- React: client boundary가 최소인가, effect가 외부 시스템 동기화에만 쓰이는가, composition으로 boolean prop과 전역 상태를 줄일 수 있는가.
- 보안: UI 표시와 별개로 서버가 인증·인가를 다시 수행하는가, redirect target과 URL 입력을 검증하는가, 최소 DTO만 직렬화하는가.
- 운영: loading·error·empty·permission·conflict 상태가 검증됐는가, cache 무효화와 rollback 의미가 명확한가, bundle과 접근성 회귀가 자동 검사되는가.

## 금지 패턴

- 전역 기술 폴더와 포괄 이름의 `components`, `hooks`, `services`, `utils`, `common`에 기능 코드를 모으는 구조.
- route 파일, hook, Server Action과 UI 컴포넌트에 비즈니스 규칙을 중복 구현하는 구조.
- Server Component에서 자기 앱 Route Handler를 호출하거나 Server Action을 조회 API로 사용하는 구조.
- 상위 Server Component와 하위 client cache·store가 같은 mutable 값을 동시에 소유하는 구조.
- root layout 전체의 `"use client"`, async Client Component, 비직렬화 props와 browser-only package의 server import.
- `useEffect` chain, 렌더 중 파생 가능한 중복 state, 저장 실패를 숨기는 fire-and-forget promise.
- ORM·DB model, 내부 오류와 검증되지 않은 API 응답을 client prop으로 직접 노출하는 구조.
- 근거 없는 무기한 cache, 광범위 cache 무효화, 측정 없는 memoization과 거대 공통 추상화.

## 관련 문서

- `../product/problem-definition.md`: 제품 문제와 범위.
- `system-overview.md`: 모노레포 구조와 runtime 경계.
- `../product/content-model.md`: 콘텐츠 도메인 모델과 불변식.
- `api-contract.md`, `data-model.md`, `auth-permissions.md`: API, DB와 인증 경계.
- `../design`: 브랜드, foundation, component, pattern, asset, accessibility, IA, 화면 UX의 기준.
- `../design/text-localization-policy.md`: 텍스트 현지화 원칙.
