# 레슨 세션 상태 전이

## 상태와 event inventory

- 세션 상태: `not-started`, `starting`, `active`(`idle` | `submitting`), `complete`.
- 학습 event: 시작 요청·성공·실패, 답안 payload 변경, draft 조정, 채점 결과, 계속하기, 완료 저장 요청·성공·실패.
- 시작 요청이 abort되면 `startError` 없이 `not-started`로 돌아간다.
- 이미 처리 중인 중복 event는 같은 상태를 반환한다. 그 밖의 불법 event는 throw한다.
- 외부 effect: 시작 저장, 정답 계속하기의 원본 진행 persist, 레슨 완료 저장.
- 진행 persist는 세션 상태가 아니다. 정답 후 `CONTINUE_REQUESTED`의 부수 effect다.
- draft 저장은 머신 밖 `use-lesson-draft-sync.ts`가 담당한다.

`apps/web/src/features/lesson-session/model`이 레슨 세션 정책을 소유한다는 ADR-0003을 유지한다. 상태 전이 Module은 network와 router를 import하지 않고, 외부 effect는 `features/lesson-session/api`의 좁은 포트를 감싼 Adapter를 통해 실행한다.

## 구현 원칙

- 현재 구현 위치와 file 이름은 레슨 feature source가 소유한다.
- 허용되지 않은 event는 명시적 오류로 드러낸다. 시작 저장 중 중복 `START_REQUESTED`, 이미 채점된 `STEP_EVALUATED`, 완료 저장 중 draft·채점·계속하기는 동일 상태로 유지한다.
- state machine은 network와 router를 import하지 않고, 외부 effect는 좁은 adapter 경계를 통해 실행한다.
- 시작 재시도, 중복 submit, 완료 전이와 부분 실패는 table·fault test로 검증한다.

클라이언트 state machine은 서버 저장 원자성을 재구현하지 않는다. 스텝 채점은 클라이언트 `evaluateStepSubmission`이 판정한다. 재개 시 서버가 저장한 원본 완료 스텝으로 남은 큐를 다시 만든다. 세션 중 오답 재큐는 저장하지 않는다. 서버의 레슨 완료는 순수 effect plan이 정답률, 레슨·코스 완료, 활동일 순서를 결정하고 SQLite interpreter가 한 transaction에서 적용한다. SQLite characterization은 잠금·version 거절에서 학습 row가 바뀌지 않고, 레슨/코스 완료·replay에서 활동 집계가 한 번만 확정되며, 완료 저장 실패가 관련 상태 전체를 rollback하는지를 고정한다.

## 검증

현재 test file과 실행 명령은 workspace test 설정과 root task를 확인한다.
