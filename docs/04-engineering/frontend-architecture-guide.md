---
title: 프론트엔드 아키텍처 가이드
description: 현재 Next.js 프로토타입의 구조를 설명하고, 실제 제품 구현으로 확장할 때 지켜야 할 프론트엔드 원칙을 정리합니다.
---

## 상태

- 기준 시점: 2026-03-24
- 현재 프론트엔드는 `apps/web` 단일 앱으로 운영됩니다.
- 구현 범위는 홈, 글감 목록/상세, 글 목록, 새 글 작성, 글 상세 화면 프로토타입입니다.
- API 계층은 `openapi-typescript`와 `openapi-fetch` 기반으로 타입 세이프하게 구현되어 있습니다.
- 서버 OpenAPI 스펙에서 자동 생성된 타입을 사용합니다.

## 현재 구조

- `app/layout.tsx`: 전역 폰트, `@workspace/ui/globals.css`, 테마 공급자 연결
- `app/(app)/*`: 글로벌 내비게이션을 공유하는 사용자 화면 route group
- `components/*`: 제품 맥락이 있는 화면 컴포넌트
- `components/ai/*`: 에디터 내부 AI 보조 UI와 Tiptap 확장
- `foundation/api/*`: OpenAPI 스펙 기반 타입 세이프 HTTP 클라이언트
- `lib/*`: 프레젠테이션 보조 로직
- `packages/ui`: 앱 전용 문구가 없는 공용 UI 프리미티브

## 구성 원칙

- 페이지와 레이아웃은 데이터 조합과 하위 컴포넌트 배치에 집중합니다.
- 편집기, 테마, 공유, 클립보드, 브라우저 API는 클라이언트 컴포넌트로 분리합니다.
- `(app)` 같은 route group은 URL을 바꾸지 않고 구조만 정리하는 용도로 사용합니다.
- 공통 스타일 토큰과 Tailwind 커스텀 유틸리티는 `packages/ui/src/styles/globals.css`에 둡니다.
- 앱 고유의 복잡한 레이아웃만 CSS Module을 허용합니다.

## 현재 코드에서 확인된 패턴

- `writing-body-editor.tsx`는 Tiptap editor 인스턴스와 AI 상호작용을 한곳에 모은 핵심 클라이언트 컴포넌트입니다.
- `writing-page-client.tsx`는 제목, 공유, 삭제, 내보내기, 버전 기록 모달을 조합하는 화면 조립 계층입니다.
- `theme-provider.tsx`는 `next-themes`와 키보드 단축키를 통해 전역 테마 상태를 제어합니다.
- 홈, 글감, 글 목록 페이지는 아직 서버 데이터가 아니라 파일 내부 상수에 의존합니다.

## 앞으로의 확장 규칙

- 실제 데이터가 도입되면 서버 컴포넌트에서 조회하고, 클라이언트 컴포넌트에는 직렬화 가능한 데이터만 넘깁니다.
- 브라우저 상호작용이 없는 화면은 가능하면 서버 컴포넌트로 유지합니다.
- 글 편집 도메인 로직은 `components`와 `lib`에 흩뿌리지 말고, `write` 단위로 응집시킵니다.
- API 호출은 `foundation/api` 계층을 통해서만 수행합니다.

## API 계층

- `foundation/api/schema.d.ts`: `openapi-typescript`로 서버 OpenAPI 스펙에서 자동 생성한 타입입니다.
- `foundation/api/client.ts`: `openapi-fetch` 기반 HTTP 클라이언트입니다. 쿠키 인증을 포함합니다.
- 타입 생성 스크립트: `bun run api:generate`로 실행합니다.
- 서버 API가 변경되면 `bun run api:generate`를 다시 실행하여 타입을 갱신합니다.

## 권장 다음 단계

1. 에디터 관련 화면 로직을 `write` 하위의 feature 단위로 더 명확히 묶습니다.
2. AI 보조 기능은 mock 함수 대신 서버 API와 비동기 작업 상태 모델로 교체합니다.
3. 저장, 버전 기록, 공유 이력을 실제 영속 계층과 연결합니다.

## 관련 문서

- [[README]]
- [[state-management-guide]]
- [[environment-variables]]
- [[03-architecture/tech-stack]]
- [[03-architecture/data-flow]]

## 출처

- [Route Groups | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Server and Client Components | Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js `use client`](https://nextjs.org/docs/app/api-reference/directives/use-client)
- [React | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/install/react)
- [CharacterCount extension | Tiptap Editor Docs](https://tiptap.dev/docs/editor/extensions/functionality/character-count)
- [Placeholder extension | Tiptap Editor Docs](https://tiptap.dev/docs/editor/extensions/functionality/placeholder)
- [Functions and directives | Tailwind CSS](https://tailwindcss.com/docs/functions-and-directives)
- [Dark mode | Tailwind CSS](https://tailwindcss.com/docs/dark-mode)
