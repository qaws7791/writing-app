# 런타임 설정

이 문서는 포트, 환경 변수, 로컬/운영 기본값, 비밀값 정책을 설명하는 단일 진실 원천이다.

## 기준

- 기준일: 2026-06-19
- 기준 파일:
  - `packages/env/src/parse-env.ts`
  - `packages/env/src/local-runtime-defaults.ts`
  - `apps/api/src/config/env.ts`
  - `apps/admin-api/src/env.ts`
  - `apps/web/src/runtime-config.ts`
  - `apps/admin/src/runtime-config.ts`
  - `turbo.json`
  - `apps/*/.env.example`

## 로컬 표준 포트

| 앱         | 포트   | 변수             |
| ---------- | ------ | ---------------- |
| 학습자 웹  | `3000` | Next.js 기본     |
| 학습자 API | `4000` | `API_PORT`       |
| 어드민 웹  | `3001` | Next.js script   |
| 어드민 API | `4001` | `ADMIN_API_PORT` |

로컬 기본 URL은 `packages/env/src/local-runtime-defaults.ts`에서 정의한다.

## 공통 환경 변수 파서

`@workspace/env`의 `parseEnv()`가 공통 schema를 제공한다.

주요 변수:

- `NODE_ENV`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_COOKIE_DOMAIN`
- `ADMIN_BETTER_AUTH_COOKIE_DOMAIN`
- `DATABASE_URL`
- `API_PORT`
- `ADMIN_API_PORT`
- `WEB_ORIGIN`
- `ADMIN_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## 학습자 API 설정

파일: `apps/api/src/config/env.ts`

| 변수                        | 필수       | 기본값                         | 설명                                       |
| --------------------------- | ---------- | ------------------------------ | ------------------------------------------ |
| `BETTER_AUTH_SECRET`        | 필수       | 없음                           | 학습자 Better Auth 비밀값                  |
| `BETTER_AUTH_URL`           | 선택       | `http://localhost:${API_PORT}` | 학습자 API 인증 기준 URL                   |
| `BETTER_AUTH_COOKIE_DOMAIN` | 선택       | 없음                           | cross-subdomain 쿠키 domain                |
| `DATABASE_URL`              | 선택       | `data/api.sqlite`              | SQLite 경로                                |
| `API_PORT`                  | 선택       | `4000`                         | API listen port                            |
| `WEB_ORIGIN`                | 선택       | `http://localhost:3000`        | 학습자 웹 origin                           |
| `CORS_ORIGIN`               | 선택 alias | 없음                           | 첫 origin을 `WEB_ORIGIN` fallback으로 사용 |
| `GOOGLE_CLIENT_ID`          | 선택       | 없음                           | Google OAuth client id                     |
| `GOOGLE_CLIENT_SECRET`      | 선택       | 없음                           | Google OAuth 비밀값                        |
| `OPENAI_API_KEY`            | 선택       | 없음                           | OpenAI API key                             |
| `OPENAI_MODEL`              | 선택       | `gpt-5.2`                      | AI 피드백 모델                             |

## 학습자 웹 설정

파일: `apps/web/src/runtime-config.ts`

| 변수                       | 기본값                  | 설명                                |
| -------------------------- | ----------------------- | ----------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | 브라우저에서 호출할 학습자 API      |
| `WEB_API_BASE_URL`         | `http://localhost:4000` | 서버 컴포넌트에서 호출할 학습자 API |

base URL은 trailing slash를 제거해 정규화한다. endpoint URL은 `buildApiUrl()`로 만든다.

## 어드민 API 설정

파일: `apps/admin-api/src/env.ts`

| 변수                              | 필수           | 기본값                               | 설명                            |
| --------------------------------- | -------------- | ------------------------------------ | ------------------------------- |
| `ADMIN_BETTER_AUTH_SECRET`        | 권장           | 없음                                 | 관리자 Better Auth 비밀값 alias |
| `BETTER_AUTH_SECRET`              | 필수 canonical | 없음                                 | 파서 내부 canonical 비밀값      |
| `ADMIN_BETTER_AUTH_URL`           | 선택 alias     | 없음                                 | 관리자 인증 기준 URL alias      |
| `BETTER_AUTH_URL`                 | 선택 canonical | `http://localhost:${ADMIN_API_PORT}` | parser 내부 canonical URL       |
| `ADMIN_BETTER_AUTH_COOKIE_DOMAIN` | 선택           | 없음                                 | 관리자 cookie domain            |
| `BETTER_AUTH_COOKIE_DOMAIN`       | 선택 fallback  | 없음                                 | cookie domain fallback          |
| `DATABASE_URL`                    | 선택           | `data/api.sqlite`                    | SQLite 경로                     |
| `ADMIN_API_PORT`                  | 선택           | `4001`                               | 어드민 API listen port          |
| `ADMIN_ORIGIN`                    | 선택           | `http://localhost:3001`              | 어드민 웹 origin                |
| `ADMIN_CORS_ORIGIN`               | 선택 alias     | 없음                                 | `ADMIN_ORIGIN` fallback         |

관리자 비밀값은 학습자 비밀값과 같은 값을 사용하지 않는다.

## 어드민 웹 설정

파일: `apps/admin/src/runtime-config.ts`

| 변수                 | 기본값                  | 설명           |
| -------------------- | ----------------------- | -------------- |
| `ADMIN_API_BASE_URL` | `http://localhost:4001` | 어드민 API URL |

base URL은 trailing slash를 제거해 정규화한다. endpoint URL은 `buildAdminApiUrl()`로 만든다.

## Turbo 환경 변수

`turbo.json`의 `globalEnv`는 task cache와 실행에 영향을 주는 환경 변수를 선언한다. 새 runtime env를 추가하면 여기도 함께 갱신한다.

`build` task output은 패키지 산출물 `dist/**`와 Next.js 산출물 `.next/**`를 포함하되, 재사용하면 안 되는 `.next/cache/**`는 제외한다. coverage, `.turbo`, `.next`, `dist` 같은 산출물과 캐시는 `.gitignore` 기준으로 Git에 포함하지 않는다.

현재 포함 예:

- API/auth origin 관련 변수
- Better Auth 비밀값/url/cookie domain
- DB reset 관련 변수
- `DATABASE_URL`
- `NODE_ENV`
- 웹/API base URL

## `.env.example` 정책

- 실제 비밀값을 넣지 않는다.
- placeholder는 명확히 쓴다.
- 선택 변수는 주석 처리한다.
- 앱별 `.env`는 해당 앱 디렉터리 기준으로 읽힌다.

## 설정 변경 체크리스트

- parser schema를 갱신했는가?
- 앱별 env 변환에서 alias와 기본값을 처리했는가?
- `.env.example`을 갱신했는가?
- `turbo.json.globalEnv`를 갱신했는가?
- 보안 문서와 운영 문서를 갱신했는가?
- 테스트에서 기본 URL과 trailing slash 정규화를 확인했는가?
