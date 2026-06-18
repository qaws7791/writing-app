# SCR-108 운영 설정

## 라우트

- `apps/admin`: `/settings`

## 목적

관리자가 공지, 법적 문서, 콘텐츠 초기화를 관리한다.

## 주요 사용자

- 관리자

## 정보 구조

- `AdminHeader`
- 처리 상태 메시지
- 공지와 배너 form
- 법적 문서 form
- 콘텐츠 초기화 패널
- 초기화 확인 dialog

## UI 기준

- 설정 form은 `.settings-grid` 2열을 사용한다.
- 공지/배너와 법적 문서는 각각 `admin-panel` form으로 분리한다.
- 저장 버튼은 `admin-primary-button`이다.
- 콘텐츠 초기화는 `admin-danger-button`과 확인 dialog를 사용한다.

## 상태

- 설정 조회 성공
- 설정 조회 실패
- 공지 저장 중
- 약관 저장 중
- 콘텐츠 초기화 확인
- 콘텐츠 초기화 진행 중
- 처리 완료 또는 실패 메시지

## 접근성

- textarea와 input에는 label 또는 `aria-label`을 제공한다.
- 처리 완료 메시지는 `role="status"`로 표시한다.
- 초기화 확인 dialog는 `role="dialog"`와 `aria-labelledby`를 제공한다.
