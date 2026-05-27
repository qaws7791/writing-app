# 콘텐츠 변경 정책 문서화 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획을 태스크 단위로 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [ ]`) 문법을 사용한다.

**목표:** 커리큘럼 버전 관리 로드맵의 1단계로, 콘텐츠 변경 유형과 학습자 성취 보존 원칙을 공식 문서에 고정한다.

**아키텍처:** 이번 계획은 런타임 코드와 DB 스키마를 바꾸지 않는 문서화 작업이다. `DOMAIN.md`를 도메인 정책의 단일 출처로 두고, `BACKEND.md`와 `/docs` 문서는 현재 API/DB가 그 정책을 아직 어떻게 제약받는지 설명한다.

**기술 스택:** Markdown, Prettier, ripgrep, Git.

---

## 파일 구조

- 수정: `DOMAIN.md`
  - 콘텐츠 변경 정책의 단일 출처를 작성한다.
  - 변경 유형, 아카이빙, 커리큘럼 버전, 마이그레이션, 학습자 업그레이드 원칙을 정리한다.
- 수정: `BACKEND.md`
  - 현재 백엔드가 아직 버전 스키마를 갖지 않지만, 이후 구현에서 따라야 할 서비스/DB 제약을 기록한다.
- 생성: `docs/curriculum-change-policy.md`
  - 운영자와 구현자가 읽을 수 있는 `/docs` 하위 정책 요약 문서를 추가한다.
- 수정: `docs/admin-site.md`
  - 관리자 콘텐츠 운영 로드맵의 1단계 구현 계획 시작/완료를 기록한다.
- 수정: `docs/platform-backend-api.md`
  - 학습자 API 관점에서 진행 데이터와 콘텐츠 변경 정책의 관계를 기록한다.

## 작업 1: `DOMAIN.md` 콘텐츠 변경 정책 작성

- [ ] **단계 1: 정책 부재 확인**

실행:

```bash
rg -n "콘텐츠 변경 정책|minor-edit|CurriculumNodeStatus|완료 성취" DOMAIN.md
```

기대 결과: 현재 `DOMAIN.md`가 비어 있으므로 출력 없이 종료 코드 `1`을 반환한다.

- [ ] **단계 2: `DOMAIN.md` 전체 내용 작성**

`DOMAIN.md`를 다음 내용으로 채운다.

````markdown
# 도메인 가이드

## 콘텐츠 변경 정책

코스 콘텐츠는 운영 중에도 바뀔 수 있다. 오탈자 수정, 예제 추가, 레슨 삽입, 챕터 재배치, 오래된 레슨 정리는 모두 교육 품질을 유지하기 위한 정상적인 운영 활동이다. 따라서 공개된 코스를 절대 수정하지 않는 방식은 이 플랫폼의 정책이 아니다.

핵심 원칙은 변경을 막는 것이 아니라, 변경이 학습자의 진행 상태와 완료 성취를 훼손하지 않도록 다루는 것이다.

## 변경 유형

| 변경 유형        | 예시                                     | 정책                                                                   |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `minor-edit`     | 오탈자 수정, 설명 보완, 이미지 교체      | 같은 커리큘럼 버전에 즉시 반영할 수 있다. 학습자 공지는 필요하지 않다. |
| `additive`       | 기존 레슨 안의 예제 추가, 보충 설명 추가 | 같은 커리큘럼 버전에 반영할 수 있다. 필요하면 선택 공지를 제공한다.    |
| `structural`     | 새 레슨 삽입, 챕터 순서 변경, 레슨 이동  | 새 커리큘럼 버전을 발행한다. 기존 학습자는 현재 버전을 유지한다.       |
| `major-revision` | 커리큘럼 전면 개편, 다수 레슨 병합·분할  | 새 버전 발행과 마이그레이션 맵을 요구한다. 학습자 선택 UX가 필요하다.  |

