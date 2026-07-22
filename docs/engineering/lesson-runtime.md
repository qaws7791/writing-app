# 레슨 런타임과 스텝 편집 계약

## 작업 상태

- 2026-07-17: 매칭 choice·결정적 순서·selection/payload 정책과 interaction state를 `apps/web`으로 옮기고 UI를 controlled presentation으로 축소했다.
- 2026-07-17: 일반 `completeStep`을 순수 채점·전이 effect plan과 결정된 순서로 적용하는 SQLite transaction interpreter로 분리했다.
- 2026-07-17: `startLesson`을 최소 readonly snapshot의 순수 의사결정과 idempotent effect를 적용하는 SQLite transaction shell로 분리했다.
- 2026-07-17: 레슨 초안 저장 정책을 `apps/web`으로 이동하고 server/client 첫 render 뒤 mount 시점에 복원하도록 전환했다.
- 2026-07-17: 학습자 레슨을 서버 권위 상태 전이 계약으로 전환하고 공유 lesson runtime과 별도 어드민 QA 제품 화면을 제거했다.

## 경계

- `@workspace/contracts/learning/learner-content`와 `@workspace/contracts/learning/learner-transition`은 공개 레슨, stable item ID 제출, 서버 평가와 학습 상태 전이 계약을 소유한다.
- `packages/core`는 채점, 순서, 잠금, 진도, 레슨·코스 완료와 AI 피드백 전이를 소유한다.
- 학습 시작 정책은 lesson scope, 잠금, 기존 진행과 정렬된 step ID snapshot만 받아 rejection·start·replay와 readonly effect를 결정한다. Drizzle repository는 한 transaction에서 load → decide → apply만 수행한다.
- 일반 단계 완료 정책은 rejection·retry·replay·step/lesson acceptance를 구분하고, 답안 저장 → step/lesson 전진 → 필요한 course 완료 → 활동 집계 effect를 SQL·table 이름 없이 계획한다. interpreter는 이 순서를 한 transaction에서 적용한다.
- `apps/web/src/features/lesson-session`은 입력 중 상태, 세션 event, 화면 전환과 시각 컴포넌트 조립만 소유한다.
- `apps/web/src/features/lesson-session/model/lesson-match-presentation.ts`와 `ui/lesson-match-answer.tsx`는 매칭 choice ID, 결정적 shuffle, pending·일대일 selection 전이, 정답 tone과 stable item-ID payload를 소유한다.
- `apps/web/src/features/lesson-session/api/lesson-draft-storage.ts`는 사용자별 `v2` key, 20,000자 상한, 메모리 cache, legacy 정리와 cross-tab 무효화를 소유한다.
- `packages/shared/ui/src/components/lesson`은 API 계약과 채점 규칙을 import하지 않는 순수 props 기반 시각 컴포넌트만 제공한다. `MatchAnswer`는 controlled choice·connection·pending 값과 선택 callback을 받아 버튼 접근성과 연결선 DOM 측정만 담당한다.
- `apps/admin` 코스 편집기는 내부 콘텐츠 계약을 검증하고 10개 스텝 편집 폼과 학습자 미리보기를 제공한다.

## 학습자 동작

- 레슨 시작은 `startLesson`, 일반 단계 제출은 `completeStep`, AI 코칭은 step-scoped AI feedback 요청으로 수행한다.
- 웹은 서버의 `retry`, `advanced`, `lesson_completed` 결과와 `learning.currentStepId`를 그대로 소비한다.
- 정답, 해설, 진도율, 다음 레슨과 완료 여부를 프론트엔드에서 다시 계산하지 않는다.
- 코스의 다음 레슨과 잠금 상태는 active 유닛의 `sortOrder`, 그 안의 active 레슨 `sortOrder` 순으로 서버가 계산한다.
- 코스와 진행 목록은 `{ items, nextCursor }`를 사용하며 다음 cursor가 있을 때만 추가 로딩을 제공한다.
- 쓰기·AI 코칭 초안은 server render와 hydration 첫 render에서 `localStorage`를 읽지 않는다. 첫 출력은 빈 초안으로 같게 유지하고 외부 store 구독 뒤 복원하며, 복원 전에 시작된 사용자 입력은 저장 초안으로 덮어쓰지 않는다.
- 초안 저장 실패는 `quota-exceeded`와 `unavailable`로 구분해 UI에 전달하고, 로그아웃 성공 시 현재 학습자 namespace만 제거한다.
- 매칭 선택지는 같은 입력에서 같은 `left-N`·`right-N` ID와 오른쪽 순서를 사용한다. 중복 label도 콘텐츠 item ID로 구분하며 오른쪽 선택지는 한 왼쪽에만 연결되고 같은 짝 재선택은 연결을 해제한다.

## 검증

- 10개 공개 step schema가 제출 전에 solution을 노출하지 않는지 계약 테스트로 확인한다.
- stable ID 제출과 타입별 평가, 오답 재시도, 원자적 전이와 동시성은 core 테스트로 확인한다.
- 학습 전이 SQLite characterization은 잠금·version·순서 거절의 무변경, accepted/replay의 단일 답안·활동 집계, 마지막 활성 레슨의 코스 완료와 AI finalize 실패 rollback을 반환 결과와 영속 row 양쪽에서 확인한다.
- 학습 시작 테스트는 별도 SQLite connection의 동시 요청이 unique conflict 뒤 같은 진행으로 수렴하는지, replay가 row·counter를 중복하지 않고 활동 시각만 갱신하는지, activity 저장 실패가 course·lesson 시작 전체를 rollback하는지 확인한다.
- 일반 단계 완료 테스트는 순수 plan의 effect 순서, rejection·retry·replay의 빈 effect, lesson/course/activity 결과와 마지막 activity fault에서 답안·lesson·course·activity 전체 rollback을 확인한다.
- 레슨 세션이 서버 전이 결과만으로 이동하는지 web 테스트로 확인한다.
- 초안 adapter의 version·사용자 격리·길이 상한·legacy·저장 실패·cross-tab 동작과 mount 이후 복원을 web 테스트로 확인한다.
- 매칭 정책의 결정성·중복 label·일대일 재배정·재선택·정답 tone·item-ID payload는 web 테스트로, controlled 표시·keyboard callback·접근성 상태는 UI와 Storybook 테스트로 확인한다.
- step 시각 상태는 Storybook fixture로, 어드민 편집 union은 editor 테스트로 확인한다.
