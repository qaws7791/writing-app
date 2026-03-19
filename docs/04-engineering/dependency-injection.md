---
title: 의존성 주입 가이드
description: 백엔드 기능 구현 시 의존성을 어디서 조립하고 어디까지 전달할지에 대한 실용적인 기준입니다.
---

## 상태

- 기준 시점: 2026-03-19
- 현재 `apps/api`에는 실제 의존성 주입 구조가 아직 없습니다.
- 백엔드가 미구현 상태이므로, 이 문서는 초기 설계 기준을 제공합니다.

## 기본 원칙

- 의존성은 route handler 안에서 직접 생성하지 않고 composition root에서 조립합니다.
- 도메인과 애플리케이션 계층은 인터페이스 또는 port에 의존합니다.
- Hono `Context`는 요청 메타데이터 전달용이지, 비즈니스 의존성 컨테이너가 아닙니다.
- 현재 단계에서는 DI 컨테이너보다 수동 주입을 우선합니다.

## 권장 조립 지점

- `src/app.ts`: 공용 인프라와 feature 라우터를 조립하는 최상위 지점
- `features/*/presentation`: feature 라우터 팩토리
- `features/*/application`: use case에 필요한 port 정의
- `features/*/infrastructure`: port 구현체 생성

## 권장 패턴

```ts
type WritingSummary = {
  id: string
  title: string
}

type WritingRoutesDeps = {
  listWritings: () => Promise<WritingSummary[]>
}

export function createWritingRoutes(deps: WritingRoutesDeps) {
  const app = new Hono()
  app.get("/", async (c) => c.json({ items: await deps.listWritings() }))
  return app
}
```

이 패턴의 핵심은 "라우터는 필요한 기능만 인자로 받고, 구현체 선택은 상위에서 끝낸다"는 점입니다.

## 요청 스코프 값 처리

- `requestId`, 인증 주체, 권한 스냅샷처럼 요청마다 달라지는 값만 `c.set()` / `c.get()`으로 전달합니다.
- 저장소, AI 클라이언트, 파일 저장 어댑터 같은 장수명 의존성은 앱 시작 시 생성해 주입합니다.
- 애플리케이션 계층 함수 시그니처에는 가능하면 Hono `Context`를 직접 노출하지 않습니다.

## 도입하지 않는 것

- 전역 mutable singleton
- feature 내부에서 숨겨진 `new` 체인
- 모든 기능을 한 번에 넣는 대형 DI 컨테이너
- 테스트 때문에만 존재하는 과도한 추상화

## 관련 문서

- [[README]]
- [[backend-architecture-guide]]
- [[api-conventions]]
- [[logging-guide]]

## 출처

- [Context - Hono](https://hono.dev/docs/api/context)
- [Factory Helper - Hono](https://hono.dev/docs/helpers/factory)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