관리자 CMS가 추가될 때는 관리자가 변경 유형을 명시하거나, 시스템이 구조 변경 여부를 감지해 발행 정책을 제한한다.

## 완료 성취 보존

학습자가 이미 완료한 성취는 콘텐츠 구조 변경 때문에 사라지지 않는다.

- 완료 레슨 수는 레슨이 archived 상태가 되더라도 보존한다.
- 완료율은 학습자가 시작한 커리큘럼 버전을 기준으로 계산한다.
- 신규 학습자는 최신 published 버전으로 시작한다.
- 기존 학습자는 명시적으로 업그레이드하기 전까지 기존 진행 버전을 유지한다.
- 스트릭, 배지, 완료 표시 같은 gamification 요소는 구조 변경으로 임의 차감하지 않는다.

## 커리큘럼 버전

커리큘럼은 코스의 특정 버전으로 표현한다.

```text
Course
  -> CurriculumVersion
    -> VersionChapter
      -> VersionLesson
        -> Lesson
          -> LessonStep
```

학습 진행은 코스 자체가 아니라 학습자가 시작한 커리큘럼 버전에 귀속한다.

```text
LearnerProgress
  - userId
  - courseId
  - curriculumVersionId
  - lastLessonId
  - completedLessonIds
```

기존 콘텐츠는 코스별 `v1` published 버전으로 시작한다. 이후 구조 변경은 새 published 버전을 만들고, 기존 학습자에게는 업그레이드 선택지를 제공한다.

## 삭제 대신 아카이빙

레슨과 챕터는 실제 삭제하지 않는다. 신규 학습자에게 더 이상 보여주지 않으려면 상태를 변경한다.

```ts
type CurriculumNodeStatus = "active" | "deprecated" | "archived"
```

- `active`: 신규 학습자와 기존 학습자 모두에게 정상 노출한다.
- `deprecated`: 대체 예정 상태다. 기존 학습자는 접근할 수 있고, 관리자 화면에서는 정리 대상임을 표시한다.
- `archived`: 신규 학습자 경로에서는 숨긴다. 기존 학습자의 완료 기록과 이전 버전 조회를 위해 데이터는 보존한다.

실제 삭제는 진행 데이터 참조, 감사 로그, 복구 기간을 확인한 뒤 별도 정리 작업에서만 다룬다. 관리자 제품 기능으로 기본 delete를 제공하지 않는다.

## 마이그레이션

구조 변경이 기존 학습자에게 적용되어야 할 때는 명시적인 마이그레이션 맵을 사용한다.

```ts
type LessonMigrationMappingType = "equivalent" | "split" | "merged" | "removed"
```

- `equivalent`: 이전 레슨과 새 레슨이 같은 학습 성취로 간주된다.
- `split`: 하나의 이전 레슨이 여러 새 레슨으로 나뉜다.
- `merged`: 여러 이전 레슨이 하나의 새 레슨으로 합쳐진다.
- `removed`: 새 커리큘럼에는 대응 레슨이 없지만 완료 성취는 보존한다.

매핑이 없는 구조 변경은 자동 마이그레이션하지 않는다. 마이그레이션은 재실행해도 같은 결과를 내야 하며, 실패 상태는 운영자가 관측할 수 있어야 한다.

## 학습자 선택권

구조 변경은 학습자에게 갑자기 강제하지 않는다. 새 커리큘럼이 있을 때 학습자는 다음 선택지를 가진다.

- 새 커리큘럼으로 업그레이드한다.
- 지금 학습 중인 버전을 계속 진행한다.
- 이번 세션에서는 결정하지 않는다.

업그레이드 안내는 변경 이유와 기대 효과를 짧고 구체적으로 설명한다. 학습자가 선택하기 전까지 현재 학습 경로와 완료 상태는 임의로 바뀌지 않는다.

## 현재 구현 상태

현재 저장소는 아직 커리큘럼 버전 스키마를 구현하지 않았다. `courses`, `course_chapters`, `course_lessons`, `lessons`, `lesson_steps`가 직접 연결되어 있고, `course_progress`, `lesson_progress`는 콘텐츠 ID에 직접 귀속된다.

