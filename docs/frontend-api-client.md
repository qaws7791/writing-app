# 프론트엔드 API 클라이언트 전환

## 2026-05-31 인증 프록시 제거와 직접 API 인증 전환

- 웹과 어드민의 Next.js `/api/auth/*` 프록시를 제거했다.
- 학습자 Google OAuth 시작은 `NEXT_PUBLIC_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 사용한다.
- 관리자 이메일 로그인은 `ADMIN_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 사용한다.
- Hono API는 CORS credentials와 Better Auth trusted origin을 유지하고, 운영 서브도메인 배포에서는 cookie domain 환경 변수로 세션 쿠키 공유 범위를 명시한다.

## 2026-05-31 BSSN 6순위 단순화 완료

- `WritingAppApi`에서 `searchCourses`와 `getProfile` 포트를 제거했다.
- HTTP 어댑터와 fake 테스트 어댑터는 코스 목록, 코스 상세, 레슨 조회, 진행/답변/완료, AI 피드백만 제공한다.
- `/app/profile` 페이지와 전역 프로필/검색 진입점을 제거했다.
- 레거시 `/home`, `/courses`, `/courses/[id]`, `/lesson` 리다이렉트 route 파일을 제거하고 `/app`, `/app/courses`, `/app/courses/[id]`, `/app/lesson`만 학습자 앱 경로로 유지한다.
- 레슨 UI는 생명, XP, 연속 학습, 색종이, 공유 버튼, 완료 통계를 렌더링하지 않는다.

## 2026-05-31 학습자 인증 진입점 단순화 완료

- 웹 학습자 인증 화면은 Google 로그인 단일 버튼만 렌더링한다.
- 이메일/비밀번호 로그인 폼, 학습자 회원가입 링크, `/signup` 페이지, 이메일 인증 요청 helper를 제거했다.
- Google OAuth 시작은 Hono API의 `/api/auth/*` endpoint를 직접 사용하고, 완료 후 안전한 `/app...` 경로로 복귀한다.

## 2026-05-27 계획 수립 시작

- `openapi-typescript`와 `openapi-fetch`를 사용해 백엔드 OpenAPI 계약 기반 API 클라이언트를 만드는 계획을 수립한다.
- 프론트엔드는 실제 백엔드 없이도 테스트할 수 있도록 외부 HTTP 의존성을 교체 가능한 경계 뒤에 둔다.
- 기존 `apps/web` 정적 데이터 구조, `FRONTEND.md`의 API 레이어 원칙, `apps/api` OpenAPI 생성 파이프라인을 함께 검토한다.

## 2026-05-27 계획 수립 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-27-web-api-client-design.md`에 작성했다.
- 구현 계획은 `docs/superpowers/plans/2026-05-27-web-api-client.md`에 작성했다.
- 권장 구조는 `apps/web` 내부에 API 포트, `openapi-fetch` 기반 HTTP 어댑터, 정적 데이터 기반 fake 어댑터를 함께 두는 방식이다.
- 생성 타입은 `docs/openapi/writing-app-api.json`에서 `apps/web/src/lib/api/generated/writing-app-api.d.ts`로 만든다.
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
- 현재 `apps/web`에는 로그인 또는 회원가입 화면이 없어 브라우저에서 실제 인증 세션을 만들 수 없고, AI 피드백 단계에는 `로그인이 필요합니다.` 오류가 표시된다.
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

## 2026-05-27 회원가입 브라우저 검증 시작

- 실제 API 모드로 `apps/api`와 `apps/web`을 함께 실행하고, 브라우저에서 `/signup?next=%2Fapp` 회원가입 흐름을 실제 사용자 입력 방식으로 검증한다.
- 검증 범위는 회원가입 폼 렌더링, 이메일/비밀번호 회원가입 요청, Better Auth 세션 쿠키 저장, 보호된 `/app` 진입 여부다.
- 첫 제출에서 API CORS preflight는 통과했지만 Better Auth가 `http://localhost:3001` origin을 신뢰하지 않아 `Invalid origin`으로 403을 반환하는 문제를 확인했다.

## 2026-05-27 회원가입 브라우저 검증 완료

