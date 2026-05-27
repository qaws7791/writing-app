# 어드민 코스 목록 Data Table 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획을 태스크 단위로 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [x]`) 문법을 사용한다.

**목표:** 어드민 코스 목록을 shadcn Data Table 기반 화면으로 바꾸고, 서버측 검색과 페이지네이션을 제공한다.

**아키텍처:** 목록 전용 API `GET /courses?page=&pageSize=&query=`를 추가하고 기존 `include=chapters,lessons` 트리 API는 유지한다. Next 서버 컴포넌트가 URL query를 읽어 Admin API를 호출하고, 클라이언트 DataTable은 TanStack Table의 manual pagination/filtering 모드로 서버 응답만 렌더링한다.

**기술 스택:** Bun, Next.js 16 App Router, Hono, Drizzle SQLite, shadcn/ui, `@tanstack/react-table`, Vitest, Testing Library.

---

## 파일 구조

- 수정: `apps/admin/package.json`
  - `@tanstack/react-table` 의존성을 추가한다.
- 수정: `packages/core/src/admin/admin.dto.ts`
  - 목록 item, pagination, query DTO 스키마와 타입을 추가한다.
- 수정: `packages/core/src/admin/admin.repository.ts`
  - `listCourses(input)` repository port를 추가한다.
- 수정: `packages/core/src/admin/admin.service.ts`
  - `listCourses(input)` service 메서드를 추가하고 DTO 검증 실패를 `database-unavailable`로 변환한다.
- 수정: `packages/core/src/admin/admin.service.test.ts`
  - 목록 service 성공/실패 테스트를 추가한다.
- 수정: `packages/db/src/repositories/drizzle-admin.repository.ts`
  - `courses` 테이블에 대한 검색, count, limit/offset 조회를 추가한다.
- 수정: `packages/db/src/repositories/drizzle-admin.repository.test.ts`
  - 서버측 검색, 페이지네이션, totalCount 테스트를 추가한다.
- 수정: `apps/admin-api/src/routes/courses.route.ts`
  - `include` 없는 `/courses`를 목록 조회로 처리하고 query validation을 추가한다.
- 수정: `apps/admin-api/src/app.test.ts`
  - 목록 API 성공과 validation 실패 테스트를 추가한다.
- 수정: `apps/admin/src/lib/api/admin-api.ts`
  - `listCourses(input)` client contract를 추가한다.
- 수정: `apps/admin/src/lib/api/http-admin-api.ts`
  - 목록 API URL query 생성 로직을 추가한다.
- 수정: `apps/admin/src/lib/api/http-admin-api.test.ts`
  - 목록 API 요청 URL 테스트를 추가한다.
- 수정: `apps/admin/src/app/(admin)/courses/page.tsx`
  - `searchParams`를 읽어 목록 API를 호출한다.
- 교체: `apps/admin/src/features/courses/admin-courses-page.tsx`
  - 기존 카드/Collapsible 트리 UI를 목록 shell로 바꾼다.
- 교체: `apps/admin/src/features/courses/admin-courses-page.test.tsx`
  - 기존 트리 UI 테스트를 목록 UI 테스트로 바꾼다.
- 생성: `apps/admin/src/features/courses/admin-course-columns.tsx`
  - 코스 DataTable 컬럼을 정의한다.
- 생성: `apps/admin/src/features/courses/admin-courses-data-table.tsx`
  - shadcn Data Table 가이드와 지정 dashboard 템플릿 기반 DataTable을 구현한다.
- 생성: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
  - 빈 상세 자리 화면을 렌더링한다.
- 생성: `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`
  - 빈 상세 자리 화면 테스트를 추가한다.
- 생성: `apps/admin/src/app/(admin)/courses/[id]/page.tsx`
  - 상세 페이지 route를 연결한다.
- 수정: `docs/admin-site.md`
  - 완료 내용과 검증 결과를 기록한다.

## 작업 1: Admin Core 목록 계약

- [x] **단계 1: 실패 테스트 작성**

`packages/core/src/admin/admin.service.test.ts`에 다음 테스트를 추가한다.

```ts
it("returns paginated course list", async () => {
  const service = createAdminService({ repository })

  await expect(
    service.listCourses({ page: 1, pageSize: 10, query: "문장" })
  ).resolves.toMatchObject({
    status: "ok",
    value: {
      courses: [{ id: "sentence-structure" }],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
      },
      query: "문장",
    },
  })
})
```

- [x] **단계 2: 실패 확인**

실행: `bun --filter @workspace/core test -- admin.service.test.ts`

기대 결과: `service.listCourses is not a function` 또는 repository type 누락으로 실패한다.

- [x] **단계 3: 최소 구현**

`admin.dto.ts`에 `adminCourseListDtoSchema`와 `AdminCourseListDto`, `AdminCourseListInputDto` 타입을 추가한다. `admin.repository.ts`에 `listCourses(input)`을 추가한다. `admin.service.ts`에 `listCourses(input)`을 추가하고 repository 결과를 `adminCourseListDtoSchema.parse(...)`로 검증한다.

