# 런타임 설정

이 문서는 포트, 환경 변수, 로컬/운영 기본값, 비밀값 정책을 설명하는 단일 진실 원천이다.

## 기준

- 기준일: 2026-07-16
- 기준 파일:
  - `package.json`
  - `scripts/setup.ts`
  - `scripts/doctor.ts`
  - `scripts/local-onboarding.ts`
  - `apps/admin-api/package.json`
  - `apps/admin-api/src/dev-environment.ts`
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

## 로컬 자동 준비와 진단

`bun run setup`은 clean clone의 로컬 준비를 담당하는 멱등적 진입점이다. 다음 순서를 유지한다.

1. `check:toolchain`으로 Bun exact version과 Node.js major를 확인한다.
2. `bun install --frozen-lockfile`로 dependency를 설치한다.
3. 네 앱의 `.env`가 없을 때만 대응하는 `.env.example`에서 생성한다.
4. 새 학습자·관리자 API 환경 파일에 서로 다른 32-byte 난수 인증 비밀값을 넣는다.
5. 새 어드민 API 환경 파일에 강한 난수 seed 비밀번호를 넣고 반복 setup이 기존 credential hash를 재설정하지 않도록 `ADMIN_SEED_RESET_PASSWORD=false`로 둔다.
6. 기존 `dev:app:setup`, `dev:admin:setup`을 재사용해 migration과 seed를 실행한다.
7. `bun run doctor`로 최종 상태를 검사한다.

기존 `.env`는 내용이 잘못되었더라도 자동으로 수정하거나 덮어쓰지 않는다. 이 경우 setup은 진단 또는 기존 앱별 parser·seed validation에서 실패하고 사용자가 파일을 명시적으로 고쳐야 한다. 생성한 credential 원문은 setup log에 출력하지 않으며 관리자 로그인 값은 로컬 `apps/admin-api/.env`에서만 확인한다.

`bun run doctor`는 파일이나 DB를 변경하지 않고 다음을 확인한다.

- 현재 Bun·Node.js와 root manifest의 toolchain 계약
- dependency 설치 여부와 네 앱의 `.env` 존재 여부
- 학습자·관리자 인증 비밀값의 최소 길이, placeholder 여부와 상호 분리
- `apps/api`와 `apps/web`의 `ENABLE_TEST_AUTH` 일치
- 두 API의 `DATABASE_URL`이 같은 file-backed SQLite 파일을 가리키는지와 파일 존재 여부

doctor는 비밀값 원문을 출력하지 않는다. DB schema와 seed 내용의 정확성은 doctor에 중복 구현하지 않고 기존 migration·seed와 DB 테스트가 소유한다.

학습자 API 개발 명령은 저장소 루트에서 실행되므로 `apps/api/.env`의 로컬 DB 값은 `file:data/api.sqlite`를 사용한다. 어드민 API watcher는 아래의 개발 감시 계약대로 `apps/admin-api/.env`의 `file:../../data/api.sqlite`를 앱 디렉터리 기준 절대 경로로 정규화한다. doctor는 이 두 runtime 경계를 각각 적용한 뒤 같은 저장소 루트 DB인지 비교한다.

## 공통 환경 변수 파서

`@workspace/env/parse-env`의 `parseEnv()`가 공통 schema를 제공한다.

주요 변수:

