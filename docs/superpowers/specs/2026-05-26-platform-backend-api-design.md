# 플랫폼 백엔드 API 설계

## 배경

현재 백엔드는 `apps/api`를 Hono 기반 조립 루트로 두고, `packages/core`, `packages/db`, `packages/logger`가 콘텐츠 조회, SQLite 영속성, 로깅 책임을 나누고 있다. 기존 API는 `/courses`, `/courses/:courseId`, `/lessons/:lessonId` 중심의 공개 콘텐츠 조회까지만 구현되어 있다.

`docs/platform-product-feature-spec.md`는 학습자용 플랫폼 기능으로 인증, 홈, 프로필, 검색, 코스 탐색, 코스 상세, 레슨 플레이어, 학습 진행 저장, 레슨 내부 답변 저장, OpenAI 기반 AI 피드백을 확정했다. 어드민 콘텐츠 관리와 콘텐츠 검수는 차순위 기능으로 분리한다.

Better Auth 공식 Hono 통합 문서는 `/api/auth/*`에 인증 핸들러를 마운트하고 쿠키 인증을 위해 CORS credentials를 설정하는 방식을 안내한다. Better Auth Drizzle adapter 문서는 기존 Drizzle 데이터베이스와 인증 스키마를 연결할 수 있음을 설명한다. OpenAI 공식 문서는 Responses API에서 Structured Outputs를 사용해 JSON schema 기반 응답을 받을 수 있음을 설명한다.

- Better Auth Hono 통합: <https://better-auth.com/docs/integrations/hono>
- Better Auth Drizzle adapter: <https://better-auth.com/docs/adapters/drizzle>
- Better Auth 기본 사용: <https://better-auth.com/docs/basic-usage>
- OpenAI Responses API: <https://platform.openai.com/docs/api-reference/responses>
- OpenAI Structured Outputs: <https://platform.openai.com/docs/guides/structured-outputs>

## 목표

- Better Auth로 이메일/비밀번호 로그인과 Google 로그인을 실제 구현한다.
- 콘텐츠 조회 API는 공개로 유지한다.
- 사용자 정보가 필요한 프로필, 진행 저장, 답변 저장, AI 피드백 API만 인증을 요구한다.
- 코스 검색 API를 추가한다.
- 학습 진행과 레슨 내부 답변을 SQLite에 영속 저장한다.
- OpenAI Responses API와 Structured Outputs로 작성 답변 피드백을 생성한다.
- AI 피드백 재시도는 사용자, 레슨, 피드백 스텝 기준 최대 3회로 제한한다.
- 어드민 기능, 결제, 알림, 리마인드, 저널, 하이라이트 저장은 구현하지 않는다.

## 비목표

- 어드민 콘텐츠 관리와 콘텐츠 검수는 구현하지 않는다.
- 결제와 구독은 구현하지 않는다.
- 알림과 리마인드는 구현하지 않는다.
- 작성 답변을 레슨 외부의 저널이나 학습 자산으로 노출하지 않는다.
- 읽기 하이라이트 저장은 구현하지 않는다.
- 한국어 전문 검색 품질 개선용 FTS 테이블은 이번 범위에 넣지 않는다.
- `apps/web` API 클라이언트 전환은 이 설계의 구현 범위에 포함하지 않는다.

## 아키텍처

기존 모듈러 모놀리스 구조를 유지한다.

```txt
apps/api
  Hono 앱 생성
  Better Auth 핸들러 마운트
  인증 세션 미들웨어
  공개 라우트와 인증 라우트 등록
  환경 변수 검증
  서비스 조립

packages/core
  content: 콘텐츠 DTO, 검색, 조회 서비스
  learning: 학습 진행, 답변, 완료 도메인 계약
  ai-feedback: AI 피드백 요청, 결과, 재시도 제한 계약

packages/db
  Drizzle SQLite schema
  Better Auth schema
  콘텐츠 저장소
  학습 상태 저장소
  AI 피드백 시도 저장소

packages/logger
  API 요청 로그와 외부 호출 실패 로그에 사용하는 공통 logger
```

의존 방향은 기존 규칙을 유지한다.

```txt
apps/api -> packages/core
apps/api -> packages/db
apps/api -> packages/logger
packages/db -> packages/core
packages/core -> validation libraries only
packages/logger -> external logging libraries only
```

