# 플랫폼 백엔드 API

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
