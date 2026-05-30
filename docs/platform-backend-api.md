# 플랫폼 백엔드 API

## 2026-05-31 학습자 Google 단일 로그인 완료

- 학습자 Better Auth 런타임에서 `emailAndPassword` 설정을 제거하고 Google social provider만 인증 진입점으로 남겼다.
- `/login` 화면은 이메일/비밀번호 폼과 회원가입 링크 없이 `Google로 계속하기` 버튼만 제공한다.
- `/signup` 학습자 페이지와 웹 이메일 인증 클라이언트는 제거했다.
- 관리자 인증은 어드민 전용 Better Auth ID/password 경로로 유지한다.

## 2026-05-31 docs 앱 제거 완료

- OpenAPI 정적 계약 파일 위치를 `apps/docs/openapi/writing-app-api.json`에서 `docs/openapi/writing-app-api.json`으로 옮겼다.
- API 런타임의 `/openapi.json` 라우트는 유지하되, Fumadocs 기반 공개 API 문서 사이트와 MDX 생성 경로는 제거했다.
- 웹 OpenAPI 타입 생성은 `docs/openapi/writing-app-api.json`을 기준으로 유지한다.

## 2026-05-28 학습자 커리큘럼 업그레이드 UX 구현 시작

- 커리큘럼 버전 관리 로드맵 8단계 구현을 시작한다.
- 학습자가 현재 진행 버전을 유지한 상태로 새 커리큘럼 공지를 확인하고, 명시적으로 업그레이드하거나 나중에 결정할 수 있게 한다.
- 업그레이드 적용은 7단계의 active 마이그레이션 맵과 동일한 완료 성취 이전 정책을 사용한다.

## 2026-05-28 학습자 커리큘럼 업그레이드 UX 구현 완료

- 학습자 API에 업그레이드 공지 조회, 직접 업그레이드, 나중에 결정 route를 추가했다.
- 업그레이드 공지는 사용자의 현재 진행 버전보다 높은 최신 published 버전과 active 마이그레이션 맵이 있을 때만 `available`로 반환한다.
- 직접 업그레이드는 관리자 마이그레이션 적용과 동일한 helper를 사용해 완료 레슨만 새 버전으로 이전하고 진행 버전을 target version으로 이동한다.
- 나중에 결정은 `curriculum_upgrade_dismissals`에 사용자/코스/source/target 버전 쌍을 기록해 같은 공지를 숨긴다.
- 당시 `apps/docs/openapi/writing-app-api.json`와 웹 OpenAPI 생성 타입에 새 route 계약을 반영했다. 현재 정적 계약 파일은 `docs/openapi/writing-app-api.json`에 둔다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 시작

- 커리큘럼 버전 관리 로드맵 7단계 구현을 시작한다.
- 관리자 지정 마이그레이션 맵으로 기존 학습자의 완료 진행을 새 버전에 이전하는 저장소 경계를 추가한다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 완료

- DB에 마이그레이션 맵, 레슨 매핑, 적용 결과 application 테이블을 추가했다.
- Admin API에 마이그레이션 맵 생성, 조회, 특정 사용자 적용 route를 추가했다.
- `equivalent`와 `split`은 완료 source lesson을 target lesson 완료로 이전하고, `merged`는 같은 target에 연결된 모든 source lesson이 완료됐을 때만 이전한다.
- `removed`는 기존 완료 성취 row를 삭제하지 않고 application 결과의 보존 목록에 기록한다.
- 적용 성공 후 `course_progress.curriculum_version_id`는 target version으로 이동하고, 재실행하면 같은 completed application 결과를 반환한다.
- 학습자가 직접 업그레이드를 선택하는 API와 UX는 아직 제공하지 않는다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 7단계 구현 계획을 작성한다.
- 기존 학습자의 진행 버전을 새 버전으로 옮길 때 관리자 지정 맵을 기준으로만 적용되도록 설계한다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 계획 완료

- Admin API에 마이그레이션 맵 생성, 조회, 사용자 단위 적용 route를 추가하는 계획을 고정한다.
- 적용 전까지 기존 학습자의 `course_progress.curriculum_version_id`는 계속 현재 버전을 유지한다.
- learner-facing 업그레이드 선택 UX는 다음 단계로 남긴다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 시작

