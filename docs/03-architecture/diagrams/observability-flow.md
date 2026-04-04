---
title: 관측 흐름 다이어그램
description: 웹과 API에서 생성되는 로그, 메트릭, 트레이스, 감사 이벤트가 운영 계층으로 수집되는 흐름을 보여주는 목표 아키텍처 다이어그램입니다.
---

이 다이어그램은 사용자 요청이 운영 신호로 변환되는 경로를 정리해 장애 대응과 품질 추적의 기준점을 제공한다.

## 다이어그램

```mermaid
flowchart LR
    browser["브라우저 요청 / 사용자 상호작용"]
    web["apps/web"]
    api["apps/api"]
    db["PostgreSQL"]
    ai["Google Gemini"]
    storage["Cloudflare R2"]

    subgraph collection["수집 계층"]
        logs["구조화 로그"]
        metrics["운영 / 제품 메트릭"]
        traces["분산 추적"]
        audit["감사 이벤트 저장소"]
    end

    subgraph operations["운영 활용"]
        dashboards["대시보드"]
        alerts["알림"]
        support["장애 대응 / 고객 지원"]
    end

    browser --> web
    web --> api
    api --> db
    api --> ai
    api --> storage

    web --> logs
    web --> metrics
    web --> traces
    api --> logs
    api --> metrics
    api --> traces
    api --> audit
    db --> metrics
    ai --> metrics
    storage --> metrics

    logs --> dashboards
    metrics --> dashboards
    traces --> dashboards
    audit --> support
    dashboards --> alerts
    dashboards --> support
```

## 상태

- 관측 데이터는 본문 원문을 복제하지 않고 메타데이터 중심으로 수집한다는 원칙을 전제로 한다.

## 관련 문서

- [[03-architecture/diagrams/README]]
- [[03-architecture/README]]
- [[03-architecture/observability-architecture]]
- [[03-architecture/error-handling]]
- [[03-architecture/auth-and-session]]