`packages/core`는 Better Auth, Hono, OpenAI SDK, Drizzle을 직접 import하지 않는다. 인증된 사용자 ID, 저장소 포트, AI provider 포트만 입력으로 받는다.

## 인증

Better Auth는 `apps/api`에서 구성한다. Hono는 `GET`, `POST` 요청을 `/api/auth/*`로 받아 `auth.handler(c.req.raw)`에 위임한다.

쿠키 인증을 위해 CORS 설정은 명시 origin과 `credentials: true`를 사용한다. `CORS_ORIGIN`은 쉼표로 구분한 허용 origin 목록이다.

Better Auth 설정은 다음 기능을 켠다.

- 이메일/비밀번호 로그인
- Google 로그인
- Drizzle SQLite adapter

인증이 필요한 API는 공통 세션 헬퍼를 통해 현재 사용자를 확인한다. 세션이 없으면 다음 오류를 반환한다.

```json
{
  "code": "unauthorized",
  "message": "Authentication is required."
}
```

`/me`는 현재 로그인 사용자 기본 정보를 확인하는 엔드포인트로만 사용한다. 사용자 상태 API 전체를 `/me/*` 아래에 넣지 않고, 학습 도메인 리소스 중심 URL을 사용한다.

## 환경 변수

필수 환경 변수는 서버 시작 시 검증한다. 값이 없거나 형식이 틀리면 기능을 비활성화하지 않고 API 프로세스 시작을 실패시킨다.

필수 환경 변수:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

기본값을 허용하는 환경 변수:

- `PORT`: 기본값 `4000`
- `LOG_LEVEL`: 기본값 `info`
- `CORS_ORIGIN`: 로컬 개발 origin 기본값

외부 서비스 설정 오류, 데이터베이스 마이그레이션 오류, Better Auth 초기화 오류는 숨기지 않는다. 시작 단계 오류는 빠른 실패로 처리한다. 런타임 외부 호출 실패는 명시 오류 DTO로 반환하고 로그에 원인을 남긴다.

## 데이터 모델

기존 콘텐츠 테이블은 유지한다. Better Auth 테이블은 Better Auth가 요구하는 기본 스키마를 사용하고, 우리 도메인 서비스는 해당 테이블을 직접 조작하지 않는다.

추가 학습 테이블은 짧고 도메인 의미가 분명한 이름을 사용한다.

### `course_progress`

사용자별 코스 진행 요약이다.

- `user_id`
- `course_id`
- `started_at`
- `last_lesson_id`
- `completed_count`
- `updated_at`

제약:

- `(user_id, course_id)`는 유일하다.

### `lesson_progress`

사용자별 레슨 진행 위치와 완료 상태다.

- `user_id`
- `lesson_id`
- `course_id`
- `current_step_id`
- `step_order`
- `status`
- `completed_at`
- `updated_at`

`status`는 `not-started`, `in-progress`, `completed` 중 하나다.

제약:

- `(user_id, lesson_id)`는 유일하다.

### `lesson_answers`

레슨 내부에서 AI 피드백과 복귀 흐름에 필요한 스텝별 답변이다. 별도 저널이나 작성물 목록으로 노출하지 않는다.

- `user_id`
- `lesson_id`
- `step_id`
- `answer`
- `updated_at`

제약:

- `(user_id, lesson_id, step_id)`는 유일하다.

### `feedback_attempts`

AI 피드백 시도와 결과 저장소다.

- `user_id`
- `lesson_id`
- `feedback_step_id`
- `source_step_id`
- `attempt_number`
- `answer_snapshot`
- `result_json`
- `status`
- `created_at`

`status`는 첫 구현에서 `completed`만 사용한다. OpenAI 호출 자체가 실패한 경우는 사용자 재시도 횟수를 소모하지 않도록 저장하지 않는다. 구조화 응답 파싱 이후 저장 단계에서 실패한 경우는 API 오류로 반환하고 로그에 남긴다.

제약:

- 사용자, 레슨, 피드백 스텝 기준으로 `attempt_number`는 증가한다.
- 서비스 계층은 완료된 시도가 3회 이상이면 추가 요청을 거부한다.

## API 계약

모든 API는 버전 접두사 없이 유지한다.

### 공개 API

`GET /courses`

- 코스 카테고리와 코스 목록을 반환한다.
- 기존 응답 계약을 유지한다.

`GET /courses/search?q=...`

