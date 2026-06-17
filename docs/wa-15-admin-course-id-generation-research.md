# WA-15 관리자 코스 ID 생성 충돌 분석

## 2026-06-17 시작

- Notion 이슈: `WA-15 트랜잭션 블록 내의 안전하지 않은 난수 충돌`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-15 페이지
- 조사 범위: `packages/db/src/repositories/admin.repository.ts`의 `createCourse`, 관리자 service/repository 계약, DB schema와 관련 테스트
- 목표: 관리자 코스 생성 ID가 실제 충돌 가능성을 갖는지 확인하고, 콘텐츠 aggregate 생성이 더 안정적인 구조가 되도록 개선 방향을 도출한다.

## 2026-06-17 구현 시작

- 선택한 방향: ID 생성 책임을 `admin.repository.ts` 내부 시간 계산에서 분리하고, 관리자 코스 aggregate ID factory를 repository 의존성으로 주입한다.
- 안정성 목표: 운영 기본 factory는 `crypto.randomUUID()` 기반 불투명 ID를 생성하고, 테스트는 deterministic factory를 주입해 생성 ID 계약을 명시한다.
- 추가 방어선: unique constraint 충돌이 감지되면 같은 aggregate 생성을 제한 횟수 안에서 다시 시도한다.

## 이슈 요약

WA-15는 `packages/db/src/repositories/admin.repository.ts`의 `createCourse()`가 코스 ID를 `c${input.now.getTime().toString(36)}`로 생성해 같은 밀리초에 코스 생성 요청이 둘 이상 들어오면 primary key 충돌이 발생할 수 있다고 지적한다.

## 코드 조사

### 현재 구현

`createCourse()`는 트랜잭션 전에 다음 ID를 만든다.

- `courseId = c${input.now.getTime().toString(36)}`
- `unitId = ${courseId}-u1`
- `lessonId = ${courseId}-l1`
- 스텝 ID는 `${lessonId}-s1`, `${lessonId}-s2`

이후 하나의 트랜잭션에서 `courses`, `course_units`, `lessons`, `lesson_steps`를 insert한다.

### 실제 위험

이슈는 타당하다.

- `input.now`는 관리자 API route에서 요청 시각으로 들어오는 값이다.
- 같은 millisecond에 두 요청이 들어오면 동일한 `courseId`가 생성된다.
- `unitId`, `lessonId`, `stepId`가 모두 `courseId`에서 파생되므로 한 번의 충돌이 전체 aggregate 생성 실패로 이어진다.
- 현재 테스트는 고정 시각 `2026-06-14T03:00:00.000Z`에서 `cmqd74yo0`이 생성되는지를 고정한다. 충돌 방지 테스트는 없다.

### 더 넓은 구조 문제

문제는 단순한 난수 선택이 아니라 ID 생성 책임이 repository 구현 내부에 숨겨져 있다는 점이다.

- `packages/core/src/content/content.ids.ts`는 brand type만 정의하고 ID 생성 정책은 없다.
- `AdminRepository.createCourse(input)`은 `now`만 받으므로 테스트와 호출자는 ID 생성 전략을 알 수 없다.
- DB repository가 시간, aggregate 구조, ID 정책을 모두 결정한다.

## 판단

WA-15는 타당하다. 현재 ID 생성은 deterministic test에는 편하지만 운영 동시성에는 안전하지 않다. 또한 시간 기반 ID는 생성 시각과 식별자 의미를 암묵적으로 결합한다.

개선은 `crypto.randomUUID()`를 한 줄로 직접 호출하는 데서 끝내기보다, 콘텐츠 aggregate ID 생성 정책을 명시적인 Module 또는 포트로 분리해 테스트 가능성과 충돌 안전성을 동시에 확보하는 방향이 좋다.

## 해결 방안

### 방안 1. 관리자 콘텐츠 ID factory를 repository 의존성으로 주입한다

`createDrizzleAdminRepository(db, { createContentIds })`처럼 ID factory를 repository 생성 시 주입한다.

예상 factory 반환값:

```ts
type NewCourseContentIds = {
  readonly courseId: CourseId
  readonly unitId: UnitId
  readonly lessonId: LessonId
  readonly readingStepId: LessonStepId
  readonly writeStepId: LessonStepId
}
```

운영 기본 adapter는 `crypto.randomUUID()` 또는 검증된 짧은 ID 생성기를 사용하고, 테스트는 deterministic factory를 주입한다.

장점은 ID 생성 정책이 repository 내부에서 숨지 않고, 테스트가 시간 기반 ID에 의존하지 않게 된다는 점이다. 충돌 가능성도 UUID 수준으로 낮아진다.

추천 강도: 높음.

### 방안 2. aggregate ID와 child ID 생성 규칙을 명시한다