따라서 관리자 콘텐츠 수정 기능을 만들기 전, 다음 순서로 구현한다.

1. 콘텐츠 변경 정책 문서화
2. 커리큘럼 버전 모델 추가
3. 학습 진행의 버전 귀속
4. 버전 인식 읽기 경로
5. 아카이빙과 상태 정책
6. 관리자 draft/published 발행 워크플로우
7. 마이그레이션 맵
8. 학습자 업그레이드 UX와 공지
````

- [ ] **단계 3: 정책 문서 확인**

실행:

```bash
rg -n "콘텐츠 변경 정책|minor-edit|CurriculumNodeStatus|완료 성취|마이그레이션" DOMAIN.md
```

기대 결과: 각 검색어가 `DOMAIN.md`에서 출력된다.

## 작업 2: 백엔드 가이드와 `/docs` 정책 문서 작성

- [ ] **단계 1: 백엔드 가이드 정책 부재 확인**

실행:

```bash
test ! -e docs/curriculum-change-policy.md
rg -n "콘텐츠 변경 정책|커리큘럼 버전|아카이빙" BACKEND.md
```

기대 결과: 첫 명령은 종료 코드 `0`을 반환하고, 두 번째 명령은 출력 없이 종료 코드 `1`을 반환한다.

- [ ] **단계 2: `BACKEND.md`에 정책 섹션 추가**

`BACKEND.md`의 `### packages/core` 섹션 뒤에 다음 섹션을 추가한다.

```markdown
### 콘텐츠 변경 정책

콘텐츠 변경 정책의 단일 출처는 `DOMAIN.md`다. 백엔드 구현은 이 정책을 기준으로 학습자 완료 성취를 보존해야 한다.

현재 구현은 아직 커리큘럼 버전 스키마를 갖지 않는다. 공개 콘텐츠 조회는 최신 seed 콘텐츠를 읽고, 학습 진행은 `course_progress`, `lesson_progress`가 `course_id`, `lesson_id`에 직접 연결된다. 이 구조에서는 관리자 수정 기능을 먼저 추가하면 코스 구조 변경이 진행률과 다음 레슨 계산에 바로 영향을 줄 수 있다.

따라서 관리자 콘텐츠 생성, 수정, 삭제 API를 추가하기 전에 다음 제약을 먼저 지킨다.

- 구조 변경은 `curriculum_versions` 기반 버전 경계가 생긴 뒤 허용한다.
- 신규 학습자는 최신 published 버전으로 시작한다.
- 기존 학습자는 명시적 업그레이드 전까지 자신의 진행 버전을 유지한다.
- 레슨과 챕터 삭제는 실제 delete가 아니라 `deprecated` 또는 `archived` 상태 전환으로 처리한다.
- 이미 완료한 레슨은 archived 상태가 되더라도 완료 성취와 카운트에서 사라지지 않는다.
- 진행 마이그레이션은 관리자 지정 매핑이 있을 때만 수행한다.

이 정책이 구현되기 전까지 어드민 API는 콘텐츠 조회 중심으로 유지하고, published 콘텐츠 구조를 직접 바꾸는 관리 API를 제공하지 않는다.
```

- [ ] **단계 3: `/docs` 정책 요약 문서 생성**

`docs/curriculum-change-policy.md`를 다음 내용으로 생성한다.

