---
title: 코딩 표준
description: 이 저장소에서 일관된 품질과 경계 명확성을 유지하기 위한 코드 작성 기준입니다.
---

## 상태

- 기준 시점: 2026-03-31
- 현재 저장소는 oxlint + ESLint 병행 린팅, oxfmt 포매팅을 사용합니다.
- ESLint는 turbo/no-undeclared-env-vars 규칙을 위해 유지하며, eslint-plugin-oxlint로 중복 규칙을 비활성화합니다.
- 프론트엔드는 실제 화면 프로토타입 위주이고, 백엔드는 아직 기능 구현 전 단계입니다.

## 핵심 원칙

- 파일 이름은 항상 `kebab-case`를 사용합니다.
- 한 파일은 한 가지 책임만 가지도록 유지합니다.
- 포매팅은 oxfmt에 맡기고, 리뷰는 정확성, 이름, 경계, 결합도에 집중합니다.
- 앱 간 상대 경로 import는 금지하고, 공유 코드는 `packages/*`로 올립니다.
- 각 앱과 패키지는 자기 역할만 수행하고, 연결은 인터페이스와 DI로 해결합니다.

## TypeScript 기준

- `strict`는 유지합니다.
- `any`는 추가하지 않습니다.
- 성공/실패를 `boolean` 한 개로 뭉개지 말고, 의미 있는 union 타입으로 표현합니다.
- 상태나 메시지 분기는 discriminated union과 exhaustive check를 우선합니다.
- 도메인 식별자는 brand type 또는 별도 타입 별칭으로 의미를 드러냅니다.
- 파생 가능한 값은 상태로 저장하지 않고 계산합니다.

## 백엔드 기준

- 백엔드 코드는 클래스보다 immutable plain object와 순수 함수를 우선합니다.
- 객체와 배열은 직접 변이하지 않고 새 값을 반환합니다.
- 예외는 예외 상황에 한정하고, 기본 실패 흐름은 `Result` 값으로 표현합니다.
- 데이터 가공과 컬렉션 조합은 선언적으로 작성하고 필요 시 `pipe()`와 `remeda`를 사용합니다.
- Hono, DB, Storage, AI SDK 같은 프레임워크 의존성은 경계 계층에만 둡니다.
- `apps/api`는 HTTP 조립과 매핑만 담당합니다.
- `core`는 포트와 계약 스키마, 비즈니스 규칙만 담당합니다.
- 인프라 구현은 `packages/db`, `packages/storage`, `packages/ai`로 분리합니다.
- 패키지 간 책임 침범과 구현체 직접 참조를 허용하지 않습니다.

## React / Next.js 기준

- `use client`는 브라우저 API나 상호작용이 필요한 경계 파일에만 둡니다.
- 서버에서 해결 가능한 일은 서버 컴포넌트에 남기고, 클라이언트 컴포넌트는 가능한 한 잎사귀에 가깝게 둡니다.
- 사용자 이벤트는 이벤트 핸들러에서 처리하고, Effect는 외부 시스템 동기화에만 사용합니다.
- 공통 UI는 `@workspace/ui`에서 가져오고, 제품 맥락이 섞인 조합 로직은 `apps/web`에 둡니다.

## 컴포넌트 파일 네이밍 규칙

파일 이름은 `{도메인}-{역할}` 패턴을 따릅니다.

- **도메인**: 컴포넌트가 속한 기능 영역 (예: `writing`, `prompt`, `auth`)
- **역할**: 컴포넌트가 수행하는 구체적인 역할 (예: `text-editor`, `editor-body`, `editor-header`)

```
features/writing/components/
├── writing-text-editor.tsx       # writing 도메인 / text-editor 역할 (Tiptap 에디터 인스턴스)
├── writing-editor-body.tsx       # writing 도메인 / editor-body 역할 (에디터 페이지 본문 레이아웃)
├── writing-editor-header.tsx     # writing 도메인 / editor-header 역할 (에디터 페이지 헤더)
└── writing-editor-dialogs.tsx    # writing 도메인 / editor-dialogs 역할 (에디터 다이얼로그 모음)
```

**금지 패턴:** 수식어와 핵심 명사의 순서를 섞어 쓰지 않습니다.

```
# 혼재 (금지)
writing-body-editor.tsx   # [writing]-[body]-[editor]
writing-editor-body.tsx   # [writing]-[editor]-[body]

# 통일 (권장)
writing-text-editor.tsx   # [writing]-[text-editor]
writing-editor-body.tsx   # [writing]-[editor-body]
```

## 현재 저장소에 적용하는 추가 규칙

- `apps/web/app`의 `page.tsx`, `layout.tsx`는 가능한 한 얇게 유지합니다.
- `apps/web/components`는 사용자 흐름 중심 컴포넌트를 둡니다.
- `packages/ui`는 도메인 비의존 UI 프리미티브만 포함합니다.
- `apps/api`는 Hono 의존성을 HTTP 경계에만 두고, 조립 계층으로 유지합니다.
- 도입 예정인 `packages/core`는 모듈러 모놀리스 비즈니스 코어로 사용합니다.
- 도입 예정인 `packages/db`, `packages/storage`, `packages/ai`는 각 인프라 책임만 수행합니다.

## 리뷰 체크리스트

- 이름만 보고 역할이 드러나는가
- 같은 데이터가 두 군데 이상 중복 저장되지 않는가
- 파일과 패키지 경계가 한 방향으로 유지되는가
- 구현체 대신 포트와 인터페이스에 의존하는가
- 직접 변이, dead code, 우회 조건이 남지 않았는가

## 관련 문서

- [[README]]
- [[local-development]]
- [[frontend-architecture-guide]]
- [[backend-architecture-guide]]
- [[backend-package-boundaries]]
- [[backend-core-guide]]
- [[state-management-guide]]

## 출처

- [TypeScript `strict`](https://www.typescriptlang.org/tsconfig/strict.html)
- [TypeScript Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [You Might Not Need an Effect | React](https://react.dev/learn/you-might-not-need-an-effect)
- [Configuration Files | ESLint](https://eslint.org/docs/latest/use/configure/configuration-files)
