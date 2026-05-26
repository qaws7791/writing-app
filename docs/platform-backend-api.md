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
