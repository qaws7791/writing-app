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
- workspace 내부 import는 절대 경로를 사용한다.
- 앱 간 상대 import를 만들지 않는다.
- `Kwep/` 구현 파일은 제품 런타임에서 import하지 않는다.

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
- `workspace/no-invalid-workspace-dependency`: error.

Architecture test는 계층 규칙을 검사할 때 TypeScript AST 기반 import 수집을 사용한다. type-only import, dynamic import, export declaration도 runtime import와 같은 경계를 따라야 한다.

## TypeScript

- `strict`를 유지한다.
- `noUncheckedIndexedAccess`를 유지한다.
- 도메인 ID와 중요한 값에는 브랜드 타입을 사용한다.
- `any`를 사용하지 않는다.
- `as unknown as T`로 타입 안전성을 우회하지 않는다.
- vague result shape 대신 discriminated union이나 명시적 result variant를 사용한다.
- 약한 `Record<string, unknown>`는 실제 타입을 만들 수 없는 경계에서만 사용한다.

## React와 Next.js

- Client Component는 상호작용 상태가 필요할 때만 사용한다.
- 서버에서 조회 가능한 데이터는 Server Component에서 먼저 처리한다.
- 내부 이동 UI는 `next/link`의 `Link`를 사용한다.
- 명령형 이동은 로그인 완료, 저장 완료, 모달 종료 같은 이벤트 결과에만 사용한다.
- `window.location.*` 직접 이동은 어드민 인증 source에서 금지한다.
- 버튼에는 명시적 `type`을 둔다.

## API와 DB 경계

- `apps/api`는 `@workspace/db`와 Drizzle을 직접 import하지 않는다.
- `packages/db`는 `@workspace/core`를 import하지 않는다.
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
