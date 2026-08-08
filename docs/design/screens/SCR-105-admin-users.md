# SCR-105 사용자 관리

## 구현 탐색

현재 route는 [관리자 앱 route source](../../../apps/admin/src/app)에서 확인한다.

## 목적

관리자가 학습자를 검색하고 상태 변경 또는 삭제 요청 처리를 수행한다.

## 주요 사용자

- 소유자 관리자

## 정보 구조

- `AdminPageHeader`
- `Field`, `Input`, `Select`와 `Button`을 조합한 필터 form
- 처리 상태 메시지
- `Card` 안의 `Table` 사용자 목록
- 페이지 크기 선택과 페이지 이동
- `AlertDialog` 사용자 상태 변경 확인
- `AlertDialog` 삭제 요청 확인

## UI 기준

- 검색, 상태와 정렬 필터를 native `GET` form에 둔다.
- 필터 toolbar는 `GET` form이며, 사용자 검색 `query`, 상태 `status`, 정렬 `sort`를 query string으로 제출한다.
- 필터 적용 버튼은 `Button variant="outline"`이다.
- 페이지 크기 선택은 코스 목록과 같은 옵션을 제공한다.
- row action은 포인터 hover에 의존하지 않고 항상 확인할 수 있어야 한다.
- 사용자 첫 열은 이름과 이메일을 함께 표시한다.
- 상태는 app-local `StatusBadge`가 Luma `Badge` variant로 표시한다.
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
- 상태 변경과 삭제 확인 dialog는 `AlertDialog`를 사용하며 `role="alertdialog"` 의미와 제목/설명 관계를 제공한다.
