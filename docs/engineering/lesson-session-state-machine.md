# 레슨 세션 상태 전이

## 작업 상태

완료했다.

## 현재 상태와 event inventory

- 세션 상태: 시작 전, 시작 저장 중, 학습 중, 진행 저장 중, 완료 저장 중, 완료.
- 학습 event: 시작 요청·성공·실패, 답안 payload 변경, 채점 결과 변경, 진행 저장 요청·성공·실패, 완료 저장 요청·성공·실패.
- 외부 effect: 시작 답안 저장, 진행 위치 저장, 스텝 답안 저장, AI 피드백 요청, 레슨 완료 저장.

`apps/web/src/features/lesson-session/model`이 레슨 세션 정책을 소유한다는 ADR-0003을 유지한다. 상태 전이 Module은 network와 router를 import하지 않고, 외부 effect는 `features/lesson-session/api`의 좁은 포트를 감싼 Adapter를 통해 실행한다.

## 구현 결과

- `lesson-session-machine.ts`가 모든 세션 상태와 event를 판별 union으로 표현한다.
- 허용되지 않은 event는 `LessonSessionTransitionError`로 드러내며 중복 시작·진행 저장·완료 저장을 조용히 무시하지 않는다.
- `lesson-session-effect-adapter.ts`가 시작, 답안, 진행, AI 피드백, 완료 effect를 소유한다.
- `use-lesson-session.ts`는 state machine과 Adapter를 React 생명주기에 조립하고 최신 답안 저장 순서만 관리한다.
- 시작 재시도, 중복 submit, 진행·완료 전이는 table test로 고정하고 Adapter의 부분 실패와 AI 피드백 재시도 분류는 fault test로 고정했다.

클라이언트 state machine은 서버 저장 원자성을 재구현하지 않는다. 서버의 일반 단계 완료는 순수 effect plan이 답안, step/lesson, course와 activity 순서를 결정하고 SQLite interpreter가 한 transaction에서 적용한다. SQLite characterization은 retry·잠금·version·순서 거절에서 학습 row가 바뀌지 않고, accepted·lesson/course 완료·replay에서 답안과 활동 집계가 한 번만 확정되며, 일반 완료와 AI finalize 저장 실패가 각각 관련 상태 전체를 rollback하는지를 고정한다.

## 검증

- `bun --filter @workspace/web test -- src/features/lesson-session/model/lesson-session-machine.test.ts src/features/lesson-session/api/lesson-session-effect-adapter.test.ts src/features/lesson-session/ui/lesson-experience.test.tsx`
- `bun run typecheck`
- `bun run lint`
- `bun run build`
