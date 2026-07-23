# SCR-108 콘텐츠 유지보수

## 구현 탐색

현재 route는 [관리자 앱 route source](../../../apps/admin/src/app)에서 확인한다.

## 목적

소유자 관리자가 기준 seed로 콘텐츠를 복구하는 위험 작업을 실행한다.

## 주요 사용자

- 소유자 관리자

## 정보 구조

- 화면 제목과 owner 전용 작업 설명
- 콘텐츠 초기화 패널
- 초기화 확인 `AlertDialog`
- 완료 또는 실패 상태 메시지

## UI 기준

- 콘텐츠 초기화는 `Button variant="destructive"`로 표시한다.
- 실행 전 확인 dialog에서 active 콘텐츠가 seed 기준으로 재정렬됨을 설명한다.
- 성공 시 새 revision을 함께 표시한다.

## 상태

- 초기화 확인
- 초기화 진행 중
- 완료
- 실패

## 접근성

- 처리 결과는 `role="status"`로 알린다.
- 확인 dialog는 제목과 설명이 연결된 `alertdialog` 의미를 제공한다.
