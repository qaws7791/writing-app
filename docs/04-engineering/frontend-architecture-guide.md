---
title: 프론트엔드 아키텍처 가이드
description: Feature-Sliced Design 기반 4-Layer 아키텍처로 구성된 apps/web의 구조와 원칙을 정리합니다.
---

## 상태

- 기준 시점: 2026-03-25
- 현재 프론트엔드는 `apps/web` 단일 앱으로 운영됩니다.
- **FSD(Feature-Sliced Design) 기반 4-Layer 아키텍처**(`views` → `features` → `domain` → `foundation`)가 적용되어 있습니다.
- 구현 범위: 홈, 글감 목록/상세, 글 목록, 글쓰기(에디터), 인증(로그인·회원가입·비밀번호 재설정) 화면
- API 클라이언트는 `packages/api-client`를 통해 타입 세이프하게 사용합니다.
- 글쓰기 글은 로컬 IndexedDB + 서버 동기화 엔진(XState 상태 머신 기반)으로 관리합니다.

## 레이어 구조

```
src/
 ┣━ app/          ← Next.js App Router 진입점 (라우팅·메타데이터·Provider)
 ┣━ views/        ← 페이지 조립 계층 (화면 단위 composition root)
 ┣━ features/     ← 독립적 기능 단위 (상태·UI·API·동기화 캡슐화)
 ┣━ domain/       ← 비즈니스 엔티티 (타입·스키마·순수 서비스)
 ┗━ foundation/   ← 기술 인프라 (HTTP 클라이언트·공용 UI·유틸리티·환경 설정)
```

의존성은 단방향 하향 흐름만 허용합니다: `app → views → features → domain → foundation`

## 레이어별 상세

### `app/` — Next.js 라우팅 계층

Next.js App Router 파일 시스템 규칙을 따르는 가장 얇은 진입점입니다.

```
app/
 ┣━ layout.tsx                          ← 전역 폰트·테마 Provider
 ┣━ page.tsx                            ← 루트 리디렉션
 ┣━ (protected)/                        ← 인증 필요 route group
 │   ┣━ layout.tsx                      ← 글로벌 내비게이션 포함 레이아웃
 │   ┣━ home/page.tsx
 │   ┣━ prompts/page.tsx
 │   ┣━ prompts/[id]/page.tsx
 │   ┣━ write/page.tsx                  ← 새 글쓰기
 │   └━ write/[id]/page.tsx             ← 기존 글 편집
 ┣━ sign-in/, sign-up/
 ┣━ forgot-password/, reset-password/
```

- `page.tsx`는 최대한 얇게 유지합니다. 실질적인 내용은 `views/`에 위임합니다.
- `generateMetadata`, 레이아웃, Provider 조립만 담당합니다.

### `views/` — 페이지 조립 계층

라우트 하나에 대응하는 화면을 조립합니다. `features`의 컴포넌트와 `foundation/ui`의 기본 컴포넌트를 레이아웃에 배치합니다. 비즈니스 로직이나 상태를 직접 소유하지 않습니다.

```
views/
 ┣━ home-view.tsx
 ┣━ prompts-view.tsx
 ┣━ prompt-detail-view.tsx
 ┣━ writing-list-view.tsx
 ┣━ writing-page-view.tsx              ← "use client" — 글쓰기 화면 조립
 ┣━ sign-in-view.tsx
 ┣━ sign-up-view.tsx
 ┣━ forgot-password-view.tsx
 ┗━ reset-password-view.tsx
```

- `writing-page-view.tsx`는 `features/writing`의 훅과 컴포넌트를 조립하는 화면 조립 루트입니다.
- view 간 직접 import는 금지합니다.

### `features/` — 독립적 기능 단위 계층

사용자가 경험하는 하나의 기능을 캡슐화합니다. `index.ts`에 공개 API만 명시적으로 re-export합니다.

```
features/
 ┣━ writing/
 │   ┣━ components/
 │   │   ┣━ writing-body-editor.tsx     ← Tiptap 에디터 인스턴스 + AI 상호작용
 │   │   ┣━ writing-page-header.tsx     ← 제목 입력·툴바·공유·삭제
 │   │   ┣━ writing-page-body.tsx
 │   │   ┣━ writing-page-dialogs.tsx    ← 삭제·내보내기·버전 기록 모달 조합
 │   │   ┣━ writing-export-modal.tsx
 │   │   ┣━ writing-version-history-modal.tsx
 │   │   └━ sync-status-indicator.tsx
 │   ┣━ hooks/
 │   │   ┣━ use-writing-page.ts         ← 글쓰기 화면 전체 상태 오케스트레이션
 │   │   ┣━ use-sync-engine.ts
 │   │   ┣━ use-document-hydration.ts
 │   │   └━ use-editor-leave-guard.ts
 │   ┣━ repositories/
 │   │   └━ app-repository.ts           ← 서버 API 요청 (글 CRUD·동기화)
 │   ┣━ sync/                           ← 오프라인·멀티탭 동기화 엔진
 │   │   ┣━ sync-machine.ts            ← XState 상태 머신
 │   │   ┣━ sync-engine.ts
 │   │   ┣━ sync-transport.ts          ← HTTP 동기화 전송
 │   │   ┣━ local-db.ts               ← IndexedDB 래퍼
 │   │   ┣━ change-capture.ts
 │   │   ┣━ conflict-resolver.ts
 │   │   ┣━ multi-tab-coordinator.ts
 │   │   └━ service-worker-bridge.ts
 │   └━ index.ts
 ┣━ ai-assistant/
 │   ┣━ components/
 │   │   ┣━ ai-features.tsx
 │   │   ┣━ ai-review-card.tsx
 │   │   ┣━ ai-review-extension.ts     ← Tiptap 확장 (AI 리뷰)
 │   │   └━ ai-suggestion-panel.tsx
 │   ┣━ repositories/
 │   │   └━ mock-ai.ts                 ← AI API mock (추후 실제 API 교체 예정)
 │   └━ index.ts
 ┣━ auth/
 │   ┣━ components/
 │   │   └━ auth-sign-out-button.tsx
 │   ┣━ repositories/
 │   │   ┣━ auth-client.ts             ← 클라이언트 사이드 인증 요청
 │   │   └━ server-auth.ts             ← 서버 사이드 인증 유틸리티
 │   └━ index.ts
 └━ navigation/
     ┣━ components/
     │   └━ global-navigation.tsx
     └━ index.ts
```