- 관리자 발행 API가 새 published 버전을 만들 때 공개 최신 버전과 기존 학습자 진행 버전이 분리되는지 검증한다.
- 학습자 public DTO에는 커리큘럼 버전 metadata를 계속 노출하지 않는다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 완료

- Admin API에 커리큘럼 버전 목록 조회, draft 생성, 버전 상세 조회, draft publish route를 추가했다.
- draft 생성은 최신 published 버전의 챕터와 레슨 snapshot을 복제하며, 이미 draft가 있는 코스는 중복 draft 생성을 거절한다.
- draft publish 후 신규 공개 콘텐츠 조회는 새 최신 published 버전을 사용한다.
- 기존 학습자의 `course_progress.curriculum_version_id`는 publish 후에도 자동 변경하지 않는다.
- 구조 편집 API, 마이그레이션 맵, 학습자 업그레이드 UX는 아직 제공하지 않는다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 시작

- 관리자 draft publish 후 신규 학습자는 새 최신 published 버전으로 시작하고, 기존 학습자는 저장된 진행 버전을 유지하는지 검증한다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 완료

- Admin API에 커리큘럼 버전 목록, draft 생성, 상세 조회, publish route를 추가하는 계획을 고정한다.
- 학습자 public DTO에는 version metadata를 노출하지 않는다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 시작

- 공개 콘텐츠와 학습 진행 API가 커리큘럼 노드 상태를 읽기 정책으로 따르도록 5단계 구현을 시작한다.
- archived/deprecated 노드는 신규 학습 경로에서 제외하고, 이미 저장된 완료 성취는 유지한다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 완료

- 공개 `GET /courses`, `GET /courses/search`, `GET /courses/:courseId`는 최신 published 버전의 active 챕터와 active 레슨만 기준으로 `lessonCount`, `firstLessonId`, `chapters`를 계산한다.
- 학습 진행 조회와 저장 검증은 진행 버전의 active 레슨만 다음 학습 후보와 저장 가능 레슨으로 사용한다.
- 이미 완료된 archived 레슨은 학습자의 완료 카운트에 남는다.
- 관리자 API의 `GET /courses?include=chapters,lessons`는 최신 published 버전의 노드 상태를 반환한다.
- delete API와 archive mutation API는 아직 제공하지 않는다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 시작

- 공개 콘텐츠 API와 학습 진행 API가 archived/deprecated 노드를 신규 학습 경로에서 제외하도록 5단계 계획을 작성한다.
- 이미 완료된 archived 레슨의 완료 카운트는 학습 진행 row 기준으로 보존한다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 완료

- 공개 콘텐츠 API는 최신 published 버전의 active 챕터와 active 레슨만 반환한다.
- 학습 진행 API는 진행 버전의 active 레슨만 다음 학습 후보와 저장 가능 레슨으로 사용한다.
- delete API와 archive mutation API는 아직 제공하지 않는다.

## 2026-05-28 버전 인식 읽기 경로 구현 시작

- 공개 콘텐츠 API와 인증된 학습 진행 API가 서로 다른 커리큘럼 버전 기준을 유지하도록 4단계 구현을 시작한다.
- `saveLessonAnswer`도 진행 저장과 완료 처리와 같은 진행 버전 포함 여부 검증을 적용한다.

## 2026-05-28 버전 인식 읽기 경로 구현 완료

- 공개 `GET /courses/:courseId`는 최신 published 커리큘럼 버전 기준 응답을 유지한다.
- 인증된 `GET /courses/:courseId/progress`와 `GET /progress`는 학습자의 `course_progress.curriculum_version_id`에 저장된 진행 버전 기준 응답을 유지한다.
- `PUT /lessons/:lessonId/progress`, `PUT /lessons/:lessonId/answers`, `POST /lessons/:lessonId/complete`는 진행 버전 밖 레슨에 대해 `400 invalid-request`를 반환한다.
- API route 통합 테스트는 Hono route의 응답 분리와 오류 매핑을 검증하고, 실제 버전 계산은 core/db 테스트가 담당한다.

## 2026-05-28 버전 인식 읽기 경로 구현 계획 시작

- 공개 최신 커리큘럼과 인증된 진행 커리큘럼이 API 경계에서 섞이지 않도록 통합 테스트 계획을 작성한다.
- 진행 저장, 완료, 답변 저장은 학습자의 진행 버전에 포함된 레슨에 대해서만 허용하도록 검증 범위를 확장한다.

