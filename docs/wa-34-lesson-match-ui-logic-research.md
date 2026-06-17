# WA-34 매칭 스텝 UI 로직 결합 조사

- 작성일: 2026-06-17
- 대상 이슈: WA-34 `비즈니스 로직과 UI의 강결합 (Impure UI)`
- 조사 범위: `apps/web/src/features/lessons/lesson-step-renderer.tsx`, `lesson-logic.ts`, `lesson-types.ts`, `packages/core/src/learning/learning.service.ts`, 관련 테스트와 제품 문서

## 결론

WA-34는 타당하다. `MatchAnswer` 컴포넌트는 매칭 스텝을 그리는 동시에 오른쪽 선택지 표시 순서, deterministic seed 생성, LCG 기반 shuffle, 선택 상태와 정답 표시 정책을 모두 직접 처리한다.

이 문제는 단순히 shuffle 함수를 다른 파일로 옮기는 수준보다 넓다. 매칭 스텝의 학습 상호작용 모델이 UI 내부 구현으로 숨어 있어, 웹 UI 외부에서 같은 순서 정책을 검증하거나 재사용하기 어렵고, 서버 저장 검증과 학습자 화면 표시 모델 사이의 책임도 분리되어 있지 않다.

## 근거

- `apps/web/src/features/lessons/lesson-step-renderer.tsx`
  - `MatchAnswer` 내부에서 `lefts`, `rights`, `shuffledRights`를 직접 만든다.
  - `useMemo` 안에서 `step.pairs.map((pair) => pair.right).join("")`로 seed를 만들고, `Math.imul` 기반 hash와 LCG로 배열을 섞는다.
  - 같은 컴포넌트가 `matchMap`, 선택/해제, 오른쪽 항목 재할당, 정답/오답 색상 판단도 담당한다.
- `apps/web/src/features/lessons/lesson-step-renderer.test.tsx`
  - 매칭 테스트는 UI 클릭과 class 검증 중심이다.
  - 표시 순서 정책, seed 안정성, 같은 입력에서 같은 결과가 나오는지, 중복 텍스트를 어떻게 다루는지에 대한 순수 단위 테스트가 없다.
- `apps/web/src/features/lessons/lesson-logic.ts`
  - answer payload 검증은 존재하지만, 매칭 스텝의 표시 모델이나 상호작용 전이 모델은 없다.
- `packages/core/src/learning/learning.service.ts`
  - 저장 검증은 `MATCH` payload의 좌우 값 존재와 중복을 확인한다.
  - 학습자에게 오른쪽 항목을 어떤 순서로 노출할지에 대한 domain/application contract는 없다.
- `docs/platform-product-feature-spec.md`
  - 매칭 스텝은 오른쪽 항목을 섞어서 표시할 수 있다고 되어 있지만, 섞는 기준과 안정성 정책은 코드에만 있다.

## 위험

- 같은 매칭 콘텐츠라도 UI 구현이 바뀌면 표시 순서가 예고 없이 바뀔 수 있다.
- 오른쪽 항목 값이 중복될 때 `key={right}`와 `matchedLeftForRight(right)`가 모호해진다.
- 서버, 관리자 미리보기, 웹 학습자 화면이 서로 다른 표시 순서 정책을 갖기 쉽다.
- 순수 로직 테스트 없이 UI 클릭 테스트만 남아, 알고리즘 변경이 학습 경험과 저장 payload에 미치는 영향을 좁게 검증하기 어렵다.
- `lesson-step-renderer.tsx`가 이미 큰 렌더러인데, 스텝별 상호작용 정책까지 계속 흡수하면 WA-16의 거대 컴포넌트 문제가 반복된다.

## 개선 방안

### 방안 1. 매칭 스텝 표시 모델을 core 또는 lesson domain module로 승격한다

`createMatchStepPresentation(step, options)` 같은 순수 함수를 만들고, UI는 반환된 `leftChoices`, `rightChoices`, `correctPairByLeftId`만 렌더링한다. 함수는 seed 생성, 오른쪽 선택지 순서, stable key, 중복 값 처리 기준을 명시한다.

