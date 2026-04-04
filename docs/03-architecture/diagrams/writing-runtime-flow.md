---
title: 글쓰기 런타임 흐름 다이어그램
description: 홈 진입, 글감 자유 글쓰기, 여정 세션 진행, AI 코칭 피드백까지의 핵심 런타임 흐름을 보여주는 목표 아키텍처 다이어그램입니다.
---

이 다이어그램은 글필의 두 가지 주요 흐름(글감 자유 글쓰기, 여정 세션 진행)에서 어떤 요청과 저장이 어떤 순서로 일어나는지 상세 흐름을 보여준다.

## 다이어그램

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Web as web
    participant API as api
    participant DB as PostgreSQL
    participant AI as Google Gemini

    User->>Web: 홈 진입
    Web->>API: 진행 중인 여정·최근 글·오늘의 글감 요청
    API->>DB: 사용자 상태 조회
    DB-->>API: 홈 구성 데이터
    API-->>Web: 홈 데이터 응답

    alt 글감 자유 글쓰기
        User->>Web: 글감 선택 후 작성 시작
        Web->>API: 새 글 생성 요청 (promptId)
        API->>DB: Writing 생성
        DB-->>API: writingId / 초기 버전
        API-->>Web: 편집기 초기 상태

        User->>Web: 본문 입력
        Web->>Web: 5초 디바운스 자동 저장
        Web->>API: 자동 저장 요청
        API->>DB: WritingVersion 저장
        DB-->>API: 저장 완료
        API-->>Web: 저장 시각 반환
    end

    alt 여정 세션 진행
        User->>Web: 여정 카드 선택
        Web->>API: 세션 목록 / 진행 상태 요청
        API->>DB: UserJourneyProgress·UserSessionProgress 조회
        DB-->>API: 세션 목록 + 잠금 상태
        API-->>Web: 세션 목록 응답

        User->>Web: 잠금 해제된 세션 시작
        Web->>API: 세션 스텝 목록 요청
        API->>DB: Step 목록 조회
        DB-->>API: 스텝 목록 (LEARN/READ/GUIDED_QUESTION/WRITE/FEEDBACK/REVISE)
        API-->>Web: 스텝 목록 응답

        loop 각 스텝 진행
            User->>Web: 스텝 완료 / 글 작성
            Web->>API: 스텝 완료 또는 글 저장 요청
            API->>DB: 진행 상태 갱신
            DB-->>API: 갱신 완료
            API-->>Web: 다음 스텝 전환
        end

        opt AI 코칭 피드백 (FEEDBACK 스텝)
            Web->>API: 피드백 요청 (writingId + 수준)
            API->>AI: 소크라테스식 코칭 프롬프트
            AI-->>API: 강점 / 개선점 / 질문
            API->>DB: 피드백 결과 저장
            API-->>Web: 피드백 응답
        end

        User->>Web: 세션 완료
        Web->>API: 세션 완료 요청
        API->>DB: UserSessionProgress COMPLETED + 다음 세션 잠금 해제
        DB-->>API: 여정 진행 상태 갱신
        API-->>Web: 완료 결과 + 보상 정보
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