### `domain/` — 비즈니스 엔티티 계층

핵심 데이터 구조와 순수 비즈니스 규칙을 정의합니다. React, HTTP, UI에 의존하지 않습니다.

```
domain/
 ┣━ auth/
 │   ┣━ model/
 │   │   └━ auth.types.ts
 │   └━ index.ts
 ┣━ writing/
 │   ┣━ model/
 │   │   ┣━ writing.types.ts             ← WritingSummary·WritingDetail·HomeSnapshot
 │   │   ┣━ writing.service.ts           ← 순수 변환 함수 (content → HTML/text 등)
 │   │   └━ writing-sync.service.ts      ← 동기화 관련 순수 로직 (스냅샷 생성·직렬화)
 │   └━ index.ts
 └━ prompt/
     ┣━ model/
     │   ┣━ prompt.types.ts
     │   └━ prompt.constants.ts
     ┣━ ui/
     │   └━ level-dots.tsx             ← 글감 난이도 표시 UI
     └━ index.ts
```

점 표기법 파일 역할 규칙:

| 파일             | 역할                         |
| ---------------- | ---------------------------- |
| `*.types.ts`     | 도메인 타입 정의             |
| `*.schema.ts`    | Zod 스키마 (검증)            |
| `*.constants.ts` | 상수 정의                    |
| `*.service.ts`   | 순수 비즈니스 로직 함수 집합 |

### `foundation/` — 기술 인프라 계층

비즈니스 로직을 모르는 공용 빌딩 블록입니다. 이론상 다른 프로젝트에 복사해도 동작합니다.

```
foundation/
 ┣━ api/
 │   ┣━ client.ts                      ← @workspace/api-client 래퍼·baseUrl 주입
 │   ┣━ error.ts
 │   └━ index.ts
 ┣━ config/
 │   └━ env.ts                         ← 환경 변수 접근 (NEXT_PUBLIC_*)
 ┣━ lib/
 │   ┣━ api-base-url.ts                ← 브라우저/서버 baseUrl 해석
 │   ┣━ format.ts                      ← 날짜·숫자 포맷 유틸
 │   └━ storage.ts                     ← localStorage 래퍼
 └━ ui/
     ┣━ theme-provider.tsx             ← next-themes 래퍼·키보드 단축키
     ┣━ auth-page-shell.tsx            ← 인증 페이지 공통 레이아웃
     └━ index.ts
```

## API 계층

- `@workspace/api-client`: 서버 OpenAPI 스펙 기반 타입 세이프 HTTP 클라이언트 패키지 (`packages/api-client`)
- `foundation/api/client.ts`: `@workspace/api-client` 래퍼. 쿠키 인증과 baseUrl 주입을 담당합니다.
- 타입 갱신 명령: `bun run api:generate` (monorepo 루트에서 실행, `@workspace/api-client` 스크립트 위임)

## 코드 패턴

- `writing-body-editor.tsx`는 Tiptap 에디터 인스턴스와 AI 확장을 하나로 묶은 핵심 클라이언트 컴포넌트입니다.
- `use-writing-page.ts`는 글쓰기 화면 전체 상태(에디터 글, 동기화 상태, 모달 등)를 오케스트레이션하는 커스텀 훅입니다.
- `features/writing/sync/sync-machine.ts`는 XState 상태 머신으로 동기화 흐름(`CHANGE_DETECTED → SYNC_SUCCESS/CONFLICT`)을 선언합니다.
- `features/writing/repositories/app-repository.ts`는 서버 API 글 CRUD를 담당합니다.
- `theme-provider.tsx`는 `next-themes`와 키보드 단축키를 통해 전역 테마를 제어합니다.

## 원칙

- `"use client"`는 상태·이벤트·브라우저 API가 필요한 최소 컴포넌트에만 선언합니다.
- `page.tsx`는 view 컴포넌트를 렌더링하는 것 외에 별도 로직을 갖지 않습니다.
- feature 간 직접 import는 금지합니다. 반드시 `index.ts` Public API를 통해 참조합니다.
- `domain/*/model/`의 service는 순수 함수만 가집니다. HTTP 요청이나 React 훅을 포함하지 않습니다.
- CSS Module은 복잡한 레이아웃이 필요한 `features/writing/components`에만 허용합니다.

## 관련 문서

- [[README]]
- [[state-management-guide]]
- [[environment-variables]]
- [[03-architecture/tech-stack]]
- [[03-architecture/data-flow]]
- [[editor-sync/]]

## 출처

- [Route Groups | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Server and Client Components | Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [XState | Getting Started](https://stately.ai/docs/quick-start)
- [React | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Functions and directives | Tailwind CSS](https://tailwindcss.com/docs/functions-and-directives)
