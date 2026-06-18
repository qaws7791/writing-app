# SCR-105 사용자 관리

## 라우트

- `apps/admin`: `/users`

## 목적

관리자가 학습자를 검색하고 상태 변경 또는 삭제 요청 처리를 수행한다.

## 주요 사용자

- 운영자
- 관리자

## 정보 구조

- `AdminHeader`
- 사용자 필터 toolbar
- 처리 상태 메시지
- 사용자 목록 table
- 삭제 요청 확인 dialog

## UI 기준

- 검색, 상태, 정렬 필터를 toolbar에 둔다.
- 사용자 첫 열은 이름과 이메일을 함께 표시한다.
- 상태는 `.admin-status-pill`로 표시한다.
- row action은 정지와 삭제 요청을 제공한다.

## 상태

- 목록 조회 성공
- 목록 조회 실패
- 상태 변경 진행 중
- 삭제 요청 확인
- 처리 완료 또는 실패 메시지

## 접근성

- toolbar는 `aria-label="사용자 필터"`를 제공한다.
- table header는 `scope="col"`을 사용한다.
- 삭제 확인 dialog는 `role="dialog"`와 `aria-labelledby`를 제공한다.