- `NODE_ENV`
- `BETTER_AUTH_SECRET`
- `ADMIN_BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `ADMIN_BETTER_AUTH_URL`
- `BETTER_AUTH_COOKIE_DOMAIN`
- `ADMIN_BETTER_AUTH_COOKIE_DOMAIN`
- `DATABASE_URL`
- `API_PORT`
- `ADMIN_API_PORT`
- `WEB_ORIGIN`
- `ADMIN_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ENABLE_TEST_AUTH`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## 운영 환경 fail-closed 계약

`NODE_ENV=production`에서는 로컬 기본값으로 보완하지 않고 다음 설정을 프로세스 시작 전에 검증한다. 하나라도 누락되거나 조건에 맞지 않으면 API는 listen 또는 DB 연결 전에 종료한다.

| 구분          | 필수 변수                                  | 운영 조건                                              |
| ------------- | ------------------------------------------ | ------------------------------------------------------ |
| 공개 origin   | `WEB_ORIGIN`, `ADMIN_ORIGIN`               | `https`이며 localhost 또는 loopback이 아님             |
| 인증 기준 URL | `BETTER_AUTH_URL`, `ADMIN_BETTER_AUTH_URL` | `https`이며 localhost 또는 loopback이 아님             |
| 데이터베이스  | `DATABASE_URL`                             | 명시적으로 설정하며 in-memory DB가 아님                |
| 학습자 비밀값 | `BETTER_AUTH_SECRET`                       | 32자 이상, placeholder가 아니며 충분한 엔트로피를 가짐 |
| 관리자 비밀값 | `ADMIN_BETTER_AUTH_SECRET`                 | 학습자 비밀값과 다르고 동일한 강도 조건을 만족함       |
| 테스트 인증   | `ENABLE_TEST_AUTH`                         | `false`                                                |

쿠키 domain을 설정하면 학습자 domain은 `WEB_ORIGIN`, 관리자 domain은 `ADMIN_ORIGIN`의 host 범위와 일치해야 한다. 개발과 테스트에서는 localhost URL과 `ENABLE_TEST_AUTH=true`를 계속 사용할 수 있다.

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
| `ENABLE_TEST_AUTH`          | 선택       | `false`                        | 로컬 자동화용 학습자 테스트 인증 활성화    |
| `OPENAI_API_KEY`            | 선택       | 없음                           | OpenAI API key                             |
| `OPENAI_MODEL`              | 선택       | `gpt-5.2`                      | AI 피드백 모델                             |

## 학습자 웹 설정

파일: `apps/web/src/runtime-config.ts`, `apps/web/src/runtime-config-server.ts`

| 변수                       | 기본값                  | 설명                                |
| -------------------------- | ----------------------- | ----------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | 브라우저에서 호출할 학습자 API      |
| `WEB_API_BASE_URL`         | `http://localhost:4000` | 서버 컴포넌트에서 호출할 학습자 API |
| `ENABLE_TEST_AUTH`         | `false`                 | 로컬 자동화용 테스트 로그인 버튼    |

base URL은 trailing slash를 제거해 정규화한다. endpoint URL은 `buildApiUrl()`로 만든다.
테스트 인증은 `NODE_ENV=production`에서는 `ENABLE_TEST_AUTH=true`여도 비활성화한다.

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

## 어드민 로컬 seed 설정

`bun run dev:admin:setup`은 최종 자료실 schema를 포함한 baseline migration, 콘텐츠 seed, 관리자 seed를 순서대로 실행한다. 별도 자료실 전환 migration은 없다. 관리자 credential은 `apps/admin-api/.env`에 명시해야 하며 기본 이메일과 비밀번호 fallback은 없다.

| 변수                               | 필수 조건        | 설명                                       |
| ---------------------------------- | ---------------- | ------------------------------------------ |
| `ADMIN_SEED_EMAIL`                 | 필수             | seed owner 이메일                          |
| `ADMIN_SEED_NAME`                  | 선택             | 관리자 이름, 기본값 `관리자`               |
| `ADMIN_SEED_PASSWORD`              | 필수             | 16자 이상, 세 종류 이상 문자군의 비밀번호  |
| `ADMIN_SEED_RESET_PASSWORD`        | 선택             | `true`이면 기존 credential 비밀번호 재설정 |
| `ADMIN_SEED_PRODUCTION_APPROVED`   | 운영 필수 `true` | 운영 seed 명시적 승인                      |
| `ADMIN_SEED_EXPECTED_DATABASE_URL` | 운영 필수        | 실제 `DATABASE_URL`과 같은 대상 확인값     |

`bun --filter @workspace/admin-api seed:admin`을 직접 실행하면 `ADMIN_SEED_RESET_PASSWORD=true`를 명시하지 않는 한 기존 credential 비밀번호를 보존한다. 운영 seed와 관리자 인증 감사·세션 폐기 절차는 `admin-auth-security-operations.md`를 따른다.

## 어드민 로컬 개발 감시

2026-07-13 변경 단위 3 단계 7을 완료했다. 일회성 DB setup과 장기 실행 watcher의 명령 경계를 분리하고, Windows·Linux에서 시작·workspace 변경 감지·process tree 종료를 검증하는 lifecycle smoke를 추가했다.

`bun run dev:admin:setup`은 migration·콘텐츠 seed·관리자 seed를 실행하는 일회성 명령이다. `bun run dev:admin`은 DB를 변경하지 않고 Turbo로 어드민 웹과 어드민 API의 장기 실행 process만 시작한다. 어드민 웹 내부 변경은 Next.js watcher가 처리하고, 어드민 API는 Bun watcher가 workspace source 변경을 감지해 프로세스를 재시작한다. 이 Interface는 `dev:app:setup`과 `dev:app`의 분리 규칙과 같다.

