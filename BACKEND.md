# 백엔드 개발 가이드

## 아키텍처

백엔드는 모듈러 모놀리스로 구성한다. 런타임은 하나의 API 프로세스로 시작하지만, 도메인 규칙, 데이터 접근, 로깅, 프로세스 조립 책임을 패키지 단위로 분리한다. 현재 백엔드 슬라이스는 학습자용 API를 다루며, 공개 콘텐츠 조회, Better Auth 인증, 학습 진행/답변 저장, OpenAI 기반 AI 피드백을 포함한다. 관리자 콘텐츠 관리 기능은 아직 범위에 포함하지 않는다.

## 앱과 패키지 책임

### `apps/api`

`apps/api`는 백엔드 조립 루트다. Hono 앱 생성, 라우트 등록, 환경 변수 파싱, 데이터베이스 열기, 서비스 구성, 프로세스 시작을 이곳에서 수행한다.

현재 API 라우트는 버전 접두사 없이 노출한다. 사용자 정보가 필요하지 않은 콘텐츠 조회 API는 공개로 유지하고, 사용자별 데이터가 필요한 API만 Better Auth 세션 인증을 요구한다.

- `GET /health`
- `GET /openapi.json`
- `GET /api/auth/*`, `POST /api/auth/*`: Better Auth 인증 엔드포인트
- `GET /courses`
- `GET /courses/search?q=...`
- `GET /courses/:courseId`
- `GET /lessons/:lessonId`
- `GET /me`
- `GET /profile`
- `GET /progress`
- `GET /courses/:courseId/progress`
- `GET /lessons/:lessonId/progress`
- `PUT /lessons/:lessonId/progress`
- `PUT /lessons/:lessonId/answers`
- `POST /lessons/:lessonId/complete`
- `POST /ai-feedback`

API 앱은 `@workspace/env`의 `parseEnv`로 시작 단계 환경 변수를 검증한다. 공유 패키지는 Zod 검증, 빈 문자열 정규화, 오류 메시지 형식만 담당한다. `DATABASE_URL`의 `file:` prefix 제거, `CORS_ORIGIN` 분리 같은 앱별 의미 변환은 `apps/api/src/env.ts`에 유지한다.

필수 환경 변수는 누락 시 서버 시작 단계에서 즉시 실패한다. 기능을 숨기거나 다른 동작으로 대체하지 않는다. 로컬 실행에 필요한 전체 예시는 `apps/api/.env.example`을 기준으로 관리한다.

| 변수                   | 필수 여부 | 기본값 또는 예시                              | 용도                                                                                   |
| ---------------------- | --------- | --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | 필수      | `replace-with-local-auth-secret`              | Better Auth 세션과 인증 토큰 서명에 사용하는 비밀값                                    |
| `BETTER_AUTH_URL`      | 필수      | `http://localhost:4000`                       | Better Auth가 콜백과 인증 URL을 계산할 때 사용하는 API 기준 URL                        |
| `CORS_ORIGIN`          | 선택      | `http://localhost:3000,http://localhost:3001` | 자격 증명 포함 요청을 허용할 프론트엔드 origin 목록. 쉼표로 여러 값을 구분한다.        |
| `DATABASE_URL`         | 필수      | `file:data/api.sqlite`                        | SQLite 데이터베이스 위치. `file:` 접두사는 API 시작 시 파일 경로로 변환한다.           |
| `GOOGLE_CLIENT_ID`     | 필수      | `replace-with-google-client-id`               | Google OAuth 클라이언트 ID                                                             |
| `GOOGLE_CLIENT_SECRET` | 필수      | `replace-with-google-client-secret`           | Google OAuth 클라이언트 secret                                                         |
| `LOG_LEVEL`            | 선택      | `info`                                        | Pino 로그 레벨. `trace`, `debug`, `info`, `warn`, `error`, `fatal` 중 하나를 사용한다. |
| `NODE_ENV`             | 선택      | `development`                                 | 실행 환경 이름. 로거와 런타임 환경 구분에 사용한다.                                    |
| `OPENAI_API_KEY`       | 필수      | `replace-with-openai-api-key`                 | AI 피드백 provider가 OpenAI Responses API를 호출할 때 사용하는 API 키                  |
| `OPENAI_MODEL`         | 필수      | `gpt-5-mini`                                  | AI 피드백 생성에 사용할 OpenAI 모델 이름                                               |
| `PORT`                 | 선택      | `4000`                                        | API 서버가 수신할 포트                                                                 |