## 2026-05-28 버전 인식 읽기 경로 구현 계획 완료

- 공개 `GET /courses/:courseId`는 최신 published 버전을 유지한다.
- 인증된 `GET /courses/:courseId/progress`와 `GET /progress`는 저장된 진행 버전을 유지한다.
- 답변 저장도 진행 버전 밖 레슨에 대해 `invalid-request`를 반환하도록 구현 계획에 포함한다.

## 2026-05-28 학습 진행 버전 귀속 구현 시작

- 인증된 진행 API가 최신 공개 콘텐츠 구조와 독립적으로 학습자의 진행 버전을 유지하도록 구현을 시작한다.
- 코스/레슨 진행 row에 `curriculum_version_id`를 기록하고, 진행률과 다음 레슨 계산을 저장된 버전 기준으로 바꾼다.

## 2026-05-28 학습 진행 버전 귀속 구현 완료

- `course_progress.curriculum_version_id`는 사용자가 해당 코스에서 진행 중인 커리큘럼 버전을 저장한다.
- `lesson_progress.curriculum_version_id`는 레슨 진행 row가 생성된 커리큘럼 버전을 저장한다.
- 새 진행은 최신 published 버전으로 시작하고, 기존 진행은 저장된 버전을 유지한다.
- `GET /courses/:courseId/progress`와 전체 진행 조회는 진행 버전의 active 레슨 배치로 완료율과 다음 레슨을 계산한다.
- 레슨 진행 저장과 완료 처리는 대상 레슨이 학습자의 진행 버전에 포함될 때만 허용한다.

## 2026-05-28 학습 진행 버전 귀속 구현 계획 시작

- 인증된 학습 진행 API가 공개 최신 커리큘럼이 아니라 학습자가 시작한 커리큘럼 버전을 유지하도록 3단계 구현 계획을 작성한다.
- 이번 계획은 `course_progress`, `lesson_progress`의 버전 ID 저장과 진행률/다음 레슨 계산 기준 변경을 포함한다.

## 2026-05-28 학습 진행 버전 귀속 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-28-progress-curriculum-version-binding.md`에 작성한다.
- 신규 진행은 최신 published 버전을 선택하고, 기존 진행은 저장된 커리큘럼 버전을 유지한다.
- 공개 콘텐츠 API 응답에 버전 ID를 노출하지 않고, 인증된 진행 저장과 조회 내부 경계에서 먼저 버전을 사용한다.

## 2026-05-28 커리큘럼 버전 모델 추가 시작

- 공개 콘텐츠 API가 관리자 구조 변경의 영향을 직접 받지 않도록 커리큘럼 버전 스냅샷 모델을 추가한다.
- 이번 단계는 코스별 `v1` published 버전 생성과 최신 published 버전 기준 공개 조회로 한정한다.
- 학습 진행 테이블의 버전 귀속과 학습자 업그레이드 UX는 이후 단계에서 별도로 구현한다.

## 2026-05-28 커리큘럼 버전 모델 추가 완료

- DB 마이그레이션은 `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons`를 생성한다.
- 콘텐츠 seed는 현재 코스/챕터/레슨 구조를 코스별 `v1` published 버전으로 함께 생성한다.
- `GET /courses`, `GET /courses/search`, `GET /courses/:courseId`는 published 버전 중 가장 큰 `version_number`를 최신 버전으로 사용한다.
- 공개 조회는 최신 버전의 active 챕터와 레슨 배치로 목록 요약과 상세 구조를 계산하며, 레슨 본문 조회는 기존 `lessonId` 기반 경로를 유지한다.

## 2026-05-30 챕터 레이블 제거 완료

- 챕터는 별도 라벨 없이 제목과 정렬 순서로만 표현한다.
- 공개 코스 상세 응답의 챕터 객체에서 `label` 속성을 제거했다.
- `course_chapters`, `curriculum_version_chapters`의 `label` 컬럼은 새 DB와 기존 DB 마이그레이션 경로에서 제거한다.

## 2026-05-28 콘텐츠 변경 정책 문서화 시작

