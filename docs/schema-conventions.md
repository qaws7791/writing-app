# 데이터베이스 스키마 관습

## 목적

새 테이블과 컬럼을 추가할 때 provider가 소유한 스키마와 프로젝트가 직접 소유한 스키마의 명명 규칙을 명확히 구분한다. 기존 인증 테이블의 camelCase 컬럼과 직접 관리 테이블의 snake_case 컬럼은 의도된 차이다.

## 기본 원칙

- provider가 생성하거나 런타임 계약으로 요구하는 테이블은 provider convention을 따른다.
- 프로젝트가 직접 설계하고 마이그레이션하는 테이블은 SQL 컬럼과 인덱스 이름에 snake_case를 사용한다.
- Drizzle 객체 속성은 TypeScript 경계의 가독성을 위해 camelCase를 유지할 수 있다.
- 도메인 코드와 API DTO는 DB 컬럼 이름을 그대로 노출하지 않는다. repository가 DB row와 도메인 계약 사이를 변환한다.
- 명명 규칙 변경은 기존 데이터와 마이그레이션 위험이 크므로, 새 코드에서 관습을 명시적으로 따르는 것을 우선한다.

## Better Auth 계열 테이블

학습자 인증 테이블 `user`, `session`, `account`, `verification`은 Better Auth 런타임과 adapter 계약을 따른다. `account` 테이블은 공식 core schema의 `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password` 필드를 포함한다.

관리자 인증 테이블 `admin_user`, `admin_session`, `admin_account`, `admin_verification`도 같은 Better Auth core schema 형태를 유지한다. 테이블 이름에는 관리자 인증 경계를 드러내기 위해 `admin_` prefix를 붙였고, Drizzle 속성은 Better Auth가 기대하는 `emailVerified`, `createdAt`, `updatedAt`, `userId`, `accountId`, `providerId` 이름을 유지한다. 실제 SQLite 컬럼명은 baseline SQL과 Drizzle schema가 함께 정의하는 이름을 기준으로 한다.

이 테이블의 컬럼을 snake_case로 바꾸려면 Better Auth adapter 설정, 마이그레이션, 기존 세션과 계정 데이터 이전 계획을 함께 검토해야 한다. 단순 정리 작업으로 rename하지 않는다.

## 직접 관리 테이블

콘텐츠, 학습 진행, AI 피드백, 운영 ledger처럼 프로젝트가 직접 소유한 테이블은 SQL 이름에 snake_case를 사용한다.

예시는 다음과 같다.

- `course_categories.sort_order`
- `courses.category_id`
- `course_chapters.course_id`
- `lesson_steps.content_json`
- `course_progress.started_at`
- `lesson_progress.current_step_id`
- `lesson_answers.updated_at`
- `feedback_attempts.feedback_step_id`
- `schema_migrations.applied_at`

Drizzle schema에서는 다음처럼 SQL 컬럼은 snake_case로 두고 TypeScript 속성은 camelCase로 매핑한다.

```ts
export const courseProgress = sqliteTable("course_progress", {
  userId: text("user_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
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
