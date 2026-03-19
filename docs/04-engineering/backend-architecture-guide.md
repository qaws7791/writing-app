---
title: 백엔드 아키텍처 가이드
description: 아직 구현되지 않은 Hono 백엔드를 어떤 구조와 경계로 확장할지에 대한 기준을 정리합니다.
---

## 상태

- 기준 시점: 2026-03-19
- 현재 `apps/api`는 `src/index.ts`, `src/app.ts`와 `GET /` 한 개의 라우트만 존재합니다.
- 인증, 검증, 저장소, 로깅, 오류 처리, 도메인 모델은 아직 구현되지 않았습니다.
- 이 문서는 "초기 구현을 시작할 때 따라야 할 기준"입니다.

## 시작 구조

- `src/index.ts`: 런타임 어댑터와 포트 바인딩만 담당합니다.
- `src/app.ts`: Hono 앱 생성, 미들웨어 등록, 라우트 조립의 composition root로 둡니다.
- 새 기능은 처음부터 거대한 공용 패키지로 빼지 말고 `apps/api/src` 안에서 시작합니다.

## 권장 디렉터리 구조

```text
apps/api/src/
  app.ts
  index.ts
  middleware/
  shared/http/
  features/
    prompts/
      domain/
      application/
      infrastructure/
      presentation/
    writings/
      domain/
      application/
      infrastructure/
      presentation/
```

## 레이어 원칙

- `domain`: 순수 비즈니스 규칙과 타입만 둡니다.
- `application`: use case, port, 정책 조합을 둡니다.
- `infrastructure`: DB, 외부 API, 파일 저장, AI 연동 어댑터를 둡니다.
- `presentation`: Hono route, validator, request/response 매핑을 둡니다.

## Hono 적용 원칙

- 요청 검증은 가장 바깥 HTTP 경계에서 수행합니다.
- 요청별 메타데이터는 `c.set()` / `c.get()`으로 전달하되, 도메인 객체를 억지로 Context에 저장하지 않습니다.
- 공통 예외 fallback은 `app.onError()`에 두고, 기능별 예외는 애플리케이션 계층에서 의미 있는 오류로 변환합니다.
- `requestId`, 로거, 인증 미들웨어는 가능한 한 앞단에서 등록합니다.

## 패키지 분리 기준

- 두 개 이상의 앱이 같은 도메인 로직을 실제로 재사용할 때만 `packages/*` 추출을 고려합니다.
- 단순히 "언젠가 쓸 수도 있음" 수준이면 `apps/api` 내부에 둡니다.
- 추출 시에도 UI, 인프라, 애플리케이션의 역방향 의존성은 만들지 않습니다.

## 현재 저장소에 맞는 구현 순서

1. `src/app.ts`에 공통 미들웨어와 오류 처리 뼈대를 먼저 넣습니다.
2. `prompts`, `writings` 같은 사용자 흐름 단위 feature를 만듭니다.
3. 각 feature 안에서 도메인과 use case를 먼저 굳힌 뒤 HTTP 표현을 붙입니다.
4. 두 번째 소비자가 생기기 전까지는 feature를 패키지로 추출하지 않습니다.

## 관련 문서

- [[README]]
- [[api-conventions]]
- [[dependency-injection]]
- [[logging-guide]]
- [[03-architecture/api-overview]]
- [[03-architecture/domain-model]]

## 출처

- [App - Hono](https://hono.dev/docs/api/hono)
- [Context - Hono](https://hono.dev/docs/api/context)
- [Factory Helper - Hono](https://hono.dev/docs/helpers/factory)
- [Validation - Hono](https://hono.dev/docs/guides/validation)
- [Structuring a repository | Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
