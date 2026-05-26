# API 기반

## 2026-05-26 시작

- `apps/api`에 첫 번째 백엔드 기반을 구축한다.
- API 앱은 Hono를 사용하며 버전이 없는 라우트인 `/health`, `/openapi.json`, `/courses`, `/courses/:courseId`, `/lessons/:lessonId`를 노출한다.
- 백엔드 책임은 `packages/core`, `packages/db`, `packages/logger`로 나눈다.
- 과정과 레슨 조회는 Drizzle SQLite 시드 데이터에서 가져온다.
- 이 작업에서 `apps/web`은 변경하지 않는다.
- 범위 제외: 인증, 진행 상태 추적, 답변 저장, AI 피드백, 파일 업로드, 관리자 흐름, 생성된 API 클라이언트, API 라우트 버전 관리.
- 검증 대상: 패키지 테스트, API 테스트, 타입 검사, 린트, 포맷 검사, `git diff --check`, 가능할 경우 Lefthook pre-commit.

## 2026-05-26 진행

- `packages/db` 콘텐츠 스키마와 마이그레이션, 시드 작업을 시작했다.
- `packages/db`에 Drizzle SQLite 콘텐츠 스키마, 초기 마이그레이션, 결정적 콘텐츠 시드 구현을 추가했다.
- `packages/db` 콘텐츠 시드는 테스트, 타입 검사, 린트로 검증했다. SQL 파일은 현재 루트 Prettier 구성에 SQL 파서가 없어 명시 포맷 검사에서 제외 사유가 남았다.
- 콘텐츠 시드 재실행 시 기존 값을 선언된 시드 값으로 복구하도록 개선하고, 실행 마이그레이션이 체크인된 SQL 파일을 사용하도록 정리했다.
- `packages/core`에 콘텐츠 DTO, 브랜드 ID, 저장소 포트, 읽기 서비스를 추가했다.
- 콘텐츠 서비스는 저장소의 잘못된 시드 DTO를 `invalid-content` 결과로 반환하고, 저장소 호출 실패를 `unavailable` 결과로 반환한다.
- 과정과 레슨 조회 경계는 `CourseId`, `LessonId` 브랜드 타입을 사용한다.
- `packages/logger`에 Pino 기반 로거와 요청 로그 필드 생성을 추가하고 패키지 테스트, 타입 검사, 린트, 포맷 검사를 통과시켰다.
- `packages/db`에 Drizzle 콘텐츠 저장소 매핑을 추가하고 과정 목록, 과정 상세, 레슨 조회 테스트로 검증했다.
- 손상된 레슨 단계 콘텐츠는 데이터베이스 장애가 아니라 `invalid-content`로 분류되도록 저장소와 서비스 검증 경계를 보정했다.
- `apps/api`에 Hono 앱 팩토리와 버전 없는 `/health`, `/openapi.json`, `/courses`, `/courses/:courseId`, `/lessons/:lessonId` 라우트를 추가했다.
- API 라우트는 콘텐츠 서비스 결과를 명시적인 HTTP 상태와 오류 DTO로 매핑하고, OpenAPI 3.1 문서에 현재 경로를 노출한다.
- `apps/api` 실행 루트를 구성해 환경 변수 파싱, SQLite 초기화, 마이그레이션, 시드, 콘텐츠 서비스 연결, 서버 시작 로깅을 한 곳에서 처리한다.
- 개발 기본 환경에서 API가 외부 pretty transport 해석 없이 시작되도록 로거 구성을 보정했다.
- SQLite 데이터베이스 경로가 `:memory:` 또는 파일명만 있는 형태일 때 디렉터리 생성을 건너뛰도록 보정했다.

## 2026-05-26 완료