- 코스 제목과 설명을 기준으로 검색한다.
- 빈 검색어는 `400 invalid-request`를 반환한다.
- 별도 검색 인덱스 없이 SQLite `LIKE`로 시작한다.

`GET /courses/:courseId`

- 공개 코스 상세 콘텐츠를 반환한다.
- 사용자 진행 상태를 포함하지 않는다.

`GET /lessons/:lessonId`

- 공개 레슨 콘텐츠를 반환한다.
- 사용자 진행 위치와 답변을 포함하지 않는다.

### 인증 API

`GET /me`

- 현재 로그인 사용자 기본 정보를 반환한다.

`GET /profile`

- 프로필 화면에 필요한 사용자 정보와 학습 현황 요약을 반환한다.

`GET /progress`

- 진행 중인 코스 목록과 다음 학습 대상을 반환한다.

`GET /courses/:courseId/progress`

- 특정 코스의 내 완료 수, 전체 레슨 수, 퍼센트, 다음 레슨, 레슨별 상태를 반환한다.

`GET /lessons/:lessonId/progress`

- 특정 레슨의 저장된 현재 스텝, 상태, 스텝별 답변을 반환한다.

`PUT /lessons/:lessonId/progress`

- 현재 스텝 ID와 순서를 저장한다.
- 레슨이 존재하지 않으면 `404 lesson-not-found`를 반환한다.
- 코스 진행이 없으면 함께 생성한다.

`PUT /lessons/:lessonId/answers`

- 스텝 ID와 답변 텍스트를 저장한다.
- 레슨 콘텐츠의 저장 가능한 스텝 타입에 대해서만 허용한다.
- 저장 가능한 타입은 `SHORT_WRITE`, `LONG_WRITE`, `REVISION`, `CHECKLIST`, `REFLECTION`이다.

`POST /lessons/:lessonId/complete`

- 레슨을 완료 처리한다.
- 이미 완료된 레슨이면 완료 수를 다시 증가시키지 않는다.
- 완료 처리는 멱등적이다.

`POST /ai-feedback`

- `lessonId`, `feedbackStepId`, 선택적 `answer`를 입력으로 받는다.
- `answer`가 없으면 피드백 스텝의 `sourceStepId`에 해당하는 저장 답변을 사용한다.
- 저장 답변이 없으면 `404 answer-not-found`를 반환한다.
- 완료된 피드백 시도가 3회 이상이면 `429 feedback-retry-limit-exceeded`를 반환한다.
- OpenAI 호출 실패는 `503 ai-feedback-unavailable`로 반환한다.

## 오류 계약

오류 응답은 명시적 DTO를 사용한다. `success: false` 형태는 사용하지 않는다.

첫 구현에서 필요한 오류 코드는 다음과 같다.

- `unauthorized`
- `invalid-request`
- `course-not-found`
- `lesson-not-found`
- `answer-not-found`
- `feedback-step-not-found`
- `feedback-retry-limit-exceeded`
- `ai-feedback-unavailable`
- `database-unavailable`
- `invalid-content-seed`

예상 가능한 오류는 라우트 경계에서 HTTP 상태로 매핑한다. 예상하지 못한 오류는 요청 ID와 함께 로그에 남기고 내부 정보를 노출하지 않는 `500` 응답으로 처리한다.

## 서비스 동작

### 학습 진행 저장

`PUT /lessons/:lessonId/progress`는 레슨 존재 여부를 확인하고 `lesson_progress`를 업서트한다. `course_progress`가 없으면 생성한다. 저장 대상은 현재 스텝 ID와 순서다.

`GET /lessons/:lessonId/progress`는 저장된 위치와 답변을 반환한다. 저장된 진행이 없으면 오류를 반환하지 않고, 레슨의 첫 번째 스텝을 기본 진행으로 계산해 반환한다. 이 계산은 저장을 발생시키지 않는다.

### 답변 저장

`PUT /lessons/:lessonId/answers`는 스텝 ID와 텍스트를 받아 `lesson_answers`에 업서트한다. 콘텐츠 스텝 타입을 확인해 저장 가능한 타입만 허용한다.

작성 답변은 레슨 내부 상태로만 제공한다. 별도 저널, 작성 기록, 학습 자산 API는 만들지 않는다.

### 레슨 완료

`POST /lessons/:lessonId/complete`는 `lesson_progress.status`를 `completed`로 바꾸고, `course_progress.completed_count`와 `last_lesson_id`를 갱신한다. 이미 완료된 레슨이면 변경 없이 현재 완료 상태를 반환한다.

