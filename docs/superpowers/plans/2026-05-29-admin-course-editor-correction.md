# 어드민 코스 에디터 정정 구현 계획

## 목표

어드민 코스 상세 에디터를 draft editor document 기반의 한국어 커리큘럼 편집 도구로 정정한다. 코스 기본 정보, 챕터, 레슨, 스텝을 한 화면 흐름에서 추가, 수정, 정렬, 보관하고, 저장 전 변경사항과 위험 작업을 명확하게 다룬다.

## 범위

- core/admin에 editor document DTO와 저장 계약을 추가한다.
- DB repository는 기존 curriculum version snapshot 테이블을 정식 편집 원천으로 사용한다.
- admin-api는 editor document 조회와 저장 route를 제공한다.
- admin HTTP client와 Next route는 editor document 단일 조회 흐름으로 연결한다.
- admin UI는 한국어 라벨, 챕터/레슨/스텝 조작, 읽기 전용 published 상태, 위험 작업 확인, 모바일 전환형 작업대를 제공한다.
- 스텝 content 폼은 실제 content key를 읽고 타입을 보존해 저장한다.
- `/prototype` 디렉터리는 수정하지 않는다.

## 변경 파일

- `docs/admin-site.md`
- `docs/admin-course-detail-ui-audit.md`
- `docs/superpowers/specs/2026-05-29-admin-course-editor-correction-design.md`
- `packages/core/src/admin/admin.dto.ts`
- `packages/core/src/admin/admin.repository.ts`
- `packages/core/src/admin/admin.service.ts`
- `packages/core/src/admin/admin.service.test.ts`
- `packages/db/src/repositories/drizzle-admin.repository.ts`
- `packages/db/src/repositories/drizzle-admin.repository.test.ts`
- `apps/admin-api/src/routes/curriculum-editor.route.ts`
- `apps/admin-api/src/app.test.ts`
- `apps/admin/src/lib/api/admin-api.ts`
- `apps/admin/src/lib/api/http-admin-api.ts`
- `apps/admin/src/lib/api/http-admin-api.test.ts`
- `apps/admin/src/app/(admin)/courses/[id]/page.tsx`
- `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- `apps/admin/src/features/courses/course-editor/*`

## 완료 체크리스트

- [x] 코스 상세 페이지의 추가 UI/기능 문제를 감사 문서에 기록했다.
- [x] editor document 설계와 저장 정책을 문서화했다.
- [x] core DTO, repository port, service method와 테스트를 추가했다.
- [x] DB editor document 조회와 저장 구현, revision conflict, draft-only 저장 테스트를 추가했다.
- [x] admin-api editor 조회/저장 route와 통합 테스트를 추가했다.
- [x] admin HTTP client 조회/저장 method와 URL/body 테스트를 추가했다.
- [x] Next route를 editor document 단일 조회 흐름으로 전환했다.
- [x] 헤더의 동적 코스 제목 설명을 제거하고 버전 상태를 상단에 한국어로 표시했다.
- [x] 썸네일 경로 직접 편집을 제거하고 썸네일 변경 버튼과 미리보기 중심 UI로 바꿨다.
- [x] 챕터, 레슨, 스텝 총 개수 카드 표시를 제거했다.
- [x] 챕터 추가, 제목 수정, 보관 UI를 추가했다.
- [x] 레슨 추가, 선택, 보관 UI를 추가했다.
- [x] 스텝 추가, 선택, 이동, 보관 UI를 추가했다.
- [x] 레슨 작업대, 미리보기, 스텝 상세 폼의 enum과 내부 상태 라벨을 한국어 표시 라벨로 교체했다.
- [x] seed 데이터에 enum 문자열이 제목처럼 들어온 스텝도 한국어 fallback 제목으로 표시한다.
- [x] `LEARNING SEQUENCE` 상시 노출 구조를 선택 레슨의 `학습 흐름` 작업대로 전환했다.
- [x] 스텝 클릭 시 URL과 오른쪽 작업대가 스텝 상세 수정 화면으로 전환된다.
- [x] 레슨 설정 화면과 미리보기 화면 전환을 실제 렌더링으로 연결했다.
- [x] published 버전은 읽기 전용으로 표시하고 편집 버튼을 비활성화했다.
- [x] 발행, 폐기, 복원, 저장 전 이탈에 확인 흐름을 추가했다.
- [x] 모바일에서 `커리큘럼`과 `작업대`를 전환할 수 있도록 레이아웃을 보정했다.
- [x] 스텝 content 폼의 숫자, 배열, boolean, JSON, 스텝 참조 필드가 타입을 보존하도록 수정했다.
- [x] admin, admin-api, core, DB 테스트와 타입 검사를 실행했다.
- [x] Playwright로 데스크톱과 모바일 로컬 화면을 검증했다.
- [x] 완료 내용을 `docs/admin-site.md`에 기록했다.

## 검증 기록

- `bun --filter @workspace/admin test`: 17개 파일, 91개 테스트 통과.
- `bun --filter @workspace/admin lint`: 통과.
- `bun --filter @workspace/admin typecheck`: 통과.
- `bun --filter @workspace/admin-api test`: 3개 파일, 39개 테스트 통과.
- `bun --filter @workspace/admin-api lint`: 통과.
- `bun --filter @workspace/admin-api typecheck`: 통과.
- `bun --filter @workspace/core test`: 4개 파일, 60개 테스트 통과.
- `bun --filter @workspace/core typecheck`: 통과.
- `bun --filter @workspace/db test`: 6개 파일, 54개 테스트 통과.
- `bun --filter @workspace/db typecheck`: 통과.
- Playwright 검증: `http://localhost:3001/courses/sentence-structure`에서 데스크톱 편집 화면, 스텝 상세 전환, 모바일 `커리큘럼`/`작업대` 전환, enum 영문 노출 제거를 확인했다.
