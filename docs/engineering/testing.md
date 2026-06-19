# 테스트 전략

이 문서는 테스트 범위, 검증 명령, 커버리지 기준, 테스트 환경을 설명하는 단일 진실 원천이다.

## 테스트 원칙

- 사용자에게 보이는 동작과 런타임 경계를 우선 검증한다.
- 도메인 정책은 순수 함수나 service 단위 테스트로 고정한다.
- HTTP route는 실제 request/response 형태로 검증한다.
- DB repository는 in-memory SQLite 또는 파일 DB를 명시적으로 준비해 검증한다.
- 테스트 편의를 위해 제품 코드에 조건문을 추가하지 않는다.

## 테스트 도구

| 도구            | 용도                                         |
| --------------- | -------------------------------------------- |
| Vitest          | 기본 테스트 실행기                           |
| Testing Library | React UI 테스트                              |
| jsdom           | 프론트엔드 테스트 DOM                        |
| Bun SQLite      | DB 통합 테스트                               |
| Playwright      | 브라우저 스모크나 시각 검증이 필요할 때 사용 |

## 테스트 프로젝트

루트 `vitest.workspace.ts`는 다음 프로젝트를 포함한다.

- `apps/admin`
- `apps/admin-api`
- `apps/api`
- `apps/web`
- `packages/core`
- `packages/db`
- `packages/env`
- `packages/hono`
- `packages/http-client`
- `packages/logger`
- `packages/ui`

## 테스트 계층

| 계층              | 대상                                  | 예시                                                 |
| ----------------- | ------------------------------------- | ---------------------------------------------------- |
| 단위 테스트       | 순수 정책, parser, mapper, DTO schema | 날짜 키, 매칭 표시 정책, API URL builder             |
| 서비스 테스트     | core use case와 repository port       | 학습 진행, AI 피드백, 관리자 서비스                  |
| Repository 테스트 | Drizzle query와 schema mapping        | 콘텐츠 repository, 학습 repository, admin repository |
| Route 테스트      | Hono request/response                 | 학습자 API route, 어드민 API route                   |
| UI 테스트         | 사용자 관점 화면 상태                 | 코스 목록, 레슨 진행, 관리자 화면                    |
| 브라우저 스모크   | 실제 dev server와 브라우저            | 로그인, 학습 플로우, 어드민 주요 화면                |

## 주요 명령

```bash
bun run check:components-config
bun run check:api-contract
bun run check:document-drift
bun run check:workspace-inventory
bun run test
bun run test:coverage
bun run typecheck
bun run lint
bun run build
bun lefthook run pre-commit
```

`packages/ui/tsconfig.lint.json`은 실제 TypeScript source와 Vitest 설정 파일만 포함한다. 존재하지 않는 생성기 경로나 빌드 출력 경로를 lint tsconfig에 추가하지 않는다.
앱 `tsconfig.json`의 test alias는 실제 테스트 지원 디렉터리가 있을 때만 둔다.

워크스페이스 단위 검증 예시는 다음과 같다.

```bash
bun run --filter=@workspace/api test
bun run --filter=@workspace/admin-api test
bun run --filter=@workspace/core test
bun run --filter=@workspace/db test
bun run --filter=@workspace/web test
```

## 커버리지 기준

- `bun run test:coverage`는 V8 coverage를 사용한다.
- 루트 coverage는 `vitest.workspace.ts`를 사용하며, `vitest.config.ts`를 가진 workspace는 coverage workspace에 포함되어야 한다.
- 현재 저장소에는 전역 최소 coverage threshold가 고정되어 있지 않다.
- 새 정책, 권한, 보안, 데이터 보존 로직은 threshold 유무와 관계없이 회귀 테스트를 추가한다.
- 단순 markup 변경은 UI smoke 수준으로 충분할 수 있다.
- 공유 package, repository, auth, migration 관련 변경은 테스트 범위를 넓힌다.

## API 테스트 기준

- route 테스트는 HTTP status, JSON body, CORS, request id, 인증 실패를 확인한다.
- 학습자 API는 active session, unauthorized, unavailable account 케이스를 구분한다.
- 어드민 API는 operator와 owner 권한 차이를 검증한다.
- JSON body 오류는 malformed JSON과 schema 오류를 구분한다.
- OpenAPI 생성 route는 실제 등록 route 기준으로 검증한다.
- 학습자 웹 앱은 `@workspace/core`를 직접 import하지 않는다는 아키텍처 테스트로 API 계약 경계를 고정한다.
- 어드민 API route의 wire contract schema는 `@workspace/contracts/admin`에서 직접 가져온다. `apps/admin`은 `@workspace/core`를 직접 import하지 않고, `@workspace/contracts/admin`은 `apps/admin/src/lib/api/http-admin-api.ts`에서만 사용한다는 아키텍처 테스트로 앱 모델 경계를 고정한다.

## DB 테스트 기준

- baseline migration은 in-memory DB에 적용할 수 있어야 한다.
- seed는 반복 실행해도 stable ID 기준으로 같은 결과를 내야 한다.
- seed에서 빠진 콘텐츠는 삭제가 아니라 `archived` 전환으로 검증한다.
- repository test는 DB row와 도메인 DTO mapping을 함께 확인한다.

## 프론트엔드 테스트 기준

- 화면 텍스트와 접근성 role을 사용자 관점으로 조회한다.
- API는 포트 mock 또는 명시적 test double로 대체한다.
- generated OpenAPI 타입은 mapper 경계 안에 격리한다.
- `apps/web` 아키텍처 테스트는 `openapi-fetch` dependency/import가 없고 자체 HTTP adapter를 유지하는지 확인한다.
- overlay 계열 컴포넌트는 테스트 mock을 사용해 포털 구현 세부사항에 묶이지 않게 한다.
- 내부 탐색은 가능한 link role과 href로 검증한다.

## 테스트 데이터

- 학습자 테스트 기본 세션은 `user-1` 형태를 사용한다.
- 어드민 테스트 기본 세션은 owner `admin-1`을 사용한다.
- 테스트 double은 예상하지 않은 service 호출을 실패시키는 형태를 선호한다.
- 외부 provider 호출은 테스트에서 직접 수행하지 않는다.

## 실패 대응

- 실패를 우회하기 위한 조건문을 제품 코드에 추가하지 않는다.
- flaky 테스트는 먼저 재현 조건과 시간/외부 의존성을 분리한다.
- 테스트 수정이 실제 계약 변경인지, 오래된 기대값 수정인지 문서화한다.