코스, 유닛, 레슨, 스텝은 하나의 aggregate로 함께 생성된다. child ID를 parent ID에 문자열 suffix로 붙일지, 각각 독립 UUID로 만들지 정책을 정해야 한다.

권장 방향:

- 외부 URL에 노출되는 `courseId`는 짧고 불투명한 ID를 사용한다.
- `unitId`, `lessonId`, `lessonStepId`는 parent ID에서 파생해도 되지만, 파생 규칙을 factory 안에 가둔다.
- 향후 유닛/레슨을 추가하는 기능이 생기면 같은 factory에서 child ID를 만든다.

장점은 계층 ID 규칙이 여러 repository 함수에 흩어지지 않는다는 점이다.

추천 강도: 높음.

### 방안 3. unique constraint 충돌을 명시적 재시도 또는 도메인 오류로 처리한다

난수 기반 ID를 사용하더라도 DB unique constraint는 마지막 방어선이다. `createCourse()`는 insert 충돌을 예상 가능한 실패로 분류해야 한다.

선택지:

- ID factory를 최대 N회 재호출해 aggregate insert를 재시도한다.
- 재시도 후에도 실패하면 `content-id-collision` 같은 명시적 repository 오류를 반환한다.
- 관리자 API는 이를 409 또는 503으로 매핑하고 내부 오류로 숨기지 않는다.

장점은 확률적으로 낮은 충돌도 관찰 가능한 실패로 만든다는 점이다. 단점은 현재 `AdminRepository.createCourse`가 DTO를 바로 반환하므로 Result union 도입이 필요하다.

추천 강도: 중간 이상.

### 방안 4. ID 생성 정책을 문서화하고 seed ID와 runtime ID를 분리한다

seed 콘텐츠는 사람이 읽을 수 있는 안정 ID를 유지할 수 있다. 반면 관리자 런타임에서 새로 만드는 콘텐츠는 불투명하고 충돌 안전한 ID를 써야 한다.

문서화할 내용:

- seed ID는 콘텐츠 이식과 회귀 테스트를 위한 안정 ID다.
- runtime ID는 생성 시각을 인코딩하지 않는다.
- ID는 의미 정보를 담지 않고 URL과 FK 참조를 위한 불투명 식별자로 취급한다.

장점은 향후 이미지 매핑, route, 테스트 fixture가 runtime ID 형식에 기대는 일을 줄인다.

추천 강도: 중간.

## 권장 순서

1. `createCourse()` 충돌 재현 테스트를 추가한다. 같은 `now`로 두 번 호출했을 때 두 코스가 모두 생성되어야 한다.
2. repository 생성 시 주입되는 `createContentIds` factory를 추가한다.
3. 운영 기본 factory는 `crypto.randomUUID()` 기반 불투명 ID를 만들고, 기존 테스트는 deterministic factory로 기대 ID를 고정한다.
4. unique constraint 충돌 처리와 재시도 정책을 별도 단계로 추가한다.
5. seed ID와 runtime ID 정책을 문서화한다.

## 검증 계획

- `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/core test src/admin/admin.service.test.ts`
- `bun --filter @workspace/admin-api test src/routes/courses.route.test.ts`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/admin-api typecheck`

## 2026-06-17 완료

- Notion `WA-15` 내용을 확인했다.
- 관리자 코스 생성 repository, 관리자 service 계약, 테스트, 관련 ID 사용처를 조사했다.
- WA-15는 타당하다고 판단했다.
- 단순 직접 UUID 호출보다 ID factory 주입, aggregate ID 정책 명시, unique constraint 충돌 처리, seed/runtime ID 정책 분리를 추천한다.

## 2026-06-17 구현 완료

- `packages/db/src/repositories/admin-content-ids.ts`를 추가해 관리자 코스 생성 aggregate의 ID 묶음을 명시적인 factory로 분리했다.
- `createDrizzleAdminRepository()`는 선택적 `createCourseContentIds` 의존성을 받으며, 운영 기본값은 `crypto.randomUUID()` 기반 불투명 ID를 사용한다.
- `createCourse()`는 ID unique constraint 충돌을 감지하면 제한 횟수 안에서 ID factory를 다시 호출해 같은 aggregate 생성을 재시도한다.
- 기존 시간 기반 ID 기대 테스트는 deterministic factory 주입 방식으로 바꾸고, 같은 요청 시각의 연속 생성과 충돌 재시도 회귀 테스트를 추가했다.
- `admin-api` typecheck에서 노출되던 `packages/db` 내부 self-alias를 package export 경로로 정리해 외부 앱에서도 타입 해석이 가능하게 했다.

## 검증 결과

- `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/core test src/admin/admin.service.test.ts`
- `bun --filter @workspace/admin-api test src/routes/courses.route.test.ts`
- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/db lint`
