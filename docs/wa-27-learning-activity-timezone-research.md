# WA-27 학습 활동일 타임존 의존성 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-27 `날짜 포맷팅의 암묵적 시간대(Timezone) 의존성`
- 조사 범위: 기존 `packages/db/src/repositories/activity-date.ts`, 학습/관리자 repository의 활동일 사용처, 학습자 API streak 계산, `docs/platform-backend-api.md`

## 이슈 요약

WA-27은 `packages/db/src/repositories/activity-date.ts`가 `Intl.DateTimeFormat`과 `Asia/Seoul`을 사용해 날짜 키를 만들기 때문에 시스템 시간대나 글로벌 사용자 환경에 따라 데이터 무결성이 깨질 수 있다고 지적한다.

## 코드 조사

현재 구현은 다음과 같다.

- `learningActivityTimeZone = "Asia/Seoul"` 상수를 둔다.
- `Intl.DateTimeFormat`에 `timeZone: learningActivityTimeZone`을 명시한다.
- `toLearningDateKey(date)`는 `YYYY-MM-DD` 학습 활동일 키를 만든다.
- `addLearningCalendarDays(dateKey, days)`는 `YYYY-MM-DD` 논리 날짜를 UTC calendar arithmetic으로 이동한다.

`learning.repository.ts`는 lesson progress, answer 저장, lesson 완료 시 `learner_activity_days.activity_date`에 이 학습 활동일 키를 저장한다. 관리자 dashboard/analytics/user list와 학습자 API의 streak 계산도 같은 활동일 키와 `addLearningCalendarDays()`를 사용한다.

`docs/platform-backend-api.md`에는 이미 다음 정책이 명시되어 있다.

- DB timestamp는 UTC instant로 유지한다.
- 학습 활동일 같은 논리 날짜는 서버 기준 학습 타임존인 `Asia/Seoul`로 계산한다.
- `Intl.DateTimeFormat`의 명시적 `timeZone` 옵션으로 날짜 키를 만든다.

테스트도 `2026-06-14T15:30:00.000Z` 활동이 KST 기준 `2026-06-15`로 저장되는지를 검증한다.

## 판단

이슈는 현재 표현 그대로는 타당하지 않다.

문제의 구현은 시스템 로컬 타임존에 암묵적으로 의존하지 않는다. 오히려 `Intl.DateTimeFormat`에 `Asia/Seoul`을 명시해 서버/개발자 머신의 로컬 타임존 차이를 제거한다. 또한 DB에 모든 값을 UTC timestamp로만 저장해야 한다는 제안은 학습 활동일 같은 논리 날짜에는 맞지 않는다. 하루 단위 streak, 활동일, 집계 bucket은 instant가 아니라 제품 정책상 정한 calendar day이므로 `YYYY-MM-DD` 논리 날짜를 저장하는 것이 합리적일 수 있다.

다만 장기적으로 글로벌 사용자별 타임존을 지원하려면 기존 구조는 부족했다. `Asia/Seoul` 정책이 DB repository 패키지 안에 있고, activity date key 타입이 일반 string이며, 사용자별 학습일 정책을 표현할 도메인 타입이 없었다. 또한 관리자 대시보드의 가입자 집계 일부는 학습일 key를 만들고도 UTC 자정 range를 다시 만들어 비교했다.

따라서 이 작업은 “DB에 UTC timestamp만 저장”으로 바꾸지 않고, 학습 활동일을 core 도메인 계약으로 승격해 instant와 logical date의 책임을 분리하는 방향으로 진행했다.

## 향후 구조 개선 방안

### 방안 1. 학습 활동일 정책을 core 도메인 타입으로 이동한다

`LearningDateKey` brand type과 `LearningCalendarPolicy`를 `packages/core`에 둔다. DB repository는 이 정책을 호출해 저장만 담당한다. 장점은 학습일이 단순 string이 아니라 도메인 개념으로 드러난다.

### 방안 2. 플랫폼 기본 타임존과 사용자 타임존을 분리한다

현재 정책은 플랫폼 기본 학습 타임존 `Asia/Seoul`이다. 향후 글로벌 지원이 필요하면 다음을 분리한다.

- platform default learning timezone
- user preferred timezone
- course/cohort timezone

각 정책별로 activity day를 계산하는 위치와 migration 전략을 명시한다.

### 방안 3. instant와 logical date 저장 규칙을 schema에 명확히 반영한다

`learner_activity_days.activity_date`는 UTC timestamp가 아니라 logical learning date라는 점을 schema comment나 문서에 남긴다. `firstActivityAt`, `lastActivityAt`, `startedAt`, `completedAt`, `updatedAt`은 UTC instant로 유지한다.

### 방안 4. timezone 경계 테스트를 확대한다

현재 KST 다음 날 새벽 케이스는 있다. 추가로 다음을 검증한다.

- UTC 날짜와 KST 날짜가 다른 양방향 경계
- 연말/연초 경계
- 윤년
- DST가 있는 타임존을 도입할 경우 해당 경계

### 방안 5. 사용자별 타임존 도입 시 migration 계획을 먼저 만든다

기존 `activity_date`를 재계산할지, 기존 데이터는 플랫폼 기준으로 고정할지, 새 컬럼을 추가할지 결정해야 한다. 이 결정 없이 UTC timestamp만 저장하도록 바꾸면 기존 streak와 관리자 집계가 깨질 수 있다.

## 검증 계획

- `bun --filter @workspace/db test -- learning.repository admin.repository`
- `bun --filter @workspace/api test -- progress.route app`
- 향후 core 이동 시 `bun --filter @workspace/core test -- learning-date`

## 완료 기록

- WA-27 본문을 읽고 활동일 유틸, 학습 repository, 관리자 repository, API streak 계산, 기존 문서를 조사했다.
- 현재 구현은 시스템 로컬 타임존에 암묵적으로 의존하지 않는다고 판단했다.
- 그러나 학습일 정책이 DB repository 내부에 있는 구조와 UTC 자정 range가 섞인 대시보드 집계는 장기 안정성 문제가 있다고 판단했다.
- `packages/core/src/learning/learning-date.ts`에 `LearningDateKey`, 플랫폼 학습 시간대, 날짜 키 생성, 일 단위 이동, range 비교, 연속 학습일 계산을 추가했다.
- DB repository와 학습자 API 조립 루트가 DB 내부 activity date 유틸이 아니라 core 학습일 계약을 사용하도록 바꿨다.
- 관리자 대시보드의 가입자 당일/최근 7일 집계를 UTC 자정 range가 아니라 `LearningDateKey` range 비교로 변경했다.
- KST 날짜 경계, 연말/연초, 윤년, streak, range 비교 테스트를 core에 추가했다.
