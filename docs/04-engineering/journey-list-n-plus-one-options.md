---
title: 여정 목록 N+1 제거 방안
description: 완료 여정 목록과 내 여정 목록 조회에서 발생하는 N+1 쿼리 문제를 현재 코드 기준으로 분석하고, 서로 다른 3가지 해결 접근을 비교합니다.
---

## 상태

- 기준 시점: 2026-04-20
- 구현 상태:
  - `list-completed-journeys.ts`, `list-user-journeys.ts`, `get-home.ts`는 접근 2로 전환 완료
  - `ProgressRepository.listUserJourneyItems(userId, status)` 도입 완료
- 대상 코드:
  - `packages/core/src/modules/progress/use-cases/list-completed-journeys.ts`
  - `packages/core/src/modules/progress/use-cases/list-user-journeys.ts`
  - `packages/core/src/modules/home/use-cases/get-home.ts`
  - `packages/database/src/repository/journey.repository.ts`
- 목표:
  - 여정 목록 조회 시 `journeyId`별 개별 조회를 제거한다.
  - 현재 패키지 경계(`apps -> packages`, `application -> domain`, `infrastructure -> domain`)를 해치지 않는다.
  - 목록 화면에 필요한 데이터만 읽도록 조회 비용을 줄인다.

## 문제 요약

현재 두 use case는 먼저 진행 상태 목록을 읽고, 이후 각 `journeyId`마다 `journeyRepository.getById()`를 호출한다.

- `list-completed-journeys.ts`:
  - `progressRepository.listCompletedJourneys(userId)`
  - `progresses.map((p) => journeyRepository.getById(p.journeyId))`
- `list-user-journeys.ts`:
  - `progressRepository.listActiveJourneys(userId)` 또는 `listCompletedJourneys(userId)`
  - `progresses.map((p) => journeyRepository.getById(p.journeyId))`

이 패턴은 일반적인 의미의 N+1보다도 더 비싸다.

- `progressRepository`에서 진행 상태 목록 조회: 1회
- `journeyRepository.getById()` 내부:
  - `journeys` 조회 1회
  - `journey_sessions` 조회 1회
- 따라서 완료 여정이 100개면 실제 쿼리는 `1 + (100 * 2) = 201회`가 된다.

또한 목록 화면에서 제목, 설명, 썸네일, 세션 수 정도만 필요해도 `getById()`는 세션 목록 전체를 항상 읽는다. 즉, N+1과 과조회(over-fetching)가 동시에 발생한다.

## 접근 1. `JourneyRepository`에 배치 조회를 추가한다

가장 작은 구조 변경으로 N+1을 제거하는 방법이다.

### 핵심 아이디어

- `JourneyRepository`에 `listByIds(journeyIds: JourneyId[]): Promise<JourneySummary[] | JourneyDetail[]>` 같은 배치 API를 추가한다.
- `packages/database` 구현은 `where in (...)` 한 번으로 여정들을 읽고, 세션 수만 필요하면 집계 서브쿼리 또는 `group by`로 붙인다.
- use case는 `progresses`에서 `journeyId[]`를 추출한 뒤 단 한 번만 repository를 호출한다.

### 적용 형태

- 포트 예시:

```ts
export interface JourneyRepository {
  listByIds(journeyIds: JourneyId[]): Promise<JourneySummary[]>
}
```

- use case 흐름:
  1. 진행 상태 목록 조회
  2. `journeyId[]` 추출 및 중복 제거
  3. `journeyRepository.listByIds(ids)` 1회 호출
  4. `journeyId` 기준으로 결과를 매핑

### 장점

- 현재 `progressRepository`와 `journeyRepository` 책임을 거의 유지한다.
- diff가 가장 작고, 기존 use case 구조를 크게 바꾸지 않는다.
- 다른 목록 화면도 같은 배치 API를 재사용할 수 있다.

### 단점

- 진행 상태와 여정 메타데이터를 두 번 읽는 구조 자체는 유지된다.
- 정렬 기준을 진행 상태 기준으로 유지하려면 애플리케이션 레이어에서 재매핑이 필요하다.
- `JourneyDetail` 대신 목록 전용 DTO를 분리하지 않으면 배치 조회에서도 과조회를 그대로 들고 갈 수 있다.

### 적합한 경우

- 빠르게 성능 병목만 해소해야 할 때
- 패키지 경계를 거의 건드리지 않고 안전하게 개선해야 할 때

## 접근 2. `ProgressRepository`가 조인된 목록 DTO를 직접 반환한다

목록 조회를 진행 상태 중심 읽기 모델로 정의하는 방법이다.

### 핵심 아이디어

- 이 화면의 진짜 관심사는 "사용자의 여정 진행 목록"이다.
- 따라서 `ProgressRepository`가 `user_journey_progress`와 `journeys`를 조인해서 목록 전용 DTO를 바로 반환한다.
- 필요하다면 `journey_sessions` 집계도 같은 쿼리 안에서 붙인다.

### 적용 형태

- 예시 DTO:

```ts
export type UserJourneyListItem = {
  readonly journeyId: JourneyId
  readonly title: string
  readonly description: string
  readonly thumbnailUrl: string | null
  readonly status: "in_progress" | "completed"
  readonly completionRate: number
  readonly currentSessionOrder: number
  readonly sessionCount: number
}
```

- 포트 예시:

```ts
export interface ProgressRepository {
  listUserJourneys(
    userId: UserId,
    status: "in_progress" | "completed"
  ): Promise<UserJourneyListItem[]>
}
```

### 장점

