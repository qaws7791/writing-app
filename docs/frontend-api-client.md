# 프론트엔드 API 클라이언트 전환

## 2026-05-27 계획 수립 시작

- `openapi-typescript`와 `openapi-fetch`를 사용해 백엔드 OpenAPI 계약 기반 API 클라이언트를 만드는 계획을 수립한다.
- 프론트엔드는 실제 백엔드 없이도 테스트할 수 있도록 외부 HTTP 의존성을 교체 가능한 경계 뒤에 둔다.
- 기존 `apps/web` 정적 데이터 구조, `FRONTEND.md`의 API 레이어 원칙, `apps/api` OpenAPI 생성 파이프라인을 함께 검토한다.

## 2026-05-27 계획 수립 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-27-web-api-client-design.md`에 작성했다.
- 구현 계획은 `docs/superpowers/plans/2026-05-27-web-api-client.md`에 작성했다.
- 권장 구조는 `apps/web` 내부에 API 포트, `openapi-fetch` 기반 HTTP 어댑터, 정적 데이터 기반 fake 어댑터를 함께 두는 방식이다.
- 생성 타입은 `apps/docs/openapi/writing-app-api.json`에서 `apps/web/src/lib/api/generated/writing-app-api.d.ts`로 만든다.
- 화면과 도메인 로직은 생성 타입과 HTTP 클라이언트에 직접 의존하지 않고, 프론트 내부 모델과 API 포트만 사용한다.
- 테스트는 fake 어댑터로 외부 없이 실행하고, HTTP 어댑터는 주입된 `fetch`로 요청 모양과 오류 매핑을 검증한다.

## 2026-05-27 구현 시작

- `codex/web-api-client` 브랜치에서 웹 API 클라이언트 전환 구현을 시작한다.
- 구현 순서는 `docs/superpowers/plans/2026-05-27-web-api-client.md`의 Task 1부터 Task 8까지 따른다.
- 시작 시점의 주요 범위는 `apps/web` API 포트, HTTP/fake 어댑터, 페이지 연결, 레슨 mutation 연결, 관련 문서 갱신이다.

## 2026-05-27 구현 완료

- `apps/web`에 OpenAPI 타입 생성 스크립트와 `openapi-fetch` 기반 HTTP 어댑터를 추가했다.
- 프론트 화면은 `WritingAppApi` 포트를 통해 데이터에 접근하며, fake 어댑터로 백엔드 없이 테스트할 수 있다.
- 코스 목록, 코스 상세, 레슨 조회, 진행 저장, 답변 저장, 레슨 완료, AI 피드백 호출 경로를 API 포트로 연결했다.
- 검증 명령은 test, typecheck, lint, build를 실행했다.

## 2026-05-27 브라우저 실동작 검증 시작

- 이전 작업에서 연결한 실제 API 모드로 `apps/api`와 `apps/web`을 함께 실행한다.
- 브라우저에서 코스 목록, 코스 상세, 레슨 진입, 레슨 진행 저장, 답변 저장, AI 피드백 호출, 레슨 완료 흐름을 확인한다.
- 검증 중 발견되는 실패는 서버 로그, 브라우저 상태, 네트워크 호출 기준으로 분리하고 필요한 최소 변경만 진행한다.

## 2026-05-27 브라우저 실동작 검증 완료

- `apps/api`는 `apps/api/.env` 기반으로 `http://localhost:4000`에서 실행했고, `apps/web`은 실제 API 모드로 `http://localhost:3001`에서 실행했다.
- 브라우저에서 `/courses`, `/courses/sentence-structure`, `/lesson?lesson_id=sentence-structure-01` 화면 렌더링과 레슨 단계 전환을 확인했다.
- 공개 API 호출은 `/health`, `/courses`, `/courses/sentence-structure`, `/lessons/sentence-structure-01`이 `200`을 반환했다.
- 실제 API 모드의 브라우저 레슨 진행 저장, 답변 저장, 레슨 완료, AI 피드백 호출은 인증 세션이 없어 `401 unauthorized`를 반환했다.
- 현재 `apps/web`에는 로그인 또는 회원가입 화면이 없어 브라우저에서 실제 인증 세션을 만들 수 없고, AI 피드백 단계에는 `Authentication is required.` 오류가 표시된다.
- 같은 API 서버에서 테스트 계정 쿠키로 직접 호출한 인증 API는 진행 저장, 답변 저장, AI 피드백 모두 `200`을 반환해 백엔드 기능 자체는 정상 동작함을 확인했다.
- 다음 작업은 실제 API 모드에서 사용할 프론트 인증 진입점과 인증 필요 상태의 UX를 추가한 뒤 브라우저에서 저장/AI 피드백 성공 경로를 다시 검증하는 것이다.

