# @workspace/web

학습자용 Next.js App Router 앱이다. 코스 탐색, 로그인, 학습 홈, 코스 상세, 레슨 진행, 답변 저장, AI 피드백 요청 화면을 제공한다.

## 주요 라우트

- `/`: 학습자 랜딩 페이지.
- `/login`: Google 로그인 화면. `next` query는 허용된 앱 내부 경로만 사용한다.
- `/app`: 로그인한 학습자의 홈. `/progress` 읽기 모델로 진행 중 코스와 다음 학습 위치를 표시한다.
- `/app/courses`: 카테고리 섹션으로 묶은 코스 목록.
- `/app/courses/[id]`: 코스 상세와 커리큘럼.
- `/app/lesson?lesson_id=...`: step 기반 레슨 경험.
- 인증 요청: `apps/api`의 `/api/auth/*` Better Auth endpoint를 직접 호출한다.

## 구조

- `src/app`: App Router 라우트와 layout.
- `src/features/auth`: 로그인 화면과 인증 UI.
- `src/features/home`: 학습 홈과 진행 요약 표시.
- `src/features/courses`: 코스 목록, 상세, 커리큘럼 UI와 API mapper.
- `src/features/lessons`: 레슨 경험, step renderer, 저장 hook, 레슨 mapper.
- `src/lib/api`: `WritingAppApi` 포트, HTTP 어댑터, fake 어댑터, 서버 API 생성.
- `src/lib/auth`: 로그인 redirect와 현재 사용자 조회 helper.

## 실행 명령

```bash
bun --filter @workspace/web dev
bun --filter @workspace/web build
bun --filter @workspace/web lint
bun --filter @workspace/web typecheck
bun --filter @workspace/web test
```

## 개발 규칙

- 앱 코드는 `src` 아래에 둔다.
- import는 절대 경로를 사용한다.
- 화면과 feature 코드는 `WritingAppApi` 포트에 의존하고, HTTP 세부 구현에는 직접 의존하지 않는다.
- 학습자 HTTP 계약은 `@workspace/contracts/learning`의 strict Zod schema와 추론 타입을 직접 사용한다.
- runtime OpenAPI 문서는 API의 `/openapi`에서 확인하며 정적 JSON과 generated TypeScript 타입은 추적하지 않는다.
- 런타임 HTTP 호출은 `src/lib/api/http/openapi-client.ts`의 자체 adapter가 담당하며 `openapi-fetch`를 의존성으로 두지 않는다.
- 사용자 화면 텍스트와 접근성 텍스트는 한국어로 작성한다.
