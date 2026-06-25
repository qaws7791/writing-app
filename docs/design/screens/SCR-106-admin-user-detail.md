# SCR-106 사용자 상세

## 라우트

- `apps/admin`: `/users/[id]`

## 목적

관리자가 특정 학습자의 상태와 학습 요약을 확인한다.

## 주요 사용자

- 운영자
- 관리자

## 정보 구조

- `PageHeader`
- 사용자 기본 정보
- `StatusBadge`
- 가입일
- 최근 접속
- 완료 레슨
- 전체 진도
- 학습 요약 정의 목록

## UI 기준

- 상세 정보는 `Surface variant="panel"` 안에 배치한다.
- 수치 요약은 `dl` 구조를 사용한다.
- 상태는 app-local `StatusBadge`가 Kwep 어드민 기준의 중립 `Badge`로 표시한다.

## 상태

- 사용자 조회 성공
- 사용자 조회 실패

## 접근성

- 정의 목록 `dl`, `dt`, `dd`로 지표 의미를 보존한다.
- 오류는 `role="alert"`로 표시한다.
