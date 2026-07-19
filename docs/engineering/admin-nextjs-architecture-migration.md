# 관리자 웹 Next.js 아키텍처 마이그레이션

## 상태

완료

## 목적

`apps/admin`의 전역 기술 폴더와 기능 간 암묵적 결합을 제거하고, 변경 이유가 같은
모델·HTTP adapter·Server Action·UI를 한 기능 슬라이스에 공배치한다. URL, 화면
문구와 동작, 접근성, 관리자 Hono API 계약, 인증·인가, ETag와 SSE 의미는 변경하지
않는다.

## 불변 조건

- 공개 라우트 `/`, `/login`, `/courses`, `/users`, `/analytics`, `/settings`, `/chat`,
  `/resources`와 동적 하위 경로를 유지한다.
- `@workspace/contracts/admin`의 요청·응답 schema와 `AdminApiResult<T>`의
  `status: "ok" | "error"` 계약을 유지한다.
- API가 최종 역할 인가를 소유하며 모든 Server Action은 자체적으로 세션과 입력을
  검증한다.
- ETag 조건부 저장, stale revision, resource conflict와 SSE 중단·재시도 의미를
  유지한다.
- Recharts와 Lexical의 동적 import 경계와 기존 route gzip 예산을 유지한다.
- 새 dependency, TanStack Query, 클래스 기반 CRUD 추상화와 캐시 정책 변경을
  도입하지 않는다.
- `package.json`과 `bun.lock`의 dependency 버전은 변경하지 않는다.
- 테스트 실패를 우회하는 조건문, skip, forwarding module을 만들지 않는다.

## 목표 구조

```text
apps/admin/src/
├── app/
│   ├── _providers/
│   └── (admin)/_views/
├── features/
│   ├── authentication/
│   ├── dashboard/
│   ├── analytics/
│   ├── course-catalog/
│   ├── course-editor/
│   ├── user-management/
│   ├── settings-management/
│   ├── ai-chat/
│   ├── resource-library/
│   └── resource-document-editor/
├── entities/
│   ├── learner-account/
│   ├── admin-analytics/
│   ├── course/
│   └── resource-document/
├── shared/
│   ├── auth/
│   ├── config/
│   ├── http/
│   └── navigation/
├── server/
│   ├── auth/
│   ├── env/
│   └── http/
└── proxy.ts
```

의존성은 `app → features → entities → shared` 방향으로 흐른다. `app`과 feature의
server 경계는 `server` 플랫폼 모듈을 사용할 수 있고, `server`는 `entities`와
`shared`만 사용한다. feature는 다른 feature 내부를 import하지 않는다.

## 실행 순서

1. 문서와 ADR에 불변 조건, 목표 구조와 검증 기록 형식을 확정한다.
2. Admin 테스트를 목표 feature의 `model`, `api`, `server`, `ui` 옆으로 옮기고
   architecture 규칙과 누락된 경계 사례를 추가한다.
3. 제품 코드를 변경하기 전에 목표 경로 부재와 기존 계층 위반의 RED를 기록한다.
4. `shared`, `server`, `entities`, feature, App Router 조립 순서로 전환한다.
5. 구 `components`, `lib`, `features/shared`와 루트 runtime config를 제거한다.
6. 전체 정적·동적 검증을 통과한 뒤 이 문서와 관련 living documentation을 실제
   경로에 맞춘다.

## 검증 기록

### 실화면 회귀 수정

2026-07-20 실제 Chrome 검증에서 모바일 강의 목록의 과도한 열 축소와
`/resources/trash` 직접 접근 시 자료 트리 범위가 활성 자료로 남는 결함을 확인했다.
URL·API 계약을 변경하지 않고 회귀 테스트를 먼저 추가한 뒤 수정과 실제 브라우저
재검증했다.

- 강의 표에 720px 최소 폭을 적용해 모바일에서는 표 컨테이너만 가로 스크롤하고
  문서 전역에는 가로 오버플로가 생기지 않도록 했다. 390×844 Chrome 검증에서 표
  컨테이너는 333px, 표는 720px였으며 첫 강의명은 한 줄로 표시됐다.
