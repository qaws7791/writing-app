# Next.js 아키텍처 가이드

---

## 0. 핵심 원칙 (TL;DR)

1. **Server Component가 기본값**입니다. 상호작용이 필요한 최소 leaf만 Client Component로 전환합니다.
2. **`app/`은 라우팅·조립 전용**입니다. 비즈니스 로직을 두지 않습니다.
3. **함께 변경되는 코드는 `features/{기능명}`으로 공배치**합니다. 전역 `components/`, `hooks/`, `utils/`, `services/` 폴더는 만들지 않습니다.
4. **도메인 규칙은 순수 함수 + 불변 데이터**로 표현합니다. 클래스 기반 도메인 모델은 기본값이 아닙니다 (예외는 23장).
5. **모든 신뢰 경계(입력·응답·env)는 Zod로 파싱**합니다. 타입은 스키마에서 `z.infer`로 추론합니다.
6. **데이터는 하나의 소유자만 가집니다.** 서버 렌더 시점 읽기는 Server Component, 브라우저 갱신이 필요한 서버 상태는 TanStack Query, 공유·복원 가능한 화면 상태는 URL.
7. **쓰기는 Server Action 기본**, optimistic update나 외부 client 호출이 필요할 때만 Route Handler를 병행합니다.
8. **`useEffect`는 외부 시스템 동기화에만** 사용합니다. 파생 상태·이벤트·데이터 조회에는 쓰지 않습니다.
9. **컴포지션이 기본 재사용 수단**입니다. boolean prop을 계속 추가하는 대신 작은 서브 컴포넌트를 조합합니다.
10. **경계는 도구로 강제**합니다. ESLint, TypeScript, dependency-cruiser, CI가 금지된 의존성과 순환 참조를 차단합니다.
11. **리소스가 매우 많고 균일한 CRUD 어드민 영역**에서는 클래스 기반 컨벤션(BaseRepository 등)을 예외적으로 허용합니다 (23장).

---

## 1. 기술 스택

| 영역 | 채택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js App Router | RSC, Server Action, Route Handler, Cache Components |
| UI 런타임 | React 19 | Server Components, Actions, `useActionState` |
| 언어 | TypeScript strict | 런타임 검증은 신뢰하지 않고 Zod가 별도 담당 |
| 런타임 검증 | Zod | 입력·응답·env·webhook 전부 |
| 브라우저 서버 상태 | TanStack Query | refetch, optimistic update, 무한 스크롤 |
| 복잡한 폼 | React Hook Form + Zod resolver | 동적 필드, 즉시 검증이 필요할 때 |
| 스타일 | Tailwind CSS + CVA | 토큰 기반, variant 타입 안전 |
| UI 프리미티브 | Radix 기반 (shadcn/ui 등) | 접근성 내장, 코드 직접 소유 |
| 전역 클라이언트 상태 | Zustand | 최소한으로만 사용 |
| URL 상태 | `nuqs` 또는 자체 searchParams 스키마 | 필터·정렬·페이지 |
| 인증 | Auth.js 또는 회사 표준 IdP | 어댑터 뒤에 격리 |
| DB | Prisma 또는 Drizzle | 타입 안전한 접근 |
| 단위·컴포넌트 테스트 | Vitest + Testing Library | |
| 네트워크 mock | MSW | protocol 경계에서 intercept |
| E2E | Playwright | 핵심 사용자 여정만 |
| 컴포넌트 카탈로그 | Storybook | 상태별 문서화, a11y 검사 |
| 관측성 | OpenTelemetry | vendor-neutral |
| 린트/경계 강제 | ESLint flat config + typescript-eslint + dependency-cruiser | 계층 위반 CI 차단 |
| 미사용 코드 | Knip | 죽은 export·의존성 탐지 |
| i18n | next-intl | App Router 네이티브 |

**조건부 채택**: Zustand(먼 subtree가 공유하는 클라이언트 상태가 실재할 때), TanStack Table/Virtual(복잡한 그리드·대량 목록), XState(병렬·재시도가 많은 상태 머신), 모노레포+Turborepo(여러 앱이 실제로 패키지를 공유할 때).

**기본적으로 채택하지 않음**: 전역 Redux, CSS-in-JS 런타임, axios(표준 `fetch`로 충분한 경우), 무분별한 barrel file, `lodash` 전체 import.

---

## 2. 저장소 디렉토리 구조

기본은 **단일 애플리케이션 저장소**입니다. 여러 앱이 실제로 같은 디자인 시스템·계약을 공유하게 되는 시점에만 모노레포로 확장합니다 (24장).

