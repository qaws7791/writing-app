---
title: 프론트엔드 아키텍처 가이드
description: Feature-Sliced Design 기반 4-Layer 아키텍처의 구조, 원칙, 패턴을 정리합니다.
---

## 개요

`apps/web`은 **FSD(Feature-Sliced Design) 기반 4-Layer 아키텍처**를 따릅니다. 레이어 간 의존성은 단방향 하향 흐름만 허용하며, 각 레이어는 명확한 책임 경계를 갖습니다.

```
src/
 ┣━ app/          ← Next.js App Router 진입점 (라우팅·메타데이터·Provider)
 ┣━ views/        ← 페이지 조립 계층 (화면 단위 composition root)
 ┣━ features/     ← 독립적 기능 단위 (상태·UI·API 캡슐화)  [선택]
 ┣━ domain/       ← 비즈니스 엔티티 (타입·스키마·순수 서비스)  [선택]
 ┗━ foundation/   ← 기술 인프라 (HTTP 클라이언트·공용 UI·유틸리티·환경 설정)
```

의존성 방향: **`app → views → features → domain → foundation`**

> `features/`와 `domain/`은 제품 복잡도에 따라 도입합니다. 초기에는 `app → views → foundation` 3-Layer로 시작한 뒤, 비즈니스 로직과 기능 단위가 분리될 필요가 생기면 점진적으로 확장합니다.

---

## 1. 레이어별 책임

### `app/` — 라우팅 계층

Next.js App Router 파일 시스템 규칙을 따르는 **가장 얇은 진입점**입니다.

- `page.tsx`는 `views/`에 위임만 합니다. 자체 로직을 갖지 않습니다.
- `layout.tsx`는 전역 Provider·내비게이션·메타데이터 조립만 담당합니다.
- Route Group(`(group-name)/`)으로 인증·탭 등 관심사별 레이아웃을 분리합니다.

```
app/
 ┣━ layout.tsx             ← 전역 폰트·테마 Provider
 ┣━ page.tsx               ← 루트 리디렉션
 ┣━ (group-name)/          ← route group (인증·탭 등 관심사 분리)
 │   ┣━ layout.tsx         ← 그룹 공용 레이아웃
 │   ┣━ resource/page.tsx
 │   └━ resource/[id]/page.tsx
 ┗━ ...
```

### `views/` — 페이지 조립 계층

라우트 하나에 대응하는 화면을 조립합니다. `features/`의 컴포넌트(또는 직접 UI)와 `foundation/ui`의 기본 컴포넌트를 레이아웃에 배치합니다.

**핵심 규칙:**

- 비즈니스 로직이나 서버 상태를 직접 소유하지 않습니다.
- view 간 직접 import는 금지합니다.
- 파일 이름은 `{screen-name}-view.tsx` 형식입니다.
- 복잡한 화면은 하위 디렉토리로 분리할 수 있습니다.

### `features/` — 독립적 기능 단위 계층

사용자가 경험하는 **하나의 기능**을 캡슐화합니다. 상태, UI 컴포넌트, API 호출, 부수 효과를 하나의 경계 안에 응집시킵니다.

```
features/{feature-name}/
 ┣━ components/        ← 기능 전용 UI 컴포넌트
 ┣━ hooks/             ← 기능 상태 오케스트레이션 훅
 ┣━ repositories/      ← 서버 API 요청 함수
 ┗━ index.ts           ← Public API (re-export만)
```

**핵심 규칙:**

- `index.ts`에 공개 API만 명시적으로 re-export합니다. 외부에서 내부 파일을 직접 import하지 않습니다.
- feature 간 직접 import는 금지합니다. 공유가 필요하면 `domain/` 또는 `foundation/`으로 내립니다.

### `domain/` — 비즈니스 엔티티 계층

핵심 데이터 구조와 **순수 비즈니스 규칙**을 정의합니다. React, HTTP, UI에 의존하지 않습니다.

