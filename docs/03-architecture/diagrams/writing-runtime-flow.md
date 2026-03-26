---
title: 글쓰기 런타임 흐름 다이어그램
description: 홈 진입, 작성, 자동 저장, AI 보조, 공개, 내보내기까지의 핵심 런타임 흐름을 보여주는 목표 아키텍처 다이어그램입니다.
---

이 다이어그램은 사용자 글쓰기 세션에서 어떤 요청과 저장이 어떤 순서로 일어나는지 상세 흐름을 보여준다.

## 다이어그램

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Web as web
    participant API as api
    participant DB as 관계형 DB
    participant AI as AI 제공자
    participant Storage as 오브젝트 스토리지

    User->>Web: 홈 진입
    Web->>API: 세션 상태 / 이어쓰기 / 글감 요약 요청
    API->>DB: 사용자 상태 조회
    DB-->>API: 홈 구성 데이터
    API-->>Web: 최소 홈 데이터 응답

    User->>Web: 글감 선택 후 작성 시작
    Web->>API: 새 글 생성 요청
    API->>DB: Writing 글 생성
    DB-->>API: writingId / 초기 버전
    API-->>Web: 편집기 초기 상태

    User->>Web: 제목 / 본문 입력
    Web->>Web: 클라이언트 편집 상태 반영
    Web->>API: 자동 저장 요청
    API->>DB: 버전 충돌 확인 후 저장
    alt 저장 성공
        DB-->>API: Writing / WritingVersion 갱신
        API-->>Web: 저장 시각 / 버전 상태 반환
    else 저장 실패 또는 충돌
        DB-->>API: 실패 또는 충돌 정보
        API-->>Web: 재시도 가능 여부 / 충돌 정보 반환
    end

    opt AI 제안 또는 검토 요청
        User->>Web: AI 기능 실행
        Web->>API: 선택 영역 또는 문단 정보 전송
        API->>AI: 코칭형 요청
        AI-->>API: 제안 목록 또는 검토 결과
        API-->>Web: 사용자 승인용 결과 반환
    end

    opt 공개 또는 공유
        User->>Web: 공개 범위 선택
        Web->>API: 공개 / 공유 요청
        API->>DB: 권한 / 상태 / 메타데이터 검증
        DB-->>API: Publication 또는 ShareLink 상태
        API-->>Web: 공개 결과 반환
    end

    opt 내보내기
        User->>Web: txt / md 내보내기 요청
        Web->>API: 내보내기 요청
        API->>DB: 기준 버전 조회
        API->>Storage: 파생 파일 생성 또는 임시 링크 발급
        Storage-->>API: 다운로드 정보
        API-->>Web: 다운로드 응답
    end
```

## 상태

- 이 다이어그램은 목표 사용자 흐름을 상세하게 보여주며, `data-flow.md`의 요약 다이어그램보다 한 단계 자세한 런타임 뷰다.

## 관련 문서

- [[03-architecture/diagrams/README]]
- [[03-architecture/README]]
- [[03-architecture/data-flow]]
- [[03-architecture/api-overview]]
- [[03-architecture/error-handling]]
- [[03-architecture/file-storage-strategy]]