```text
my-app/
├── .github/workflows/          # CI
├── e2e/                        # Playwright 여정 테스트
├── prisma/                     # 또는 drizzle/
├── public/
├── src/
│   ├── app/                    # 라우팅 전용 (4장)
│   ├── features/               # 기능 단위 모듈 — 핵심 레이어 (5장)
│   ├── entities/                # 여러 feature가 공유하는 안정된 도메인 명사 (6장)
│   ├── shared/                  # 도메인 중립 공용 코드 (7장)
│   ├── server/                  # 앱 전역 서버 플랫폼 (8장)
│   ├── instrumentation.ts       # OTel 초기화
│   └── proxy.ts                 # 조기 redirect, locale gate (middleware.ts 대응)
├── .env.example
├── eslint.config.mjs
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

파일·디렉토리명은 예약 파일(`page.tsx`, `layout.tsx`, `route.ts` 등)을 제외하고 모두 **kebab-case**로 고정합니다. 동적 세그먼트는 `orders/[id]`처럼 짧게 쓰고, `[order-id]`처럼 하이픈을 넣으면 `params['order-id']` 접근이 번거로워지므로 피합니다.

---

## 3. 레이어 책임과 의존성 규칙

| 계층 | 책임 | 허용 의존성 | 두면 안 되는 것 |
|---|---|---|---|
| `app` | URL, 레이아웃, 메타데이터, 화면 조립 | features, entities, shared, server | 비즈니스 로직, 복잡한 조회 조립 |
| `features` | 사용자 능력(=변경 단위) 구현 | 같은 feature, entities, shared, server | 다른 feature의 내부 경로 |
| `entities` | 여러 feature가 공유하는 안정된 도메인 명사 | shared | React hook, HTTP, DB, 세션 |
| `shared` | 도메인 중립 공용 코드 | 외부 라이브러리만 | 도메인 지식, 특정 정책 |
| `server` | 인증·DB·캐시·로그 등 서버 플랫폼 | entities, shared | app/feature의 UI·hook |

의존성은 `app → features → entities → shared` 한 방향으로만 흐릅니다. 강제 규칙:

- 순환 의존은 계층과 무관하게 전면 금지합니다.
- 한 feature는 다른 feature의 내부 경로를 import할 수 없습니다. 공유가 필요하면 `entities` 또는 `shared`로 승격합니다.
- Client Component는 `server-only` 모듈을 import할 수 없습니다 (`server-only` 패키지로 강제).
- Server Component에서 자기 앱의 Route Handler를 `fetch`로 호출하지 않습니다. DAL을 직접 호출합니다.
- 딥 임포트를 금지하고, feature의 공개 API는 명시적 경로(`@/features/order-list/ui/order-list`)로만 노출합니다. 앱 내부용 barrel(`index.ts`)은 강제하지 않습니다.

이 규칙은 ESLint(`import/no-restricted-paths`, custom `boundaries`)와 `dependency-cruiser`로 CI에서 기계적으로 강제합니다. 사람의 기억에 의존하지 않습니다.

---

## 4. `app/` — 라우팅 레이어

`page.tsx`와 `layout.tsx`는 다음만 수행합니다.

1. `params`/`searchParams`를 Zod로 파싱합니다.
2. 인증된 actor·tenant 컨텍스트를 얻습니다.
3. 서버 데이터 소유권인 경우 DAL을 직접 호출합니다.
4. route-private 뷰와 feature UI를 조합합니다.
5. `notFound`, redirect, `generateMetadata` 등 라우팅 결정을 내립니다.

```tsx
// src/app/(authenticated)/orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import { orderRouteParamsSchema } from '@/features/order-detail/model/order-route-params-schema';
import { getOrderDetail } from '@/features/order-detail/server/dal/get-order-detail';
import { OrderDetailPage } from './_views/order-detail-page';

