# WA-14 스텝 Union 계약 분석

## 2026-06-17 시작

- Notion 이슈: `WA-14 유연성이 떨어지는 거대 Union 타입`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-14 페이지
- 조사 범위: `packages/core/src/content/content.dto.ts`, 학습자 스텝 정책과 렌더러, 어드민 스텝 폼 registry, DB seed 타입 정규화, OpenAPI 문서
- 목표: `lessonStepDtoSchema`의 discriminated union이 실제 변경성 문제인지 판단하고, 새 스텝 타입 추가가 더 안전해지는 구조 개선 방향을 도출한다.

## 이슈 요약

WA-14는 `packages/core/src/content/content.dto.ts`의 `lessonStepDtoSchema`가 10개 스텝 타입을 한 파일의 거대한 discriminated union으로 묶고 있어, 새 스텝 타입 추가 시 같은 파일을 계속 수정해야 한다고 지적한다.

## 코드 조사

### 현재 core 계약

- `lessonStepTypeSchema`는 `READING`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `WRITE`, `AI_FEEDBACK`, `MATCH`, `CATEGORIZE` 10개 타입을 명시한다.
- 같은 파일 안에서 각 타입별 Zod schema를 정의하고, 마지막에 `z.discriminatedUnion("type", [...])`로 조합한다.
- `lessonDtoSchema`는 `steps: z.array(lessonStepDtoSchema)`를 사용하므로 콘텐츠 repository read path와 API route의 핵심 계약이 이 union에 묶인다.

### 이미 분리된 영역

- 학습자 웹 렌더러는 `stepContentRendererByType` typed registry를 사용한다.
- 학습자 웹 진행 정책은 `lesson-step-policy.ts`에 별도로 모였지만, 내부에는 여전히 타입별 switch가 있다.
- 어드민 스텝 폼은 `step-form-registry.tsx`에서 `Partial<Record<EditorStep["type"], StepFormComponent>>` mapping과 `GenericStepForm` fallback을 사용한다.
- DB seed는 Kwep 원본 타입과 표준 타입을 `stepTypeMap`으로 정규화한다.

### 공개 계약으로 남아야 하는 영역

새 스텝 타입을 추가할 때 다음 파일이 바뀌는 것은 우연한 중복이 아니라 공개 계약 변경이다.

- `packages/core/src/content/content.dto.ts`
- `packages/core/src/learning/learning.dto.ts`와 답변 저장 가능 정책
- `apps/api/src/openapi/openapi-document.ts`
- `apps/web/src/lib/api/generated/writing-app-api.d.ts`
- DB seed 타입 정규화와 repository read path
- 학습자 렌더링 및 진행 정책
- 어드민 편집 폼

따라서 "새 타입 추가 시 core DTO를 수정하지 않게 한다"는 목표는 적절하지 않다. 변경은 필요하다. 다만 변경할 곳이 스텝별로 응집되어 있지 않아 누락을 찾기 어렵다는 점은 실제 문제다.

## 판단

WA-14는 타당하지만, 표현은 조정이 필요하다.

`lessonStepDtoSchema`가 discriminated union인 것은 API와 저장 데이터의 명시적 계약이므로 그 자체가 나쁜 구조는 아니다. 오히려 이 계약을 암묵적 registry 자동 등록으로 숨기면 새 스텝 타입의 저장, 렌더링, 답변, OpenAPI 처리 누락을 더 늦게 발견할 수 있다.

하지만 현재 `content.dto.ts`는 스텝별 schema가 한 파일에 밀집되어 있고, OpenAPI schema와 learning answer schema가 별도의 진실의 원천으로 존재한다. 새 스텝 타입을 추가할 때 어떤 계약을 함께 수정해야 하는지 강제하는 "스텝 정의 단위"가 없기 때문에 장기 변경성 문제는 실제로 있다.

## 해결 방안

### 방안 1. core에 스텝별 DTO 파일과 명시 조합 index를 만든다

`packages/core/src/content/steps` 아래에 스텝 타입별 schema를 분리한다.

예상 구조:

- `steps/reading-step.dto.ts`
- `steps/compare-step.dto.ts`
- `steps/write-step.dto.ts`
- `steps/ai-feedback-step.dto.ts`
- `steps/index.ts`

`steps/index.ts`는 모든 스텝 schema를 명시적으로 import하고 `lessonStepDtoSchema`와 `lessonStepTypeSchema`를 조합한다.

장점은 스텝별 필드와 테스트 fixture가 가까워지고, `content.dto.ts`가 코스/레슨 상위 DTO에 집중할 수 있다는 점이다. 단점은 조합 index는 여전히 수정해야 한다. 이 수정은 공개 계약 변경이므로 의도적으로 남기는 편이 안전하다.

추천 강도: 높음.

### 방안 2. 스텝 정의 registry를 core 계약의 체크리스트로 사용한다

스텝 타입별로 DTO schema, answer schema 존재 여부, answerable 여부, OpenAPI schema 조각, seed type mapping을 하나의 definition에서 선언하게 한다.

예상 형태:

```ts
const lessonStepDefinitions = {
  READING: {
    dtoSchema: readingStepDtoSchema,
    answerable: false,
  },
  WRITE: {
    dtoSchema: writeStepDtoSchema,
    answerSchema: writeAnswerSchema,
    answerable: true,
  },
} satisfies Record<LessonStepType, LessonStepDefinition>
```

이 registry는 런타임 마법이 아니라 누락 방지 장치로 사용한다. OpenAPI 문서와 generated type은 여전히 명시 생성 흐름을 따르되, schema 조각의 누락을 테스트로 잡는다.