## 2026-05-27 공개 랜딩과 앱 보호 라우팅 시작

- 루트 `/`를 공개 랜딩 페이지로 단순화하고, 학습 앱 내부 화면은 `/app/...` 경로 아래로 모은다.
- `/app` 하위 라우트는 현재 사용자 확인에 실패하면 공개 랜딩으로 돌려보내도록 보호한다.
- 기존 `/home`, `/courses`, `/lesson` 깊은 링크는 새 `/app/...` 경로로 리다이렉트해 사용자의 기존 진입 경로를 보존한다.

## 2026-05-27 공개 랜딩과 앱 보호 라우팅 완료

- 루트 `/`는 공개 랜딩 페이지로 변경하고 전역 앱 내비게이션을 제거했다.
- 기존 앱 홈은 `/app`, 코스 목록은 `/app/courses`, 코스 상세는 `/app/courses/[id]`, 레슨은 `/app/lesson`, 프로필은 `/app/profile`로 배치했다.
- `/app` 하위 layout에서 `getCurrentUser`를 호출해 인증되지 않은 사용자를 `/`로 리다이렉트한다.
- 서버 API 클라이언트는 Next.js `cookies()`의 쿠키 문자열을 실제 API 요청에 전달해 서버 컴포넌트에서도 인증 세션을 사용할 수 있게 했다.
- 기존 `/home`, `/courses`, `/courses/[id]`, `/lesson` 경로는 새 `/app/...` 경로로 리다이렉트한다.
- 실제 API 모드 브라우저 검증에서 `/`는 랜딩을 렌더링했고, 비인증 `/app` 접근과 기존 `/courses/sentence-structure` 진입은 최종적으로 `/`로 보호 리다이렉트됐다.

## 2026-05-27 로그인과 회원가입 페이지 시작

- 공개 라우트 `/login`, `/signup`을 추가해 비인증 사용자가 앱 진입 전에 인증할 수 있게 한다.
- `/app/...` 보호 리다이렉트는 기존 `/` 대신 `/login?next=...`로 이동해 로그인 후 원래 목적지로 복귀할 수 있게 한다.
- 로그인과 회원가입 폼은 브라우저에서 실제 API의 Better Auth 이메일 엔드포인트를 `credentials: "include"`로 호출해 인증 쿠키를 저장한다.

## 2026-05-27 로그인과 회원가입 페이지 완료

- `/login`, `/signup` 공개 페이지를 추가하고 이메일/비밀번호 기반 인증 폼을 연결했다.
- 로그인 폼은 `/api/auth/sign-in/email`, 회원가입 폼은 `/api/auth/sign-up/email`을 호출하며 `credentials: "include"`로 Better Auth 세션 쿠키를 브라우저에 저장한다.
- 인증 성공 후에는 `next` 쿼리로 전달된 `/app...` 내부 경로로 이동하고, 외부 URL이나 비앱 경로는 기본값 `/app`으로 보정한다.
- `/app` 보호 layout은 비인증 사용자를 `/login?next=%2Fapp`으로 리다이렉트한다.
- 랜딩의 주요 CTA는 로그인 페이지로 이동하되, 인증 후 앱 홈 또는 코스 목록으로 이어지도록 `next` 값을 포함한다.
- 브라우저 검증에서 비인증 `/app` 접근은 `/login?next=%2Fapp`으로 이동했고, `/login`, `/signup` 폼 렌더링을 확인했다.
- 자동 브라우저 입력은 도구의 가상 클립보드 오류로 끝까지 수행하지 못해, 실제 회원가입 API와 세션 확인은 동일 서버에 대한 HTTP 스모크 테스트로 검증했다.
