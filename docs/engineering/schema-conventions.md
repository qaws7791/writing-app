# 데이터베이스 스키마 관습

## 목적

새 테이블과 컬럼을 추가할 때 provider가 소유한 스키마와 프로젝트가 직접 소유한 스키마의 명명 규칙을 구분한다. 인증 테이블의 camelCase 컬럼과 직접 관리 테이블의 snake_case 컬럼은 의도된 차이다.

## 기본 원칙

- provider가 생성하거나 런타임 계약으로 요구하는 테이블은 provider convention을 따른다.
- 프로젝트가 직접 설계하고 마이그레이션하는 테이블은 SQL 컬럼과 인덱스 이름에 snake_case를 사용한다.
- auth infra와 각 module은 자기 최종 Drizzle schema를 소유하고, API의 schema entry는 migration 생성용으로 이 export를 조립한다. 동일 SQLite의 FK 선언에 필요한 다른 owner의 공개 `./schema` 참조는 허용한다.
- FK는 table 쓰기 소유권과 별개다. 같은 SQLite에 저장되는 필수 reference는 FK로 선언하고, 삭제 의미는 기록 보존 여부에 따라 `CASCADE` 또는 `RESTRICT`로 명시한다.
- Drizzle 객체 속성은 TypeScript 경계의 가독성을 위해 camelCase를 유지할 수 있다.
- 도메인 코드와 API DTO는 DB 컬럼 이름을 그대로 노출하지 않는다.
- repository가 DB row와 도메인 계약 사이를 변환한다.
- 명명 규칙 변경은 마이그레이션 위험이 크므로 새 코드에서 관습을 명시적으로 따르는 것을 우선한다.

## Better Auth 계열 테이블

학습자 인증 테이블 `user`, `session`, `account`, `verification`은 Better Auth 런타임과 adapter 계약을 따른다.

관리자 인증 테이블 `admin_user`, `admin_session`, `admin_account`, `admin_verification`도 같은 Better Auth core schema 형태를 유지한다. 테이블 이름에는 관리자 인증 경계를 드러내기 위해 `admin_` prefix를 붙인다.

이 테이블의 컬럼을 snake_case로 바꾸려면 Better Auth adapter 설정, 마이그레이션, 기존 세션과 계정 데이터 이전 계획을 함께 검토해야 한다. 단순 정리 작업으로 rename하지 않는다.

## 직접 관리 테이블

콘텐츠, 학습 진행, AI 피드백, 운영 설정처럼 프로젝트가 직접 소유한 테이블은 SQL 이름에 snake_case를 사용한다.

새 table은 가능한 한 소유 context를 드러내는 prefix를 사용한다. 기존 provider 이름이나 제품의 오래된 canonical 이름처럼 rename 비용이 의미를 개선하는 이점보다 큰 경우에는 기존 이름을 보존하고 schema ownership 검사에 명시적으로 배정한다. prefix만 보고 소유권을 추측하지 않고 module schema와 API의 ownership 검사를 권위로 삼는다.

예시는 다음과 같다.

- `courses.published_curriculum_version_id`
- `course_curriculum_versions.edit_version`
- `course_unit_versions.sort_order`
- `lesson_versions.summary_json`
- `lesson_step_versions.content_json`
- `learner_course_progress.curriculum_version_id`
- `learner_lesson_progress.current_step_id`
- `learner_lesson_answers.answer_json`
- `ai_feedback_attempts.result_json`
- `admin_settings.updated_at`

Drizzle schema에서는 SQL 컬럼은 snake_case로 두고 TypeScript 속성은 camelCase로 매핑한다.

```ts
export const learnerLessonAnswers = sqliteTable("learner_lesson_answers", {
  userId: text("user_id").notNull(),
  answerJson: text("answer_json").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})
```

## 새 스키마 추가 체크리스트

- 새 테이블이 provider 소유인지 프로젝트 직접 소유인지 먼저 결정한다.
- provider 소유라면 공식 schema 또는 adapter가 요구하는 이름을 우선한다.
- 직접 소유라면 테이블, 컬럼, 인덱스, foreign key 관련 SQL 이름을 snake_case로 작성한다.
- TypeScript 속성은 기존 Drizzle schema 관습처럼 camelCase로 작성한다.
- repository test에서 새 컬럼의 read/write mapping을 검증한다.
- 마이그레이션 SQL과 Drizzle schema의 SQL 이름이 일치하는지 확인한다.
- FK의 양쪽 owner와 삭제 정책을 확인하고 Drizzle schema와 append-only SQL에 같은 관계를 선언한다.
- 독립 DB 분리를 전제로 FK를 제거할 때는 outbox/API 검증과 장애 시 reconciliation 책임을 별도 결정으로 남긴다.
- version 범위 콘텐츠 FK는 `curriculum_version_id`와 논리 ID의 복합 키로 같은 version 안의 부모만 참조하게 한다.
- published 콘텐츠 변경 금지와 course당 단일 draft처럼 DB에서 보장할 수 있는 불변조건은 trigger·partial unique index와 통합 테스트로 고정한다.
