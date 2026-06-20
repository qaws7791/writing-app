# SCR-103 콘텐츠 관리

## 라우트

- `apps/admin`: `/courses`

## 목적

관리자가 코스를 검색, 필터링, 생성, 보관한다.

## 주요 사용자

- 콘텐츠 관리자
- 운영자

## 정보 구조

- `AdminHeader`
- 코스 필터 toolbar
- 처리 상태 메시지
- 코스 목록 table
- 코스 보관 확인 dialog

## UI 기준

- 필터는 `.admin-toolbar`에 둔다.
- 필터 toolbar는 `GET` form이며, 코스 검색 `query`, 카테고리 `category`, 상태 `status`, 페이지 크기 `pageSize`를 query string으로 제출한다.
- 필터 적용 버튼은 `admin-secondary-button`이다.
- 페이지 크기 선택은 `10`, `20`, `50` 옵션을 제공한다.
- table 첫 열은 제목과 revision을 함께 보여준다.
- 새 코스 버튼은 `admin-primary-button`이다.
- 보관 버튼은 `admin-secondary-button`이고, 확인 dialog의 실행은 `admin-danger-button`이다.

## 상태

- 목록 조회 성공
- 목록 조회 실패
- 생성 진행 중
- 보관 확인
- 보관 진행 중
- 처리 완료 또는 실패 메시지

## 접근성

- toolbar는 `aria-label="코스 필터"`를 제공한다.
- table header는 `scope="col"`을 사용한다.
- dialog는 `role="dialog"`와 `aria-labelledby`를 제공한다.
