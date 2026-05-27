# 어드민 코스 목록 Data Table 개선 설계

## 목적

- 어드민 코스 목록 페이지를 shadcn Data Table 가이드와 지정된 dashboard DataTable 템플릿을 기반으로 개선한다.
- 코스 목록은 코스 단위 정보만 보여주고, 챕터와 레슨 같은 하위 데이터는 코스 상세 페이지 책임으로 분리한다.
- 검색과 페이지네이션은 모두 서버측에서 수행한다.
- 이번 작업에서는 코스 상세 페이지를 빈 자리 화면으로만 만든다.

## 근거 문서

- shadcn Data Table 문서: `https://ui.shadcn.com/docs/components/base/data-table`
- 지정 템플릿: `https://raw.githubusercontent.com/shadcn-ui/ui/360e8a19c3ee13ac78b656027462007c8bdaa6d5/apps/v4/app/(app)/examples/dashboard/components/data-table.tsx`
- TanStack Table 문서 확인 사항:
  - 서버측 페이지네이션은 `manualPagination`과 `rowCount` 또는 `pageCount`를 사용한다.
  - 서버측 검색은 `manualFiltering`을 켜고, 클라이언트 row model이 데이터를 다시 필터링하지 않게 한다.
  - 현재 페이지 데이터는 서버 응답을 그대로 `data`로 전달하고 `getCoreRowModel()`을 기본 row model로 사용한다.

## 범위

### 포함

- `@tanstack/react-table`을 `apps/admin` 의존성에 추가한다.
- 어드민 Core/Admin API/DB repository에 코스 목록 전용 계약을 추가한다.
- 새 목록 API는 `GET /courses?page=1&pageSize=10&query=...` 형태를 사용한다.
- 기존 `GET /courses?include=chapters,lessons`는 당장 제거하지 않는다.
- 어드민 `/courses` 페이지는 서버 컴포넌트에서 URL query를 읽고 목록 API를 호출한다.
- 코스 목록 화면은 shadcn Data Table 가이드와 지정 dashboard 템플릿의 구조를 기반으로 구성한다.
- `/courses/[id]` 상세 route는 빈 상세 자리 화면만 렌더링한다.
- `docs/admin-site.md`에 작업 시작과 완료 내용을 기록한다.

### 제외

- 코스 생성, 수정, 삭제 기능.
- 코스 상세의 챕터/레슨 실제 조회와 표시.
- 클라이언트측 검색, 클라이언트측 페이지네이션.
- 드래그 정렬, 차트, 탭별 데이터 전환, row selection 같은 dashboard 템플릿의 부가 기능.

## API 설계

### 요청

`GET /courses`

- `page`: 1 이상의 정수. 누락 시 `1`.
- `pageSize`: 허용값 `10`, `20`, `30`, `40`, `50`. 누락 시 `10`.
- `query`: 선택 검색어. 앞뒤 공백은 제거한다.
- `include=chapters,lessons`: 기존 트리 조회 호환 경로로 유지한다.

`include`가 있으면 기존 트리 조회 규칙을 따른다. `include`가 없으면 목록 조회로 처리한다.

### 응답

```ts
type AdminCourseListDto = {
  courses: {
    id: string
    title: string
    description: string
    sortOrder: number
  }[]
  pagination: {
    page: number
    pageSize: 10 | 20 | 30 | 40 | 50
    totalCount: number
    totalPages: number
  }
  query: string
}
```

검색 결과가 없으면 `courses`는 빈 배열이고 `pagination.totalCount`는 `0`이다. `totalPages`는 빈 결과에서도 화면 안정성을 위해 `1`로 반환한다.

### 오류

- `page`, `pageSize`가 유효하지 않으면 `invalid-request` 400을 반환한다.
- DB 조회 실패나 DTO 검증 실패는 기존 어드민 서비스 규칙처럼 `database-unavailable` 503으로 변환한다.

## DB 조회 설계