- `apps/api`를 백엔드 조립 루트로 추가하고 Hono 앱 생성, 환경 변수 파싱, SQLite 데이터베이스 열기, 서비스 구성, 프로세스 시작 책임을 배치했다.
- 버전 접두사 없는 `/health`, `/openapi.json`, `/courses`, `/courses/:courseId`, `/lessons/:lessonId` 라우트를 추가했다.
- `packages/core`, `packages/db`, `packages/logger`를 추가해 도메인 계약, Drizzle SQLite 영속성, Pino 로깅 책임을 분리했다.
- 데이터베이스 스키마, 마이그레이션 SQL, 시드 데이터, 저장소 구현은 Drizzle SQLite를 사용한다.
- 첫 번째 슬라이스는 작성된 과정과 레슨 콘텐츠 조회만 저장하며 인증, 진행 상태, 답변 저장, AI, 업로드, 관리자 기능은 제외했다.
- `apps/web`은 변경하지 않았다.
- 패키지 단위 검증은 모두 통과했다: `bun --filter @workspace/core test`, `bun --filter @workspace/logger test`, `bun --filter @workspace/db test`, `bun --filter @workspace/api test`, 각 패키지 `typecheck`, 각 패키지 `lint`.
- 루트 검증 중 `bun run test`, `bun run lint`, `git diff --check`, `bun lefthook run pre-commit`은 통과했다.
- 루트 `bun run typecheck`는 기존 `@workspace/ui`의 `packages/ui/src/lib/utils.ts` `clsx` 모듈 타입 해석 실패로 종료 코드 2를 반환했다. 이번 작업은 `packages/ui`를 변경하지 않았다.
- 루트 `bun run format:check`는 기존 포맷 불일치 파일 197개로 종료 코드 1을 반환했다. 변경 파일인 `BACKEND.md`와 `docs/api-foundation.md`는 별도 Prettier 검사에서 통과했다.
- 임시 포트에서 `DATABASE_URL=:memory:`로 API 스모크를 실행했고 `/health`, `/courses`, `/courses/sentence-structure`, `/lessons/sentence-structure-01`, `/openapi.json` 모두 HTTP 200을 반환했다.

## 2026-05-26 최종 리뷰 반영

- `packages/db` 콘텐츠 시드는 현재 `apps/web` 정적 카탈로그와 상세 화면에서 사용하는 과정, 챕터, 레슨 ID를 API가 안정적으로 반환할 수 있도록 확장했다.
- `/courses`는 `sentence-structure`, `vocabulary-basics`, `reading-comprehension`, `grammar-complete`, `expression`, `essay-writing`, `business-writing`, `creative-writing` 요약을 포함한다. 상세 데이터에만 존재하는 `basic-sentence-writing`, `emotion-writing`, `business-email`은 `home` 카테고리로 시드해 상세/레슨 ID 조회가 끊기지 않게 했다.
- 시드 레슨은 아직 프론트 프로토타입의 전체 본문을 복제하지 않는다. 각 레슨은 API 계약과 플레이 가능성을 확인하기 위한 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE` 기본 단계를 제공한다.
- `sentence-structure` 상세는 12개 레슨을 반환하며, `sentence-structure-02` 같은 후속 레슨도 `/lessons/:lessonId`에서 조회 가능하다.
- 레슨 step DTO는 프론트 레슨 모델의 대표 타입인 `CONCEPT`, `MULTIPLE_CHOICE`를 포함해 현재 step type 전체를 수용한다.
- `apps/api`는 주입된 logger로 요청 ID, method, path, status, duration을 기록한다. 예상치 못한 요청 처리 오류는 같은 request id와 함께 오류 로그를 남긴다.
- OpenAPI 문서의 404, 500, 503 오류 응답은 core의 오류 DTO Zod schema를 재사용해 JSON schema를 노출한다.

## 2026-05-26 로컬 실동작 검증 반영

- 환경 변수 세팅 후 실제 로컬 API 스모크 테스트에서 답변 저장과 AI 피드백 성공 경로를 검증할 수 있도록 시드 레슨에 작성형 단계와 AI 피드백 단계를 포함했다.
- `POST /ai-feedback`는 OpenAI Structured Outputs가 지원하는 배열 schema 형태를 사용해 `scoreRange`를 요청하고, 응답은 기존 도메인 DTO로 다시 검증한다.
- 최종 로컬 검증에서 공개 콘텐츠 조회, Better Auth 이메일 회원가입/로그인, 인증 사용자 조회, 진행 저장, 답변 저장, 레슨 완료, 실제 OpenAI AI 피드백 요청이 정상 응답을 반환했다.
