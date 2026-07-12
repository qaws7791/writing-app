# 레슨 세션 상태 전이

## 작업 상태

완료했다.

## 현재 상태와 event inventory

- 세션 상태: 시작 전, 시작 저장 중, 학습 중, 진행 저장 중, 완료 저장 중, 완료.
- 학습 event: 시작 요청·성공·실패, 답안 payload 변경, 채점 결과 변경, 진행 저장 요청·성공·실패, 완료 저장 요청·성공·실패.
- 외부 effect: 시작 답안 저장, 진행 위치 저장, 스텝 답안 저장, AI 피드백 요청, 레슨 완료 저장.

`apps/web/src/features/lessons`가 레슨 세션 정책을 소유한다는 ADR-0003을 유지한다. 상태 전이 Module은 network와 router를 import하지 않고, 외부 effect는 `WritingAppApi`를 감싼 Adapter를 통해 실행한다.

## 구현 결과

- `lesson-session-machine.ts`가 모든 세션 상태와 event를 판별 union으로 표현한다.
- 허용되지 않은 event는 `LessonSessionTransitionError`로 드러내며 중복 시작·진행 저장·완료 저장을 조용히 무시하지 않는다.
- `lesson-session-effect-adapter.ts`가 시작, 답안, 진행, AI 피드백, 완료 effect를 소유한다.
- `use-lesson-session.ts`는 state machine과 Adapter를 React 생명주기에 조립하고 최신 답안 저장 순서만 관리한다.
- 시작 재시도, 중복 submit, 진행·완료 전이는 table test로 고정하고 Adapter의 부분 실패와 AI 피드백 재시도 분류는 fault test로 고정했다.

## 검증

- `bun run test -- src/features/lessons/lesson-session-machine.test.ts src/features/lessons/lesson-session-effect-adapter.test.ts src/features/lessons/lesson-experience.test.tsx`
- `bun run typecheck`
- `bun run lint`
- `bun run build`
