# 코드베이스 개선 진행 기록

## 목적

`combined-codebase-improvements.md`에 정리된 개선 항목을 우선순위와 문서 순서대로 처리한다. 각 항목은 관련 코드 조사, 테스트 추가, 최소 변경 구현, 검증, 커밋 순서로 완료한다.

## 진행 원칙

- `/prototype` 디렉터리는 수정하지 않는다.
- 사용자 입력 자료인 `combined-codebase-improvements.md`와 `codebase.md`는 변경하지 않는다.
- 한 커밋은 하나의 개선 항목을 기준으로 한다.
- 동작 변경은 먼저 실패하는 테스트로 재현한 뒤 구현한다.
- 문서 갱신은 각 항목의 시작과 완료 상태를 남기는 방식으로 수행한다.

## 현재 진행 상태

| 순서 | ID        | 상태 | 요약                                                |
| ---: | --------- | ---- | --------------------------------------------------- |
|    1 | ADMIN-08  | 완료 | 체크박스 필드를 제어 컴포넌트로 전환했다.           |
|    2 | API-01    | 완료 | 프론트 HTTP API 응답 런타임 파싱을 도입했다.        |
|    3 | ARCH-01   | 완료 | 패키지 공개 경계와 내부 경로 직접 참조를 정리했다.  |
|    4 | AUTH-01   | 완료 | 어드민 인증 확인을 전용 세션 API로 분리했다.        |
|    5 | DATA-01   | 완료 | 마이그레이션 적용 이력 관리를 도입했다.             |
|    6 | DATA-02   | 완료 | 서버 시작 시 자동 데이터 변경 작업을 분리했다.      |
|    7 | DATA-03   | 완료 | Step content JSON 계약을 경계별로 엄격히 검증했다.  |
|    8 | DOMAIN-01 | 완료 | 플레이 가능한 레슨 불변식을 core 경계에서 검증한다. |
|    9 | ADMIN-01  | 완료 | CourseEditorProvider의 URL/저장 책임을 분리했다.    |
|   10 | ADMIN-02  | 완료 | 에디터 선택 파생 계산과 step source를 정리했다.     |
|   11 | ADMIN-03  | 완료 | 커리큘럼 맵 내부 prop 전달을 줄였다.                |
|   12 | ADMIN-04  | 완료 | dirty 변경 내역과 change kind 계산을 연결했다.      |