export default async function Page({ params }: PageProps<'/orders/[id]'>) {
  const parsed = orderRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const order = await getOrderDetail({ orderId: parsed.data.id });
  if (order === null) notFound();

  return <OrderDetailPage order={order} />;
}
```

그 라우트에서만 쓰는 조립 컴포넌트는 `_views/`(private 폴더, 빌드 라우팅에서 제외)에 둡니다. 재사용 가능성이 조금이라도 보이면 즉시 `features/`로 승격합니다. Provider 조립은 `app/_providers/`에 두고, provider 자체만 Client Component로 만들어 server-rendered `children`을 그대로 받습니다 — root layout 전체를 `'use client'`로 만들지 않습니다.

| 예약 파일 | 책임 |
|---|---|
| `layout.tsx` | 지속되는 shell과 Provider 조립. 모든 하위 route가 필요할 때만 데이터 요청 |
| `loading.tsx` | route shell에 맞춘 skeleton (화면 전체 복제 금지) |
| `error.tsx` | 예상하지 못한 오류의 복구 UI. 반드시 Client Component. 도메인 오류 표시용 아님 |
| `not-found.tsx` | 리소스 부재 표현 |
| `route.ts` | 외부 webhook, OG 이미지 등 REST가 꼭 필요한 경우만. 내부 mutation은 Server Action 우선 |

`proxy.ts`(구 `middleware.ts`)는 조기 redirect·locale·coarse route gate만 담당하는 UX 최적화 계층입니다. 최종 인증·인가는 데이터 접근 직전(DAL·use-case)에서 반드시 다시 검증합니다.

**i18n을 도입하는 경우**: `app/[locale]/(public)/`와 `app/[locale]/(protected)/` 형태의 route group으로 로케일과 인증 경계를 함께 표현합니다. route group `(...)`은 URL에 포함되지 않습니다.

---

## 5. `features/{기능명}` — 기능 슬라이스 (핵심 레이어)

이 문서의 핵심 레이어입니다. **폴더 하나 = 기능 하나 = 독립적으로 삭제 가능**해야 합니다. 모든 기능에 아래 폴더가 전부 필요한 것은 아닙니다 — 실제로 필요한 capability만 만듭니다. 예를 들어 순수 서버 읽기 화면은 `model`, `server/dal`, `ui`만 있으면 됩니다.

```text
features/order-cancellation/
├── model/                 # 순수 규칙, zod 스키마, 상태 전이 (React·DB·fetch를 모름)
│   ├── cancel-order-form-schema.ts
│   ├── cancel-order-command-schema.ts
│   └── can-cancel-order.ts
├── server/
│   ├── dal/                # 권한을 포함한 읽기·쓰기 I/O
│   ├── mappers/             # 외부 표현 <-> 내부 모델 변환
│   ├── use-cases/           # 순수 규칙 + I/O 오케스트레이션
│   ├── actions/             # "use server" 얇은 어댑터
│   └── route-handlers/      # Request/Response 얇은 어댑터
├── api/                    # 브라우저 fetch, query/mutation options
├── hooks/                  # React lifecycle 연결 (비즈니스 로직 금지)
├── ui/                     # 표현과 컴포지션
└── testing/                # fixture, MSW handler
```

| 디렉토리 | 책임 | 금지 |
|---|---|---|
| `model` | 순수 규칙, 상태 전이, schema | React, fetch, DB, 세션, 로그 |
| `server/dal` | 권한 포함 읽기·쓰기 I/O | UI 상태, transport 응답 생성 |
| `server/use-cases` | 순수 규칙과 I/O 조립 | HTTP·React 형식에 종속된 반환 |
| `server/actions` / `route-handlers` | 입력 파싱·호출·응답 매핑 | 핵심 규칙, 직접 DB 쿼리 |
| `api` | 브라우저 fetch, query key·options | server-only import, UI 표현 |
| `hooks` | React lifecycle·library adapter | 비즈니스 규칙(가격, 권한, 전이) |
| `ui` | 표현과 composition | 직접 DAL·DB 호출, 숨은 전역 상태 |

### 5-1. 한 기능을 관통하는 예시 (주문 취소)

```ts
// model/can-cancel-order.ts — 순수 함수. React, DB, 현재 시각 singleton을 모름
export function canCancelOrder({ order, nowEpochMs }: CanCancelOrderInput): CancellationEligibility {
  if (order.status === 'cancelled') return { eligible: false, reason: 'already-cancelled' };
  if (order.status === 'shipped') return { eligible: false, reason: 'already-shipped' };
  if (nowEpochMs > order.cancellationDeadlineEpochMs) return { eligible: false, reason: 'deadline-expired' };
  return { eligible: true, refundableAmount: order.paidAmount };
}
```

```ts
// server/actions/cancel-order-action.ts — 얇은 Server Action
'use server';
import 'server-only';

