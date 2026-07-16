# 패키지 Interface와 import 규칙

## 작업 상태

- 2026-07-16: 학습자 웹의 generated OpenAPI 타입 경로를 제거하고 `@workspace/contracts/learning` 직접 소비 경로로 전환했다.
- 2026-07-12: `packages/core`, `packages/ui`, `packages/env` 공개 Interface와 패키지 내부 import 규칙 정비를 완료했다.

## 완료 결과

- core 공개 export를 8개 canonical Interface로 축소하고 repository Implementation은 `admin-api-core` composition 뒤에 숨겼다.
- `@workspace/core/auth`는 session과 status 계약만 공개하며 learner profile Drizzle factory, repository port와 Better Auth hook factory를 공개하지 않는다.
- UI와 env root barrel 및 호환 pass-through를 제거하고 모든 소비자를 좁은 subpath로 이관했다.
- core·UI·Hono·env·Storybook 내부 import를 package별 private alias로 통일했다.
- export snapshot과 relative/self/deep import negative 검사를 pre-commit에 연결했다.
- Bun 1.3.10 기준 전체 workspace typecheck가 통과한다.
- Bun 1.3.10 기준 전체 14개 test task가 통과한다.
- Storybook production build는 성공했고 story별 subpath chunk와 `workspace-ui` chunk가 생성되는 것을 확인했다.

## 공개 Interface 원칙

- 패키지 소비자는 `package.json`의 명시적인 subpath export만 import한다.
- root barrel은 제공하지 않는다. 기능 또는 UI primitive 단위의 좁은 subpath를 사용한다.
- `packages/core`의 canonical 경로는 `@workspace/core/<module>`이다. `modules/*`, `shared/*`, repository Implementation 경로는 외부에 공개하지 않는다.
- `packages/ui`는 `@workspace/ui/components/ui/<name>`, `@workspace/ui/components/lesson/<name>`, `@workspace/ui/lib/<name>`처럼 소유 module이 드러나는 경로를 사용한다.
- `packages/env`는 parser와 로컬 기본값을 각각 `@workspace/env/parse-env`, `@workspace/env/local-runtime-defaults`에서 제공한다. client runtime config는 parser를 import하지 않는다.
- 학습자 HTTP request·response·오류 타입은 `@workspace/contracts/learning`에서만 가져오며 generated OpenAPI 타입과 `writing-app-api-contract` 중간 계층을 만들지 않는다.

## 내부 import 원칙

- workspace 간 import는 `@workspace/*` 공개 subpath를 사용한다.
- `packages/core`, `packages/ui`, `packages/hono`, `packages/env` 내부 Implementation은 각 package 이름이 드러나는 `#core/*`, `#ui/*`, `#hono/*`, `#env/*` private alias를 사용한다.
- TypeScript source를 직접 소비하는 앱은 의존 패키지의 private alias를 해석하기 위한 mapping만 tsconfig에 둔다. 앱 코드는 이 alias를 import하지 않는다.
- `apps/storybook` 내부 module은 tsconfig와 Vite가 함께 소유하는 `#storybook/*` private alias를 사용하고, builder가 먼저 읽는 설정 module은 package `imports`로 고정한다.
- 같은 패키지의 공개 `@workspace/*` 경로를 Implementation이 역참조하거나 상대 경로로 우회하지 않는다.

## 자동 검증

- package export snapshot은 허용된 공개 subpath가 의도 없이 늘어나는 것을 막고 auth facade의 concrete 구현 re-export를 거부한다.
- import architecture 검사는 내부 상대 import, 자기 공개 경로 역참조, 외부의 `core` Implementation deep import와 root barrel import를 거부한다.
- `bun run check:package-interfaces`, package test, typecheck와 `bun run check:import-cycles`를 함께 실행한다.
