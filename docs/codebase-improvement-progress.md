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

| 순서 | ID        | 상태    | 요약                                                |
| ---: | --------- | ------- | --------------------------------------------------- |
|    1 | ADMIN-08  | 완료    | 체크박스 필드를 제어 컴포넌트로 전환했다.           |
|    2 | API-01    | 진행 중 | 프론트 HTTP API 응답 런타임 파싱을 도입한다.        |
|    3 | ARCH-01   | 대기    | 패키지 공개 경계와 내부 경로 직접 참조를 정리한다.  |
|    4 | AUTH-01   | 대기    | 어드민 인증 확인을 전용 세션 API로 분리한다.        |
|    5 | DATA-01   | 대기    | 마이그레이션 적용 이력 관리를 도입한다.             |
|    6 | DATA-02   | 대기    | 서버 시작 시 자동 데이터 변경 작업을 분리한다.      |
|    7 | DATA-03   | 대기    | Step content JSON 계약을 경계별로 엄격히 검증한다.  |
|    8 | DOMAIN-01 | 대기    | 플레이 가능한 레슨 불변식을 core 경계에서 검증한다. |

## ADMIN-08 작업 메모

- 대상 파일: `apps/admin/src/features/courses/course-editor/step-forms/step-form-fields.tsx`
- 검증 방향: `StepWorkspace` 렌더링 후 같은 체크박스 필드의 `content` 값이 바뀌면 DOM의 `checked` 값도 함께 바뀌어야 한다.
- 완료 내용: 체크박스가 `checked`와 `onChange`를 함께 사용하는 제어 입력으로 동작한다.
- 검증: `bun --filter @workspace/admin test src/features/courses/course-editor/step-workspace.test.tsx`

## API-01 작업 메모

- 대상 파일: `apps/web/src/lib/api/http/create-http-writing-app-api.ts`, `apps/web/src/features/lessons/lesson-api-mappers.ts`
- 조사 방향: OpenAPI 타입 단언 뒤 mapper로 넘기는 응답 경계를 찾고, 프론트 내부에서 재사용 가능한 schema parse 지점을 정한다.
- 완료 조건: HTTP 응답이 내부 모델로 변환되기 전에 런타임 schema로 검증되고, 계약 위반이 명시적 API 오류로 노출된다.