- 자료실 범위를 `usePathname()`에서 파생하고 서버 초기 트리도 요청 URL의 범위로
  조회했다. `/resources/trash` 직접 접근, 자료 탭 이동과 브라우저 뒤로가기에서 URL,
  `aria-pressed`, 트리 범위가 일치했다.
- 회귀 테스트를 포함한 Admin Vitest 44개 파일, 124개 테스트와 Oxlint, TypeScript,
  production build, architecture boundary, import cycle 검사가 통과했다. 실제 Chrome
  콘솔의 오류와 경고는 없었다.

### 착수 기준선

- Bun 1.3.10, Node.js 24.15.0을 확인했다.
- Admin Vitest 36개 파일, 107개 테스트가 통과했다.
- Admin Oxlint와 TypeScript가 통과했다.
- root architecture boundary 7개 규칙과 import cycle 13개 workspace, 4개 runtime
  scope, 6개 core capability가 통과했다.
- 손상된 ignored `.next/dev/types/validator.ts` 생성 파일 하나를 제거하고
  `next typegen`을 다시 실행한 뒤 TypeScript 통과를 확인했다.

### RED

2026-07-20에 제품 코드를 변경하지 않은 상태에서 테스트 28개를 목표 책임 위치로
옮기고 architecture 규칙을 강화했다. Admin Vitest는 36개 파일 중 33개가 통과하고
3개가 실패했으며, 110개 테스트 중 103개가 통과하고 7개가 실패했다.

- 예상한 구조 실패: 허용되지 않은 `components`, `lib`, 루트 runtime config와
  test 폴더가 남아 있다.
- 예상한 의존 실패: 구 feature 이름, 구 `@/lib`와 `@/runtime-config` import,
  feature 간 내부 import와 UI 밖의 wire DTO import가 남아 있다.
- 예상한 목표 모듈 부재: runtime config 테스트가 최종
  `shared/config/admin-runtime-config.ts` 경로를 요구한다.
- 테스트 이동으로 생긴 source root 계산 오류 두 건을 확인했다. 이는 제품 실패가
  아니라 테스트 위치 의존성이므로 최종 위치 기준으로 즉시 수정했다.

skip, 조건부 우회와 임시 forwarding module은 추가하지 않았다.

### GREEN

2026-07-20에 forwarding module 없이 제품 코드를 목표 구조로 전환하고 구
`components`, `lib`, `features/shared`와 루트 runtime config를 제거했다.

- Admin Vitest 43개 파일, 123개 테스트가 통과했다. malformed route/search 입력,
  미인증·잘못된 Server Action 입력, SSE origin·body 크기·schema와 기존 편집 충돌
  계약을 포함한다.
- Admin Oxlint, 엄격 TypeScript 옵션을 포함한 typecheck와 Next.js 16.2.6 production
  build가 통과했다.
- root architecture boundary와 13개 workspace import cycle 검사가 통과했다. Admin
  자체 검사는 허용 계층, 절대 import, 단방향 의존, feature 격리, model 순수성,
  Client→server, UI→DAL, contract DTO 경계와 구 중앙 API 재도입 금지를 고정한다.
- 대시보드 초기 JS gzip은 43,483 bytes, 분석은 57,775 bytes로 각각 60,000 bytes와
  75,000 bytes 예산 이내이며 초기 chunk에 Recharts가 없다.
- `/resources`와 `/resources/trash` 초기 chunk에는 Lexical과 Yjs가 없다.
- `ENABLE_TEST_AUTH=true` E2E 3개가 통과해 학습자 흐름과 관리자 owner/operator,
  코스·사용자·자료실 계약을 실제 dev server에서 확인했다.
- `bun lefthook run pre-commit`의 Oxfmt와 Admin Oxlint가 통과했다.
- 새 dependency와 cache 정책은 추가하지 않았고 `package.json`과 `bun.lock`은
  변경하지 않았다.

## 최종 게이트

```bash
bun --filter @workspace/admin lint
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin test
bun run check:architecture-boundaries
bun run check:import-cycles
bun --filter @workspace/admin build
bun run check:admin-chart-route-bundle
bun run check:resource-route-bundle
ENABLE_TEST_AUTH=true bun run test:e2e
bun lefthook run pre-commit
```
