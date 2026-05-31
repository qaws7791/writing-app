# 미시적 코드 품질 개선 구현 계획

> **에이전트 작업자용:** 필수 하위 스킬은 순차 실행이다. 각 단계는 체크박스 문법으로 추적하고, 테스트를 먼저 추가한 뒤 구현한다.

**목표:** 네 가지 미시적 코드 품질 문제를 작은 변경 단위로 순차 개선한다.

**아키텍처:** 기존 패키지 경계를 유지한다. 검증 규칙은 Zod 스키마와 명명된 유틸리티로 옮기고, React 클라이언트 경계는 실제 상호작용이 필요한 부분으로 줄인다.

**기술 스택:** Bun, Vitest, TypeScript, Next.js, React, Zod, Drizzle ORM.

---

### 작업 1: API 에러 응답 Zod 파싱

**파일:**

- 수정: `apps/web/src/lib/api/api-error.test.ts`
- 수정: `apps/web/src/lib/api/api-error.ts`
- 수정: `apps/web/package.json`

- [x] `message`가 문자열이 아닌 백엔드 에러 응답을 계약 오류로 처리하는 실패 테스트를 추가한다.
- [x] `z.object({ code: z.string(), message: z.string() })` 기반 스키마를 추가한다.
- [x] `safeParse` 결과만 에러 매핑에 사용하고 수동 속성 타입 가드를 제거한다.
- [x] `bun --filter @workspace/web test -- src/lib/api/api-error.test.ts`를 실행한다.

### 작업 2: 관리자 코스 목록 URL 쿼리 유틸리티

**파일:**

- 생성: `apps/admin/src/features/courses/admin-course-list-search-params.ts`
- 생성: `apps/admin/src/features/courses/admin-course-list-search-params.test.ts`
- 수정: `apps/admin/src/app/(admin)/courses/page.tsx`
- 수정: `apps/admin/src/features/courses/admin-courses-data-table.tsx`

- [x] 검색 파라미터 파싱과 경로 생성을 검증하는 실패 테스트를 추가한다.
- [x] Zod DTO 스키마를 사용하는 검색 파라미터 파서와 경로 생성 함수를 만든다.
- [x] 페이지와 데이터 테이블의 수동 파싱/생성 로직을 새 유틸리티로 교체한다.
- [x] `bun --filter @workspace/admin test -- src/features/courses/admin-course-list-search-params.test.ts`를 실행한다.

### 작업 3: 코스 커리큘럼 클라이언트 경계 축소

**파일:**

- 생성: `apps/web/src/features/courses/course-curriculum.test.tsx`
- 수정: `apps/web/src/features/courses/course-curriculum.tsx`

- [x] 커리큘럼이 네이티브 `details` 요소로 단원을 렌더링하는 실패 테스트를 추가한다.
- [x] `use client`, `useState`, `Collapsible` 의존성을 제거한다.
- [x] 초기에 열릴 단원은 `open` 속성으로 표현한다.
- [x] `bun --filter @workspace/web test -- src/features/courses/course-curriculum.test.tsx`를 실행한다.

### 작업 4: 커리큘럼 노드 상태 단일 진실 공급원

**파일:**

- 생성: `packages/core/src/content/curriculum-node-status.ts`
- 생성: `packages/core/src/content/curriculum-node-status.test.ts`
- 수정: `packages/core/src/content/index.ts`
- 수정: `packages/core/src/admin/admin.dto.ts`
- 수정: `packages/db/src/schema/content.schema.ts`
- 수정: `apps/admin/src/features/courses/course-editor/editor-labels.ts`
- 수정: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`

- [x] 상태 상수와 Zod 스키마가 같은 값을 공유하는 실패 테스트를 추가한다.
- [x] `curriculumNodeStatuses` 상수와 `curriculumNodeStatusSchema`를 정의한다.
- [x] Admin DTO, Drizzle 스키마, 관리자 라벨 타입이 이 상수를 참조하도록 바꾼다.
- [x] `bun --filter @workspace/core test -- src/content/curriculum-node-status.test.ts`를 실행한다.

### 최종 검증

- [x] `bun --filter @workspace/web test`
- [x] `bun --filter @workspace/admin test`
- [x] `bun --filter @workspace/core test`
- [x] `bun --filter @workspace/db test`
- [x] `bun --filter @workspace/web lint`
- [x] `bun --filter @workspace/admin lint`
- [x] `bun --filter @workspace/core lint`
- [x] `bun --filter @workspace/db lint`
- [x] `bun --filter @workspace/db typecheck`
- [x] `bun --filter @workspace/web typecheck`
- [x] `bun --filter @workspace/admin typecheck`
- [x] `bun --filter @workspace/core typecheck`
- [x] `bun --filter @workspace/web build`
- [x] `bun --filter @workspace/admin build`
- [x] 문서를 완료 상태로 갱신한다.