export async function cancelOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cancelOrderFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'invalid', fieldErrors: toZodFieldErrors(parsed.error) };

  const actor = await requireActor();
  const result = await cancelOrder({ actor, command: parsed.data }); // use-case 호출
  if (!result.ok) return { status: 'failure', code: result.code };

  updateTag(orderCacheTags.detail(result.orderId));
  return { status: 'success', data: { orderId: result.orderId } };
}
```

```ts
// hooks/use-cancel-order.ts — Query cache를 함께 갱신해야 할 때만 추가
'use client';
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    ...cancelOrderMutationOptions(),
    onSuccess: (result) => queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(result.orderId) }),
  });
}
```

액션은 **입력 파싱 → actor 획득 → use-case 호출 → 캐시 처리 → 직렬화 가능한 상태 반환**만 담당합니다. 비즈니스 규칙을 action이나 hook에 다시 작성하지 않습니다. use-case는 의존성을 함수 인자로 주입받아(팩토리 패턴) 테스트 시 fake로 교체할 수 있게 합니다 — 단, 이 패턴은 실제로 교체·테스트 가치가 있는 경계에만 사용하고 모든 함수에 강제하지 않습니다.

---

## 6. `entities/` — 안정된 도메인 명사

feature 간에 공유되는 "명사" 단위입니다. 처음부터 모든 개념을 entity로 만들지 않고, 다음을 만족할 때만 승격합니다.

- 둘 이상의 feature가 동일한 의미로 사용한다.
- 상태·식별자·표현 규칙이 비교적 안정됐다.
- 특정 화면의 lifecycle에 종속되지 않는다.

```text
entities/order/
├── model/order-schema.ts        # 여러 feature가 공유하는 Order 타입·스키마
├── query/order-query-keys.ts    # 공유 query key factory
└── ui/order-status-badge.tsx    # 여러 feature가 재사용하는 최소 프레젠테이션
```

**금지**: DB row 타입 노출, API 응답 전체를 그대로 재사용, 세션·환경변수 접근, HTTP 요청, React hook, 특정 라우트의 search parameter.

---

## 7. `shared/` — 도메인 중립 공용 레이어

```text
shared/
├── ui/          # 디자인 프리미티브(Button, Dialog, Overlay...)
├── hooks/       # 도메인 무관 범용 훅 (use-media-query, use-online-status)
├── lib/         # react-query client, date, result 타입
├── http/        # fetch 래퍼, 공통 에러 파싱
├── config/      # env.ts(zod 검증), site-config
└── types/       # brand 타입 등 순수 타입 유틸
```

`utils`, `helpers`, `common`, `misc`, `constants` 같은 **포괄 폴더는 만들지 않습니다.** 코드가 무엇을 하는지 이름으로 표현할 수 없다면 아직 올바른 경계를 찾지 못한 것입니다. 도메인 용어가 섞이면 `shared`가 아니라 `feature`/`entity`로 옮깁니다.

```ts
// shared/config/env.ts — 환경변수도 신뢰 경계이므로 Zod로 검증
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
});
export const env = envSchema.parse(process.env); // 누락 시 즉시 실행 중단
```

---

## 8. `server/` — 서버 플랫폼 레이어

```text
server/
├── auth/            # get-session, require-actor, can()
├── env/             # server/client env schema
├── database/        # DB client, transaction
├── http/            # 외부 API client factory
├── cache/           # cache tags, cache policy
├── observability/   # logger, tracing, metric
├── security/        # csrf, webhook 검증, rate-limit
└── feature-flags/
```

모든 모듈 최상단에 `import 'server-only'`를 추가해 Client Component 그래프에 섞이지 않게 합니다. **DAL 원칙**: 현재 actor·tenant를 확인하고, 읽기 권한을 데이터 조회와 가까운 곳에서 검사하며, DB row나 외부 응답을 검증·매핑해 컴포넌트에 필요한 최소 DTO만 반환합니다. 별도 백엔드가 이미 있는 조직이라면 이 레이어는 해당 API의 서버 어댑터 역할을 합니다.

---

## 9. 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|---|---|---|
| 디렉토리/파일명 | kebab-case | `order-list-item.tsx` |
| 컴포넌트(export) | PascalCase | `export function OrderListItem` |
| 함수/변수 | camelCase | `filterOrderList` |
| 진짜 컴파일 타임 상수 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| 훅 파일 | `use-` 접두 kebab → camelCase export | `use-order-list.ts` → `useOrderList` |
| 순수 함수 파일 | 동사-목적어 kebab | `filter-order-list.ts` |
| 스키마 파일 | `*-schema.ts` | `order-list-schema.ts` |
| 쿼리 키/옵션 팩토리 | `*-query-keys.ts` / `*-query-options.ts` | |
| Server Action | `*-action.ts` | `create-order-action.ts` |
| 테스트/스토리 | co-location | `*.test.ts(x)`, `*.stories.tsx` |

**함수 동사 규칙**: `parse`(경계 검증), `map`(유효한 표현 간 변환), `create`(factory), `get`(존재 보장), `find`(없을 수 있음, `null`/Result 반환), `list`(collection), `calculate`(순수 계산), `can/is/has/should`(판정), `assert`(위반 시 throw), `handle`(transport entry adapter), `on`(주입받는 콜백), `invalidate`(캐시 무효화), `search`(복합 필터), `fetch`(외부 연동 조회), `count`/`aggregate`(집계), `batch`/`bulk`(대량 처리). `process`, `manage`, `handleData`처럼 의미가 넓은 이름은 피합니다.

파일당 주요 export는 원칙적으로 1개입니다(단, schema+`z.infer` 타입, 컴포넌트+props 타입, reducer+action 타입은 같은 역할이므로 예외). 250줄, 함수 40줄, props 7개, boolean prop 3개를 넘으면 분리 신호로 간주하되 이는 자동 실패가 아니라 리뷰 신호입니다.

---

## 10. TypeScript 규칙

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- `any`는 금지합니다. 외부 입력은 `unknown`으로 받아 Zod로 좁힙니다.
- `enum` 대신 `as const` 객체, literal union, discriminated union을 우선합니다.
- 식별자는 필요할 때 Zod `.brand<'OrderId'>()`로 서로 바뀌지 않게 합니다.
- 직렬화 경계의 날짜는 ISO 8601 문자열, 금액은 통화 코드 + 정수 최소 단위로 표현합니다.
- 상태는 discriminated union으로 불가능한 조합 자체를 제거합니다 (`isOpen/isLoading/isSuccess/error` 네 개의 boolean 대신 하나의 status union).

---

## 11. 함수형 설계와 Result 타입

도메인 모델은 readonly object + discriminated union으로 표현하고, 순수 함수가 이를 변환합니다. 예상 가능한 실패(이미 취소된 주문, 버전 충돌 등)는 **값**으로 표현하고, 예상하지 못한 인프라 오류(DB 타임아웃, 불변식 위반)만 `throw`합니다.

```ts
// shared/lib/result.ts
export type Result<TValue, TError> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TError };
```

`Result`를 모든 함수에 강제하지 않습니다. 호출자가 실제로 분기·복구해야 하는 예상 실패에만 사용합니다. 배열/객체는 불변으로 다루고(spread, `toSorted`), 원본을 변형하지 않습니다. 의존성 주입(현재 시각, ID 생성, I/O)은 use-case 경계에서만 함수 인자로 명시합니다.

---

## 12. 데이터 소유권 모델

| 데이터 종류 | 소유자 | 기본 도구 |
|---|---|---|
| 서버 렌더 시점 읽기 데이터 | Server Component | DAL 직접 호출 |
| 브라우저에서 갱신되는 서버 데이터 | TanStack Query | Route Handler + `useQuery`/`useMutation` |
| 공유·북마크 가능한 화면 상태 | URL | `searchParams` + router |
| 입력 중인 값과 검증 상태 | form | native form 또는 RHF |
| 한 subtree의 일시적 UI 상태 | component | `useState`/`useReducer` |
| 먼 subtree가 공유하는 일시적 상태 | scoped Context 또는 Zustand | 최소 범위 provider |
| 외부 store/브라우저 API snapshot | external store | `useSyncExternalStore` |

**선택 순서**: ① render 중 계산 가능한가 → ② 이벤트 순간 계산 가능한가 → ③ URL이 자연스러운가(공유·새로고침) → ④ 브라우저 refetch·optimistic이 필요한 서버 상태인가 → ⑤ reducer로 표현 가능한가 → ⑥ 정말 여러 먼 subtree가 공유해야 하는가. 마지막 단계까지 해결되지 않을 때만 전역 client store를 도입합니다.

같은 사실을 URL, local state, Query cache, Zustand에 동시에 복제하지 않습니다. Server Component가 렌더한 값을 하위 Query subtree가 다시 refetch하도록 이중 소유권을 만들지 않습니다 — 한 값의 **소유자는 항상 하나**입니다.

---

## 13. 쓰기 경로: Server Action vs Route Handler

| 요구 | 기본 선택 |
|---|---|
| progressive enhancement가 필요한 HTML form | Server Action |
| optimistic update, Query cache가 소유한 데이터 | Route Handler + `useMutation` |
| upload progress, 외부 client도 호출하는 API | Route Handler |
| webhook, 3rd-party callback | Route Handler |
| 내부 admin 버튼의 단순 서버 변경 | Server Action |

두 경로 모두 **동일한 command schema와 use-case**를 호출합니다 (5-1절 예시 참고). Server Action도 인증되지 않은 요청이 직접 POST로 호출할 수 있는 public entry point로 취급합니다 — action 내부에서 인증하고, use-case·DAL에서 다시 인가합니다.

**optimistic update는 다음을 모두 만족할 때만** 적용합니다: 실패 확률이 낮음, rollback 가능한 snapshot이 있음, version/idempotency로 경합을 제어함, 실패 UI가 명확함. 결제 확정·권한 부여·계정 삭제는 서버 확인 전에 성공처럼 보여주지 않습니다.

---

## 14. 캐시 전략

| 캐시 | 소유 위치 | 무효화 |
|---|---|---|
| 브라우저 Query cache | TanStack Query | key 기반 invalidate / `setQueryData` |
| Next data cache | 서버 | `cacheTag` + `updateTag`/`revalidateTag` |
| request memoization | 서버 render 1회 | 요청 종료 시 자동 |
| CDN/HTTP cache | edge/browser | cache header, versioned URL |

- 동적 데이터는 기본적으로 동적으로 취급하고, 요청 간 재사용 가치가 검증된 읽기만 `'use cache'`로 opt-in합니다.
- `cacheTag`는 도메인 리소스 기준으로 설계합니다(`orders:${orderId}`). tenant가 필요하면 반드시 포함합니다.
- 사용자 자신의 변경을 즉시 반영해야 하면 `updateTag`, stale-while-revalidate가 맞으면 `revalidateTag`를 씁니다.
- `revalidatePath('/')` 같은 광범위 무효화는 최후의 수단입니다. 전역 `staleTime: Infinity`도 사용하지 않습니다.

---

## 15. 클라이언트 상태와 `useEffect` 정책

검색어·정렬·필터·페이지·탭처럼 공유·복원되어야 하는 상태는 **URL이 source of truth**입니다. 서로 연관된 여러 상태가 함께 전이하거나 불가능한 조합을 막아야 할 때만 `useReducer`를 씁니다. Context는 한 subtree의 compound state나 변화가 드문 전역 환경(locale, theme)에 적합하고, Zustand는 먼 컴포넌트들이 실제로 같은 일시적 클라이언트 상태를 공유할 때만 씁니다. 서버 데이터를 Zustand로 복사하지 않습니다.

**Effect 판단 순서**: render 중 계산 → event handler에서 처리 → reducer로 상태 전이 → `key`로 subtree reset → URL state → TanStack Query → `useSyncExternalStore` → (그래도 안 되면) 외부 시스템 동기화용 custom hook 안의 `useEffect`.

**Effect로 하지 않는 것**: props/state에서 계산 가능한 파생값 저장, 클릭·제출 같은 사용자 이벤트 처리, Server Component/Query가 담당할 데이터 fetch, `state A 변경 → effect → state B 변경`의 연쇄. `useEffect`는 DOM 이벤트·observer·WebSocket·타이머처럼 **React 바깥의 시스템과 동기화할 때만** 정당화됩니다.

---

## 16. 폼 처리

| 상황 | 방식 |
|---|---|
| 단순 서버 중심 폼 | native `<form action={serverAction}>` + `useActionState` + `useFormStatus` |
| 동적 필드, 즉시 검증, 다단계 입력 | React Hook Form + `zodResolver` |

클라이언트 검증(RHF + zodResolver)과 서버 검증(Server Action 내부 `safeParse`)은 **동일한 zod 스키마 하나**를 공유합니다. `useFormStatus`는 pending을 읽어야 하는 form의 하위 leaf 컴포넌트에만 두고, form 전체를 Client Component로 만들지 않습니다. 성공 후 캐시 무효화는 mutation의 `onSuccess`에서 처리합니다.

---

## 17. 에러 모델

| 분류 | 예 | 표현 | 처리 위치 |
|---|---|---|---|
| validation | 잘못된 입력 | Zod issue | transport adapter·form |
| domain rejection | 이미 배송됨 | discriminated Result | use-case → UI/HTTP 매핑 |
| authentication | 세션 없음 | typed error 또는 redirect | auth boundary |
| authorization | 타 tenant 리소스 | forbidden 또는 의도적 not-found | DAL·use-case |
| concurrency | version conflict | domain result, HTTP 409 | use-case |
| not found | 리소스 없음 | `null`/`notFound()` | DAL → route |
| infrastructure | DB timeout | throw | error boundary·관측성 |

transport 경계에서만 소수의 typed error로 HTTP 상태 코드를 매핑합니다.

```ts
export class BizError extends Error { constructor(public code: string, message: string) { super(message); } }
export class ValidationError extends BizError {}   // → 400
export class PermissionError extends BizError {}   // → 403
export class NotFoundError extends BizError {}     // → 404
export class ConflictError extends BizError {}     // → 409

