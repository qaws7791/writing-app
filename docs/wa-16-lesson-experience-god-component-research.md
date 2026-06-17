# WA-16 레슨 경험 거대 컴포넌트 분석

## 2026-06-17 시작

- Notion 이슈: `WA-16 거대 컴포넌트 (God Component)`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-16 페이지
- 조사 범위: `apps/web/src/features/lessons/lesson-experience.tsx`, `use-lesson-session.ts`, `lesson-step-renderer.tsx`, `lesson-step-policy.ts`, 관련 개선 기록
- 목표: 레슨 경험 화면이 여전히 과도한 책임을 갖는지 판단하고, 상태별 화면과 스텝 렌더링이 더 안정적으로 확장되는 구조 개선 방향을 도출한다.

## 이슈 요약

WA-16은 `LessonExperience`가 레슨 시작 커버, 진행 상태, 종료 모달, 완료 화면, API 오류 처리 등 여러 책임을 한 파일에서 처리한다고 지적한다.

## 코드 조사

### 현재 파일 크기

- `lesson-experience.tsx`: 596줄
- `use-lesson-session.ts`: 437줄
- `lesson-step-renderer.tsx`: 1260줄
- `lesson-step-policy.ts`: 199줄

### 이미 개선된 부분

기존 작업으로 일부 책임은 분리되었다.

- `useLessonSession()`이 시작 여부, 현재 스텝, 채점 상태, 답변 payload, 답변 저장 최신성, 완료 저장 생명주기를 담당한다.
- `LessonStepRenderer`가 타입별 스텝 UI를 담당한다.
- `lesson-step-policy.ts`가 제목, 설명, 제출 가능 여부, 채점, CTA 문구 정책을 담당한다.

### 남아 있는 문제

`LessonExperience`는 여전히 다음 책임을 함께 갖는다.

- API adapter 선택
- router navigation
- 시작 화면 branch
- 진행 화면 branch
- 완료 화면 branch
- exit modal 상태
- shell, header, footer, primary button, checked footer UI
- 완료 화면의 다음 레슨 계산
- 정답/오답 footer 문구 조합
- scroll side effect

또한 `LessonStepRenderer`가 1260줄로 더 크기 때문에, WA-16은 단일 파일 하나의 문제가 아니라 레슨 기능 전체의 Module 깊이 문제로 보는 편이 정확하다.

## 판단

WA-16은 타당하다. 다만 1차 분리 작업이 이미 있었기 때문에 "아무 분리도 되지 않았다"는 상태는 아니다.

현재 구조에서 `LessonExperience`는 레슨 상태를 조립하는 shell 역할을 하려고 하지만, 상태별 화면과 공통 UI primitive까지 같은 파일에 있어 유지보수 locality가 낮다. `LessonStepRenderer` 역시 타입별 스텝 UI가 한 파일에 집중되어 새 스텝 UI 수정 시 context가 지나치게 커진다.

## 해결 방안

### 방안 1. 상태별 화면 Module로 분리한다

`lesson-experience.tsx`에서 상태별 화면을 분리한다.

예상 파일:

- `lesson-start-screen.tsx`
- `lesson-active-screen.tsx`
- `lesson-complete-screen.tsx`
- `lesson-exit-dialog.tsx`
- `lesson-shell.tsx`

`LessonExperience`는 `useLessonSession()`을 호출하고 현재 상태에 맞는 screen을 선택하는 orchestrator로 줄인다.

장점은 시작/진행/완료 화면의 UI 변경이 서로의 context를 오염시키지 않는다는 점이다. 단점은 prop interface 설계를 잘못하면 prop drilling만 늘 수 있으므로 각 screen에는 필요한 명령과 표시 값만 넘겨야 한다.

추천 강도: 높음.

### 방안 2. 레슨 shell primitive를 별도 Module로 만든다

`LessonShell`, `LessonProgressHeader`, `LessonPrimaryButton`, `LessonCheckedFooter` 같은 공통 UI primitive를 `lesson-shell.tsx` 또는 `lesson-controls.tsx`로 분리한다.

이 Module은 레슨 도메인 상태를 직접 알지 않고, 표시 값과 callback만 받는다.

