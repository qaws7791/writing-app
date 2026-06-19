# 기술 스택

이 문서는 writing-app에서 채택한 기술 스택, 버전 정책, 선택 근거를 설명하는 단일 진실 원천이다.

## 기준

- 기준일: 2026-06-19
- 기준 파일: 루트 `package.json`, 각 workspace `package.json`, `turbo.json`, `vitest.workspace.ts`

## 런타임과 패키지 관리

| 항목        | 현재 값                | 정책                                                                     |
| ----------- | ---------------------- | ------------------------------------------------------------------------ |
| Node.js     | `24.x`                 | 루트 `engines.node`를 기준으로 고정한다.                                 |
| Bun         | `1.3.10`               | 루트 `packageManager`를 기준으로 고정한다.                               |
| Workspace   | `apps/*`, `packages/*` | Bun workspace로 관리한다.                                                |
| 작업 실행기 | Turbo `^2.8.8`         | `build`, `dev`, `test`, `typecheck`, `lint`를 workspace 단위로 실행한다. |

패키지 매니저와 workspace 정책의 단일 출처는 루트 `package.json`이다. npm 설정이 실제로 필요하지 않으면 빈 `.npmrc` placeholder를 두지 않는다.

## 프론트엔드

| 기술         | 버전                | 사용 위치                    | 선택 근거                                             |
| ------------ | ------------------- | ---------------------------- | ----------------------------------------------------- |
| Next.js      | `16.2.5`            | `apps/web`, `apps/admin`     | App Router 기반 서버/클라이언트 경계를 명시하기 쉽다. |
| React        | `19.2.4`            | 웹 앱, 어드민, UI 패키지     | Next.js 16과 맞춘 UI 런타임이다.                      |
| Tailwind CSS | `^4` 또는 `^4.1.18` | 웹 앱, 어드민, UI, Storybook | 디자인 토큰과 UI primitive 스타일을 빠르게 공유한다.  |
| Base UI      | `^1.4.0`            | `packages/ui`                | 접근성 있는 headless UI primitive 기반을 제공한다.    |
| lucide-react | `^1.8.0`            | 앱, UI, Storybook            | 일관된 아이콘 시스템을 제공한다.                      |

`packages/ui`의 primitive는 shadcn/Base UI 파일 관례를 따르지만, 런타임 dependency는 현재 source 또는 stylesheet에서 직접 import하는 패키지만 둔다.

## 백엔드

| 기술                | 버전      | 사용 위치                                     | 선택 근거                                                        |
| ------------------- | --------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Hono                | `^4.10.0` | `apps/api`, `apps/admin-api`, `packages/hono` | Bun 런타임에서 작은 HTTP transport 경계를 만든다.                |
| `@hono/zod-openapi` | `^1.4.0`  | `apps/api`, `packages/hono`                   | route 정의와 OpenAPI 생성을 같은 위치에 둔다.                    |
| `hono-openapi`      | `^1.1.0`  | `apps/admin-api`                              | 어드민 API 의존성에 남아 있다.                                   |
| Zod                 | `^4.2.0`  | 전 영역                                       | 런타임 validation과 DTO schema를 명시한다.                       |
| Better Auth         | `^1.6.0`  | 인증                                          | 학습자 Google OAuth와 관리자 ID/password 인증을 분리해 조립한다. |
| OpenAI SDK          | `^6.39.0` | `packages/core`                               | AI 피드백 provider adapter에서 사용한다.                         |

## 데이터

| 기술        | 버전                  | 사용 위치                                             | 선택 근거                                              |
| ----------- | --------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| SQLite      | Bun 내장 `bun:sqlite` | 로컬/운영 DB                                          | 초기 운영 복잡도를 낮추고 단일 파일 백업으로 시작한다. |
| Drizzle ORM | `^0.45.0`             | `packages/db`, `packages/core`, `apps/admin-api` 조립 | schema와 query를 TypeScript로 명시한다.                |
| drizzle-kit | `^0.31.0`             | `packages/db` devDependency                           | Drizzle 관련 개발 도구로 유지한다.                     |

## 테스트와 품질 도구

| 기술            | 버전                                                 | 용도                           |
| --------------- | ---------------------------------------------------- | ------------------------------ |
| Vitest          | `^4.1.x`                                             | 단위/통합 테스트               |
| Testing Library | React `^16.3.2`, DOM `^10.4.1`, user-event `^14.6.1` | 사용자 관점 UI 테스트          |
| jsdom           | `^29.x`                                              | React 테스트 DOM 환경          |
| Playwright      | `^1.58.2`                                            | 브라우저 검증이 필요할 때 사용 |
| Oxlint          | `^1.70.0`                                            | lint                           |
| Oxfmt           | `^0.55.0`                                            | formatting                     |
| Lefthook        | `^2.1.3`                                             | Git hook                       |

## 버전 고정 정책

- Node와 Bun은 루트 선언을 기준으로 맞춘다.
- TypeScript는 대부분 `5.9.3`으로 고정한다.
- Next.js, React, React DOM은 앱 단위에서 같은 버전을 사용한다.
- 새 의존성은 앱 또는 패키지의 책임 경계 안에서만 추가한다.
- 한 기능 때문에 루트 공통 의존성으로 승격하지 않는다.
- `Kwep/`의 의존성은 제품 스택 판단에 포함하지 않는다.
- workspace package의 runtime dependency는 해당 workspace source, stylesheet, 또는 명시적 script에서 직접 사용하는 경우에만 둔다.

## 의존성 추가 기준

새 dependency는 다음 질문을 통과해야 한다.

- 이미 workspace 안의 패키지나 표준 라이브러리로 해결할 수 없는가?
- 런타임 경계를 넓히지 않는가?
- 보안 업데이트와 transitive dependency 비용을 감당할 수 있는가?
- 제거하거나 대체하기 쉬운 위치에 격리되는가?
- 문서와 테스트에서 새 선택의 이유를 확인할 수 있는가?

## 금지 또는 지양

- 백엔드 DB 접근을 프론트엔드로 끌어올리지 않는다.
- `apps/api`에서 `@workspace/db` 또는 Drizzle을 직접 import하지 않는다.
- 같은 목적의 utility 패키지를 중복 생성하지 않는다.
- 단일 앱에서만 필요한 의존성을 루트 정책처럼 문서화하지 않는다.