```markdown
# 커리큘럼 변경 정책

## 목적

이 문서는 관리자 콘텐츠 운영에서 코스, 챕터, 레슨 변경이 학습자 진행 상태에 미치는 영향을 줄이기 위한 정책을 정리한다. 상세 로드맵 설계는 `docs/superpowers/specs/2026-05-28-curriculum-versioning-roadmap-design.md`를 기준으로 한다.

## 핵심 원칙

- 공개된 코스도 교육 품질을 위해 변경될 수 있다.
- 변경을 막는 대신 변경 유형에 따라 배포 정책을 나눈다.
- 학습자가 이미 완료한 성취는 구조 변경으로 사라지지 않는다.
- 삭제는 기본 기능이 아니며, 신규 노출 중단은 아카이빙으로 처리한다.
- 구조 변경은 새 커리큘럼 버전과 학습자 업그레이드 선택을 통해 적용한다.

## 변경 유형

| 변경 유형        | 처리 정책                                            |
| ---------------- | ---------------------------------------------------- |
| `minor-edit`     | 같은 버전에 즉시 반영할 수 있다.                     |
| `additive`       | 같은 버전에 반영할 수 있고 선택 공지가 가능하다.     |
| `structural`     | 새 커리큘럼 버전을 발행한다.                         |
| `major-revision` | 새 버전, 마이그레이션 맵, 학습자 선택 UX가 필요하다. |

## 삭제 정책

관리자 제품에서 레슨과 챕터를 실제 삭제하지 않는다.

- `active`: 정상 노출 상태
- `deprecated`: 대체 예정 상태
- `archived`: 신규 학습자 경로에서 숨김, 기존 기록 보존

완료한 레슨이 archived 상태가 되어도 학습자의 완료 성취와 완료 카운트는 보존한다.

## 구현 순서

1. 콘텐츠 변경 정책 문서화
2. 커리큘럼 버전 모델 추가
3. 학습 진행의 버전 귀속
4. 버전 인식 읽기 경로
5. 아카이빙과 상태 정책
6. 관리자 draft/published 발행 워크플로우
7. 마이그레이션 맵
8. 학습자 업그레이드 UX와 공지

## 현재 상태

현재 저장소는 1단계 정책 문서화부터 진행한다. 런타임 코드와 DB 스키마는 아직 변경하지 않는다. 관리자 콘텐츠 수정 기능은 커리큘럼 버전 경계가 생긴 뒤 순차적으로 추가한다.
```

- [ ] **단계 4: 문서 연결 확인**

실행:

```bash
rg -n "콘텐츠 변경 정책|curriculum_versions|archived|docs/superpowers/specs/2026-05-28-curriculum-versioning-roadmap-design.md" BACKEND.md docs/curriculum-change-policy.md
```

기대 결과: `BACKEND.md`와 `docs/curriculum-change-policy.md`에서 정책과 설계 문서 경로가 출력된다.

## 작업 3: 진행 로그 문서 갱신

- [ ] **단계 1: 로그 위치 확인**

실행:

```bash
sed -n '1,80p' docs/admin-site.md
sed -n '1,80p' docs/platform-backend-api.md
```

기대 결과: `docs/admin-site.md` 상단에는 커리큘럼 버전 관리 로드맵 설계 기록이 있고, `docs/platform-backend-api.md` 상단에는 플랫폼 백엔드 API 기록이 있다.

- [ ] **단계 2: `docs/admin-site.md` 상단에 1단계 계획 기록 추가**

`docs/admin-site.md`의 제목 바로 아래에 다음 내용을 추가한다.

```markdown
## 2026-05-28 콘텐츠 변경 정책 문서화 시작

- 커리큘럼 버전 관리 로드맵의 1단계로 콘텐츠 변경 정책을 공식 문서에 반영한다.
- 관리자 콘텐츠 수정 기능은 아직 추가하지 않고, 변경 유형과 완료 성취 보존 원칙을 먼저 고정한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-change-policy.md`에 작성한다.

## 2026-05-28 콘텐츠 변경 정책 문서화 완료

