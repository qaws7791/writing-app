# 레슨 런타임과 스텝 편집 계약

## 작업 상태

- 2026-07-17: 매칭 choice·결정적 순서·selection/payload 정책과 interaction state를 `apps/web`으로 옮기고 UI를 controlled presentation으로 축소했다.
- 2026-07-17: 일반 `completeStep`을 순수 채점·전이 effect plan과 결정된 순서로 적용하는 SQLite transaction interpreter로 분리했다.
- 2026-07-17: `startLesson`을 최소 readonly snapshot의 순수 의사결정과 idempotent effect를 적용하는 SQLite transaction shell로 분리했다.
- 2026-07-17: 레슨 초안 저장 정책을 `apps/web`으로 이동하고 server/client 첫 render 뒤 mount 시점에 복원하도록 전환했다.
- 2026-07-17: 학습자 레슨을 서버 권위 상태 전이 계약으로 전환하고 공유 lesson runtime과 별도 어드민 QA 제품 화면을 제거했다.
- 2026-07-24: 서버 단계 초안, 낙관적 version 저장, 레슨 조회·시작 복구와 제출 transaction의 초안 정리를 learning 경계에 추가했다.
- 2026-07-24: 10개 활동의 완료 방식·draft·서버 평가 정책과 stable item ID를 canonical 계약으로 묶고, 서버·클라이언트 학습 상태 책임을 확정했다.
- 2026-07-24: 웹 초안을 서버 autosave·복구·충돌 조정으로 전환하고 브라우저 저장소와 로그아웃 정리 경로를 제거했다.
- 2026-07-24: learning application을 조회·시작·초안 저장·단계 제출 transaction use case로 압축하고 전달 전용 service·query wrapper를 제거했다.

## 경계

- `@workspace/contracts/content/steps`는 10개 활동 DTO와 각 타입의 완료 방식·draft 가능 여부·서버 평가 정책을 소유한다. admin form registry와 learner renderer registry는 이 같은 타입 집합을 빠짐없이 소비한다.
- `@workspace/contracts/learning/learner-content`와 `@workspace/contracts/learning/learner-transition`은 공개 레슨, 타입별 final answer·부분 draft, stable item ID 제출, 서버 평가와 학습 상태 전이 계약을 소유한다.
- `@workspace/learning`은 채점, 순서, 잠금, 진도, 레슨·코스 완료와 AI 단계의 저장 답안 문맥·진행 전이를 소유한다. `@workspace/ai-feedback`은 prompt, provider 호출·검증과 attempt 정책·기록을 소유하며 API composition이 두 공개 port를 연결한다.
- application 공개 경계는 `readLearnerHome`, `readCourseCatalog`, `readCourseDetail`, `readLesson`, `startLesson`, `saveStepDraft`, `submitStep`을 중심으로 구성한다. HTTP route는 application을 다시 감싸는 전달 전용 query·command factory 없이 이 use case를 호출한다.
- 학습 시작 정책은 lesson scope, 잠금, 기존 진행과 정렬된 step ID snapshot만 받아 rejection·start·replay와 readonly effect를 결정한다. Drizzle repository는 한 transaction에서 load → decide → apply만 수행한다.
- 일반 단계 완료 정책은 rejection·retry·replay·step/lesson acceptance를 구분하고, 답안 저장 → step/lesson 전진 → 필요한 course 완료 → 활동 집계 effect를 SQL·table 이름 없이 계획한다. interpreter는 이 순서를 한 transaction에서 적용한다.
- `@workspace/learning`은 현재 스텝의 서버 드래프트 접근·revision·version 검증을 소유한다. 드래프트 저장은 `BEGIN IMMEDIATE` transaction에서 compare-and-swap으로 처리하고, 답변 제출 성공 시 답안 저장과 드래프트 삭제를 같은 transaction에서 확정한다.
- `apps/web/src/features/lesson-session`은 loading, editing, saving, checking, advancing, 복구 가능한 오류, 아직 전송하지 않은 입력과 시각 컴포넌트 조립만 소유한다. 내부 machine event와 서버 transition DTO를 분리하며 revision, 현재 스텝, 채점, 잠금과 완료를 계산하지 않는다.
- `apps/web/src/features/lesson-session/model/lesson-match-presentation.ts`와 `ui/lesson-match-answer.tsx`는 매칭 choice ID, 결정적 shuffle, pending·일대일 selection 전이, 서버 evaluation 기반 tone과 stable item-ID payload를 소유한다.
- `apps/web/src/features/lesson-session/hooks/use-lesson-draft-sync.ts`는 입력 debounce, 즉시 flush, 서버 version 조정과 화면에 표시할 저장 상태만 소유한다. 초안의 권위와 충돌 판정은 서버 응답을 따른다.
- `packages/shared/ui/src/components/lesson`은 API 계약과 채점 규칙을 import하지 않는 순수 props 기반 시각 컴포넌트만 제공한다. `MatchAnswer`는 controlled choice·connection·pending 값과 선택 callback을 받아 버튼 접근성과 연결선 DOM 측정만 담당한다.
- `apps/admin` 코스 편집기는 내부 콘텐츠 계약을 검증하고 10개 스텝 편집 폼과 학습자 미리보기를 제공한다.