어드민 API Bun watcher는 저장소 루트에서 실행해 `apps/admin-api`와 import한 `packages/*` source를 함께 감시한다. `.env`는 `apps/admin-api/.env`를 명시적으로 읽고 preload에서 상대 `DATABASE_URL`만 `apps/admin-api` 기준 절대 경로로 정규화한다. Bun 작업 디렉터리는 저장소 루트로 유지한다.

`bun run test:admin-dev-lifecycle`은 disposable DB와 `packages/env` 아래 전용 fixture를 사용한다. 어드민 API와 웹의 readiness, fixture 변경에 따른 API 재시작 정확히 1회, Bun project directory 경고 부재, 종료 후 3001·4001 port와 Next lock 해제를 검증한다. `ADMIN_DEV_LIFECYCLE_FIXTURE`는 이 smoke 전용 변수이며 사용자 runtime 설정이 아니다.

Bun `1.3.10`의 Windows runtime에서는 `Bun.Terminal` PTY를 사용할 수 없음을 로컬 검증했다. 따라서 lifecycle Adapter는 POSIX에서 분리된 process group에 `SIGINT`를 보내고, Windows에서는 harness가 시작해 PID를 기록한 root process tree에만 `taskkill /T /F`를 적용한다. 실패 정리도 기록한 소유 PID만 대상으로 하며 이름이나 port만으로 다른 process를 종료하지 않는다. 이는 대상 버전의 검증된 platform 제약이며 Bun 버전 변경 시 재확인이 필요하다.

## 어드민 웹 설정

파일: `apps/admin/src/runtime-config.ts`, `apps/admin/src/runtime-config-server.ts`

| 변수                             | 기본값                  | 설명                               |
| -------------------------------- | ----------------------- | ---------------------------------- |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | `http://localhost:4001` | 브라우저가 호출할 어드민 API URL   |
| `NEXT_PUBLIC_LEARNER_WEB_ORIGIN` | `http://localhost:3000` | 어드민에서 이동할 학습자 웹 origin |
| `ADMIN_API_BASE_URL`             | `http://localhost:4001` | 서버가 호출할 내부 어드민 API URL  |
| `ADMIN_ORIGIN`                   | `http://localhost:3001` | 서버 API 요청 origin과 CSP 기준    |

base URL은 trailing slash를 제거해 정규화한다. endpoint URL은 `buildAdminApiUrl()`로 만든다.
브라우저 reader는 공개 `NEXT_PUBLIC_ADMIN_API_BASE_URL`만 읽고, 서버 reader는 비공개 `ADMIN_API_BASE_URL`만 읽는다. development 기본값은 `@workspace/env/local-runtime-defaults`를 사용하며 SSR 중 `window`를 읽지 않는다.
어드민 웹은 `ADMIN_DEV_SESSION_TOKEN` 같은 자동 세션 주입 환경 변수를 지원하지 않는다. 로컬 개발은 seed 관리자 로그인, 학습자 브라우저 자동화는 `ENABLE_TEST_AUTH=true`를 사용한다.

`bun run dev:admin`은 서버를 열기 전에 `check:toolchain`을 실행한다. 저장소 고정 버전인 Bun 1.3.10과 다르면 요구 버전과 실행 버전을 출력하고 종료한다.

## 프론트엔드 보안 header 설정

- 웹 앱의 `NEXT_PUBLIC_API_BASE_URL`과 어드민 앱의 `NEXT_PUBLIC_ADMIN_API_BASE_URL` origin은 각 앱 CSP의 `connect-src`에 반영된다.
- `CSP_REPORT_ONLY`는 기본 `false`다. staging 위반 수집 또는 enforcement 회귀 rollback에서만 `true`로 빌드하고, 정상화 뒤 `false`로 다시 배포한다.
- production build는 브라우저 공개 API URL과 학습자 웹 origin이 비어 있을 때 localhost 기본값으로 후퇴하지 않고 실패한다.
- production 빌드는 HSTS와 공통 보안 header를 적용하고 `X-Powered-By`를 노출하지 않는다.
- API origin을 변경할 때 CORS·trusted origin과 프론트엔드 CSP가 같은 배포 구성을 가리키는지 함께 검증한다.

## Turbo 환경 변수