```
domain/{entity}/
 ┣━ model/
 │   ┣━ {entity}.types.ts       ← 도메인 타입 정의
 │   ┣━ {entity}.schema.ts      ← Zod 스키마 (검증)
 │   ┣━ {entity}.constants.ts   ← 상수 정의
 │   ┗━ {entity}.service.ts     ← 순수 비즈니스 로직 함수
 ┗━ index.ts
```

**점 표기법 파일 역할 규칙:**

| 파일             | 역할                         | HTTP/React 의존 |
| ---------------- | ---------------------------- | --------------- |
| `*.types.ts`     | 도메인 타입 정의             | 없음            |
| `*.schema.ts`    | Zod 스키마 (검증)            | 없음            |
| `*.constants.ts` | 상수 정의                    | 없음            |
| `*.service.ts`   | 순수 비즈니스 로직 함수 집합 | 없음            |

**"이 규칙은 UI가 없어도, API가 없어도 유효한가?"** — 이 질문에 예라면 `domain/`에 속합니다. 그렇지 않으면 `features/` 또는 `foundation/`에 속합니다.

### `foundation/` — 기술 인프라 계층

비즈니스 로직을 모르는 공용 빌딩 블록입니다. 다른 프로젝트에 복사해도 동작할 수 있어야 합니다.

```
foundation/
 ┣━ api/           ← HTTP 클라이언트 중앙화 래퍼·에러 처리
 ┣━ config/        ← 환경 변수 접근
 ┣━ lib/           ← 범용 유틸리티 (날짜·포맷·스토리지)
 ┗━ ui/            ← 공용 UI 컴포넌트·테마 Provider
```

---

## 2. API 통신 아키텍처

### HTTP 클라이언트 중앙화

모든 HTTP 요청은 `foundation/api/`의 **단일 진입점**을 통해 발생합니다. 기반 HTTP 라이브러리의 구체적인 사용 방식을 캡슐화하며, 다음 횡단 관심사를 한 곳에서 관리합니다.

| 관심사      | 설명                                    |
| ----------- | --------------------------------------- |
| 인증        | Authorization 헤더, 세션 쿠키 자동 주입 |
| 에러 핸들링 | 4xx/5xx 응답의 일관된 에러 변환 및 전파 |
| 설정        | 베이스 URL, 타임아웃, 공통 헤더 일원화  |

```
[컴포넌트] → [Repository 함수] → [중앙 HTTP 클라이언트] → [서버]
                                                            ↓
[컴포넌트] ← [Repository 함수] ← [중앙 HTTP 클라이언트] ←
```

기반 라이브러리를 교체해도 `foundation/api/` 내부만 수정하면 됩니다. 나머지 코드는 추상화된 인터페이스만 사용합니다.

### API 호출 함수 분리

컴포넌트는 API 호출의 세부 사항(HTTP 메서드, URL, 헤더)을 알지 않아야 합니다. API 호출 로직은 `repositories/` 디렉토리에 **도메인 언어로 명명된 함수**로 분리합니다.

| 책임        | 담당 주체       | 관심사                          |
| ----------- | --------------- | ------------------------------- |
| 데이터 요청 | Repository 함수 | 엔드포인트, 파라미터, 응답 형태 |
| 상태 관리   | Query Hook      | 서버 상태, 로딩·에러 상태       |
| 화면 표시   | UI 컴포넌트     | 레이아웃, 인터랙션, 렌더링      |

함수 명명 원칙:

- 동사 + 명사 조합으로 행위를 표현합니다 (`createOrder`, `deleteComment`)
- HTTP 메서드(GET, POST)를 이름에 직접 노출하지 않습니다
- 비즈니스 컨텍스트 기준으로 명명합니다 (`submitPayment` > `postPaymentData`)

### DTO 경계와 Mapper