## 학습자 동작

- 레슨 시작은 `startLesson`, 현재 단계 초안 저장은 `saveStepDraft`, 일반 단계 제출은 `submitStep`, AI 코칭은 step-scoped AI feedback 요청으로 수행한다.
- 레슨 조회와 시작 응답은 해당 학습자와 고정 curriculum revision의 드래프트를 포함한다. 새 드래프트는 `expectedVersion: null`로 version 0을 만들고, 이후 저장은 현재 version이 일치할 때만 version을 증가시킨다.
- AI 코칭 요청은 서버가 고정된 curriculum의 레슨 제목·coaching 초점·저장된 WRITE 답안만 provider 입력으로 만든다. provider 성공 결과를 attempt에 먼저 저장한 뒤 learning 진행을 전이하며, 후자가 실패한 동일 key 재시도는 저장 결과를 재생한다.
- AI 코칭은 스텝별 성공 3회, 스텝별 pending 한 건과 idempotency key를 강제한다. 사용자별·전체 request/success 한도는 `Asia/Seoul` 날짜로 분리하며 실패는 request에만 남는다. 일일 한도는 다음 서울 날짜까지의 retry 정보가 있는 재시도 가능 오류이고 스텝 성공 한도는 영구 오류다. 일일 한도의 현재 기본값은 승인된 제품 사용량이 아니라 비용·남용 방지를 위한 조정 가능한 엔지니어링 safeguard이며, 실제 traffic과 비용 근거가 쌓이기 전의 추론으로 취급한다.
- `ATTEMPT_IN_PROGRESS`와 전송 결과를 모르는 네트워크 오류는 같은 idempotency key로 재시도한다. provider가 terminal 실패로 기록된 뒤의 재시도는 새 key를 사용해 실패 결과만 영구 재생되는 상황을 막는다.
- AI 코칭을 사용할 수 없을 때의 `skip-ai-feedback` 제출은 AI 단계에서만 허용하는 명시적 fallback이다. 웹은 이 제출의 서버 전이를 받은 뒤에만 다음 단계나 레슨 완료를 표시한다.
- 웹은 서버의 `retry`, `advanced`, `lesson_completed` 결과와 `learning.currentStepId`를 그대로 소비한다.
- 정답, 해설, 진도율, 다음 레슨과 완료 여부를 프론트엔드에서 다시 계산하지 않는다.
- 낙관적 UI는 사용자 입력과 요청 중 상태에만 적용한다. 응답을 받으면 서버의 evaluation, learning state와 draft version으로 조정하며, 충돌이나 네트워크 실패에서도 로컬 미전송 입력을 보존한다.
- 입력 변경은 800ms debounce로 저장하고 blur, hidden, pagehide, 레슨 나가기와 답안 제출에서는 대기 중인 저장을 즉시 flush한다. focus·reconnect에서는 서버를 다시 읽으며 visible 상태에서만 30초 간격으로 조정한다. 같은 스텝의 진행 중 저장은 한 건으로 제한하고 후속 변경을 합친다.
- 코스의 다음 레슨과 잠금 상태는 active 유닛의 `sortOrder`, 그 안의 active 레슨 `sortOrder` 순으로 서버가 계산한다.
- 코스와 진행 목록은 `{ items, nextCursor }`를 사용하며 다음 cursor가 있을 때만 추가 로딩을 제공한다.
- 레슨 조회·시작 응답의 서버 초안을 reducer 초기값으로 사용해 첫 render부터 복원한다. 로그아웃은 서버 초안을 삭제하지 않으므로 재로그인과 다른 기기에서도 이어 쓸 수 있다.
- 저장 상태는 `saving`, `saved`, `offline`, 일반 오류와 version 충돌로 표시한다. 네트워크 실패 중 입력은 reducer에 유지하고, 충돌 시 최신 서버 초안과 로컬 미전송 값을 함께 보존해 한쪽을 선택하거나 최신 version으로 다시 저장한다.
- 매칭 선택지는 같은 입력에서 같은 `left-N`·`right-N` ID와 오른쪽 순서를 사용한다. 중복 label도 콘텐츠 item ID로 구분하며 오른쪽 선택지는 한 왼쪽에만 연결되고 같은 짝 재선택은 연결을 해제한다.
- `FILL_BLANK`와 `ORDER` 시각 컴포넌트도 ID가 있는 항목을 직접 유지한다. 표시 문자열에서 ID를 역추론하지 않으므로 중복 문구가 답안 identity에 영향을 주지 않는다.

