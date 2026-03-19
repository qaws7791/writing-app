---
title: 코딩 표준
description: 이 저장소에서 일관된 품질과 경계 명확성을 유지하기 위한 코드 작성 기준입니다.
---

## 상태

- 기준 시점: 2026-03-19
- 현재 저장소는 공유 ESLint 설정과 TypeScript 설정을 사용합니다.
- 프론트엔드는 실제 화면 프로토타입 위주이고, 백엔드는 아직 기능 구현 전 단계입니다.

## 핵심 원칙

- 파일 이름은 항상 `kebab-case`를 사용합니다.
- 한 파일은 한 가지 책임만 가지도록 유지합니다.
- 페이지와 레이아웃은 조합 계층으로 두고, 복잡한 상호작용은 별도 컴포넌트로 분리합니다.
- 포매팅은 Prettier에 맡기고, 리뷰는 정확성, 이름, 경계, 결합도에 집중합니다.
- 앱 간 상대 경로 import는 금지하고, 공유 코드는 `packages/*`로 올립니다.

## TypeScript 기준

- `strict`는 유지합니다.
- `any`는 추가하지 않습니다.
- 성공/실패를 `boolean` 한 개로 뭉개지 말고, 의미 있는 union 타입으로 표현합니다.
- 상태나 메시지 분기는 discriminated union과 exhaustive check를 우선합니다.
- 도메인 식별자는 brand type 또는 별도 타입 별칭으로 의미를 드러냅니다.
- 파생 가능한 값은 상태로 저장하지 않고 렌더링 중 계산합니다.

## React / Next.js 기준

- `use client`는 브라우저 API나 상호작용이 필요한 경계 파일에만 둡니다.
- 서버에서 해결 가능한 일은 서버 컴포넌트에 남기고, 클라이언트 컴포넌트는 가능한 한 잎사귀에 가깝게 둡니다.
- 사용자 이벤트는 이벤트 핸들러에서 처리하고, Effect는 외부 시스템 동기화에만 사용합니다.
- 공통 UI는 `@workspace/ui`에서 가져오고, 제품 맥락이 섞인 조합 로직은 `apps/web`에 둡니다.

## 현재 저장소에 적용하는 추가 규칙

- `apps/web/app`의 `page.tsx`, `layout.tsx`는 가능한 한 얇게 유지합니다.
- `apps/web/components`는 사용자 흐름 중심 컴포넌트를 둡니다.
- `packages/ui`는 도메인 비의존 UI 프리미티브만 포함합니다.
- `apps/api`는 Hono 의존성을 HTTP 경계에만 두고, 도메인 로직과 use case는 분리합니다.

## 리뷰 체크리스트

- 이름만 보고 역할이 드러나는가
- 같은 데이터가 두 군데 이상 중복 저장되지 않는가
- 파일과 패키지 경계가 한 방향으로 유지되는가
- 클라이언트 전용 로직이 불필요하게 넓은 트리에 퍼지지 않는가
- 임시 우회 조건이나 dead code가 남지 않았는가

## 관련 문서

- [[README]]
- [[local-development]]
- [[frontend-architecture-guide]]
- [[backend-architecture-guide]]
- [[state-management-guide]]

## 출처

- [TypeScript `strict`](https://www.typescriptlang.org/tsconfig/strict.html)
- [TypeScript Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Next.js `use client`](https://nextjs.org/docs/app/api-reference/directives/use-client)
- [You Might Not Need an Effect | React](https://react.dev/learn/you-might-not-need-an-effect)
- [Configuration Files | ESLint](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Ignore Files | ESLint](https://eslint.org/docs/latest/use/configure/ignore)