export const mapErrors: Middleware = async (req, ctx, next) => {
  try { return await next(); }
  catch (e) {
    if (e instanceof BizError) return Response.json({ ok: false, code: e.code }, { status: STATUS[e.constructor.name] });
    logger.error('unhandled', e);
    return Response.json({ ok: false, code: 'INTERNAL' }, { status: 500 });
  }
};
```

예상 가능한 오류는 `error.tsx`로 보내지 않고 action state/mutation error/inline feedback으로 렌더링합니다. `error.tsx`는 예상하지 못한 render·loading 실패만 담당합니다. `switch`문의 모든 오류 코드는 `assertNever`로 exhaustive하게 처리합니다. `catch { return null }`처럼 실패 의미를 지워버리는 패턴은 금지합니다.

---

## 18. 인증·인가·멀티테넌시

보안은 세 단계의 독립된 관문으로 분리합니다.

| 단계 | 역할 | 위치 |
|---|---|---|
| 1. 인증(Authentication) | 상대가 누구인지 확인 | `proxy.ts`/`middleware.ts` — 최소한의 식별 헤더만 하위로 전달 |
| 2. 신원 확장(Identity Hydration) | 상세 권한·프로필 로드 | `React.cache`로 감싼 `getUserContext()` — 요청 범위 내 중복 조회 제거 |
| 3. 인가(Authorization) | 이 행위를 허용할지 결정 | 데이터 조회 직후, 아래 3개 권한 평면 |

### 세 가지 권한 평면

| 평면 | 질문 | 위치 |
|---|---|---|
| ① 기능 인가(RBAC) | 이 사용자가 이 행위를 할 기본 권한이 있는가 | 사용자 역할/권한 목록, 와일드카드(`agent:*`) 매칭 |
| ② 리소스 격리 | 요청한 엔티티가 본인 소유이거나 소속 tenant인가 | 데이터 인스턴스(owner, visibility, tenant) |
| ③ 워크스페이스 멤버십 | 조직 권한과 별개로 이 프로젝트 내 권한이 있는가 | 하위 도메인 멤버십, ①과 합집합 |

세 관문을 모두 통과해야 실행됩니다. 관리자 권한이 있어도 타인의 완전 비공개 리소스는 차단합니다.

```ts
export function can(ctx: UserContext, action: Action, res?: Resource): boolean {
  if (!res) return hasOperation(ctx.perms, action);
  if (!canAccessResource(ctx, res)) return false;               // ② 격리 최우선
  return hasOperation(ctx.perms, action) || projectGrants(ctx, res, action); // ① ∪ ③
}
```

**안티패턴**: 비공개 리소스는 403이 아닌 **404**로 응답해 존재 자체를 숨깁니다. 내부 PK(`id`)와 외부 IdP ID(`externalId`)를 변수명 단계에서부터 혼동하지 않습니다. `*:*` 슈퍼 관리자 와일드카드는 극소수에게만 부여합니다. UI에서 버튼을 숨기는 것은 보안이 아닙니다 — 서버가 매번 재검증합니다.

**멀티테넌시**: `AsyncLocalStorage`로 요청 전체에 tenant context를 전파하고, Repository/DAL은 이 context에서 tenant 식별자를 꺼내 쿼리 조건에 강제로 포함합니다(누락 시 조회 실패, "닫힌 기본값"). 캐시 키는 `tenant:{id}:` prefix로 네임스페이스를 분리하고, rate limit도 사용자 개인이 아닌 tenant 단위로 묶습니다.

---

## 19. 관측성

| 종류 | 예시 |
|---|---|
| trace span | `order-detail.load`, `order-cancellation.execute` (비즈니스 의도 중심 이름) |
| 구조화 로그 | JSON key-value, `requestId`/`traceId`/`feature`/`outcome` 포함 |
| metric | 타입 지정 enum 키(`Metric.AgentRunErrors`), 자유 문자열 금지 |

횡단 관심사(tracing, rate limit, usage)는 고차 함수로 라우트/Server Action을 감싸 선언적으로 조립합니다.

```ts
export const POST = composeAPIRoute([
  withTracing('order.cancel'),
  withRateLimit({ key: 'tenant', limit: 100, window: '1m' }),
  mapErrors,
  authUser,
  async (req, ctx) => { /* 순수 비즈니스 로직 */ },
]);
```

로그에는 이름·이메일·주문 comment 같은 원본 PII를 남기지 않고 중앙에서 redaction합니다. `console.log`는 제품 코드에서 금지하고 모듈 prefix가 붙은 logger를 사용합니다. Node의 단일 스레드 특성상 **이벤트 루프 지연(event loop lag)**도 주기적으로 계측해 p99가 임계치를 넘으면 경보를 울립니다.

---

## 20. 컴포넌트 컴포지션

| 종류 | 위치 | 책임 |
|---|---|---|
| 디자인 프리미티브 | `shared/ui` (다중 앱이면 `packages/ui`) | 접근성, token, variant |
| 기능 컴포넌트 | `features/<feature>/ui` | 사용자 능력의 표현 |
| route view | `app/.../_views` | 여러 feature·entity UI의 화면 조립 |

Server Component를 composition root로 사용하고, 상호작용이 필요한 자식 하나만 client boundary로 만듭니다. boolean prop을 계속 추가하는 대신(`compact editable cancellable showPayment ...`) 서브 컴포넌트를 조합합니다(`<OrderCard><OrderCardHeader/><OrderPaymentSummary/></OrderCard>`). prop drilling은 ① 소비 위치로 컴포넌트 이동 → ② `children`/slot 조합 → ③ 필요한 데이터만 담은 작은 view model → ④ scoped Context 순서로 해결하고, 앱 전역 store는 마지막에 검토합니다. 재사용 컴포넌트는 controlled(`open`/`onOpenChange`)와 uncontrolled(`defaultOpen`) 중 하나를 명확히 선택합니다.

---

## 21. 테스트 전략

| 대상 | 도구 | 위치 |
|---|---|---|
| 순수 규칙 | Vitest | 구현 파일 옆 `*.test.ts` |
| 컴포넌트 행위 | Testing Library + `user-event` | component 폴더 |
| 네트워크 상태 | MSW (protocol 경계에서 intercept) | feature `testing/` |
| 시각·접근성 상태 | Storybook + a11y addon | component 폴더 |
| 핵심 사용자 여정 | Playwright | `e2e/journeys/` |

컴포넌트 테스트는 구현 detail이 아니라 `getByRole` 등 사용자가 보는 방식으로 조회합니다. E2E는 모든 조합이 아니라 로그인·주문 생성·결제처럼 수익·보안에 직결되는 여정만 검증합니다. line coverage 총량보다 **금액·권한·상태 전이 규칙, 오류·경합 분기, 접근성 상호작용**을 우선 보장합니다.

---

## 22. 성능

- 데이터 조회와 정적 표현은 서버에 두고, client boundary는 leaf로 내립니다.
- 독립적인 I/O는 `Promise.all`로 병렬화하고, 사용자가 이해할 수 있는 section 단위로 Suspense 경계를 둡니다(텍스트 노드 하나마다 만들지 않음).
- barrel import를 피하고, 무거운 에디터·차트는 상호작용 시점에 `dynamic import` 합니다.
- Node 런타임을 기본으로 하고, Edge는 지연 이점이 실측되고 Node API 의존이 없을 때만 선택적으로 사용합니다.
- 요청 종료 후 오래 걸리는 작업(리포트 생성, 대량 export)은 Next 요청 lifecycle에 묶지 않고 별도 worker·durable queue로 분리합니다. Next 앱은 접수와 상태 조회만 담당합니다.
- `next/image`, `next/font`로 레이아웃 시프트를 줄이고, 모든 화면을 무작정 hydrate하지 않습니다 — 정말 클라이언트 lifecycle이 필요한 화면에만 Query hydration을 씁니다.

---

## 23. 컨벤션이 필요한 순간: 클래스 기반 패턴 (예외)

기본은 5장의 기능 슬라이스 + 순수 함수(**합성** 지향)입니다. 그러나 리소스가 10개 이상이고 모든 리소스가 동일한 생성 이력, 감사 로그, 검증, 인가 경로를 반복해서 밟는 **CRUD 어드민/멀티테넌트 SaaS 백오피스** 영역이라면, 매번의 설계 고민 비용을 줄이기 위해 클래스 기반 컨벤션을 예외적으로 허용합니다.

| 패턴 | 목적 |
|---|---|
| `ServiceResult<T>` | 서비스 경계의 통일된 반환 값 — 11장 `Result`와 동일한 사상 |
| `BaseEntityHandler<T>` | 생성/수정/삭제 전후 훅(감사 로그, 알림)을 공통 오버라이드로 일원화 |
| `BaseRepository<T>` | 테넌트 필터가 구조적으로 강제된 제네릭 데이터 접근 |
| 상태 전이 테이블 | `Record<Status, Partial<Record<Action, Status>>>`로 허용되지 않는 전이 자체를 차단 |

```ts
async update(entity: T, patch: Partial<T>) {
  const updated = await tx.entity.updateMany({
    where: { id: entity.id, version: entity.version },      // 낙관적 락
    data: { ...patch, version: { increment: 1 } },
  });
  if (updated.count === 0) throw new ConflictError('optimistic-lock', entity.id);
}
```

**선택은 프로젝트 전체가 아니라 슬라이스 단위**로 합니다. 균일하게 반복되는 어드민 백오피스 slice는 컨벤션(class 기반)으로 묶고, 요구사항이 계속 갈라지는 AI 에이전트·실험적 상호작용 slice는 합성(함수형)으로 열어둡니다. 리소스가 2~3개뿐인 초기 프로젝트에서 이 구조를 미리 만들면 보일러플레이트만 늘어나므로, 실제로 반복이 확인된 뒤 도입합니다.

---

## 24. 모노레포 확장 기준

다음 질문 대부분이 "예"일 때만 `packages/`로 추출합니다. **"언젠가 재사용될 것 같다"는 이유만으로 추출하지 않습니다** — 성급한 공통화보다 작은 중복이 저렴한 경우가 많습니다.

- 실제로 둘 이상의 앱이 소비하는가?
- 공개 API를 작게 정의할 수 있는가?
- 변경 주기와 소유자가 독립적인가?
- 제품 도메인을 모르게 만들 수 있는가?

패키지 후보: `packages/ui`(디자인 시스템 프리미티브), `packages/design-tokens`, `packages/api-contracts`(다중 앱 공유 transport 계약), `packages/observability`, `packages/eslint-config`/`typescript-config`. `packages/common`, `packages/utils`처럼 포괄적인 이름은 금지합니다.

---

## 25. CI/CD

```text
install(frozen lockfile) → format/lint/boundaries → typecheck
  → unit·component test → production build → storybook a11y/visual
  → Playwright 핵심 여정 → bundle/의존성 검사 → Preview 배포 → Production 배포
