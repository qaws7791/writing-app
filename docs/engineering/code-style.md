# 코드 스타일

이 문서는 네이밍, 포맷, lint, TypeScript 원칙, 금지 패턴을 설명하는 단일 진실 원천이다.

## 기본 원칙

- 명시성을 선호한다.
- 작은 cohesive unit을 만든다.
- 변경 범위를 작게 유지한다.
- domain language를 technical filler보다 우선한다.
- 주석보다 구조와 이름으로 의도를 드러낸다.
- 런타임 경계를 숨기지 않는다.

## 파일과 import

- 파일명은 kebab-case를 사용한다.
- TypeScript import path에는 파일 확장자를 포함하지 않는다.
- workspace 간 import는 `@workspace/*`의 명시적인 공개 subpath를 사용한다.
- canonical DTO와 wire status는 가장 구체적인 `@workspace/contracts/*` 공개 subpath에서, brand ID는 `@workspace/types/ids`에서 직접 import한다. 예상 가능한 실패의 공통 Result API는 `@workspace/kernel/result`를 사용한다.
- 의미, 정책 또는 validation을 추가하지 않는 core 내부 한 줄 forwarding 파일을 만들지 않는다. 외부 호환성이 필요한 capability facade는 canonical contract를 직접 재수출한다.
- 패키지 내부 Implementation은 package별 private alias를 사용한다. `auth`, `core`, `ui`, `env`는 각각 `#auth/*`, `#core/*`, `#ui/*`, `#env/*`, Storybook source는 `#storybook/*`를 사용한다. API 내부 platform과 observability 구현은 `@/*` 앱 alias를 사용한다.
- 패키지 내부에서 자기 `@workspace/*` 공개 Interface를 역참조하거나 상대 경로로 우회하지 않는다.
- 앱 간 상대 import를 만들지 않는다.
- 레거시 실험 디렉터리의 구현 파일은 제품 런타임에서 import하지 않는다.
- `apps/web/src`는 `app`, `features`, `entities`, `shared`, `server` 계층만 사용한다. `app`은 route와 조립, `features`는 사용자 능력, `entities`는 feature 간 안정된 도메인 표현, `shared`는 도메인 중립 코드, `server`는 서버 플랫폼을 소유한다.
- `apps/web`의 feature는 다른 feature 내부를 import하지 않는다. Client Component와 feature UI는 `server` 또는 feature DAL을 import하지 않는다.

## 포맷

- formatter는 Oxfmt다.
- 설정은 루트 `.oxfmtrc.json` 하나만 유지한다.
- 대표 명령:

```bash
bun run format
bun run format:check
```

현재 주요 포맷 설정은 다음과 같다.

- semicolon 없음
- double quote
- trailing comma `es5`
- print width `80`
- line ending `lf`

## Lint

- linter는 Oxlint다.
- 설정은 루트 `.oxlintrc.json` 하나에서 관리한다.
- 대표 명령:

```bash
bun run lint
bun run lint:fix
```

중요 규칙은 다음과 같다.

- `no-console`: error. 단 scripts 영역은 예외다.
- `unused-imports/no-unused-imports`: error.
- `typescript/no-explicit-any`: 기본 warn, 프론트엔드 영역은 error.
- `typescript/no-non-null-assertion`: error.
- `workspace/no-unsafe-unknown-cast`: error.
- import graph와 package dependency 정책은 dependency-cruiser가 소유하며 Oxlint에 중복 구현하지 않는다.

`bun run check:architecture`는 static import, re-export와 dynamic import의 계층 규칙을 검사한다. runtime cycle 판정에서는 type-only edge를 제외하되 계층 경계에서는 type-only 우회도 허용하지 않는다.

## TypeScript

- `strict`를 유지한다.
- `noUncheckedIndexedAccess`를 유지한다.
- `apps/web`은 `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `noFallthroughCasesInSwitch`를 함께 유지한다.
- 도메인 ID와 중요한 값에는 브랜드 타입을 사용한다.
- `any`를 사용하지 않는다.
- `as unknown as T`로 타입 안전성을 우회하지 않는다.
- vague result shape 대신 discriminated union이나 명시적 result variant를 사용한다.
- 약한 `Record<string, unknown>`는 실제 타입을 만들 수 없는 경계에서만 사용한다.

## React와 Next.js

- Client Component는 상호작용 상태가 필요할 때만 사용한다.
- 서버에서 조회 가능한 데이터는 Server Component에서 먼저 처리한다.
- `apps/web/src/app`의 page와 layout은 URL 입력 파싱, 인증·redirect, feature DAL 호출과 화면 조립만 담당한다.
- route 전용 조립은 `_views`, provider 조립은 `app/_providers`에 둔다.
- 내부 이동 UI는 `next/link`의 `Link`를 사용한다.
- 명령형 이동은 로그인 완료, 저장 완료, 모달 종료 같은 이벤트 결과에만 사용한다.
- `window.location.*` 직접 이동은 어드민 인증 source에서 금지한다.
- 버튼에는 명시적 `type`을 둔다.

## API와 DB 경계

- `apps/api`의 composition과 app-owned persistence adapter만 `@workspace/db`와 Drizzle을 import한다. HTTP route와 middleware는 직접 import하지 않는다.
- `packages/infra/auth`의 SQLite adapter factory는 Better Auth vendor 호출을 격리하고 auth schema를 소유한다. API는 제품 profile·role repository를 주입한다.
- `packages/infra/db`는 `@workspace/core`를 import하지 않는다.
- DB row와 API DTO 사이 변환은 repository 또는 mapper 경계에서 수행한다.
- API 응답은 runtime schema나 mapper를 통과한 내부 모델로 화면에 전달한다.

## 주석과 문서화

- 자명한 코드에는 주석을 달지 않는다.
- 복잡한 정책이나 되돌리기 어려운 결정에는 짧은 설명을 둔다.
- 복잡한 public API 또는 도메인 규칙에는 Tsdoc을 사용할 수 있다.
- 문서는 한국어로 작성한다. 기술 고유명사와 코드 식별자는 원문을 유지한다.

## 금지 패턴

- 같은 목적의 utility 중복 생성
- 테스트 실패를 우회하기 위한 조건문 추가
- 죽은 코드 방치
- 관련 없는 대규모 rename 또는 formatting-only 변경
- 제품 소스에서 test fixture import
- 비밀값, token, 비밀번호, 운영 DB 파일 커밋
- 앱과 패키지의 책임을 넘는 import
