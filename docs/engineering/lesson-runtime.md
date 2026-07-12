# 레슨 런타임과 스텝 편집 계약

## 작업 상태

- 2026-07-12: 학습자 레슨과 관리자 미리보기의 중복 runtime을 단일 module로 통합하고, 코스 스텝 편집 입력을 discriminated union으로 검증하는 작업을 시작했다.
- 2026-07-12: 공통 runtime과 canonical 편집 seam을 적용하고 web/admin/UI 회귀 검증을 완료했다.

## 목표

- 학습자와 관리자 미리보기는 동일한 레슨 step type, 답변 검증, 채점 policy, renderer를 사용한다.
- 앱별 navigation, 저장, draft namespace와 AI 요청은 runtime seam의 Adapter로 유지한다.
- 관리자 코스 편집기는 transport 입력을 canonical `EditorStep` union으로 검증한 뒤에만 폼을 렌더링한다.
- 손상된 스텝은 저장 가능한 빈 폼 대신 명시적인 읽기 전용 오류로 표시한다.

## 구현 계약

- `@workspace/ui/lesson-runtime/types`, `logic`, `policy`, `renderer`가 레슨 step union과 답변·채점·렌더링 Interface를 소유한다.
- web Adapter는 학습자 ID를 draft namespace로 전달하고, admin Adapter는 관리자 preview 전용 namespace를 전달한다. navigation과 저장 handler는 각 앱에 남는다.
- 관리자 코스 transport Adapter는 `contentJson`과 외부 메타데이터를 `lessonStepDtoSchema`로 검증한다. 성공 결과만 `EditorStep` discriminated union이 되며 실패는 `invalid` 결과로 보존한다.
- `stepFormByType`은 mapped registry로 모든 step type을 요구한다. 각 form은 `Extract<EditorStep, { type: ... }>`에 해당하는 variant만 받는다.
- renderer의 exhaustive switch와 편집 registry는 새 step type 추가 시 누락을 compile error로 만든다.

## 검증

- UI 공통 runtime contract: 동일 fixture를 학습자·관리자 namespace로 실행해 같은 답변과 채점 결과를 확인한다.
- 관리자 canonical parser table: 10개 step type과 invalid JSON, 배열, type 누락, 잘못된 필드 타입을 확인한다.
- 관리자 form table: 10개 `EditorStep` variant가 전용 form으로 렌더링되는지 확인한다.
- web/admin visual interaction 회귀 테스트와 전체 unit/integration suite를 실행한다.
- web/admin/UI typecheck와 lint, web/admin production build, workspace import cycle 검사를 실행한다.