API 레이어는 **Anti-Corruption Layer(ACL)** 역할을 합니다. 외부 시스템(백엔드 API)의 구조가 내부 도메인 모델을 오염시키지 않도록 변환 경계를 만듭니다.

| 구분      | DTO                   | 도메인 모델             |
| --------- | --------------------- | ----------------------- |
| 존재 목적 | 외부와의 데이터 교환  | 내부 비즈니스 로직 표현 |
| 변경 기준 | 서버 API 스펙 변경 시 | 내부 요구사항 변경 시   |
| 위치      | Repository 레이어     | `domain/` 레이어        |
| 네이밍    | 백엔드 관습 따름      | 프론트엔드 관습 따름    |

```
[Component] → [Domain Model] ← [Mapper] ← [DTO] ← [External API]
```

Mapper는 Repository 함수 내부에 위치하며, 날짜 파싱·`snake_case` → `camelCase` 변환·중첩 구조 평탄화 같은 정제 작업을 담당합니다. 서버 응답 구조가 변경되어도 Mapper만 수정하면 컴포넌트 코드는 영향받지 않습니다.

> **참고:** 서버 스펙 기반 API 클라이언트 패키지(예: OpenAPI codegen)를 사용하는 경우 DTO 타입이 자동 생성됩니다. 이 경우에도 도메인 모델과의 분리 원칙은 동일하게 적용합니다.

### 서버 상태 관리 (TanStack Query)

서버 상태(원격 데이터)와 클라이언트 상태(UI 상태)는 근본적으로 다릅니다. 서버 상태는 TanStack Query로 관리합니다.

| 상태 유형  | 특징                                  | 관리 도구              |
| ---------- | ------------------------------------- | ---------------------- |
| 클라이언트 | 브라우저 안에서만 존재, 동기적        | `useState`, Zustand 등 |
| 서버       | 원격에 존재, 비동기, 캐싱·무효화 필요 | TanStack Query         |

TanStack Query가 아키텍처에서 차지하는 위치:

| 레이어                       | 역할                                                   |
| ---------------------------- | ------------------------------------------------------ |
| Repository 함수 (인프라)     | 실제 API 호출                                          |
| Query/Mutation 훅 (features) | Repository 함수를 TanStack Query로 감싸 캐싱·상태 제공 |
| 컴포넌트 (views)             | 훅을 호출해 UI 렌더링에만 집중                         |

쿼리 키 기반 캐싱으로 동일 데이터에 대한 중복 요청을 방지하고, `invalidateQueries()`로 Mutation 이후 관련 데이터를 자동 갱신합니다.

---

## 3. 도메인 레이어 설계

### 왜 도메인 레이어가 필요한가

비즈니스 규칙이 컴포넌트·커스텀 훅·서비스 함수에 흩어지면, 동일한 규칙이 여러 곳에서 중복 구현되고 정책 변경 시 파급 범위를 예측하기 어렵습니다. 도메인 레이어는 **"이 코드는 비즈니스 규칙이다"** 라는 명시적 선언을 통해 로직에 제자리를 만들어줍니다.

### 도메인 로직의 판별 기준

**"이 규칙은 UI가 없어도, API가 없어도 여전히 유효한가?"**

- 예 → 도메인 레이어에 속합니다 (상태 전이 규칙, 유효성 검증, 금액 계산 등)
- 아니오 → `features/` 또는 `foundation/`에 속합니다

### 도메인 레이어의 특성

- React, HTTP, 브라우저 API에 의존하지 않는 순수 TypeScript 코드입니다.
- 입력과 출력만 있는 순수 함수이므로 네트워크·렌더링 없이 단위 테스트할 수 있습니다.
- 도메인 언어(유비쿼터스 언어)가 코드에 직접 반영됩니다.
- 유틸리티와 혼동하지 않습니다. 범용 도구(날짜 포맷, 문자열 처리)는 `foundation/lib/`에 둡니다.

