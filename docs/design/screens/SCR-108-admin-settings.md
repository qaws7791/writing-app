# SCR-108 운영 설정

## 구현 탐색

현재 route는 [관리자 앱 route source](../../../apps/admin/src/app)에서 확인한다.

## 목적

관리자가 공지, 법적 문서, 콘텐츠 초기화를 관리한다.

## 주요 사용자

- 관리자

## 정보 구조

- `PageHeader`
- 처리 상태 메시지
- `Surface` 성격의 공지와 배너 form
- `Surface` 성격의 법적 문서 form
- `Surface variant="panel"` 콘텐츠 초기화 패널
- `AlertDialog` 초기화 확인

## UI 기준

- 설정 form은 responsive 2열 grid를 사용한다.
- 공지/배너와 법적 문서는 각각 `SectionHeader`, `Field`, `Input`, `Textarea` 조합으로 분리한다.
- 저장 버튼은 기본 `Button`이다.
- 콘텐츠 초기화는 `Button variant="destructive"`와 확인 dialog를 사용한다.

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
- 초기화 확인 dialog는 `AlertDialog`를 사용하며 `role="alertdialog"` 의미와 제목/설명 관계를 제공한다.