### AI 피드백

AI 피드백 서비스는 OpenAI provider 포트에 의존한다. API 라우트와 도메인 서비스는 OpenAI SDK 세부사항을 직접 알지 않는다.

요청 흐름:

1. 인증 사용자를 확인한다.
2. 레슨과 피드백 스텝이 존재하는지 확인한다.
3. 평가 대상 답변을 요청 본문 또는 `lesson_answers`에서 결정한다.
4. 완료된 기존 시도 수가 3회 미만인지 확인한다.
5. OpenAI Responses API에 Structured Outputs schema를 전달한다.
6. 구조화된 피드백 결과를 검증한다.
7. `feedback_attempts`에 완료 시도를 저장한다.
8. 저장된 결과를 반환한다.

피드백 결과는 최소한 다음 값을 포함한다.

- `score`
- `scoreRange`
- `summary`
- `strengths`
- `improvements`
- `nextAction`

## 테스트 전략

구현은 TDD로 진행한다.

`packages/core`:

- 코스 진행률 계산
- 레슨 진행 기본값 계산
- 현재 스텝 저장 결과
- 저장 가능한 답변 스텝 타입 검증
- 레슨 완료 멱등성
- AI 피드백 재시도 제한
- OpenAI provider 실패 매핑

`packages/db`:

- 새 마이그레이션이 학습 테이블을 생성하는지 검증
- `course_progress` 업서트
- `lesson_progress` 업서트
- `lesson_answers` 업서트
- `feedback_attempts` 시도 수 조회와 결과 저장

`apps/api`:

- 공개 콘텐츠 API가 세션 없이 동작하는지 검증
- 인증 API가 세션 없이 `401`을 반환하는지 검증
- 인증된 사용자 ID로 진행 저장, 답변 저장, 완료 처리가 동작하는지 검증
- AI 피드백 요청이 provider mock을 통해 결과를 반환하는지 검증
- 3회 초과 피드백 요청이 `429`를 반환하는지 검증
- `/openapi.json`에 공개 API와 인증 API가 포함되는지 검증

OpenAI 실제 API는 테스트에서 호출하지 않는다. provider 포트를 mock한다.

## 문서 업데이트

작업 시작 시 `docs/platform-backend-api.md`에 시작 항목을 남긴다. 작업 완료 시 같은 문서에 실제 구현 범위, 검증 명령, 남은 제한 사항을 기록한다.

`BACKEND.md`는 구현 완료 후 다음 정보를 반영한다.

- Better Auth 라우트
- 공개 API와 인증 API 구분
- 필수 환경 변수
- 학습 상태 테이블
- OpenAI 피드백 처리 경계

모든 문서는 한국어로 작성한다.

## 검증 대상

구현 완료 시 가능한 범위에서 다음 명령을 실행한다.

```bash
bun --filter @workspace/core test
bun --filter @workspace/db test
bun --filter @workspace/logger test
bun --filter @workspace/api test
bun --filter @workspace/core typecheck
bun --filter @workspace/db typecheck
bun --filter @workspace/api typecheck
bun --filter @workspace/core lint
bun --filter @workspace/db lint
bun --filter @workspace/api lint
git diff --check
bun lefthook run pre-commit
```

루트 `typecheck`와 `format:check`는 기존 실패가 있는 경우 변경 파일과 관련 패키지를 별도 검증하고, 기존 실패를 완료 보고에 명시한다.

## 구현 순서

1. 문서에 구현 시작 항목을 추가한다.
2. Better Auth 의존성과 환경 변수 검증을 추가한다.
3. Better Auth schema와 학습 상태 schema를 추가한다.
4. 학습 도메인 DTO, 오류, 저장소 포트, 서비스를 추가한다.
5. 학습 상태 Drizzle 저장소를 추가한다.
6. 공개 검색 API를 추가한다.
7. 인증 세션 헬퍼와 인증 API 라우트를 추가한다.
8. OpenAI provider 포트와 실제 provider 구현을 추가한다.
9. AI 피드백 라우트를 추가한다.
10. OpenAPI 문서를 확장한다.
11. `BACKEND.md`와 `docs/platform-backend-api.md` 완료 항목을 갱신한다.
12. 테스트, 타입 검사, 린트, diff 검사를 실행한다.