장점은 새 스텝 타입 추가 시 컴파일러가 "이 타입의 DTO는 있는데 답변 정책은 검토했는가"를 묻게 만든다는 점이다. 단점은 한 번에 모든 계약을 registry화하면 범위가 크므로 core DTO와 learning answer 정책부터 시작하는 것이 안전하다.

추천 강도: 높음.

### 방안 3. OpenAPI lesson step schema를 core 계약과 동기화한다

현재 OpenAPI의 `lessonStepSchema`는 타입별 필드를 하나의 넓은 object에 대부분 선택 필드로 둔다. 이 구조는 TypeScript의 discriminated union보다 느슨하다.

개선 방향:

- core의 타입별 schema와 OpenAPI schema 조각을 같은 definition에서 관리한다.
- OpenAPI lesson step을 `oneOf` 또는 `anyOf`의 타입별 schema로 표현한다.
- `docs/openapi/writing-app-api.json`과 `apps/web/src/lib/api/generated/writing-app-api.d.ts`가 타입별 필수 필드를 더 정확히 표현하게 한다.

장점은 API 계약이 core DTO와 같은 수준으로 좁아진다는 점이다. 단점은 generated type 변화가 웹 mapper와 테스트에 영향을 줄 수 있어 별도 단계로 검증해야 한다.

추천 강도: 중간 이상.

### 방안 4. 새 스텝 타입 추가 절차를 문서와 테스트로 고정한다

`docs/product/content-model.md` 또는 새 `docs/step-type-contract.md`에 새 스텝 타입 추가 절차를 기록한다.

포함할 항목:

- core DTO schema
- learning answer schema와 answerable policy
- DB seed 정규화
- API OpenAPI schema와 generated type
- web mapper, renderer, progress policy
- admin form registry
- 회귀 테스트 목록

여기에 `lessonStepTypeSchema.options`와 web/admin registry key가 일치하는지 검증하는 테스트를 추가하면 누락이 더 빨리 드러난다.

장점은 스텝 타입이 제품 핵심 확장 지점이라는 사실을 명시하고, 변경 경로를 팀 지식이 아니라 시스템 지식으로 만든다는 점이다.

추천 강도: 중간.

## 권장 순서

1. 스텝별 DTO schema를 `packages/core/src/content/steps`로 분리하고 명시 조합 index를 둔다.
2. core 내부에 스텝 정의 registry를 추가해 DTO schema와 answerable 정책의 누락을 컴파일 타임에 드러낸다.
3. OpenAPI lesson step schema를 타입별 schema 조합으로 좁히는 별도 작업을 진행한다.
4. 새 스텝 타입 추가 체크리스트와 registry key 일치 테스트를 추가한다.

## 검증 계획

- `bun --filter @workspace/core test src/content/content.dto.test.ts`
- `bun --filter @workspace/core test src/learning/learning.service.test.ts`
- `bun --filter @workspace/api test src/routes/lessons.route.test.ts`
- `bun --filter @workspace/web test src/features/lessons/lesson-api-mappers.test.ts`
- OpenAPI 변경 시 `bun --filter @workspace/web api:generate`

## 2026-06-17 구현 완료

- Notion `WA-14` 내용을 확인했다.
- core content DTO, 학습자 step policy와 renderer, 어드민 form registry, DB seed mapping, OpenAPI schema를 조사했다.
- WA-14는 타당하지만, discriminated union 자체 제거가 아니라 스텝별 계약 응집과 누락 방지 구조가 핵심이라고 판단했다.
- 스텝별 DTO 파일 분리, core step definition registry, OpenAPI schema 동기화, 새 스텝 타입 추가 절차 문서화의 4가지 개선 방안을 도출했다.
- 선택한 구현은 방안 1과 방안 2의 core 범위다. `packages/core/src/content/steps` 아래에 스텝 타입별 DTO schema를 분리하고, `steps/index.ts`에서 `lessonStepTypeSchema`, `lessonStepDtoSchema`, `lessonStepDefinitions`, `answerableLessonStepTypes`를 명시적으로 조합했다.
- `packages/core/src/content/content.dto.ts`는 코스, 유닛, 레슨 상위 DTO에 집중하도록 정리했다. 공개 export 이름은 유지해 기존 import 경로의 호환성을 보존했다.
- `packages/core/src/learning/learning.service.ts`의 답변 가능 타입 집합은 core 스텝 정의에서 가져오도록 바꿨다. 새 스텝 타입이 DTO에 추가될 때 답변 가능 여부도 같은 definition에서 검토해야 한다.
- `packages/core/src/content/content.dto.test.ts`에 `lessonStepDefinitions`, `lessonStepTypeSchema.options`, `answerableLessonStepTypes`가 서로 일치하는지 확인하는 회귀 테스트를 추가했다.
- `docs/product/content-model.md`에 스텝 계약 관리 위치와 새 스텝 타입 추가 시 검토해야 할 경로를 기록했다.

## 검증 결과

- `bun --filter @workspace/core test src/content/content.dto.test.ts`
- `bun --filter @workspace/core test src/learning/learning.service.test.ts`
- `bun --filter @workspace/db test src/repositories/content.repository.test.ts src/seeds/seed-content.test.ts`
- `bun --filter @workspace/api test src/routes/learning.route.test.ts src/routes/progress.route.test.ts src/routes/courses.route.test.ts`
- `bun --filter @workspace/api test src/routes/lessons.route.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/api typecheck`