장점은 레이아웃과 진행 제어 UI가 재사용 가능해지고, 상태별 screen 파일이 더 작아진다는 점이다. Kwep parity를 유지해야 하는 시각 구조도 한 곳에서 관리할 수 있다.

추천 강도: 높음.

### 방안 3. step renderer를 타입별 feature Module로 분할한다

`lesson-step-renderer.tsx`의 타입별 UI를 `steps/reading-step-view.tsx`, `steps/write-step-view.tsx`, `steps/categorize-step-view.tsx`처럼 나눈다. 현재 typed renderer registry는 유지하되, registry 파일은 import와 mapping만 담당하게 한다.

장점은 스텝 UI 수정 시 해당 타입 파일만 열면 되고, 새 스텝 타입 추가 경로가 명확해진다. WA-14의 스텝 계약 응집 개선과도 맞물린다.

단점은 파일 수가 늘어나므로 naming과 export 규칙을 문서화해야 한다.

추천 강도: 높음.

### 방안 4. session 상태와 presentation adapter를 분리한다

`useLessonSession()`은 현재 많은 상태와 명령을 그대로 반환한다. 이 hook 위에 `createLessonExperienceViewModel(session, lesson, courseDetail)` 같은 순수 변환 Module을 두어 screen이 필요한 표시 값과 가능 action만 받게 한다.

장점은 화면 branch의 조건과 파생 표시 값 계산을 테스트하기 쉬워진다는 점이다. 완료 화면의 다음 레슨 계산, footer feedback 문구, progress 표시 같은 계산도 JSX 파일에서 빠질 수 있다.

추천 강도: 중간 이상.

## 권장 순서

1. `LessonShell`, progress header, primary button, checked footer를 공통 UI Module로 분리한다.
2. `LessonStartScreen`, `LessonActiveScreen`, `LessonCompleteScreen`, `LessonExitDialog`를 분리하고 `LessonExperience`를 상태 선택 orchestrator로 줄인다.
3. `lesson-step-renderer.tsx`를 타입별 step view 파일과 registry 파일로 분해한다.
4. 완료 화면의 다음 레슨 계산과 feedback footer 문구를 순수 view model 함수로 옮긴다.
5. `lesson-experience.test.tsx`를 상태별 screen 테스트와 통합 flow 테스트로 나눈다.

## 검증 계획

- `bun --filter @workspace/web test src/features/lessons/lesson-experience.test.tsx`
- `bun --filter @workspace/web test src/features/lessons/lesson-step-renderer.test.tsx`
- `bun --filter @workspace/web test src/features/lessons/lesson-step-policy.test.ts`
- `bun --filter @workspace/web typecheck`
- `bun --filter @workspace/web lint`

## 2026-06-17 완료

- Notion `WA-16` 내용을 확인했다.
- 레슨 경험, 세션 hook, 스텝 렌더러, 스텝 정책, 기존 FE-01/FE-02/WA-10 개선 기록을 조사했다.
- WA-16은 일부 개선 이후에도 여전히 타당하다고 판단했다.
- 상태별 screen 분리, shell primitive 분리, step renderer 타입별 분할, presentation view model 분리의 4가지 개선 방안을 도출했다.
- 1차 구현으로 `lesson-experience.tsx`를 세션 연결, 라우팅, 현재 상태 선택만 담당하는 orchestrator로 축소했다.
- 시작, 진행, 완료, 종료 확인 화면은 `lesson-experience-screens.tsx`로 분리했다.
- 레슨 shell, 진행 header, primary button, checked footer는 `lesson-shell.tsx`로 분리해 화면별 JSX가 공통 레이아웃 구현을 직접 소유하지 않게 했다.
- `lesson-experience.tsx`는 596줄에서 122줄로 줄었고, 새 screen/shell 모듈은 각각 376줄, 222줄이다.

## 검증 결과

- `bun --filter @workspace/web test src/features/lessons/lesson-experience.test.tsx`
- `bun --filter @workspace/web test src/features/lessons/lesson-step-renderer.test.tsx`
- `bun --filter @workspace/web test src/features/lessons/lesson-step-policy.test.ts`
- `bun --filter @workspace/web typecheck`
- `bun --filter @workspace/web lint`
