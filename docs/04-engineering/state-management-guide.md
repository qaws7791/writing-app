---
title: 상태 관리 가이드
description: 현재 프론트엔드 프로토타입에 맞는 상태 관리 원칙과, 이후 전역 상태를 도입할 때의 기준을 정리합니다.
---

## 상태

- 기준 시점: 2026-03-19
- 현재 전역 상태 라이브러리는 도입되어 있지 않습니다.
- 주요 상태는 `writing-page-client.tsx`, `writing-body-editor.tsx`, `theme-provider.tsx`의 로컬 상태에 머물러 있습니다.
- 글감과 글 목록 데이터는 아직 서버 상태가 아니라 파일 내부 목 데이터입니다.

## 기본 원칙

- 상태는 가능한 한 가장 가까운 컴포넌트에 둡니다.
- 한 정보에는 하나의 소유자만 둡니다.
- 렌더링 중 계산할 수 있는 값은 상태로 저장하지 않습니다.
- Effect는 외부 시스템 동기화에만 쓰고, 렌더링용 데이터 가공이나 이벤트 처리는 Effect로 옮기지 않습니다.

## 이 저장소에서의 우선순위

1. 렌더링 중 계산 가능한 값
2. 컴포넌트 로컬 상태
3. 공통 부모로 끌어올린 하위 트리 공유 상태
4. 에디터 내부 상태와 Tiptap extension 상태
5. 정말 필요한 경우에만 전역 클라이언트 상태

## 현재 코드에 대한 적용 해석

- 제목 입력 상태, 모달 open 상태, 툴바 확장 상태는 로컬 상태가 맞습니다.
- 글자 수, 단어 수, 선택 여부 같은 값은 editor snapshot에서 계산되므로 전역 스토어 대상이 아닙니다.
- 테마는 전역이지만 이미 `next-themes`가 책임지고 있으므로 별도 스토어를 추가하지 않습니다.
- 글감 목록과 글 목록은 실제 API가 생기면 "클라이언트 전역 상태"가 아니라 "서버 데이터"로 관리해야 합니다.

## 전역 스토어를 도입하는 기준

- 서로 먼 클라이언트 서브트리 두 곳 이상이 같은 상태를 읽고 써야 할 때
- URL이나 서버 데이터로 표현하기 어려운 상태가 라우트 이동 후에도 유지돼야 할 때
- 오프라인 저장 큐, 동기화 충돌 상태, 실시간 연결 상태처럼 앱 전체에 영향을 주는 클라이언트 상태가 생길 때

## 도입하지 말아야 하는 경우

- 단순 모달 open/close
- props로 한두 단계만 전달하면 되는 상태
- 서버에서 다시 조회하면 되는 데이터
- 선택 텍스트, hover, 현재 탭처럼 화면 수명이 짧은 상태

## 향후 권장 적용

- 글쓰기 초안 영속화 전에는 로컬 상태와 editor 상태만 유지합니다.
- 자동 저장과 오프라인 동기화가 생기면 그때 초안 큐만 별도 스토어로 분리합니다.
- 사용자 세션, 권한, feature flag가 생기면 서버 소스와 클라이언트 캐시의 책임을 먼저 나눈 뒤 전역 스토어 도입 여부를 결정합니다.

## 관련 문서

- [[README]]
- [[frontend-architecture-guide]]
- [[environment-variables]]
- [[03-architecture/data-flow]]

## 출처

- [Choosing the State Structure | React](https://react.dev/learn/choosing-the-state-structure)
- [Sharing State Between Components | React](https://react.dev/learn/sharing-state-between-components)
- [You Might Not Need an Effect | React](https://react.dev/learn/you-might-not-need-an-effect)
- [Server and Client Components | Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
