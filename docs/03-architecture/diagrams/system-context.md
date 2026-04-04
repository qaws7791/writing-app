---
title: 시스템 컨텍스트 다이어그램
description: 사용자, 웹 앱, API, 외부 의존성, 운영 계층의 시스템 경계를 보여주는 목표 아키텍처 다이어그램입니다.
---

이 다이어그램은 글필 플랫폼을 둘러싼 주체와 시스템 경계를 한 번에 파악하기 위한 상위 수준 뷰다.

## 다이어그램

```mermaid
flowchart TB
    user["사용자"]

    subgraph platform["글필 플랫폼"]
        web["apps/web<br/>Next.js 웹 앱"]
        api["apps/api<br/>Hono API"]
    end

    subgraph dependencies["외부 의존성"]
        auth["인증 시스템<br/>better-auth / Google·Kakao 소셜 로그인"]
        ai["Google Gemini<br/>AI 코칭 피드백"]
        storage["Cloudflare R2<br/>오브젝트 스토리지"]
        db["PostgreSQL<br/>관계형 데이터베이스"]
    end

    subgraph operations["운영 계층"]
        observability["관측 스택<br/>로그 / 메트릭 / 트레이스 / 알림"]
    end

    user --> web
    web --> api
    api --> auth
    api --> ai
    api --> storage
    api --> db
    web --> observability
    api --> observability
```

## 상태

- 이 다이어그램은 현재 코드 구현이 아니라 `03-architecture` 문서에 정의된 목표 아키텍처를 기준으로 한다.

## 관련 문서

- [[03-architecture/diagrams/README]]
- [[03-architecture/README]]
- [[03-architecture/tech-stack]]
- [[03-architecture/api-overview]]
- [[03-architecture/auth-and-session]]
- [[03-architecture/deployment-strategy]]