- 학습자 진행 API가 향후 커리큘럼 버전 기준으로 동작해야 하므로, 코드 변경 전에 콘텐츠 변경 정책을 문서화한다.
- 현재 진행 저장 구조는 `course_id`, `lesson_id`에 직접 귀속되므로 관리자 구조 변경 API를 먼저 추가하지 않는다.

## 2026-05-28 콘텐츠 변경 정책 문서화 완료

- `DOMAIN.md`와 `docs/curriculum-change-policy.md`에 변경 유형, 아카이빙, 완료 성취 보존 원칙을 정리한다.
- `BACKEND.md`에 커리큘럼 버전 경계 도입 전까지 published 콘텐츠 구조를 직접 바꾸는 관리 API를 제공하지 않는다는 제약을 기록한다.
- 이후 학습 진행 API는 신규 학습자는 최신 published 버전, 기존 학습자는 진행 중인 버전을 기준으로 계산하도록 확장한다.

## 2026-05-26 설계 시작

- `docs/platform-product-feature-spec.md`를 기준으로 학습자용 백엔드 API 서버 전체 구현 범위를 설계한다.
- 어드민 콘텐츠 관리와 콘텐츠 검수 기능은 이번 범위에서 제외한다.
- 기존 `apps/api`, `packages/core`, `packages/db`, `packages/logger` 구조를 유지하면서 인증, 프로필, 검색, 학습 진행 저장, 레슨 답변 저장, OpenAI 기반 AI 피드백을 추가하는 방향을 검토한다.
- 콘텐츠 조회 API는 공개로 유지하고, 사용자 정보가 필요한 API만 인증을 요구한다.
- 인증은 Better Auth로 실제 이메일/비밀번호 로그인과 Google 로그인을 구현한다.
- 필수 환경 변수가 없거나 형식이 잘못된 경우 기능을 비활성화하지 않고 서버 시작 시 즉시 실패하도록 설계한다.
- OpenAI 피드백은 Responses API와 Structured Outputs를 사용하는 방향으로 설계한다.

## 2026-05-26 설계 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-26-platform-backend-api-design.md`에 작성했다.
- 공개 API는 코스 목록, 코스 검색, 코스 상세, 레슨 상세를 제공한다.
- 인증 API는 현재 사용자, 프로필, 전체 진행, 코스 진행, 레슨 진행, 답변 저장, 레슨 완료, AI 피드백을 제공한다.
- Better Auth는 `/api/auth/*`에 마운트하고, 쿠키 인증을 위해 CORS credentials를 명시한다.
- 학습 상태 테이블 이름은 짧고 도메인 의미가 분명한 `course_progress`, `lesson_progress`, `lesson_answers`, `feedback_attempts`로 정리했다.
- 필수 환경 변수는 `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `DATABASE_URL`로 정했다.
- 다음 단계는 설계 리뷰 후 구현 계획을 작성하는 것이다.

## 2026-05-26 구현 계획 시작

- 승인된 설계 문서를 기준으로 구현 계획을 작성한다.
- 계획은 공개 콘텐츠 API 유지, Better Auth 실제 인증, 인증 사용자 상태 API, 학습 진행 저장, 답변 저장, OpenAI 피드백, 문서 갱신, 검증 순서로 나눈다.
- 구현자는 각 태스크를 테스트 먼저 진행하고, 태스크 단위로 검증 가능한 상태를 만든다.

## 2026-05-26 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-26-platform-backend-api.md`에 작성했다.
- 계획은 의존성과 환경 변수 빠른 실패, 콘텐츠 검색, Better Auth 인증 경계, 인증과 학습 상태 마이그레이션, 학습 서비스, 학습 저장소, 프로필과 진행 API, AI 피드백 서비스, OpenAI provider, OpenAPI와 문서 갱신, 최종 검증으로 나눴다.
- 계획 자체 검토에서 자리표시자와 모순되는 오류 계약을 제거했다.

## 2026-05-26 구현 시작

