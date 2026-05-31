# 미시적 코드 품질 개선

## 목적

API 에러 처리, 관리자 코스 목록의 URL 쿼리 상태, 코스 커리큘럼 렌더링 경계, 커리큘럼 노드 상태값 정의를 더 명시적이고 결정적으로 만든다.

## 시작 상태

- API 에러 응답은 수동 속성 검사로 `code`, `message`를 읽는다.
- 관리자 코스 목록 URL은 컴포넌트 내부에서 직접 `URLSearchParams`를 조합한다.
- 코스 커리큘럼은 토글 상태 때문에 전체 컴포넌트가 클라이언트 컴포넌트다.
- 커리큘럼 노드 상태값은 Drizzle 스키마와 Zod DTO에서 문자열 배열로 중복 정의되어 있다.

## 진행 방침

- 네 항목을 병렬 워크트리 없이 하나의 브랜치에서 순차적으로 개선한다.
- 각 변경은 가능한 한 기존 테스트 옆에 실패 테스트를 먼저 추가한다.
- 새 의존성은 피하고, 이미 사용하는 Zod와 브라우저 표준 API를 우선한다.
- `/prototype` 디렉터리는 수정하지 않는다.

## 완료 상태

- API 에러 응답은 Zod 스키마의 `safeParse`를 통과한 본문만 매핑한다. 계약이 깨진 본문은 `contract-error`로 처리하고, 5xx 응답은 기존처럼 서버 사용 불가 오류로 정규화한다.
- 관리자 코스 목록의 검색 파라미터 파싱과 경로 생성은 `admin-course-list-search-params.ts`로 분리했다. 파싱 결과는 `adminCourseListInputDtoSchema`와 `adminCourseListPageSizeSchema`로 검증한다.
- 코스 커리큘럼은 `use client`와 React 상태를 제거하고 네이티브 `details`/`summary`로 단원 토글을 처리한다. 최초 열린 단원은 서버 렌더링 시 `open` 속성으로 결정한다.
- 커리큘럼 노드 상태값은 `curriculumNodeStatuses`와 `curriculumNodeStatusSchema`에서 관리한다. Admin DTO, Drizzle 스키마, 관리자 라벨 타입은 이 정의를 참조한다.

## 검증 결과

- `bun --filter @workspace/web test`: 통과, 18개 파일 34개 테스트
- `bun --filter @workspace/admin test`: 통과, 18개 파일 86개 테스트
- `bun --filter @workspace/core test`: 통과, 6개 파일 27개 테스트
- `bun --filter @workspace/db test`: 통과, 6개 파일 24개 테스트
- `bun --filter @workspace/web lint`: 통과
- `bun --filter @workspace/admin lint`: 통과
- `bun --filter @workspace/core lint`: 통과
- `bun --filter @workspace/db lint`: 통과
- `bun --filter @workspace/web typecheck`: 통과
- `bun --filter @workspace/admin typecheck`: 통과
- `bun --filter @workspace/core typecheck`: 통과
- `bun --filter @workspace/db typecheck`: 통과
- `bun --filter @workspace/web build`: 통과
- `bun --filter @workspace/admin build`: 통과
