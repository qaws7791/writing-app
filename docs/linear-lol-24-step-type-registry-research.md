# Linear LOL-24 스텝 타입 분기 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-24 거대한 Switch 문의 저주`
- 조사 범위: Kwep 10개 표준 스텝 타입을 처리하는 core DTO, 학습자 웹 렌더러, 학습 진행 로직, 어드민 스텝 폼, DB seed/API 계약
- 목표: 이슈의 “새 스텝 타입 추가 시 여러 switch를 고쳐야 하므로 registry로 바꾸자”는 주장이 현재 코드 기준으로 타당한지 확인하고, 영향이 작은 해결 방향을 정한다.

## 관찰

- `packages/core/src/content/content.dto.ts`는 `lessonStepTypeSchema`와 `lessonStepDtoSchema`에서 10개 스텝 타입을 명시적으로 검증한다. 이 부분은 외부 API 계약과 저장 데이터 계약이므로 새 타입 추가 시 반드시 변경되어야 한다.
- `apps/web/src/features/lessons/lesson-types.ts`는 학습자 화면 내부 모델을 discriminated union으로 들고 있다. 새 타입이 학습자 화면에 노출된다면 내부 타입 추가는 피할 수 없다.
- `apps/web/src/features/lessons/lesson-api-mappers.ts`는 API DTO를 학습자 내부 모델로 변환하면서 `switch (step.type)`를 사용한다. 타입별 content shape가 다르므로 분기 자체는 도메인상 필요한 변환 경계다.
- `apps/web/src/features/lessons/lesson-step-renderer.tsx`에는 제목, 설명, 콘텐츠 렌더링, full-bleed 처리 여부가 스텝 타입별로 흩어져 있다. 이 파일은 이슈가 지적한 중복 분기 문제가 실제로 크다.
- `apps/web/src/features/lessons/lesson-experience.tsx`에는 제출 가능 여부, 정답 확인 대상, 채점, 버튼 문구가 스텝 타입별 조건으로 남아 있다. 이 부분은 렌더러 registry만으로 해결되지 않는다.
- `apps/admin/src/features/courses/course-editor/step-form-registry.tsx`는 폼 선택만 `switch`로 처리한다. fallback `GenericStepForm`이 있어 런타임 실패 위험은 낮지만, 새 전용 폼 추가 시 case를 추가해야 한다.
- `packages/core/src/learning/learning.service.ts`는 답변 저장 가능한 스텝 타입 set을 별도로 갖고 있다. 새 스텝이 답변 저장 대상이면 서버 정책도 명시적으로 바뀌어야 한다.
- `apps/api/src/openapi/openapi-document.ts`와 generated API 타입도 스텝 타입 enum을 포함한다. 따라서 새 타입 추가는 프론트 registry 등록만으로 끝나는 작업이 아니다.
- `docs/codebase-improvement-progress.md`에는 `step-definitions.ts` 분리 완료 기록이 있지만 현재 해당 파일은 없다. 문서와 코드가 어긋나 있어 후속 정리가 필요하다.

## 판단

이슈는 부분적으로 타당하다.

- 타당한 부분: 학습자 렌더러와 어드민 폼 선택처럼 “스텝 타입 -> UI 처리”만 담당하는 영역은 registry/definition 객체로 응집하는 편이 변경 지점을 줄이고 누락을 줄인다.
- 과장된 부분: `content.dto.ts`, `lesson-types.ts`, API OpenAPI enum, answerable policy는 switch 냄새가 아니라 명시적 계약이다. 새 도메인 타입을 추가하면서 이 계약들을 수정하지 않는 것이 오히려 숨은 동작을 만든다.
- 위험한 해결책: `Record<StepType, React.FC>` 하나만 만들면 끝난다는 접근은 제목/설명/채점/제출 가능 여부/API 매핑/서버 저장 정책을 다루지 못한다. 컴포넌트 매핑만 추상화하면 분기가 다른 파일에 계속 남는다.

## 권장 해결 방향

### 1단계: 학습자 step definition registry 추가

`apps/web/src/features/lessons/lesson-step-definitions.tsx` 같은 파일을 만들고, 타입별 학습자 UI 정책을 한 곳에 모은다.

- `render(step, handlers)`
- `getTitle(step)`
- `getDescription(step)`
- `usesFullBleedLayout(step)`
- `getActionLabel(step)`
- `canSubmit(step, payload)`
- `getCheckResult(step, payload)` 또는 `check?: ...`
- `getExplanation(step)`
- `getWrongText(step)`

이렇게 하면 `lesson-step-renderer.tsx`와 `lesson-experience.tsx`의 타입별 UI/진행 정책을 같은 definition에서 읽게 할 수 있다.

### 2단계: 어드민 form registry를 객체 기반으로 축소

`step-form-registry.tsx`의 switch는 다음 형태의 typed mapping으로 바꾼다.

- `const STEP_FORM_BY_TYPE = { READING: ReadingStepForm, ... } satisfies Partial<Record<EditorStep["type"], StepFormComponent>>`
- 없는 타입은 현재처럼 `GenericStepForm`으로 fallback한다.

전용 폼이 없는 타입도 안전하게 열 수 있어야 하므로 전체 `Record` 강제보다 `Partial<Record<...>>`가 현재 어드민 UX에는 더 적합하다.

### 3단계: 계약 영역은 명시성을 유지

아래 파일들은 registry로 숨기지 않는다.

- core DTO schema
- API OpenAPI enum과 generated API 타입
- DB seed 타입 정규화
- 서버의 답변 저장 가능 타입 정책

이 영역은 새 타입 추가 시 반드시 검토해야 하는 공개 계약이므로, 한 파일로 “자동 등록”하기보다 checklist와 테스트로 누락을 막는 편이 낫다.

### 4단계: 문서 불일치 정리

현재 코드에 없는 `apps/admin/src/features/courses/course-editor/step-definitions.ts`를 완료 기록에서 언급하고 있으므로, 후속 작업에서 다음 중 하나를 선택한다.

- 실제 definition 파일을 다시 도입한다.
- 문서를 현재 구조에 맞게 수정한다.

## 완료

- LOL-24의 문제 제기는 학습자 렌더러와 어드민 폼 선택 영역에서는 타당하다.
- 단, 새 스텝 타입 추가 비용의 상당 부분은 의도적인 도메인/API 계약 변경 비용이다.
- 해결은 “모든 switch 제거”가 아니라 “UI/진행 정책 registry로 응집하고, 계약 영역은 명시적으로 유지”하는 방향이 가장 작고 안전하다.

## 2026-06-15 실행 완료

- 학습자 웹의 제목, 설명, standalone layout, 제출 가능 여부, 채점, CTA 문구 정책을 `apps/web/src/features/lessons/lesson-step-policy.ts`로 분리했다.
- `LessonStepRenderer`는 layout/title/description 정책을 policy에서 읽고, 타입별 JSX content는 기존 컴포넌트 구조를 유지한다.
- `LessonExperience`는 진행 가능 여부와 채점 정책을 policy에서 읽는다.
- 어드민 `step-form-registry.tsx`는 switch 대신 typed mapping을 사용하고, 전용 폼이 없는 타입은 `GenericStepForm`으로 표시한다.
- core DTO, OpenAPI, DB seed, 서버 answerable policy는 공개 계약이므로 이번 작업에서 자동 registry로 숨기지 않았다.