## ADMIN-08 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/step-forms/step-form-fields.tsx`
- 검증 방향: `StepWorkspace` 렌더링 후 같은 체크박스 필드의 `content` 값이 바뀌면 DOM의 `checked` 값도 함께 바뀌어야 한다.
- 완료 내용: 체크박스가 `checked`와 `onChange`를 함께 사용하는 제어 입력으로 동작한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/step-workspace.test.tsx`

## API-01 작업 메모

- 대상 파일: `apps/web/src/lib/api/http/create-http-writing-app-api.ts`, `apps/web/src/features/lessons/lesson-api-mappers.ts`
- 조사 방향: OpenAPI 타입 단언 뒤 mapper로 넘기는 응답 경계를 찾고, 프론트 내부에서 재사용 가능한 schema parse 지점을 정한다.
- 완료 내용: HTTP 성공 응답이 내부 모델로 변환되기 전에 Zod schema로 검증되고, 계약 위반이 명시적 `contract-error`로 노출된다.
- 검증: `bun --filter @workspace/web test src/lib/api/http/create-http-writing-app-api.test.ts && bun --filter @workspace/web typecheck`

## ARCH-01 작업 메모

- 대상 파일: `packages/core/src/index.ts`, `packages/db/src/index.ts`, 각 앱의 `tsconfig.json`, 경계 우회 import 사용처
- 조사 방향: public subpath export로 대체 가능한 내부 `src` 경로 alias와 넓은 root export를 찾는다.
- 완료 내용: 앱의 core/db 내부 `src` path alias를 제거하고, DB client/migration/repository 사용처를 명시적 subpath export로 이동했다. `@workspace/core` root export는 비우고 domain subpath 사용을 강제한다.
- 범위 제외: `@workspace/ui` 내부 alias는 `UI-03`에서 별도 처리한다.
- 검증: `bun --filter @workspace/api typecheck && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/admin typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/core typecheck && bun --filter @workspace/logger typecheck`

## AUTH-01 작업 메모

- 대상 파일: `apps/admin-api/src/routes/session.route.ts`, `apps/admin-api/src/app.ts`, `apps/admin/src/lib/api/*`, `apps/admin/src/app/(admin)/layout.tsx`
- 조사 방향: `api.listUsers()`로 인증을 확인하는 흐름을 현재 관리자 세션 조회 API로 분리한다.
- 완료 내용: Admin API에 `GET /session`을 추가하고 보호 레이아웃은 `api.getSession()`만 호출한다. 사용자 페이지는 401만 로그인으로 보내고 나머지 조회 실패는 명시적 오류로 분리한다.
- 검증: `bun --filter @workspace/admin-api test && bun --filter @workspace/admin test && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/admin typecheck && bun --filter @workspace/admin-api lint && bun --filter @workspace/admin lint`

## DATA-01 작업 메모

- 대상 파일: `packages/db/src/migrations/run-content-migration.ts`, `packages/db/src/migrations/*.sql`, `packages/db/package.json`
- 조사 방향: 현재 커스텀 migration runner에 적용 이력과 checksum 검증을 추가할 수 있는 가장 작은 경계를 찾는다.
- 완료 내용: `schema_migrations` ledger를 추가하고 SQL/코드 migration manifest의 checksum을 기록한다. 이미 적용된 migration의 checksum이 바뀌면 명시적 오류로 중단한다.
- 검증: `bun --filter @workspace/db test src/client.test.ts && bun --filter @workspace/db test && bun --filter @workspace/db typecheck && bun --filter @workspace/db lint`

## DATA-02 작업 메모

- 대상 파일: `apps/api/src/main.ts`, `apps/admin-api/src/main.ts`, `packages/db/src/seeds/seed-content.ts`, 운영 문서
- 조사 방향: 서버 시작이 seed나 migration 같은 데이터 변경 작업을 자동 수행하는 경로를 찾고 명시 실행 단계로 분리한다.
- 완료 내용: API와 Admin API 서버 시작에서 migration/seed 실행을 제거했다. `db:migrate` 명령을 추가하고 로컬 `dev:app`은 명시 setup 후 서버를 시작한다.
- 검증: `bun --filter @workspace/api test src/main.test.ts && bun --filter @workspace/api typecheck && bun --filter @workspace/admin-api typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/api lint && bun --filter @workspace/admin-api lint && bun --filter @workspace/db lint`

## DATA-03 작업 메모

- 대상 파일: `packages/core/src/admin/admin.dto.ts`, `packages/db/src/repositories/drizzle-admin.repository.ts`, `apps/admin-api/src/routes/curriculum-editor.route.ts`
- 조사 방향: admin save/read 경계에서 step type별 content schema를 적용할 수 있는 가장 작은 core 계약을 찾는다.
- 완료 내용: step type별 content schema를 `packages/core/content`에서 export하고 admin editor step DTO가 같은 schema를 사용한다. Admin repository read path도 parsed step DTO를 반환해 DB JSON 계약을 다시 확인한다.
- 검증: `bun --filter @workspace/admin-api typecheck && bun --filter @workspace/db typecheck && bun --filter @workspace/admin-api test && bun --filter @workspace/db test && bun --filter @workspace/core test && bun --filter @workspace/core lint && bun --filter @workspace/db lint`

## DOMAIN-01 작업 메모

- 대상 파일: `packages/core/src/content/content.dto.ts`, `packages/core/src/learning/learning.service.ts`, 관련 core 테스트
- 조사 방향: playable lesson의 최소 step 수, INTRO first, COMPLETE last, step order, AI feedback source reference를 core 경계에서 검증한다.
- 완료 내용: content service가 lesson DTO parse 이후 playable lesson 불변식을 검증한다. 빈 steps, INTRO first 위반, COMPLETE last 위반, AI feedback source 누락은 `invalid-content`로 반환된다.
- 검증: `bun --filter @workspace/core test src/content/content.service.test.ts && bun --filter @workspace/core test && bun --filter @workspace/core typecheck && bun --filter @workspace/core lint`

## ADMIN-01 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`, `apps/admin/src/features/courses/course-editor/use-course-editor-url-state.ts`, `apps/admin/src/features/courses/course-editor/use-course-editor-save-command.ts`
- 조사 방향: CourseEditorProvider가 보유한 URL 동기화, 저장 상태, 저장 API 호출 책임을 동작 변경 없이 분리할 수 있는 가장 작은 경계를 찾는다.
- 완료 내용: URL 상태/히스토리 갱신은 `useCourseEditorUrlState`로, 저장 명령과 저장 중 상태는 `useCourseEditorSaveCommand`로 분리했다. URL 변경과 저장 성공/충돌 상태를 훅 테스트로 고정했다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/course-editor-session-hooks.test.tsx src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`
- 참고: `bun --filter @workspace/admin typecheck`는 기존 admin 테스트 fixture와 `editor-state.ts`의 step content 타입 불일치로 실패한다.

## ADMIN-02 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/editor-state.ts`, `apps/admin/src/features/courses/course-editor/editor-selectors.ts`, `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`
- 조사 방향: working copy 안의 step 데이터 원천이 중복되는 지점과 선택 상태 계산이 전체 트리를 반복 순회하는 지점을 찾는다.
- 완료 내용: working copy 내부 curriculum에서 `steps` 복제본을 제거하고 `workingCopy.steps`를 단일 step source로 고정했다. 선택 chapter/lesson/step 계산은 `createCourseEditorSelection` selector로 분리하고, lesson/step 인덱스를 한 번 구성해 조회한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/editor-selectors.test.ts src/features/courses/course-editor/editor-state.test.ts src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`
- 참고: `bun --filter @workspace/admin typecheck`는 기존 admin fixture와 draft step content 타입 불일치로 실패한다. step form의 content 타입 정리는 `ADMIN-07`에서 별도로 처리한다.

## ADMIN-03 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`
- 조사 방향: CourseEditorShell과 panel 경계는 이미 context 기반으로 정리되어 있으므로, 남은 prop drilling이 실제로 발생하는 `CurriculumMap` 내부 private 컴포넌트 계층을 확인한다.
- 완료 내용: `CurriculumMap` 외부 props 계약은 유지하고, 파일 내부에 private context를 추가해 `ChapterSection`과 `SortableLessonButton`이 읽기 전용 상태와 액션 콜백을 직접 읽도록 정리했다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/curriculum-map.test.tsx src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`

## ADMIN-04 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/editor-change-kind.ts`, `apps/admin/src/features/courses/course-editor/editor-state.ts`, `apps/admin/src/features/courses/course-editor/course-editor-session.tsx`
- 조사 방향: 기존 `useCourseEditorChangeKind()`가 빈 요약값을 사용해 실제 dirty 변경 내역과 연결되지 않는 지점을 확인한다.
- 완료 내용: dirty state에 `EditorChange` 판별 union을 추가하고, 기존 `changedFields`는 헤더 카운트 호환을 위해 유지했다. change kind는 `workingCopy.dirty.changes`를 요약해 계산한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/editor-state.test.ts src/features/courses/course-editor/course-editor-shell.test.tsx && bun --filter @workspace/admin lint`
- 참고: 전체 `bun --filter @workspace/admin typecheck`는 기존 admin fixture와 draft step content 타입 불일치로 실패한다.

## 다음 단계

다음 작업은 P1의 `ADMIN-07`을 문서 순서대로 진행한다.