```

- 모든 PR은 고유 Preview URL을 가지며, 실제 RSC·캐시 동작과 인증 콜백을 여기서 검증합니다. Preview에는 production secret·PII 접근을 기본으로 주지 않습니다.
- pre-commit에는 변경 파일에 한정한 빠른 검사만 두고, 전체 빌드·E2E는 CI에서 수행합니다.
- DB 마이그레이션은 앱 코드와 한 번에 배포하지 않고 backward-compatible expand/contract 방식으로 진행합니다.
- 위험한 기능은 feature flag로 점진 노출하고, release 버전을 trace/log에 남겨 즉시 rollback 가능하게 합니다.
- 의존성 업데이트는 보안 패치 자동 병합 + 일반 업데이트 주 1회 묶음 PR을 기본으로 합니다. Next.js/React 같은 핵심 라이브러리는 릴리스 노트 검토 → codemod 실행 → 타입 정리 → Playwright smoke → preview 승인 순서로 업그레이드합니다.

---

## 26. 금지 패턴

- 전역 기술 폴더: `src/components`, `src/hooks`, `src/services`, `src/utils`, `src/types`, `src/constants`
- 조회·수정·환불·추적을 한 곳에 모은 거대 서비스 클래스(`OrderService`에 메서드 10개)
- 훅 안에 비즈니스 규칙(배송 여부·마감·환불액 계산)을 넣는 패턴 — 훅은 lifecycle adapter일 뿐
- `useEffect` 체인(`setFiltered → setCount → onCountChange`)
- 서버가 한 번 읽고 렌더하면 충분한 데이터까지 전부 TanStack Query로 옮기기
- Server Component에서 자기 앱의 Route Handler를 `fetch`로 호출
- Server Action을 조회(`queryFn`) 용도로 사용
- 상위 RSC와 하위 Query가 같은 mutable 값을 동시에 소유(이중 소유권)
- 이름이 비슷하다는 이유만으로 성급하게 만드는 거대 공통 추상화
- root layout 전체를 `'use client'`로 선언
- ORM generated model을 client prop/API 응답으로 직접 노출
- 정합성 근거 없는 `staleTime: Infinity`, 무제한 `'use cache'`
- `catch { return null }`처럼 실패 의미를 지우는 예외 처리

---

## 27. 코드 리뷰 체크리스트

**경계**: 이 파일은 하나의 변경 이유를 갖는가 / feature 간 내부 import가 없는가 / server-only 코드가 client 그래프에 섞이지 않는가

**데이터**: source of truth가 하나인가 / RSC와 Query 중 소유자가 명확한가 / query key가 결과에 영향을 주는 모든 입력을 포함하는가

**함수·React**: business rule이 순수 함수인가 / 예상 실패가 안정된 코드로 표현됐는가 / Effect가 외부 시스템 동기화에만 쓰였는가 / boolean prop 대신 composition이 가능한가

**보안**: 모든 외부 입력을 Zod로 검증하는가 / action·route에서 인증하고 데이터 근처에서 인가하는가 / 최소 DTO만 직렬화하는가 / 로그에 PII가 없는가

**테스트·운영**: 순수 규칙 unit test가 있는가 / loading·error·empty·permission 상태가 검증됐는가 / 배포·rollback 시 cache·schema 문제가 없는가

---

## 28. 도입 로드맵

1. **기반**: strict TypeScript, ESLint/Prettier/dependency-cruiser, `app/features/entities/shared/server` 경계, Query provider, env parser, CI + Preview 배포
2. **대표 기능 pilot**: 조회·mutation·form·client refresh가 모두 있는 기능 하나(예: 주문 취소)를 model → use-case → action/handler → UI까지 끝까지 구현해 팀 기준으로 삼음
3. **디자인 시스템과 테스트**: Radix 기반 프리미티브, Tailwind 토큰, Storybook 상태·a11y, MSW 계약, Playwright 핵심 여정
4. **캐시와 성능**: RUM·서버 trace 확보 후 Cache Components, stale time, Suspense, dynamic import를 병목 지점에 적용
5. **조직 확장**: CODEOWNERS, ADR, 패키지 추출 기준, 필요할 때만 모노레포·별도 앱 검토
