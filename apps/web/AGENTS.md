# Next.js Frontend Application Guide

## 개요

Next.js App Router 기반의 프론트엔드 앱입니다. **FSD(Feature-Sliced Design) 기반 4-Layer 아키텍처**를 따릅니다.

```
src/
 ┣━ app/         ← 라우팅·메타데이터·Provider (진입점)
 ┣━ views/       ← 페이지 조립 계층 (composition root)
 ┣━ features/    ← 독립적 기능 단위 (상태·UI·API·동기화 캡슐화)
 ┣━ domain/      ← 비즈니스 엔티티 (타입·스키마·순수 서비스)
 ┗━ foundation/  ← 기술 인프라 (HTTP 클라이언트·공용 UI·유틸리티)
```

의존성 방향은 단방향 하향 흐름만 허용합니다: `app → views → features → domain → foundation`

## 레이어 규칙

### `app/` — 라우팅 계층

- `page.tsx`는 view 컴포넌트를 렌더링하는 것 외에 로직을 갖지 않습니다.
- `generateMetadata`, 레이아웃, Provider 조립만 담당합니다.
- 실질적인 내용은 모두 `views/`에 위임합니다.

### `views/` — 페이지 조립 계층

- 라우트 하나에 대응하는 화면을 조립합니다.
- `features`의 컴포넌트와 `foundation/ui`의 기본 컴포넌트를 레이아웃에 배치합니다.
- 비즈니스 로직이나 상태를 직접 소유하지 않습니다.
- view 간 직접 import는 금지합니다.

### `features/` — 기능 단위 계층

- 사용자가 경험하는 하나의 기능을 캡슐화합니다.
- `index.ts`에 공개 API만 명시적으로 re-export합니다.
- feature 간 직접 import는 금지합니다. 반드시 `index.ts` Public API를 통해 참조합니다.
- 내부 디렉터리: `components/`, `hooks/`, `repositories/`, `sync/` 등 역할별 분리

### `domain/` — 비즈니스 엔티티 계층

- React, HTTP, UI에 의존하지 않는 순수 타입/로직만 포함합니다.
- `*.service.ts`는 순수 함수만 가집니다. HTTP 요청이나 React 훅을 포함하지 않습니다.
- 파일 역할: `*.types.ts` 도메인 타입, `*.schema.ts` Zod 스키마, `*.constants.ts` 상수, `*.service.ts` 순수 비즈니스 로직

### `foundation/` — 기술 인프라 계층

- 비즈니스 로직을 모르는 공용 빌딩 블록입니다.
- `foundation/api/client.ts`: `@workspace/api-client` 래퍼, 쿠키 인증·baseUrl 주입 담당합니다.

## Server / Client 컴포넌트

- `"use client"`는 상태·이벤트·브라우저 API가 필요한 최소 컴포넌트에만 선언합니다.
- 클라이언트 경계는 트리의 leaf에 가깝게 내립니다. 광범위한 client tree를 피합니다.
- 데이터 로딩·인터랙션·렌더링을 하나의 대형 파일에 혼재시키지 않습니다.
- Server Component에서 정적 I/O(폰트, 공통 설정 등)는 모듈 최상단에 호이스팅합니다.
- 서버 컴포넌트 props로 전달하는 데이터는 최소화합니다(직렬화 비용 절감).

## 성능 규칙

### 워터폴 제거 (CRITICAL)

- 독립적인 서버 데이터 요청은 `Promise.all()`로 병렬 실행합니다.
- `await`는 실제 필요한 분기에서만 호출합니다. 사용하지 않는 경로를 차단하지 않습니다.
- 스트리밍이 필요한 콘텐츠는 `<Suspense>` 경계로 감쌉니다.
- 컴포넌트 구성을 통해 서버 데이터 패칭을 병렬화합니다.

### 번들 최적화 (CRITICAL)

- 무거운 컴포넌트(에디터, 차트 등)는 `next/dynamic`으로 지연 로딩합니다.
- barrel 파일(`index.ts`) re-export를 통한 간접 import를 피하고, 무거운 의존성은 직접 경로로 import합니다.
- 분석/로깅 등 비핵심 서드파티 라이브러리는 hydration 이후로 로딩을 미룹니다.
- 호버·포커스 시점에 다음 라우트를 preload해 체감 속도를 향상합니다.

### 리렌더링 최적화 (MEDIUM)

- 파생 상태는 effect 없이 렌더 중에 계산합니다. `useEffect`로 상태를 파생하지 않습니다.
- 비긴급 업데이트(검색 결과 등)에는 `useTransition`을 사용합니다.
- 콜백에서만 읽는 상태는 구독하지 않습니다(`useRef` 활용).
- 기본값 비원시 props(배열, 객체)는 컴포넌트 외부 상수로 호이스팅합니다.
- 빈번히 변하는 일시적 값(마우스 위치 등)에는 `useRef`를 사용합니다.
- `useMemo`는 실제 비용이 있는 연산에만 적용합니다. 단순 원시 값 표현식에는 불필요합니다.
- `setState` 업데이트가 이전 값에 의존하면 함수형 업데이트(`prev => ...`)를 사용합니다.

### 렌더링 성능 (MEDIUM)

- 조건부 렌더링은 `&&` 대신 삼항 연산자를 사용합니다(`false`가 렌더링되는 버그 방지).
- 컴포넌트 외부에서 변하지 않는 JSX는 컴포넌트 바깥에 정적 상수로 추출합니다.
- 로딩 상태 관리는 `useState` 보다 `useTransition`을 선호합니다.

## 금지 패턴

- `page.tsx`에 비즈니스 로직 또는 직접 데이터 패칭 추가
- feature 간 직접 import (반드시 `index.ts` Public API 경유)
- `domain/` 레이어에서 React/HTTP 의존성 포함
- `"use client"` 광범위하게 상단 컴포넌트에 선언
- CSS Module은 `features/writing/components`에만 허용합니다. 그 외 레이어에서는 Tailwind CSS를 사용합니다.
- apps/web 내에서 임시 값(bracket 패턴) 사용 금지

## 명령어

- `bun dev` — 개발 서버 시작 (기본 포트: 3000)
- `bun build` — 프로덕션 빌드
- `bun lint` — ESLint 실행
- `bun typecheck` — TypeScript 타입 검사
- `bun test` — Vitest 단위 테스트 실행
- `bun run api:generate` — API 클라이언트 타입 갱신