장점은 매칭 표시 정책이 웹 컴포넌트 밖에서 독립 테스트 가능해진다는 점이다. 단점은 core가 순수 학습 UI 모델까지 포함할지, web feature 내부 domain module에 둘지 경계를 먼저 정해야 한다.

### 방안 2. 스텝 콘텐츠 계약에 표시 순서 정책을 포함한다

콘텐츠 DTO에 `rightOrderPolicy`, `shuffleSeed`, `rightChoiceId` 같은 명시 필드를 추가한다. 관리자 편집, seed 변환, API 응답, 웹 렌더러가 같은 contract를 공유하게 한다.

장점은 콘텐츠 작성자가 표시 순서를 통제할 수 있고, 같은 콘텐츠가 모든 클라이언트에서 같은 경험을 보장한다. 단점은 DTO와 seed, 관리자 편집기까지 연결되는 변경이라 migration과 호환성 정책이 필요하다.

### 방안 3. 레슨 상호작용 상태 전이를 순수 reducer로 분리한다

`MatchInteractionState`와 `matchInteractionReducer`를 만들어 왼쪽 선택, 오른쪽 선택, 재선택, 완료 가능 여부, payload 생성 규칙을 UI 밖으로 뺀다. 컴포넌트는 reducer state를 button state로 매핑한다.

장점은 UI 이벤트 순서와 저장 payload 생성이 deterministic하게 테스트된다. 단점은 단일 스텝에 reducer를 도입하면 주변 스텝과 구조가 달라질 수 있으므로, `SELECT`, `ORDER`, `CATEGORIZE`까지 같은 패턴으로 확장할 계획이 필요하다.

### 방안 4. 스텝 타입별 렌더러 분해와 함께 interaction policy registry를 둔다

`lesson-step-renderer.tsx`를 스텝별 view 파일로 나누고, 각 스텝은 `view`, `presentation`, `interaction`, `answerPayload`를 같은 폴더에 둔다. 상위 registry는 타입과 모듈 연결만 담당한다.

장점은 거대 렌더러가 다시 비대해지는 것을 막고, 새 스텝 타입을 추가할 때 UI와 정책의 위치가 고정된다. 단점은 파일 수가 늘어나므로 naming convention과 테스트 위치를 문서화해야 한다.

## 권장 진행 순서

1. `MATCH` 전용 presentation model 순수 함수와 테스트를 먼저 만든다.
2. 오른쪽 항목에는 텍스트 값이 아니라 stable choice id를 부여하는 계약을 설계한다.
3. `MatchAnswer`가 presentation model과 interaction reducer를 사용하도록 얇게 만든다.
4. 같은 구조를 `CATEGORIZE`, `ORDER`, `SELECT`에 확장할 수 있는 step interaction policy convention으로 정리한다.
5. 제품 문서에 매칭 표시 순서, seed 안정성, 중복 항목 처리 정책을 기록한다.

## Notion 업데이트 요약

- WA-34 본문을 읽고 매칭 스텝 렌더러, 웹 레슨 로직, core 저장 검증, 테스트와 제품 문서를 조사했다.
- 이슈는 타당하며, 단순 array utility 분리가 아니라 매칭 스텝 presentation/interaction 정책을 UI 밖으로 승격하는 방향을 추천한다.
- 같은 문제가 반복되지 않게 하려면 스텝 타입별 view 분해, 순수 presentation model, interaction reducer, 콘텐츠 계약 확장을 함께 검토해야 한다.

## 완료 기록

- `packages/core`에 매칭 스텝 presentation model과 선택 전이 순수 함수를 추가했다.
- 오른쪽 선택지 섞기, stable choice id, 중복 텍스트 처리, 오른쪽 선택지 재배정, 저장 payload 변환, 정답 판정을 core 단위 테스트로 고정했다.
- 학습자 웹의 `MatchAnswer`는 core 정책이 반환하는 `leftChoices`, `rightChoices`, `MatchSelectionMap`만 렌더링하도록 바꾸었다.
- 제품/도메인/프론트엔드 문서에 매칭 스텝의 결정적 표시 순서와 choice id 기반 상호작용 원칙을 기록했다.
