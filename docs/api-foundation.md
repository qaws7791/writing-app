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

- `packages/core`에 콘텐츠 DTO, 브랜드 ID, 저장소 포트, 읽기 서비스를 추가했다.
- 콘텐츠 서비스는 저장소의 잘못된 시드 DTO를 `invalid-content` 결과로 반환하고, 저장소 호출 실패를 `unavailable` 결과로 반환한다.
- 과정과 레슨 조회 경계는 `CourseId`, `LessonId` 브랜드 타입을 사용한다.
