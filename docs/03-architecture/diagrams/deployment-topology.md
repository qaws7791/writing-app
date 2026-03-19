---
title: 배포 토폴로지 다이어그램
description: 로컬, 스테이징, 운영 환경에서 웹, API, 저장소, 데이터베이스, 운영 계층이 어떻게 배치되는지 보여주는 목표 아키텍처 다이어그램입니다.
---

이 다이어그램은 환경별 배치 차이와 배포 경계를 빠르게 비교하기 위한 인프라 관점 뷰다.

## 다이어그램

```mermaid
flowchart TB
    ci["CI / CD 파이프라인"]

    subgraph local["로컬"]
        localWeb["web 개발 서버"]
        localApi["api 개발 서버"]
        localStorage["로컬 에뮬레이터 또는 개발 버킷"]
        localDb["개발 데이터베이스"]
        localObs["개발용 로그 / 디버그 추적"]
        localWeb --> localApi
        localApi --> localStorage
        localApi --> localDb
        localApi --> localObs
    end

    subgraph staging["스테이징"]
        stagingWeb["web 스테이징 배포"]
        stagingApi["api 스테이징 배포"]
        stagingStorage["스테이징 스토리지"]
        stagingDb["스테이징 데이터베이스"]
        stagingObs["관측 스택"]
        stagingWeb --> stagingApi
        stagingApi --> stagingStorage
        stagingApi --> stagingDb
        stagingApi --> stagingObs
    end

    subgraph production["운영"]
        prodWeb["web 운영 배포"]
        prodApi["api 운영 배포"]
        prodStorage["운영 오브젝트 스토리지"]
        prodDb["고가용성 데이터베이스"]
        prodObs["운영 관측 스택"]
        prodWeb --> prodApi
        prodApi --> prodStorage
        prodApi --> prodDb
        prodApi --> prodObs
    end

    ci --> stagingWeb
    ci --> stagingApi
    ci --> prodWeb
    ci --> prodApi
```

## 상태

- 로컬은 운영과 같은 인터페이스를 재현하는 개발 환경으로, 스테이징과 운영은 같은 배치 패턴을 공유한다는 가정 위에 그린다.

## 관련 문서

- [[03-architecture/diagrams/README]]
- [[03-architecture/README]]
- [[03-architecture/deployment-strategy]]
- [[03-architecture/file-storage-strategy]]
- [[03-architecture/observability-architecture]]
