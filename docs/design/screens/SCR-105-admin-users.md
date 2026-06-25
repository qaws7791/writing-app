# SCR-105 사용자 관리

## 라우트

- `apps/admin`: `/users`

## 목적

관리자가 학습자를 검색하고 상태 변경 또는 삭제 요청 처리를 수행한다.

## 주요 사용자

- 운영자
- 관리자

## 정보 구조

- `PageHeader`
- `FilterToolbar`
- 처리 상태 메시지
- `DataTable` 사용자 목록
- 페이지네이션
- `AlertDialog` 삭제 요청 확인

## UI 기준

- 검색, 상태, 정렬 필터를 `FilterToolbar`에 둔다.
- 필터 toolbar는 `GET` form이며, 사용자 검색 `query`, 상태 `status`, 정렬 `sort`를 query string으로 제출한다.
- 필터 적용 버튼은 `Button variant="outline"`이다.
- 페이지 크기 선택 control은 제공하지 않는다.
- 사용자 목록은 페이지당 12명 고정으로 표시한다.
- 사용자 첫 열은 이름과 이메일을 함께 표시한다.
- 상태는 app-local `StatusBadge`가 Kwep 어드민 기준의 중립 `Badge`로 표시한다.
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
- 삭제 확인 dialog는 `AlertDialog`를 사용하며 `role="alertdialog"` 의미와 제목/설명 관계를 제공한다.
