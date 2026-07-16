# ADR-0011: 관계형 커리큘럼 버전과 학습자 버전 고정

## 상태

채택됨

## 날짜

2026-07-17

## 맥락

기존 커리큘럼은 `courses`, `course_units`, `lessons`, `lesson_steps` row를 직접 수정한다. 학습 진행과 답변도 현재 lesson·step ID를 직접 참조하므로, 관리자가 콘텐츠를 수정하면 이미 학습을 시작한 사용자가 보던 구조와 채점 기준이 바뀔 수 있다. `courses.curriculum_revision`은 편집 충돌만 감지할 뿐 과거 커리큘럼을 보존하지 않는다.

학습자는 시작 시점의 커리큘럼을 끝까지 사용해야 하고, 관리자는 게시 전 draft만 수정해야 한다. 게시된 구조를 JSON aggregate snapshot으로 저장하면 관계 무결성, 부분 조회와 마이그레이션 검증이 불투명해지므로 기존 SQLite 관계형 경계를 유지해야 한다.

## 결정

- `courses`는 코스 identity, lifecycle, catalog 순서와 현재 published version pointer만 소유한다.
- `course_curriculum_versions`는 course별 `draft | published` lifecycle, 게시 revision, draft `edit_version`, 코스 표시 metadata와 시각을 소유한다.
- unit·lesson·step은 각각 version table에 저장한다.
- unit·lesson·step의 논리 ID는 버전 사이에서 유지한다. 영속 identity는 `(curriculum_version_id, 논리 ID)` 복합 키다.
- 하위 row는 복합 foreign key로 같은 curriculum version 안의 부모만 참조한다.
- course당 draft는 partial unique index로 하나만 허용한다.
- draft의 `revision`은 다음 publish revision이며, `edit_version`은 draft 저장 성공마다 증가하는 `If-Match` 검증자다. 두 값을 같은 의미로 사용하지 않는다.
- publish transaction은 draft를 검증한 뒤 `published`로 전환하고 course pointer를 교체한다. published row와 하위 콘텐츠는 repository에서 수정하지 않는다.
- publish 뒤 같은 논리 ID와 새 복합 identity를 가진 다음 revision draft를 복제한다.
- 학습 시작 시 `learner_course_progress`가 curriculum version을 한 번 고정한다. lesson progress, answer와 AI attempt는 같은 version의 lesson·step만 참조한다.
- `current_step_index`는 versioned lesson 안의 `current_step_id`로 변환한다.
- 기존 mutable 콘텐츠는 published revision `1`과 revision `2` draft로 결정적으로 변환한다.
- selectable item ID는 step 안에서 안정적으로 저장하고 solution은 해당 ID만 참조한다.

## 고려한 대안

### 대안 1. aggregate JSON snapshot

- 장점: version 하나를 복사하고 보존하기 쉽다.
- 단점: foreign key, sibling 순서, lesson·step 부분 조회와 migration integrity를 DB가 보장하지 못한다.

### 대안 2. 논리 ID마다 전역 version row ID 추가

- 장점: 모든 참조가 단일 column foreign key가 된다.
- 단점: 기존 ID와 별도 식별자 mapping이 모든 API와 repository에 퍼진다. curriculum version과 논리 ID의 복합 키로 같은 불변조건을 더 직접 표현할 수 있다.

### 대안 3. 기존 row를 복사하지 않고 변경 이력만 저장

- 장점: 현재 schema 변경이 작다.
- 단점: 특정 revision의 완전한 구조를 재구성하려면 변경 순서와 모든 patch를 재생해야 하며 학습 요청의 결정성이 낮아진다.

## 결과

- 게시 revision과 draft 편집 version을 분리해 publish 순서와 저장 충돌을 명확히 관측한다.
- 동일한 lesson·step 논리 ID가 여러 version에 존재할 수 있으므로 repository query는 항상 curriculum version scope를 포함해야 한다.
- 하위 row 수는 version 수에 비례해 증가하지만 과거 학습 핀과 게시 불변성을 직접 보장한다.
- schema와 API를 함께 배포해야 하며 기존 DB는 maintenance window에서 일회성 transaction migration을 수행해야 한다.

## 검증

- 새 baseline과 기존 fixture migration의 최종 table·index·foreign key가 같은지 비교한다.
- 기존 콘텐츠가 published revision `1`과 다음 draft로 변환되는지 확인한다.
- 유효한 `current_step_index`가 정확한 step ID로 바뀌고 범위를 벗어나면 전체 migration이 rollback되는지 확인한다.
- course당 draft unique index, published update 거부와 stale `If-Match` 동시성 테스트를 둔다.
- publish validation, 다음 draft clone, archive 뒤 기존 learner pin 보존을 integration test로 확인한다.
- migration 뒤 `PRAGMA integrity_check`와 `PRAGMA foreign_key_check`를 실행한다.

## 구현 상태

2026-07-17 단계 2 구현을 완료했다. baseline·legacy schema 동등성, 이관 fail-fast, 단일 draft, published 불변성, stale 발행, 다음 draft 복제와 archive pin 보존을 자동화 테스트로 검증한다.
