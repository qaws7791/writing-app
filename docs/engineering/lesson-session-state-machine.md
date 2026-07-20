# 레슨 세션 상태 전이

## 상태와 event inventory

- 세션 상태: 시작 전, 시작 저장 중, 학습 중, 진행 저장 중, 완료 저장 중, 완료.
- 학습 event: 시작 요청·성공·실패, 답안 payload 변경, 채점 결과 변경, 진행 저장 요청·성공·실패, 완료 저장 요청·성공·실패.
- 외부 effect: 시작 답안 저장, 진행 위치 저장, 스텝 답안 저장, AI 피드백 요청, 레슨 완료 저장.

`apps/web/src/features/lesson-session/model`이 레슨 세션 정책을 소유한다는 ADR-0003을 유지한다. 상태 전이 Module은 network와 router를 import하지 않고, 외부 effect는 `features/lesson-session/api`의 좁은 포트를 감싼 Adapter를 통해 실행한다.

## 구현 원칙

- 현재 구현 위치와 file 이름은 레슨 feature source가 소유한다.
- 허용되지 않은 event는 명시적 오류로 드러내며 중복 시작·진행 저장·완료 저장을 조용히 무시하지 않는다.
- state machine은 network와 router를 import하지 않고, 외부 effect는 좁은 adapter 경계를 통해 실행한다.
- 시작 재시도, 중복 submit, 진행·완료 전이와 부분 실패는 table·fault test로 검증한다.

클라이언트 state machine은 서버 저장 원자성을 재구현하지 않는다. 서버의 일반 단계 완료는 순수 effect plan이 답안, step/lesson, course와 activity 순서를 결정하고 SQLite interpreter가 한 transaction에서 적용한다. SQLite characterization은 retry·잠금·version·순서 거절에서 학습 row가 바뀌지 않고, accepted·lesson/course 완료·replay에서 답안과 활동 집계가 한 번만 확정되며, 일반 완료와 AI finalize 저장 실패가 각각 관련 상태 전체를 rollback하는지를 고정한다.

## 검증

현재 test file과 실행 명령은 workspace test 설정과 root task를 확인한다.