- 쿼리 수를 사실상 1회로 줄일 수 있다.
- 목록 화면이 실제로 필요한 필드만 읽게 되어 과조회도 함께 제거된다.
- 진행 상태 정렬, 필터링, 파생 필드 계산을 DB에서 일관되게 처리할 수 있다.

### 단점

- `ProgressRepository`가 여정 메타데이터까지 아는 구조가 되어 읽기 책임이 넓어진다.
- 기존의 "진행 상태 저장소"라는 이름보다 "사용자 여정 읽기 모델"에 가까워지므로 포트 이름이나 문서 설명을 보강해야 한다.
- 세부 화면과 목록 화면의 DTO가 더 분명히 분리된다.

### 적합한 경우

- 목록 화면이 제품 핵심 경로라서 조회 최적화를 우선해야 할 때
- 현재 `getById()`의 과조회도 함께 정리하고 싶을 때

## 접근 3. 조회 전용 Read Model/Query Service로 분리한다

쓰기 모델과 읽기 모델을 분리해 목록 조회를 별도 경계로 만드는 방법이다.

### 핵심 아이디어

- `JourneyRepository`와 `ProgressRepository`는 도메인 저장소로 유지한다.
- 대신 목록 화면 전용 `UserJourneyQueryService` 또는 `JourneyListReadRepository`를 새로 둔다.
- 이 조회 전용 경계가 조인, 집계, 정렬, projection을 전담한다.

### 적용 형태

- 예시 포트:

```ts
export interface UserJourneyQueryService {
  listByStatus(
    userId: UserId,
    status: "in_progress" | "completed"
  ): Promise<UserJourneyListItem[]>
}
```

- 구현 위치 예시:
  - `packages/core/src/modules/progress`
  - `packages/database/src/query`

### 장점

- 도메인 저장소는 쓰기/단건 조회 책임을 유지하고, 복잡한 목록 조회는 별도 읽기 모델로 격리된다.
- 앞으로 홈, 내 여정, 추천 여정처럼 화면별 projection이 늘어나도 저장소 API를 오염시키지 않는다.
- CQRS-lite에 가까운 형태라 읽기 최적화와 경계 명확성이 가장 좋다.

### 단점

- 새 포트와 새 구현이 필요하므로 초기 변경량이 가장 크다.
- 팀이 아직 read model/query service 패턴에 익숙하지 않으면 과한 추상화처럼 보일 수 있다.
- 작은 프로젝트 단계에서는 체감 비용이 클 수 있다.

### 적합한 경우

- 홈/내 여정/추천 등 사용자별 목록 조회가 계속 늘어날 예정일 때
- 도메인 저장소를 목록용 projection 요구사항으로부터 보호하고 싶을 때

## 비교

| 항목         | 접근 1. Journey 배치 조회 | 접근 2. Progress 조인 DTO | 접근 3. Read Model 분리 |
| ------------ | ------------------------- | ------------------------- | ----------------------- |
| 쿼리 수 감소 | 좋음                      | 매우 좋음                 | 매우 좋음               |
| 변경 범위    | 작음                      | 중간                      | 큼                      |
| 과조회 제거  | 부분적                    | 좋음                      | 좋음                    |
| 경계 명확성  | 보통                      | 보통                      | 가장 좋음               |
| 구현 속도    | 가장 빠름                 | 빠름                      | 가장 느림               |
| 장기 확장성  | 보통                      | 좋음                      | 가장 좋음               |

## 권장안

현재 코드베이스 기준으로는 접근 2를 우선 권장한다.

- 문제의 본질은 "진행 상태 목록을 보여주기 위한 화면"인데, 지금은 이를 "진행 상태 조회 + 여정 상세 반복 조회"로 풀고 있다.
- 목록에 필요한 데이터가 명확히 제한되어 있으므로, `ProgressRepository`가 목록 전용 DTO를 직접 반환하는 편이 단순하고 효율적이다.
- 이 방식은 접근 1보다 구조적으로 맞고, 접근 3보다 도입 비용이 낮다.

2026-04-20 기준으로 이 권장안은 아래 범위에 먼저 적용했다.

- `packages/core/src/modules/progress/use-cases/list-completed-journeys.ts`
- `packages/core/src/modules/progress/use-cases/list-user-journeys.ts`
- `packages/core/src/modules/home/use-cases/get-home.ts`
- `packages/database/src/repository/progress.repository.ts`

즉, 프로필/홈/내 여정/여정 목록에서 사용하는 여정 목록 조회는 조인 DTO 기반 단일 조회로 바뀌었다.

다만 다음 조건이면 접근 3으로 바로 가는 편이 낫다.

- 홈/내 여정/추천/관리 화면 등에서 서로 다른 목록 projection이 계속 늘어날 예정인 경우
- 읽기 최적화와 도메인 저장소 경계를 장기적으로 분리하려는 경우

반대로 지금 즉시 병목만 제거해야 한다면 접근 1이 가장 안전한 응급 처치다.

## 구현 순서 제안

1. 목록 화면에 실제 필요한 필드를 확정한다.
2. `JourneyDetail` 재사용을 중단하고 목록 전용 DTO를 정의한다.
3. 접근 2 또는 접근 3 기준으로 단일 쿼리 읽기 경계를 만든다.
4. `list-completed-journeys.ts`, `list-user-journeys.ts`에서 per-id `getById()` 호출을 제거한다.
5. 여정 100개 기준 쿼리 수와 응답 시간을 회귀 테스트 또는 로깅으로 검증한다.

## 관련 문서

- [[04-engineering/backend-package-boundaries]]
- [[04-engineering/backend-core-guide]]
- [[04-engineering/dependency-injection]]
- [[04-engineering/transaction-boundary-audit]]
