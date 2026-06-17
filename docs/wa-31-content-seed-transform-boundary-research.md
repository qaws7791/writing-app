# WA-31 콘텐츠 Seed 변환 중첩 구조 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-31 `깊게 중첩된 Seed 로직 (Deep Nesting)`
- 조사 범위: `packages/db/src/seeds/seed-content.ts`, seed 변환 테스트, 콘텐츠 repository와 admin reset 사용처

## 이슈 요약

WA-31은 `packages/db/src/seeds/seed-content.ts`의 `createContentSeedRows()`가 course, unit, lesson, step을 4중 `forEach`로 순회하며 row 배열에 push하기 때문에 가독성과 변경 안정성이 떨어진다고 지적한다.

## 코드 조사

현재 `createContentSeedRows()`는 다음 네 배열을 mutable하게 만든다.

- `courseRows`
- `unitRows`
- `lessonRows`
- `stepRows`

이후 다음 구조로 중첩 순회한다.

1. `courses.forEach`
2. `course.units.forEach`
3. `unit.lessons.forEach`
4. `lesson.steps.forEach`

각 단계에서 parent id와 sort order를 계산해 row 배열에 push한다. 함수 자체는 50줄 안팎이지만, Kwep seed shape, DB row shape, id 생성, sort order, content JSON 직렬화, step type 정규화가 한 함수에 몰려 있다.

테스트는 전체 row 수량, 첫 course/unit/lesson/step 대표값, step type distribution을 검증한다. 그러나 unit/lesson/step row 생성 정책이 함수 단위로 분리되어 있지는 않아 개별 변환 정책을 작게 테스트하기 어렵다.

`createDefaultContentSeedRows()`는 DB seed와 admin content reset에서 재사용되므로 이 변환 함수는 운영 데이터 초기화 경계에도 영향을 준다.

## 판단

이슈는 타당하다.

단순히 중첩 depth만의 문제가 아니라 seed 변환이 하나의 절차적 블록으로 되어 있어 새 seed 필드, 새 row 테이블, step content normalization이 추가될 때 같은 함수가 계속 커질 가능성이 높다. seed는 테스트 데이터가 아니라 baseline 콘텐츠와 admin reset의 입력이므로 변환 정책을 작은 순수 함수로 나누는 편이 안전하다.

## 개선 방안

### 방안 1. row 종류별 mapper로 분리한다

다음 순수 함수를 만든다.

- `toCourseSeedRow(course, courseIndex)`
- `toUnitSeedRows(course)`
- `toLessonSeedRows(course, unit)`
- `toStepSeedRows(lesson)`

`createContentSeedRows()`는 이 mapper들을 조합하는 facade가 된다. 장점은 각 row type의 정책과 테스트가 독립된다.

### 방안 2. flatMap 기반의 불변 변환으로 바꾼다

mutable array와 nested push 대신 `map`/`flatMap`으로 row 목록을 만든다.

- courses: `courses.map(toCourseSeedRow)`
- units: `courses.flatMap(toUnitSeedRows)`
- lessons: `courses.flatMap(toLessonSeedRowsForCourse)`
- steps: `courses.flatMap(toStepSeedRowsForCourse)`

장점은 출력이 입력에서 파생되는 구조가 명확해지고, 중간 배열 mutation을 줄인다.

### 방안 3. seed source path를 명시적인 normalized tree로 변환한다

먼저 Kwep 원본 seed를 `NormalizedContentSeed`로 바꾼다.

- course context
- unit context
- lesson context
- step context

각 context에는 parent id와 sort order가 이미 포함된다. 그 다음 DB row 생성은 normalized context를 row로 mapping한다. 장점은 parent context 전달이 함수 인자에 명시되고, 향후 다른 seed source를 추가할 때도 같은 normalized tree를 재사용할 수 있다.

### 방안 4. step content normalization을 전용 module로 분리한다

현재 `contentJson: JSON.stringify(step)`로 원본 step을 그대로 저장한다. 스텝 타입과 content shape 정책은 WA-14와도 연결된다. `normalizeSeedStepContent(step)`을 두어 type별 content serialization을 책임지게 한다.

장점은 새 step 타입이 추가될 때 seed row 생성 함수가 아니라 step content policy 테스트가 깨진다.

### 방안 5. seed 변환 계약 테스트를 계층별로 나눈다

현재 대표값 테스트 외에 다음 테스트를 추가한다.

- course mapper가 sort order와 revision을 만든다.
- unit mapper가 course id를 정확히 보존한다.
- lesson mapper가 time parsing, nullable field, summary JSON을 처리한다.
- step mapper가 id, sort order, 표준 타입, content JSON을 처리한다.
- invalid time이나 unknown step type은 명시적 오류를 낸다.

장점은 seed 변환 실패 위치가 좁아지고, 전체 fixture 수량 테스트에만 의존하지 않게 된다.

## 권장 진행 순서

1. 현재 동작을 보존하는 계층별 mapper 테스트를 먼저 추가한다.
2. `toCourseSeedRow`, `toUnitSeedRows`, `toLessonSeedRows`, `toStepSeedRows`를 추출한다.
3. `createContentSeedRows()`를 mapper 조합 facade로 축소한다.
4. `normalizeSeedStepContent()`를 추가해 step content serialization 정책을 분리한다.
5. invalid seed 입력에 대한 명시적 오류 테스트를 추가한다.
6. seed 변환 구조를 개발/데이터 문서에 기록한다.

## 검증 계획

- `bun --filter @workspace/db test -- seed-content`
- `bun --filter @workspace/db test -- seed`
- `bun --filter @workspace/db test -- admin.repository`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-31 본문을 읽고 seed 변환 함수, 관련 테스트, DB seed/admin reset 사용처를 조사했다.
- 이슈는 타당하다고 판단했다.
- `createContentSeedRows()`를 course/unit/lesson/step mapper를 조합하는 facade로 축소했다.
- `toCourseSeedRow()`, `toUnitSeedRows()`, `toLessonSeedRows()`, `toStepSeedRows()`, `toLessonStepSeedRows()`를 분리해 parent id와 sort order 정책을 계층별로 드러냈다.
- `normalizeSeedStepContent()`를 추가해 step content serialization 정책을 별도 테스트 대상으로 만들었다.
- 계층별 mapper 테스트와 invalid lesson time 테스트를 추가해 전체 fixture 수량 테스트에만 의존하지 않게 했다.