- [x] **단계 4: 통과 확인**

실행: `bun --filter @workspace/core test -- admin.service.test.ts`

기대 결과: 해당 테스트 파일이 통과한다.

## 작업 2: DB repository 서버측 검색과 페이지네이션

- [x] **단계 1: 실패 테스트 작성**

`packages/db/src/repositories/drizzle-admin.repository.test.ts`에 세 코스를 넣고 다음을 검증하는 테스트를 추가한다.

```ts
const result = await repository.listCourses({
  page: 2,
  pageSize: 10,
  query: "문장",
})

expect(result).toEqual({
  courses: [
    {
      id: "course-sentence-later",
      title: "문장 확장",
      description: "두 번째 검색 결과",
      sortOrder: 3,
    },
  ],
  pagination: {
    page: 2,
    pageSize: 10,
    totalCount: 11,
    totalPages: 2,
  },
  query: "문장",
})
```

- [x] **단계 2: 실패 확인**

실행: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts`

기대 결과: `repository.listCourses is not a function` 또는 구현 누락으로 실패한다.

- [x] **단계 3: 최소 구현**

`drizzle-admin.repository.ts`에서 `listCourses`를 구현한다. `and`, `asc`, `count`, `like`, `or`를 사용해 검색 조건을 구성하고, `limit(pageSize)`, `offset((page - 1) * pageSize)`를 적용한다.

- [x] **단계 4: 통과 확인**

실행: `bun --filter @workspace/db test -- drizzle-admin.repository.test.ts`

기대 결과: 해당 테스트 파일이 통과한다.

## 작업 3: Admin API 목록 route

- [x] **단계 1: 실패 테스트 작성**

`apps/admin-api/src/app.test.ts`에 다음 테스트를 추가한다.

```ts
it("returns protected paginated courses", async () => {
  const response = await createTestApp().request(
    "/courses?page=1&pageSize=10&query=%EB%AC%B8%EC%9E%A5"
  )

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    courses: [
      {
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장의 뼈대를 이해합니다.",
        sortOrder: 1,
      },
    ],
    pagination: {
      page: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    },
    query: "문장",
  })
})
```

잘못된 pageSize 테스트도 추가한다.

```ts
it("rejects invalid course list pagination query", async () => {
  const response = await createTestApp().request("/courses?page=0&pageSize=15")

  expect(response.status).toBe(400)
  await expect(response.json()).resolves.toEqual({
    code: "invalid-request",
    message:
      "page must be positive and pageSize must be one of 10,20,30,40,50.",
  })
})
```

- [x] **단계 2: 실패 확인**

실행: `bun --filter @workspace/admin-api test -- app.test.ts`

기대 결과: 목록 API가 기존 include validation에 걸려 실패한다.

- [x] **단계 3: 최소 구현**

`courses.route.ts`에서 `include`가 있으면 기존 트리 조회를 유지하고, `include`가 없으면 `page`, `pageSize`, `query`를 파싱해 `adminService.listCourses`를 호출한다. OpenAPI 200 schema는 목록과 트리 중 하나를 문서화하기 어렵기 때문에 route 설명에는 목록 기본 동작과 include 트리 동작을 설명하고, 테스트는 JSON 동작을 우선 검증한다.

- [x] **단계 4: 통과 확인**

실행: `bun --filter @workspace/admin-api test -- app.test.ts`

기대 결과: 해당 테스트 파일이 통과한다.

## 작업 4: Admin API client

- [x] **단계 1: 실패 테스트 작성**

`apps/admin/src/lib/api/http-admin-api.test.ts`에 다음 테스트를 추가한다.

```ts
it("requests paginated courses with query", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    createJsonResponse({
      courses: [],
      pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 1 },
      query: "문장",
    })
  )
  const api = createHttpAdminApi({
    baseUrl: "http://localhost:4001",
    fetch: fetchMock,
  })

  await api.listCourses({ page: 1, pageSize: 10, query: "문장" })

  const request = getRequest(fetchMock)
  expect(request.url).toBe(
    "http://localhost:4001/courses?page=1&pageSize=10&query=%EB%AC%B8%EC%9E%A5"
  )
})
```

- [x] **단계 2: 실패 확인**

실행: `bun --filter @workspace/admin test -- http-admin-api.test.ts`

기대 결과: `api.listCourses is not a function`으로 실패한다.

- [x] **단계 3: 최소 구현**

`admin-api.ts`에 `listCourses(input)`을 추가하고 `http-admin-api.ts`에서 `/courses` URL에 `page`, `pageSize`, non-empty `query`를 추가한다.

- [x] **단계 4: 통과 확인**

실행: `bun --filter @workspace/admin test -- http-admin-api.test.ts`

기대 결과: 해당 테스트 파일이 통과한다.

## 작업 5: DataTable UI와 코스 목록 페이지

- [x] **단계 1: 의존성 추가**

실행: `bun add @tanstack/react-table --filter @workspace/admin`

기대 결과: `apps/admin/package.json`과 `bun.lock`이 변경된다.

- [x] **단계 2: 실패 테스트 작성**

`apps/admin/src/features/courses/admin-courses-page.test.tsx`를 목록 중심 테스트로 바꾼다. 제목, 검색 입력 초기값, row, 상세 링크, 페이지 정보, 빈 결과 문구를 검증한다.

```ts
render(
  <AdminCoursesPage
    courses={[{ id: "course-1", title: "문장 구조", description: "문장 학습", sortOrder: 1 }]}
    pagination={{ page: 1, pageSize: 10, totalCount: 1, totalPages: 1 }}
    query="문장"
  />
)

