---
title: 컨테이너 뷰 다이어그램
description: 모노레포 안의 주요 애플리케이션, 공유 패키지, 외부 런타임 의존성을 보여주는 목표 아키텍처 다이어그램입니다.
---

이 다이어그램은 모노레포 안에서 어떤 실행 단위와 공유 패키지가 시스템을 구성하는지 정리한다.

## 다이어그램

```mermaid
flowchart LR
    browser["브라우저"]

    subgraph monorepo["Bun 모노레포"]
        subgraph apps["apps"]
            web["apps/web<br/>Next.js App Router"]
            api["apps/api<br/>Hono API"]
            storybook["apps/storybook<br/>UI 검증 환경"]
        end

        subgraph packages["packages"]
            ui["packages/ui<br/>Base UI + shadcn/ui"]
            eslint["packages/eslint-config"]
            tsconfig["packages/typescript-config"]
        end
    end

    db["관계형 데이터베이스"]
    storage["오브젝트 스토리지"]
    auth["인증 / 소셜 로그인"]
    ai["AI 제공자"]

    browser --> web
    web --> ui
    storybook --> ui
    web --> api
    api --> db
    api --> storage
    api --> auth
    api --> ai
    web --> eslint
    api --> eslint
    storybook --> eslint
    web --> tsconfig
    api --> tsconfig
    storybook --> tsconfig
```

## 상태

- 이 다이어그램은 목표 구조를 설명하기 위한 컨테이너 수준 뷰이며, 세부 구현 파일이나 현재 실행 방식 전체를 모두 표현하지는 않는다.

## 관련 문서

- [[03-architecture/diagrams/README]]
- [[03-architecture/README]]
- [[03-architecture/tech-stack]]
- [[03-architecture/api-overview]]
- [[04-engineering/backend-architecture-guide]]
- [[04-engineering/frontend-architecture-guide]]