- `DOMAIN.md`에 콘텐츠 변경 정책의 단일 출처를 작성한다.
- `BACKEND.md`에 현재 백엔드 구조에서 관리자 수정 API를 추가하기 전에 지켜야 할 제약을 기록한다.
- `docs/curriculum-change-policy.md`에 운영자와 구현자를 위한 정책 요약을 추가한다.
- 구조 변경은 커리큘럼 버전 경계가 생긴 뒤 허용하고, 삭제는 아카이빙으로 대체하는 원칙을 문서화한다.
```

- [ ] **단계 3: `docs/platform-backend-api.md` 상단에 학습자 API 관점 기록 추가**

`docs/platform-backend-api.md`의 제목 바로 아래에 다음 내용을 추가한다.

```markdown
## 2026-05-28 콘텐츠 변경 정책 문서화 시작

- 학습자 진행 API가 향후 커리큘럼 버전 기준으로 동작해야 하므로, 코드 변경 전에 콘텐츠 변경 정책을 문서화한다.
- 현재 진행 저장 구조는 `course_id`, `lesson_id`에 직접 귀속되므로 관리자 구조 변경 API를 먼저 추가하지 않는다.

## 2026-05-28 콘텐츠 변경 정책 문서화 완료

- `DOMAIN.md`와 `docs/curriculum-change-policy.md`에 변경 유형, 아카이빙, 완료 성취 보존 원칙을 정리한다.
- `BACKEND.md`에 커리큘럼 버전 경계 도입 전까지 published 콘텐츠 구조를 직접 바꾸는 관리 API를 제공하지 않는다는 제약을 기록한다.
- 이후 학습 진행 API는 신규 학습자는 최신 published 버전, 기존 학습자는 진행 중인 버전을 기준으로 계산하도록 확장한다.
```

- [ ] **단계 4: 로그 확인**

실행:

```bash
rg -n "콘텐츠 변경 정책 문서화|커리큘럼 버전 경계|완료 성취" docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 두 문서에서 시작/완료 로그와 핵심 원칙이 출력된다.

## 작업 4: 포맷, 자체 검토, 커밋

- [ ] **단계 1: 문서 포맷 실행**

실행:

```bash
./node_modules/.bin/prettier --write DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 다섯 문서가 포맷되고 오류 없이 종료된다.

- [ ] **단계 2: 자리표시자와 모순 검색**

실행:

```bash
rg -n "T[B]D|T[O]DO|F[I]XME|미[정]|임[시]" DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 출력이 없다.

- [ ] **단계 3: 정책 커버리지 확인**

실행:

```bash
rg -n "minor-edit|additive|structural|major-revision|CurriculumNodeStatus|deprecated|archived|완료 성취|curriculum_versions" DOMAIN.md BACKEND.md docs/curriculum-change-policy.md
```

기대 결과: 변경 유형, 상태, 완료 성취, `curriculum_versions` 제약이 세 문서에서 확인된다.

- [ ] **단계 4: diff 공백 검증**

실행:

```bash
git diff --check
```

기대 결과: 출력 없이 종료 코드 `0`을 반환한다.

- [ ] **단계 5: 변경 파일 확인**

실행:

```bash
git status --short
```

기대 결과:

```text
 M BACKEND.md
 M DOMAIN.md
 M docs/admin-site.md
 M docs/platform-backend-api.md
?? docs/curriculum-change-policy.md
```

- [ ] **단계 6: 커밋**

실행:

```bash
git add DOMAIN.md BACKEND.md docs/curriculum-change-policy.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "콘텐츠 변경 정책 문서화"
```

기대 결과: pre-commit 포맷이 통과하고 한국어 커밋 메시지로 문서 변경이 커밋된다.

## 자체 검토 체크리스트

- [ ] `DOMAIN.md`가 정책의 단일 출처 역할을 한다.
- [ ] `BACKEND.md`가 현재 구현 상태와 향후 제약을 분리해서 설명한다.
- [ ] `/docs` 하위에 운영자와 구현자가 볼 수 있는 정책 요약 문서가 있다.
- [ ] 관리자 CMS나 DB 스키마를 이번 작업에서 구현한다고 오해할 문장이 없다.
- [ ] 완료 성취 보존, 아카이빙, 버전 경계, 마이그레이션 맵이 모두 언급된다.