- 검색 대상은 `courses.title`, `courses.description`이다.
- 정렬은 기존 목록과 같은 `courses.sortOrder` 오름차순이다.
- `limit`은 `pageSize`, `offset`은 `(page - 1) * pageSize`로 계산한다.
- 같은 검색 조건으로 `totalCount`를 별도 조회한다.
- SQLite 기반 구현이므로 `LIKE` 검색을 사용한다.

## 프론트엔드 설계

### 라우팅

- `/courses`
  - `searchParams`에서 `page`, `pageSize`, `query`를 읽는다.
  - 서버에서 어드민 API `listCourses`를 호출한다.
  - 오류는 기존 화면처럼 로그인 경로로 redirect한다.
- `/courses/[id]`
  - 빈 상세 자리 화면을 렌더링한다.
  - 제목은 `코스 상세`, 설명은 `챕터와 레슨 데이터는 이후 이 화면에서 확인합니다.`로 둔다.

### 컴포넌트 구조

- `admin-courses-page.tsx`
  - 페이지 헤더와 목록 화면의 서버 데이터 주입을 담당한다.
- `admin-courses-data-table.tsx`
  - `"use client"` 컴포넌트.
  - 지정 dashboard DataTable 템플릿의 table, column visibility, pagination 영역 구조를 기반으로 한다.
  - 프로젝트의 lucide 아이콘과 `@workspace/ui` shadcn 컴포넌트 import로 치환한다.
  - 드래그 정렬, 차트, 탭, drawer, editable input은 제거한다.
- `admin-course-columns.tsx`
  - `"use client"` 컬럼 정의.
  - 코스명은 상세 페이지 링크로 렌더링한다.
  - 설명, 정렬 순서, 상세 액션을 표시한다.

### 검색과 페이지네이션

- 검색 입력은 URL query를 갱신하는 GET form으로 처리한다.
- 검색 제출 시 `page`는 `1`로 초기화한다.
- 페이지 이동 버튼과 pageSize 변경은 `router.push` 또는 `<Link>`로 URL query를 갱신한다.
- TanStack Table 설정은 다음 원칙을 따른다.
  - `manualPagination: true`
  - `manualFiltering: true`
  - `rowCount: pagination.totalCount`
  - `state.pagination.pageIndex = pagination.page - 1`
  - `state.pagination.pageSize = pagination.pageSize`
  - `getCoreRowModel: getCoreRowModel()`

## 테스트 전략

- Core service 테스트
  - repository가 반환한 목록 DTO를 검증해 그대로 반환한다.
  - repository 예외 또는 잘못된 DTO는 `database-unavailable`로 변환한다.
- DB repository 테스트
  - 정렬 순서, 검색 필터, limit/offset, totalCount를 검증한다.
- Admin API route 테스트
  - 인증된 `GET /courses?page=1&pageSize=10&query=...`가 목록 DTO를 반환한다.
  - 잘못된 `page`, `pageSize`는 400을 반환한다.
  - 기존 `include=chapters,lessons` 경로는 유지된다.
- Admin API client 테스트
  - 목록 조회 URL query가 정확히 만들어진다.
- UI 테스트
  - 목록 row, 검색어 입력값, 결과 없음 상태, 페이지 정보, 상세 링크를 검증한다.
  - 상세 빈 페이지가 제목과 안내 문구를 렌더링하는지 검증한다.

## 문서화

- 작업 시작 시 `docs/admin-site.md`에 이번 범위와 설계 방향을 기록한다.
- 작업 완료 시 실제 구현된 API, UI, 검증 명령을 `docs/admin-site.md`에 기록한다.
- 모든 문서는 한국어로 작성한다.

## 승인된 결정

- 코스 목록은 방식 1인 목록 전용 API로 구현한다.
- 상세 페이지는 빈 페이지로만 구현한다.
- UI는 shadcn Data Table 가이드와 지정 dashboard DataTable 템플릿을 기반으로 하며, 직접 처음부터 새 UI를 만들지 않는다.