- `codex/platform-backend-api` 브랜치에서 승인된 구현 계획을 Inline Execution 방식으로 실행한다.
- Task 1에서 Better Auth와 OpenAI SDK 의존성을 추가하고, 필수 환경 변수 누락 시 서버가 즉시 실패하도록 `apps/api` 환경 검증을 강화했다.
- 기존 API startup 테스트가 Bun 전용 `import.meta.dir`와 고정 포트에 의존해 로컬 검증을 막고 있어, 표준 URL 기반 cwd와 동적 포트 할당으로 보정했다.
- Task 2에서 공개 코스 검색 API를 추가하고, 빈 검색어는 `invalid-request`로 명시적으로 거절하도록 했다.
- Task 3에서 Better Auth 런타임을 실제로 조립하고 `/api/auth/*`, `/me` 인증 경계를 추가했다.
- Task 4에서 Better Auth 인증 테이블과 학습 상태 테이블 마이그레이션을 추가했다.
- Task 5에서 학습 진행, 레슨 답변, 레슨 완료를 다루는 core 학습 도메인 서비스를 추가했다.
- Task 6에서 학습 진행, 레슨 답변, 레슨 완료를 저장하는 Drizzle SQLite 저장소를 추가했다.
- Task 7에서 인증이 필요한 `/profile`, `/progress`, 코스/레슨 진행, 답변 저장, 레슨 완료 API를 추가했다.
- Task 8에서 AI 피드백 core 서비스와 `feedback_attempts` Drizzle 저장소를 추가했다.
- Task 9에서 OpenAI Responses API 기반 피드백 provider와 인증이 필요한 `POST /ai-feedback` API를 추가했다.
- Task 10에서 새 학습자 API 경로가 OpenAPI 문서에 포함되는지 검증하고, `BACKEND.md`에 인증 경계, 환경 변수, 테이블, OpenAI 피드백 경계를 갱신했다.
- Task 11에서 패키지별 테스트, 타입체크, 린트와 API 스모크 테스트를 실행했다.
- 통과한 검증:
  - `bun --filter @workspace/core test`
  - `bun --filter @workspace/db test`
  - `bun --filter @workspace/logger test`
  - `bun --filter @workspace/api test`
  - `bun --filter @workspace/core typecheck`
  - `bun --filter @workspace/db typecheck`
  - `bun --filter @workspace/api typecheck`
  - `bun --filter @workspace/core lint`
  - `bun --filter @workspace/db lint`
  - `bun --filter @workspace/api lint`
  - `bun run test`
  - `bun run lint`
  - `git diff --check`
  - `bun lefthook run pre-commit`
- API 스모크 테스트는 임시 포트 `4100`에서 `/health`, `/courses`, `/courses/search?q=문장`, `/me`를 확인했다. 공개 API는 `200`, 인증 없는 `/me`는 `401 unauthorized`를 반환했다.
- 전체 워크스페이스 검증 중 `bun run typecheck`는 기존 `@workspace/ui`의 `clsx` 타입 해석 실패로 중단됐다.
- 전체 워크스페이스 `bun run format:check`는 기존 `codebase.md`, `FRONTEND.md`, `docs/platform-product-feature-spec.md` 포맷 불일치 때문에 실패했다. 이번 작업에서 작성한 구현 계획 문서는 Prettier로 정리했다.

## 2026-05-26 API 환경 변수 문서화 시작

- `apps/api/src/env.ts`에만 남아 있던 API 환경 변수 목록을 실행 예시 파일과 백엔드 문서로 함께 관리한다.
- 문서화 대상은 Better Auth, Google OAuth, OpenAI 피드백, SQLite 데이터베이스, CORS, 로그, 포트, 실행 환경 변수다.
- 런타임 검증 스키마는 변경하지 않고, 현재 필수/선택 변수의 의미와 로컬 예시값만 명시한다.

## 2026-05-26 API 환경 변수 문서화 완료

- `apps/api/.env.example`을 추가해 API 앱에 필요한 모든 환경 변수 이름과 로컬 개발용 예시값을 한 곳에 모았다.
- `BACKEND.md`의 `apps/api` 섹션에 환경 변수 표를 추가해 필수 여부, 기본값 또는 예시, 용도를 문서화했다.
- `DATABASE_URL`은 예시 파일에서 앱 패키지 기준 `file:../../data/api.sqlite`를 사용해 저장소 루트 `data/api.sqlite`를 가리키지만 런타임에서는 필수 입력이라는 점을 명확히 했다.

## 2026-05-26 로컬 API 실동작 검증 시작