expect(screen.getByRole("heading", { name: "콘텐츠" })).toBeTruthy()
expect(screen.getByRole("searchbox", { name: "코스 검색" })).toHaveProperty("value", "문장")
expect(screen.getByRole("link", { name: "문장 구조" })).toHaveProperty("href", expect.stringContaining("/courses/course-1"))
expect(screen.getByText("Page 1 of 1")).toBeTruthy()
```

- [x] **단계 3: 실패 확인**

실행: `bun --filter @workspace/admin test -- admin-courses-page.test.tsx`

기대 결과: props 타입과 렌더링 기대값이 기존 트리 UI와 맞지 않아 실패한다.

- [x] **단계 4: 최소 구현**

`admin-course-columns.tsx`와 `admin-courses-data-table.tsx`를 만든다. 지정 dashboard 템플릿에서 `columnVisibility`, `pagination`, `DropdownMenu` 컬럼 토글, `Table` 렌더링, page size select, first/previous/next/last buttons 구조를 가져오되 프로젝트 컴포넌트 import로 바꾼다. `getPaginationRowModel`, `getFilteredRowModel`, 드래그, 탭, 차트, drawer는 사용하지 않는다. `manualPagination`, `manualFiltering`, `rowCount`를 설정한다.

- [x] **단계 5: route 연결**

`apps/admin/src/app/(admin)/courses/page.tsx`에서 `searchParams`를 await하고 `api.listCourses`를 호출한다. 오류 시 기존처럼 `redirect(getAdminLoginPath("/courses"))`를 사용한다.

- [x] **단계 6: 통과 확인**

실행: `bun --filter @workspace/admin test -- admin-courses-page.test.tsx`

기대 결과: 해당 테스트 파일이 통과한다.

## 작업 6: 빈 코스 상세 페이지

- [x] **단계 1: 실패 테스트 작성**

`apps/admin/src/features/courses/admin-course-detail-page.test.tsx`를 추가한다.

```ts
render(<AdminCourseDetailPage courseId="course-1" />)

expect(screen.getByRole("heading", { name: "코스 상세" })).toBeTruthy()
expect(screen.getByText("챕터와 레슨 데이터는 이후 이 화면에서 확인합니다.")).toBeTruthy()
expect(screen.getByText("course-1")).toBeTruthy()
```

- [x] **단계 2: 실패 확인**

실행: `bun --filter @workspace/admin test -- admin-course-detail-page.test.tsx`

기대 결과: 파일 또는 컴포넌트가 없어 실패한다.

- [x] **단계 3: 최소 구현**

`admin-course-detail-page.tsx`와 `apps/admin/src/app/(admin)/courses/[id]/page.tsx`를 추가한다. 상세 페이지는 `AdminHeader`와 `Empty`를 사용해 자리 화면만 렌더링한다.

- [x] **단계 4: 통과 확인**

실행: `bun --filter @workspace/admin test -- admin-course-detail-page.test.tsx`

기대 결과: 해당 테스트 파일이 통과한다.

## 작업 7: 문서 완료 기록과 전체 검증

- [x] **단계 1: 문서 갱신**

`docs/admin-site.md`에 완료 기록을 추가한다. 목록 전용 API, 서버측 검색/페이지네이션, DataTable 기반 UI, 빈 상세 페이지, 실행한 검증 명령을 한국어로 적는다.

- [x] **단계 2: 집중 검증**

실행:

```bash
bun --filter @workspace/core test -- admin.service.test.ts
bun --filter @workspace/db test -- drizzle-admin.repository.test.ts
bun --filter @workspace/admin-api test -- app.test.ts
bun --filter @workspace/admin test -- http-admin-api.test.ts admin-courses-page.test.tsx admin-course-detail-page.test.tsx
```

기대 결과: 모든 명령이 exit 0이다.

- [x] **단계 3: 품질 검증**

실행:

```bash
bun --filter @workspace/core typecheck
bun --filter @workspace/db typecheck
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
```

기대 결과: 모든 명령이 exit 0이다.

- [x] **단계 4: pre-commit 검증**

실행: `bun lefthook run pre-commit`

기대 결과: format과 lint-staged workspace 검증이 통과한다.