- `createAuthRuntime`이 API의 `CORS_ORIGIN` 목록을 Better Auth `trustedOrigins`로 함께 전달하도록 보정했다.
- 회귀 테스트로 Better Auth 설정에 프론트 origin이 전달되는지 검증했다.
- 수정 후 브라우저에서 회원가입 재시도 시 `/api/auth/sign-up/email`은 `200`, 세션 기반 `/me`는 `200`을 반환했다.
- 회원가입 성공 후 `/app`으로 이동했고, 보호된 `/app/profile`에서 새 사용자 이름이 포함된 프로필 화면을 확인했다.
- 검증 명령은 `bun --filter @workspace/api test`, `bun --filter @workspace/api typecheck`, `bun --filter @workspace/api lint`를 실행했다. 린트는 기존 `turbo/no-undeclared-env-vars` 경고 2건만 남고 종료 코드 0을 반환했다.

## 2026-05-27 구글 로그인 시작

- 백엔드 Better Auth Google provider 설정을 유지하고, 웹 로그인/회원가입 화면에서 Google OAuth 시작 액션을 추가한다.
- Google OAuth 완료 후에는 기존 이메일 인증과 동일하게 `next` 쿼리로 보정된 `/app...` 경로로 복귀한다.
- 공식 Better Auth 클라이언트의 `signIn.social` 흐름을 사용해 OAuth 요청 URL과 리다이렉트 처리를 직접 조립하지 않는다.

## 2026-05-27 구글 로그인 완료

- `apps/web`에 `better-auth` 클라이언트 의존성을 명시하고, 로그인/회원가입 화면에 `Google로 계속하기` 버튼을 추가했다.
- Google OAuth 시작 시 API origin과 웹 origin이 다른 구조를 고려해 `callbackURL`을 현재 웹 origin이 포함된 절대 URL로 전달한다.
- `next` 쿼리는 기존 `getSafeNextPath` 보정을 그대로 사용해 `/app...` 내부 경로만 Google 로그인 후 복귀 대상으로 허용한다.
- 회귀 테스트로 Google social auth 호출 대상, callback URL 보정, 안전하지 않은 callback fallback을 검증했다.
- 검증 명령은 `bun --filter @workspace/web test`, `bun --filter @workspace/web typecheck`, `bun --filter @workspace/web lint`, `bun --filter @workspace/web build`를 실행했다.
- 인앱 브라우저에서 `/login?next=%2Fapp%2Fcourses` 화면의 Google 로그인 버튼과 회원가입 링크 렌더링을 확인했다.

## 2026-05-27 프로토타입 데이터 참조 조사 완료

- 회원가입 후 홈에서 기존 진행 중 코스가 보이는 원인을 확장해, `apps/web` 런타임의 로컬 프로토타입 데이터 참조를 조사했다.
- 상세 결과는 `docs/frontend-prototype-data-audit.md`에 기록했다.
- 홈 화면은 API를 호출하지 않고 `inProgressCourses` 정적 배열을 직접 렌더링하는 확정 문제다.
- 당시 서버와 브라우저 API 클라이언트의 기본값이 각각 fake라서, 실제 API 검증 시 `WEB_API_MODE=http`와 `NEXT_PUBLIC_API_MODE=http`를 함께 지정해야 했다.

## 2026-05-27 API 모드 실제 데이터 전환 완료

- `WritingAppApi`에 진행 목록 조회를 추가하고 HTTP 어댑터가 백엔드 `/progress`를 호출하도록 연결했다.
- `/app` 홈은 진행 목록과 코스 상세를 API 포트에서 가져오며, 새 사용자처럼 진행 목록이 없으면 빈 상태를 렌더링한다.
- 당시 코스 상세 metadata/static params와 레슨 기본값 fallback의 로컬 데이터 참조는 fake 모드에서만 동적 import하도록 제한했다.
- API 매퍼가 ID helper만 쓰려고 프로토타입 데이터 모듈을 로드하지 않도록 코스/레슨 ID helper를 별도 파일로 분리했다.
- 당시 API 클라이언트 factory의 fake 어댑터 참조도 동적 import로 바꿔 API 모드에서 fake 카탈로그가 로드되지 않게 했다.