- 실제 로컬 환경 변수 세팅 이후 `apps/api` 서버가 정상 시작되는지 확인한다.
- 공개 API, 인증 경계, OpenAPI 문서, 가능하면 인증 플로우와 인증 필요 API를 실제 HTTP 요청으로 검증한다.
- 검증 중 발견되는 실패는 로그와 응답을 기준으로 원인을 확인한 뒤, 코드 변경 없이 환경 또는 실행 절차 문제인지 먼저 분리한다.

## 2026-05-26 로컬 API 실동작 검증 완료

- `apps/api/.env`를 사용해 로컬 API 서버가 시작되고 `/health`가 `200`과 `database: ok`를 반환함을 확인했다.
- 공개 API는 `/courses`, `/courses/search?q=문장`, `/courses/sentence-structure`, `/lessons/sentence-structure-01`, `/openapi.json`을 실제 HTTP 요청으로 검증했다.
- 인증 없는 `/me`는 `401 unauthorized`를 반환했고, Better Auth 이메일 회원가입과 로그인이 각각 `200`을 반환했다.
- 인증 세션으로 `/me`, `/profile`, `PUT /lessons/sentence-structure-01/progress`, `PUT /lessons/sentence-structure-01/answers`, `POST /lessons/sentence-structure-01/complete`, `/courses/sentence-structure/progress`를 검증했다.
- 초기 검증에서 실제 시드 레슨이 `INTRO`, `SUMMARY`, `COMPLETE`만 포함해 답변 저장과 AI 피드백 성공 경로를 만들 수 없는 문제가 확인됐다.
- 시드 레슨 단계에 `SHORT_WRITE`와 `AI_FEEDBACK`을 추가해 실제 로컬 API에서 답변 저장과 AI 피드백을 검증할 수 있게 했다.
- OpenAI Structured Outputs 호출은 `scoreRange` tuple schema가 OpenAI 지원 schema 형태와 맞지 않아 `invalid_json_schema`로 실패했다. OpenAI 요청용 schema만 배열 길이 2 형식으로 보정하고, 반환값은 기존 도메인 DTO로 다시 검증하도록 했다.
- 최종 스모크 테스트에서 `POST /ai-feedback`는 실제 OpenAI 호출을 포함해 `200`을 반환했고, 응답은 `score`, `scoreRange`, `summary`를 포함했다.
- 검증 후 스모크 테스트용 API 프로세스는 모두 종료했고, 임시 SQLite 파일도 삭제했다.

## 2026-05-27 프론트엔드 연결 가능성 검토 시작

- 현재 백엔드 API 구현 현황을 코드, 문서, 테스트 기준으로 다시 점검한다.
- 검토 범위는 공개 콘텐츠 API, 인증 API, 학습 진행 API, AI 피드백 API, OpenAPI 문서, 프론트엔드 정적 데이터 구조와의 연결 가능성이다.
- 코드 변경은 하지 않고, 프론트 연결 전에 필요한 보강 지점을 식별한다.

## 2026-05-27 프론트엔드 연결 가능성 검토 완료

- `apps/api`는 공개 콘텐츠 조회, Better Auth 인증, 현재 사용자, 프로필, 진행 조회, 레슨 진행 저장, 답변 저장, 레슨 완료, AI 피드백 API를 실제 서비스와 SQLite 저장소까지 연결한다.
- `packages/core`와 `packages/db`는 콘텐츠, 학습 진행, 답변, 피드백 시도 저장을 테스트로 검증하고 있다.
- `docs/openapi/writing-app-api.json` 생성 파이프라인과 `/openapi.json` 라우트가 있어 프론트 API 클라이언트 계약의 기준점으로 사용할 수 있다.
- `apps/web`는 아직 API 호출 계층 없이 `course-data.ts`, `course-detail-data.ts`, `lesson-data.ts`의 정적 데이터로 화면을 구성한다.
- 프론트 연결은 가능하지만, 코스/레슨 DTO 매핑, 인증 쿠키 포함 fetch 설정, 진행 상태 병합, AI 피드백 호출 UI 상태, API base URL 환경 변수 정의가 선행되어야 한다.
- 검증은 `PATH=/Users/mac/.bun/bin:$PATH`를 명시해 `@workspace/api`, `@workspace/core`, `@workspace/db`의 test/typecheck/lint를 실행했다. `@workspace/api` lint는 기존 `turbo/no-undeclared-env-vars` 경고 2건만 남고 종료 코드 0을 반환했다.