2026-07-13 변경 전 기준선에서 `GITHUB_STEP_SUMMARY` 값만 바꿔도 `lint`, `typecheck`, `build`의 48개 task hash가 모두 달라졌다. 단계 5 완료 후에는 변경되는 hash가 없고, `WEB_ORIGIN` 변경은 `@workspace/web#build` hash 하나만 바꾼다.

root `turbo.json`은 모든 task에 필요한 `CI`만 `globalPassThroughEnv`로 전달하며 값은 cache hash에 포함하지 않는다. 앱과 패키지는 자신의 `turbo.json`에서 다음 책임을 소유한다.

- web과 admin `build`는 실제 production 산출물에 반영되는 URL, CSP, 테스트 인증 변수를 `env`로 선언한다.
- 앱 `dev`와 DB·운영 보조 task는 실행에만 필요한 값을 `passThroughEnv`로 선언한다.
- root CI 보조 스크립트의 `GITHUB_STEP_SUMMARY`는 Turborepo task 밖에서 소비하므로 Turbo 환경 변수 계약에 포함하지 않는다.
- 자료실 부하 suite의 실행 횟수와 artifact 경로는 `packages/core`의 전용 load task만 전달받는다.

`build` task output은 패키지 산출물 `dist/**`와 Next.js 산출물 `.next/**`를 포함하되, 재사용하면 안 되는 `.next/cache/**`는 제외한다. coverage, `.turbo`, `.next`, `dist` 같은 산출물과 캐시는 `.gitignore` 기준으로 Git에 포함하지 않는다.
`tsc --noEmit`만 실행하는 admin-api `build`는 output을 빈 배열로 override해 존재하지 않는 산출물 경고를 만들지 않는다.

## `.env.example` 정책

- 실제 비밀값을 넣지 않는다.
- placeholder는 명확히 쓴다.
- 선택 변수는 주석 처리한다.
- 앱별 `.env`는 해당 앱 디렉터리 기준으로 읽힌다.
- 로컬 setup은 누락된 `.env`만 생성하고 기존 파일을 덮어쓰지 않는다.
- 자동 생성한 credential은 일반 출력이나 Git 추적 파일에 기록하지 않는다.

## 컨테이너 배포 설정

- Next.js의 `NEXT_PUBLIC_*`, `WEB_ORIGIN`, `ADMIN_ORIGIN`, `BETTER_AUTH_URL`은 이미지 build 시점의 공개 URL과 일치해야 한다.
- `NEXT_PUBLIC_*`는 브라우저 bundle에 포함되므로 secret을 전달하지 않는다.
- 컨테이너 런타임 설정은 Ansible이 `/etc/writing-app` 아래의 root 소유 환경 파일로 렌더링한다.
- 운영 SQLite 경로는 두 API와 Litestream에서 `/var/lib/writing-app/api.sqlite`로 통일한다.
- Cloudflare Tunnel token과 R2 secret은 inventory 예시에 넣지 않고 Ansible Vault 또는 실행 시 주입한다.
- 이미지 build 설정과 서버 inventory의 origin이 다르면 배포하지 않고 이미지를 다시 build한다.

## 설정 변경 체크리스트

- parser schema를 갱신했는가?
- 앱별 env 변환에서 alias와 기본값을 처리했는가?
- `.env.example`을 갱신했는가?
- 실제 소비 package의 `turbo.json`에서 hash 입력은 `env`, 실행 전달값은 `passThroughEnv`로 구분했는가?
- 보안 문서와 운영 문서를 갱신했는가?
- 테스트에서 기본 URL과 trailing slash 정규화를 확인했는가?

## 학습자 API 종료 수명주기

학습자 API는 `SIGINT` 또는 `SIGTERM`을 받으면 종료 상태를 한 번만 시작한다. 종료 상태에서 수명주기 fetch 경계에 도착한 신규 요청은 `503 SERVICE_UNAVAILABLE`를 받고, 이미 실행 중인 요청은 응답을 끝낼 때까지 drain한다. 이후 Bun server를 중지하고 `createLearnerApiCore()`가 반환한 `core.close()`를 정확히 한 번 호출해 SQLite 연결을 닫는다.

여러 종료 신호가 연달아 와도 같은 종료 Promise를 재사용한다. server 중지와 core 종료 오류는 `server.shutdown.failed` 로그의 `phase` 필드로 구분한다. 단위 테스트와 실제 child process 신호 smoke test는 `apps/api/src/server-lifecycle.test.ts`, `apps/api/src/server-lifecycle.process.test.ts`에 있다.
