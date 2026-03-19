---
title: 글감 상세 화면
description: 선택한 글감의 맥락을 짧게 이해하고 저장 또는 바로 쓰기 행동을 결정하는 화면을 정의합니다.
status: active
---

## 목적

글감 상세 화면은 설명을 늘어놓는 곳이 아니라, 글감에 대한 확신을 높여 다음 행동을 결정하게 만드는 화면이다.

## 진입 경로

- 홈의 추천 글감 카드
- 글감 찾기 목록 카드

## 범위

- 포함: 글감 본문, 관련 태그, 저장, 바로 쓰기 CTA
- 제외: 유사 글감 추천, 댓글, 공유 기능

## 정보 위계

1. 글감 핵심 문장
2. 생각 확장을 돕는 짧은 맥락
3. 바로 쓰기 CTA
4. 저장 액션

## 주요 액션

- 바로 쓰기
- 저장
- 이전 화면으로 복귀

## 상태별 UI

### 기본 상태

- 글감의 핵심 문장과 보조 설명은 짧고 명확하게 배치한다.
- 바로 쓰기 CTA가 가장 명확한 1차 행동으로 보인다.
- 저장은 보조 액션으로 제공한다.

### 저장 완료 상태

- 상태 변화는 짧은 토스트 또는 아이콘 변화로 인지시킨다.

### 로딩 상태

- 핵심 콘텐츠와 CTA 위치를 유지한 채 스켈레톤을 보여준다.

### 오류 상태

- 전체 화면 실패보다는 내용 재시도와 이전 화면 복귀를 우선 제안한다.

## 문구 톤 가이드

- 쓰기 부담을 낮추는 안내를 우선한다.
- 예시: "완성보다 초고를 먼저 시작해도 괜찮습니다."

## 네비게이션 이동

- 바로 쓰기: [[02-design/screens/editor]]
- 뒤로 가기: [[02-design/screens/home]] 또는 [[02-design/screens/prompts]]

## 데스크톱 차이

- 본문과 보조 메타 정보를 좌우 분할로 보여줄 수 있다.
- CTA 우선순위는 모바일과 동일하게 유지한다.

## 연결 features

- [[02-design/features/today-writing-prompts]]
- [[02-design/features/prompt-discovery]]
- [[02-design/features/prompt-save]]
- [[02-design/features/editor-writing]]

## 연결 user-flows

- [[02-design/user-flows/start-writing-today]]
- [[02-design/user-flows/discover-prompt-and-start]]