기본값이 있는 선택 환경 변수는 `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`, `NODE_ENV`이다. `DATABASE_URL`은 예시 파일에서 로컬 SQLite 파일 `data/api.sqlite`를 사용하지만, 런타임 검증에서는 명시 입력을 요구한다.

```bash
bun --filter @workspace/api dev
```

### `packages/core`

`packages/core`는 도메인 중심 계약을 담는다. 콘텐츠, 학습 진행, AI 피드백 DTO, `CourseId`, `LessonId`, `UserId` 같은 브랜드 ID, 저장소 포트, 명시적 결과 변형, 도메인 서비스를 제공한다. 외부 런타임이나 데이터베이스 구현에 의존하지 않고 API와 데이터베이스 패키지가 공유하는 도메인 경계를 정의한다.

### `packages/db`

`packages/db`는 Drizzle SQLite 기반 영속성 패키지다. 콘텐츠, Better Auth, 학습 진행, AI 피드백 시도 스키마, 마이그레이션 SQL, 시드 데이터, 데이터베이스 클라이언트 생성, 저장소 구현을 제공한다. 과정과 레슨 조회 데이터는 시드된 작성 콘텐츠에서 가져온다.

인증과 학습자 상태 테이블은 다음 이름을 사용한다.

- `user`, `session`, `account`, `verification`: Better Auth 테이블
- `course_progress`: 사용자별 코스 진행 요약
- `lesson_progress`: 사용자별 레슨 현재 위치와 완료 상태
- `lesson_answers`: 사용자별 레슨 스텝 답변
- `feedback_attempts`: AI 피드백 완료 시도와 구조화 결과

콘텐츠 시드는 현재 웹 정적 카탈로그와 과정 상세 화면의 과정/챕터/레슨 ID를 명시적으로 보관한다. API는 `vocabulary-basics` 같은 기존 과정 요약과 `sentence-structure-02` 같은 후속 레슨 ID를 반환할 수 있다. 다만 모든 레슨의 프로토타입 본문을 복제하지는 않으며, 각 레슨은 현재 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE` 기본 단계로 플레이 가능성과 학습 상태 저장 경로를 보장한다.

AI 피드백은 `apps/api`의 OpenAI provider가 OpenAI Responses API와 Structured Outputs를 호출하고, `packages/core`의 AI 피드백 서비스가 재시도 제한, 저장 답변 조회, 결과 저장 규칙을 담당한다. OpenAI 호출 실패는 사용자 재시도 횟수를 소모하지 않고 `ai-feedback-unavailable` 오류로 반환한다. OpenAI 요청용 구조화 출력 schema는 OpenAI가 지원하는 JSON Schema 부분집합에 맞추고, provider 응답은 도메인 DTO schema로 다시 검증한다.

### `packages/logger`

`packages/logger`는 Pino 로거 생성과 요청 로그 필드 헬퍼를 제공한다. API 조립 루트와 라우트 주변부에서 공통 로그 형식을 재사용할 수 있게 한다.

`apps/api`는 앱 생성 시 logger를 주입받아 요청 ID, method, path, status, duration을 요청 단위로 기록한다. 클라이언트가 `x-request-id`를 보내면 같은 값을 응답 헤더와 로그에 사용하고, 없으면 API가 새 request id를 생성한다.