## 2026-05-31 runtime fake 모드 제거 완료

- `getServerWritingAppApi`와 `getBrowserWritingAppApi`는 환경 변수 모드 분기 없이 항상 HTTP 어댑터를 생성한다.
- `WEB_API_MODE`, `NEXT_PUBLIC_API_MODE`, `apps/web/src/lib/api/api-mode.ts`, `dev:fake` 스크립트를 제거했다.
- 코스 상세 `generateStaticParams`는 빈 배열을 반환하고, metadata는 API 조회 결과로만 만든다.
- 레슨 라우트는 `lesson_id`가 없을 때 로컬 기본 레슨으로 대체하지 않고 not found로 처리한다.
- fake 어댑터는 `createFakeWritingAppApi()`를 직접 import하는 테스트 격리 용도로만 유지한다.

## 2026-05-27 Better Auth와 Next.js 통합 보정 시작

- 로그인 후 앱을 다시 방문하면 세션이 사라진 것처럼 보이는 문제를 조사한다.
- 원인 후보는 브라우저 인증 요청이 API origin으로 직접 전송되어 세션 쿠키가 웹 앱 origin과 분리되는 구조다.
- 목표는 인증 진입점을 웹 앱의 `/api/auth/*` same-origin 경로로 고정하고, Next.js route handler가 백엔드 Better Auth 핸들러로 요청을 프록시하도록 보정하는 것이다.

## 2026-05-27 Better Auth와 Next.js 통합 보정 완료

- 로그인과 회원가입 요청의 기본 대상은 웹 앱 same-origin `/api/auth/*`로 변경했다.
- `apps/web`에 `/api/auth/[...path]` route handler를 추가해 Next.js가 백엔드 API의 Better Auth 핸들러로 인증 요청을 프록시한다.
- 프록시 요청은 원래 웹 origin을 `x-forwarded-host`, `x-forwarded-proto`로 전달하고, API의 Better Auth 설정은 `trustedProxyHeaders`를 활성화한다.
- 이 구조에서는 Better Auth의 `Set-Cookie`가 브라우저 기준 웹 앱 origin에 저장되어, `/app` 재방문 시 Next 서버가 `cookies()`로 세션 쿠키를 읽고 `/me` 검증에 전달할 수 있다.
- 회귀 테스트는 same-origin 인증 URL 기본값, 프록시의 `Set-Cookie` 보존, API의 프록시 헤더 신뢰 설정을 검증한다.
- 로컬 스모크 테스트에서 `http://localhost:3000/api/auth/sign-up/email` 회원가입이 `200`을 반환했고, 저장된 쿠키로 `http://localhost:3000/app/profile`이 `200`을 반환하며 사용자 이름을 렌더링했다.

## 2026-05-27 인증 페이지 재방문 리다이렉트 보정 시작

- 로그인된 사용자가 `/login` 또는 `/signup`을 다시 방문해도 인증 폼이 보이는 문제를 보정한다.
- 인증 페이지 서버 컴포넌트에서 현재 세션을 확인하고, 세션이 있으면 안전한 `next` 경로 또는 `/app`으로 즉시 이동하게 한다.

## 2026-05-27 인증 페이지 재방문 리다이렉트 보정 완료

- `getAuthenticatedAppRedirectPath`를 추가해 현재 사용자 세션이 있으면 안전한 앱 내부 경로를 반환하게 했다.
- `/login`과 `/signup` 서버 컴포넌트는 렌더링 전에 서버 API로 현재 사용자를 확인하고, 인증된 사용자는 폼 대신 `next` 또는 `/app`으로 redirect한다.
- 회귀 테스트는 인증된 사용자, 비인증 사용자, 외부 `next` 경로 보정 케이스를 검증한다.
- 로컬 스모크 테스트에서 세션 쿠키가 있는 상태의 `/login?next=%2Fapp%2Fcourses`는 `307 /app/courses`, `/signup?next=%2Fapp%2Fprofile`은 `307 /app/profile`을 반환했다.
