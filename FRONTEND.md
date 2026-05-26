
## Architecture

Pragmatic FSD Architecture for Next.js 16 App Router

### 목표

- Next.js 16 App Router의 route segment 구조와 도메인 조립 구조를 명확히 분리
- 비즈니스 규칙은 도메인 단위로 격리하고, React, Next.js, API 세부 구현으로부터 보호
- 서버 데이터 조회는 기본적으로 Server Component에서 수행합니다
- 클라이언트 상호작용, optimistic update, polling, infinite query, 복잡한 캐시 동기화가 필요한 경우에만 TanStack Query를 사용합니다
- mutation은 TanStack Query의 useMutation을 사용합니다
- Next.js 16의 캐싱은 명시적으로 설계합니다. 캐시되지 않는 요청, 캐시되는 함수, revalidation tag를 문서화합니다
- import 경계를 자동 검사할 수 있는 규칙을 둡니다

### 핵심 원칙

- **RSC-first**: `page.tsx`, `layout.tsx`는 기본적으로 Server Component입니다. Client Component는 상태, 이벤트 핸들러, 브라우저 API, 클라이언트 훅이 필요한 최소 범위로 가장 낮은 곳으로 이동합니다
- **도메인 중심 설계**: 비즈니스 규칙의 중심은 `domains/<domain>/model`입니다.
- **서버 경계 명확화**: 서버에서만 실행되어야 하는 코드는 `.server.ts` 또는 `'use server'` 파일로 분리합니다.
- **경계 기반 설계**: `api`는 외부(서버)와 애플리케이션 내부의 경계로서, DTO 기반 변환을 통해 안전하게 모델을 보호합니다.
- **애플리케이션 레이어 분리**: `application`은 react state, store, form 등 애플리케이션 내에 생명주기를 가지는 것들을 담당합니다.
- **Foundation 분리**: `foundation`은 도메인을 모르는 순수 UI, 유틸, 인프라 보조 코드만 포함합니다.
- **TanStack Query 표준화**: 데이터 조회는 항상 `queryOptions` 기반 팩토리(`domains/<domain>/data/<name>-query.ts`)를 통해서만 정의/사용합니다.
- **명시적 의존 방향**: 레이어 간 import 방향은 문서와 ESLint로 강제합니다.
- **케밥 케이스 강제**: 모든 디렉토리와 파일명은 케밥 케이스를 사용합니다.
- **점 표기법 기반 역할 명시**: 파일 역할은 기본적으로 `name.role.ext` 형식으로 표현합니다. 단, hook 파일은 `use-name.ts` 형식으로 합니다.

### 레이어 개요

Next.js 16 기준 Pragmatic FSD는 다음 레이어로 구성됩니다.

```txt
src/
  app/           # Next.js App Router, route segment, composition root
  foundation/    # 도메인을 모르는 순수 UI/유틸/인프라 보조
  domains/       # 도메인별 모델/API/application/ui/server-state 계약
```

| Layer        | 책임                                                         | 알아도 되는 대상                          |
| ------------ | ------------------------------------------------------------ | ----------------------------------------- |
| `app`        | App Router route tree, layout/page/loading/error, providers, route-local composition | 여러 `domains`, `workflows`, `foundation` |
| `foundation` | 도메인을 모르는 순수 UI, 유틸, 인프라 보조 코드              | 외부 라이브러리만                         |
| `domains`    | 도메인별 모델, API 경계, server functions, UI 조각, orchestration | 같은 도메인 내부, `foundation`            |

### Domains 설계

각 도메인은 주제별로 분리된 “작은 아키텍처 단위”이며, 내부는 다음 4개 하위 레이어로 구성됩니다.

1. `model` : 순수 타입스크립트 도메인 코어
2. `api` : 외부와의 경계(openapi-fetch, DTO, mapper)
3. `application` : React 기반 orchestration(query/store/form)
4. `ui` : 렌더링(.tsx)만 담당

### Domains 구조

```txt
domains/
  <domain>/
    index.ts
    README.md
    <domain>.queries.ts

    model/
      <domain>.types.ts
      <domain>.model.ts
      <domain>.constants.ts
      <domain>.policy.ts
      <domain>.errors.ts
      <domain>.events.ts

    api/
      <domain>.endpoints.ts
      <domain>.dto.ts
      <domain>.mapper.ts
      <domain>.api.ts

    application/ # state, hooks, form, context 등

    ui/
      <domain>-list.view.tsx
      <domain>-detail.view.tsx
      <domain>-form.form.tsx
      <domain>-card.card.tsx
      <domain>-item.item.tsx
      <domain>-filters.panel.tsx
      <domain>-dialog.dialog.tsx
      <domain>-skeleton.skeleton.tsx
      index.ts
```
