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
- 의미, 정책 또는 validation을 추가하지 않는 한 줄 forwarding 파일을 만들지 않는다. 공개 capability는 소유 package의 좁은 subpath에서 직접 제공한다.
- 패키지 내부 Implementation은 package별 private alias를 사용한다. 예를 들어 `auth`, `ui`, `env`는 각각 `#auth/*`, `#ui/*`, `#env/*`를 사용한다. API 내부 composition·foundation route와 제품별 observability adapter는 `@/*` 앱 alias를 사용한다.
- 패키지 내부에서 자기 `@workspace/*` 공개 Interface를 역참조하거나 상대 경로로 우회하지 않는다.
- 앱 간 상대 import를 만들지 않는다.
- 레거시 실험 디렉터리의 구현 파일은 제품 런타임에서 import하지 않는다.
- `apps/web/src`는 `app`, `features`, `entities`, `shared`, `server` 계층만 사용한다. `app`은 route와 조립, `features`는 사용자 능력, `entities`는 feature 간 안정된 도메인 표현, `shared`는 도메인 중립 코드, `server`는 서버 플랫폼을 소유한다.
- `apps/web`의 feature는 다른 feature 내부를 import하지 않는다. Client Component와 feature UI는 `server` 또는 서버 request options 경계를 import하지 않는다.

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

`bun run check:architecture`는 type-only edge를 제외한 runtime cycle, 미선언 dependency, frontend workspace 허용 목록, module domain·application의 framework·DB import와 module private target 접근을 검사한다. 폴더 존재나 frontend app 내부 계층 자체는 정적 정책으로 강제하지 않는다.

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
- `apps/web/src/app`의 page와 layout은 URL 입력 파싱, 인증·redirect, generated client 호출과 화면 조립만 담당한다.
- route 전용 조립은 `_views`, provider 조립은 `app/_providers`에 둔다.
- 내부 이동 UI는 `next/link`의 `Link`를 사용한다.
- 명령형 이동은 로그인 완료, 저장 완료, 모달 종료 같은 이벤트 결과에만 사용한다.
- `window.location.*` 직접 이동은 어드민 인증 source에서 금지한다.
- 버튼에는 명시적 `type`을 둔다.

## API와 DB 경계

- DB·Drizzle 직접 접근은 `apps/api`의 composition·DB tooling·persistence/auth adapter, auth schema integration과 module infrastructure로 제한한다. HTTP interface와 middleware는 직접 import하지 않는다.
- auth infra의 SQLite adapter factory는 Better Auth vendor 호출과 credential·session schema를 격리한다. identity module은 학습자 profile repository와 관리자 session 해석을 소유하고 API composition은 vendor-neutral application·query port로 두 경계를 연결한다.
- `packages/infra/db`는 application schema·migration·seed와 비즈니스 module을 import하지 않는다.
- DB row와 API DTO 사이 변환은 repository 또는 mapper 경계에서 수행한다.
- API 응답은 runtime schema나 mapper를 통과한 내부 모델로 화면에 전달한다.

## 주석과 문서화

- 자명한 코드에는 주석을 달지 않는다.
- 복잡한 정책이나 되돌리기 어려운 결정에는 짧은 설명을 둔다.
- 복잡한 public API 또는 도메인 규칙에는 Tsdoc을 사용할 수 있다.
- 문서는 한국어로 작성한다. 기술 고유명사와 코드 식별자는 원문을 유지한다.

## 네이밍과 정본 위치

- 도메인 개념은 [`docs/glossary.md`](../glossary.md) 용어를 그대로 쓴다. 용어집에 없는 개념을 코드에 도입하면 같은 변경에서 용어집을 갱신한다.
- 전송 DTO를 도메인 이름으로 별칭하지 않는다. `import type { XxxDto as Domain }` 형태는 oxlint `no-dto-domain-alias`가 금지한다.
- 같은 이름의 함수를 서로 다른 패키지에 두지 않는다. 관련되어 있고 다르다면 이름으로 구분한다.
- `xxx-error.ts`는 실패 선언만, `xxx-http-errors.ts`(또는 HTTP mapper)는 HTTP 사상만 담는다.
- 새 개념을 추가할 때 아래 표에서 소유자를 먼저 찾는다. 표에 없으면 소유자를 정하고 표와 용어집을 함께 갱신한다.

| 개념 종류            | 정본 위치                                        | 금지                                                    |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| 시간·날짜 경계       | `packages/shared/kernel/src/day-boundary.ts`     | 리터럴 `"Asia/Seoul"`, `9*60*60*1000`, SQL `'+9 hours'` |
| 식별자 브랜드        | `packages/shared/types/src/ids.ts`               | 모듈 내 재선언                                          |
| 식별자 스키마 팩토리 | `packages/shared/contracts/src/identifier.ts`    | 두 번째 `createIdSchema` / `createIdentifierSchema`     |
| 실패 표현            | `packages/shared/kernel/src/failure.ts`          | 계층별 재선언                                           |
| wire 스키마          | `packages/shared/contracts/**`                   | 앱·모듈에서 재선언                                      |
| 환경 설정            | `packages/config/env` (공통) + 앱별 `config/env` | 도메인 경계 너머로 원문 전달                            |
| 화면 모델            | `apps/*/src/features/*/model/**`                 | 생성 fetcher 반환 타입을 도메인 이름으로 역산           |

## 오류 처리

- `catch`에서 만드는 실패는 반드시 `cause`를 담는다. oxlint `catch-preserves-cause`가 강제한다.
- 감사·개인정보·인증 실패는 `cause` 외에 `logger.error`도 남긴다.
- 계층 간 변환은 정보를 추가할 때만 만든다. 이름만 바꾸는 중간 shape는 만들지 않는다.
- 실패 union에 variant를 추가하면 `assertExhaustive*`가 컴파일 에러를 낸다. 이 장치를 우회하지 않는다.
- 의도적으로 비운 `catch`는 왜 비웠는지를 한 줄 주석으로 남긴다. 다음을 모두 만족할 때만 허용한다.
  1. 이 실패를 보고하는 것이 더 중요한 실패를 가릴 수 있다
  2. 대안 경로가 이미 실패를 기록하고 있다
  3. 주석이 위 두 가지를 명시한다

서버 내부 오류 변환 층과 wire 계약은 [`api-contract.md`](./api-contract.md)가 소유한다.

## 금지 패턴

- 같은 목적의 utility 중복 생성
- 테스트 실패를 우회하기 위한 조건문 추가
- 죽은 코드 방치
- 관련 없는 대규모 rename 또는 formatting-only 변경
- 제품 소스에서 test fixture import
- 비밀값, token, 비밀번호, 운영 DB 파일 커밋
- 앱과 패키지의 책임을 넘는 import