## 검증

- 10개 공개 step schema가 제출 전에 solution을 노출하지 않는지 계약 테스트로 확인한다.
- 10개 콘텐츠 타입의 valid·invalid 계약, 7개 상호작용 타입의 final answer·부분 draft·server evaluation과 두 registry의 canonical key 일치를 계약·앱 테스트로 확인한다.
- stable ID 제출과 타입별 평가, 오답 재시도, 원자적 전이와 동시성은 learning module 테스트로 확인한다.
- 학습 전이 SQLite characterization은 잠금·version·순서 거절의 무변경, accepted/replay의 단일 답안·활동 집계, 마지막 활성 레슨의 코스 완료와 AI 진행 전이 실패 시 learning 상태 rollback을 반환 결과와 영속 row 양쪽에서 확인한다.
- AI feedback 테스트는 provider I/O 중 DB transaction 비점유, 완료 quota·pending lease, timeout·abort·provider·persistence 오류, 성공 저장 뒤 learning 실패와 동일 key 재생, 전체 attempt 상태 전이표와 만료 maintenance를 확인한다.
- 학습 시작 테스트는 별도 SQLite connection의 동시 요청이 unique conflict 뒤 같은 진행으로 수렴하는지, replay가 row·counter를 중복하지 않고 활동 시각만 갱신하는지, activity 저장 실패가 course·lesson 시작 전체를 rollback하는지 확인한다.
- 일반 단계 완료 테스트는 순수 plan의 effect 순서, rejection·retry·replay의 빈 effect, lesson/course/activity 결과와 마지막 activity fault에서 답안·lesson·course·activity 전체 rollback을 확인한다.
- 서버 드래프트 SQLite 테스트는 사용자·revision·레슨·스텝 격리, 크기·version 제약, 낙관적 충돌, 조회·시작 복구, 부모 삭제 cascade와 제출 실패 시 답안·드래프트 rollback을 확인한다.
- 레슨 세션이 서버 전이 결과만으로 이동하는지 web 테스트로 확인한다.
- 웹 초안 테스트는 debounce·즉시 flush·진행 중 저장 합치기, 네트워크 재시도, stale version 충돌의 양쪽 값 보존, focus 조정과 첫 render 복원을 확인한다. Chromium과 Safari smoke는 새로고침·다른 탭·재로그인 복구를 확인한다.
- 매칭 정책의 결정성·중복 label·일대일 재배정·재선택·정답 tone·item-ID payload는 web 테스트로, controlled 표시·keyboard callback·접근성 상태는 UI와 Storybook 테스트로 확인한다.
- step 시각 상태는 Storybook fixture로, 어드민 편집 union은 editor 테스트로 확인한다.