---

## 4. 애플리케이션 레이어 (features/hooks)

복잡한 비즈니스 흐름은 `features/hooks/`의 오케스트레이션 훅이 조율합니다. 이 훅은 클린 아키텍처의 **유즈케이스(Use Case)** 에 해당합니다.

### 오케스트레이션 훅의 역할

1. 도메인 규칙을 검증합니다
2. Repository 함수(또는 Query/Mutation 훅)를 호출합니다
3. 결과에 따라 UI 상태를 갱신합니다

```
[View 컴포넌트] → [오케스트레이션 훅] → [도메인 서비스 (검증)]
                                      → [Repository / Query 훅 (API)]
                                      → [UI 상태 갱신]
```

이 구조에서 컴포넌트는 "어떻게 처리하는가"를 알지 못하고, 훅은 "어떻게 보여주는가"를 알지 못합니다.

---

## 5. 레이어 간 의존성 규칙

```
┌─────────────────────────────────────┐
│     app/ (라우팅·Provider)           │
├─────────────────────────────────────┤
│     views/ (페이지 조립)             │  ← features + foundation 조합
├─────────────────────────────────────┤
│     features/ (기능 캡슐화)          │  ← domain + foundation 사용
├─────────────────────────────────────┤
│     domain/ (순수 비즈니스 규칙)      │  ← foundation만 사용 가능
├─────────────────────────────────────┤
│     foundation/ (기술 인프라)         │  ← 외부 라이브러리만 의존
└─────────────────────────────────────┘
```

| 규칙                       | 설명                                                                   |
| -------------------------- | ---------------------------------------------------------------------- |
| 단방향 하향 흐름           | 상위 레이어만 하위 레이어를 참조합니다                                 |
| feature 간 격리            | feature 끼리 직접 import 금지. 공유는 `domain/` 또는 `foundation/`으로 |
| view 간 격리               | view 끼리 직접 import 금지                                             |
| domain은 순수              | React, HTTP, 브라우저 API 의존 없음                                    |
| foundation은 비즈니스 무관 | 비즈니스 도메인 용어를 포함하지 않음                                   |

---

## 6. 설계 원칙

### Next.js 통합

- `"use client"`는 상태·이벤트·브라우저 API가 필요한 **최소 컴포넌트에만** 선언합니다.
- `page.tsx`는 view 컴포넌트 렌더링 외에 별도 로직을 갖지 않습니다.
- `generateMetadata`는 `page.tsx`(또는 `layout.tsx`)에서만 선언합니다.

### 관심사 분리

| 계층                  | 알아야 하는 것              | 몰라야 하는 것              |
| --------------------- | --------------------------- | --------------------------- |
| Component (views)     | 도메인 모델, 훅 인터페이스  | API 엔드포인트, HTTP 메서드 |
| Hook (features)       | 도메인 규칙, Repository API | 컴포넌트 레이아웃           |
| Repository (features) | HTTP 클라이언트, DTO 형태   | React 상태, UI              |
| Domain                | 비즈니스 규칙만             | 위의 모든 것                |
| Foundation            | 기술 인프라만               | 비즈니스 규칙               |

### 점진적 확장 전략

프로젝트 초기에는 `app → views → foundation` 3-Layer로 시작합니다. 다음 신호가 나타날 때 레이어를 추가합니다.

| 신호                                              | 추가할 레이어           |
| ------------------------------------------------- | ----------------------- |
| 동일 비즈니스 규칙이 여러 view에서 중복 구현됨    | `domain/`               |
| 화면이 복잡해져 상태·API·UI를 한 경계로 묶고 싶음 | `features/`             |
| API 호출이 view에 직접 흩어져 있어 변경 비용 증가 | `features/repositories` |

---

## 참고

- [Route Groups | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Server and Client Components | Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Functions and directives | Tailwind CSS](https://tailwindcss.com/docs/functions-and-directives)
