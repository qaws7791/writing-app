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
- `packages/resource-document`
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

자료 문서 계약은 `packages/resource-document`에서 정규 GFM AST 기반 Markdown → Lexical → Markdown 의미 보존과 반복 정규화 안정성, 중복 reference definition의 first-wins 의미, 여러 줄 원시 HTML의 실행 불가 리터럴 코드 보존, 지원하지 않는 AST 구조의 명시적 거부, 위험 URL 검증, Yjs snapshot의 headless 투영과 정리를 검증한다. 저장 전에는 지원 node 계층과 Markdown에 투영되지 않는 Text·Element·Link·Heading·ListItem·Table 속성, 알 수 없는 format bit, NodeState와 slot이 구체적인 `invalid` issue로 거부되는지도 검증한다. 세 TextNode의 모든 서식 전이와 delimiter 문자 조합을 직렬화한 뒤 새 editor에 다시 입력해 문자별 서식과 `EditorState` 동등성을 확인하며, GFM으로 표현할 수 없는 상태는 `valid`로 반환하지 않는다. 원격 Yjs update는 검증용 headless 문서와 화면 문서를 분리한 상태에서 객체형·빈 이미지 속성, 비 HTTPS URL, 임의 node type·tag·NodeState가 화면 editor에 반영되지 않고 정상 상태로 회복한 뒤에만 미러링되는지 검증한다. 이미지 node는 jsdom에서 유효하지 않은 URL을 `<img>` 생성 전에 거부하는지도 확인한다. Bun WebSocket 호환성은 `apps/admin-api`에서 OS가 할당한 로컬 포트의 실제 Bun server, 공식 `WebsocketProvider`, Y.Doc에 연결한 두 Lexical binding을 함께 실행해 동시 편집 수렴으로 검증한다. transport failure-injection은 production adapter에 테스트용 공개 주입 지점을 추가하지 않고 fake Bun socket으로 `send` exception과 반환값 `0`, initial·reply·awareness 경로가 실패한 socket만 격리하는지 검증한다. React block drag 계약은 `apps/admin`의 jsdom 환경에서 실제 `DraggableBlockPlugin_EXPERIMENTAL` portal을 렌더링하고 두 Lexical block을 drag/drop해 순서가 바뀌는지 확인한다.

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
bun run --filter=@workspace/resource-document test
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
- 어드민 서비스 테스트는 기능별 use case 조합과 repository port test double을 검증하고, 사용하지 않는 port 호출은 실패시켜 service 의존 범위를 고정한다.
- 학습자 웹 앱은 `@workspace/core`를 직접 import하지 않는다는 아키텍처 테스트로 API 계약 경계를 고정한다.
- 어드민 API route의 wire contract schema는 `@workspace/contracts/admin`에서 직접 가져온다. `apps/admin`은 `@workspace/core`를 직접 import하지 않고, `@workspace/contracts/admin`은 `apps/admin/src/lib/api/http-admin-api.ts`에서만 사용한다는 아키텍처 테스트로 앱 모델 경계를 고정한다.

## DB 테스트 기준

자료실 실시간 연결 테스트는 실제 Bun WebSocket 경계를 사용해 문서 구독 확인, 문서별 version 사건 격리, 빠른 구독 전환 순서, 관리자 ID 기준 활성 편집자 집계와 heartbeat 만료 정리를 검증한다. 브라우저 Adapter 테스트는 문서 전환에서 소켓을 다시 만들지 않고 재연결 뒤 마지막 활성 문서를 다시 구독하는지 확인한다.

- baseline migration은 in-memory DB에 적용할 수 있어야 한다.
- seed는 반복 실행해도 stable ID 기준으로 같은 결과를 내야 한다.
- seed에서 빠진 콘텐츠는 삭제가 아니라 `archived` 전환으로 검증한다.
- repository test는 DB row와 도메인 DTO mapping을 함께 확인한다.

## 프론트엔드 테스트 기준

- 화면 텍스트와 접근성 role을 사용자 관점으로 조회한다.
- API는 포트 mock 또는 명시적 test double로 대체한다.
- generated OpenAPI 타입은 `apps/web/src/lib/api/writing-app-api-contract.ts`에 격리하고 feature mapper는 이 transport contract 타입만 참조한다.
- `apps/web` 아키텍처 테스트는 `openapi-fetch` dependency/import가 없고 자체 HTTP adapter를 유지하는지 확인한다.
- overlay 계열 컴포넌트는 테스트 mock을 사용해 포털 구현 세부사항에 묶이지 않게 한다.
- 내부 탐색은 가능한 link role과 href로 검증한다.

## 테스트 데이터

- 학습자 테스트 기본 세션은 `user-1` 형태를 사용한다.
- 어드민 테스트 기본 세션은 owner `admin-1`을 사용한다.
- 테스트 double은 예상하지 않은 service 호출을 실패시키는 형태를 선호한다.
- 외부 provider 호출은 테스트에서 직접 수행하지 않는다.

## 로컬 브라우저 자동 인증

AI 에이전트나 Playwright가 Google OAuth 화면을 직접 통과할 수 없으므로 로컬 자동화는 테스트 전용 학습자 인증 경로를 사용한다.

- `apps/api`와 `apps/web`에 모두 `ENABLE_TEST_AUTH=true`를 명시한 로컬 dev server에서만 사용한다.
- 웹 버튼만 보이고 API에 플래그가 없으면 `GET /api/auth/test/sign-in`이 404를 반환한다. API `.env`를 바꾼 뒤에는 dev server를 재시작한다.
- `NODE_ENV=production`에서는 플래그가 `true`여도 API endpoint와 웹 버튼이 활성화되지 않는다.
- 웹 로그인 화면은 테스트 로그인 버튼을 노출하고, 버튼은 `GET /api/auth/test/sign-in?callbackURL=...`로 브라우저를 이동시킨다.
- API는 기본 학습자 `learner@example.com`을 찾거나 생성하고 Google account row를 연결한 뒤 `learner_session_token` 세션 쿠키를 발급한다.
- callback URL은 학습자 웹 origin 내부 URL만 허용하며, 외부 URL은 `/app`으로 되돌린다.
- 이 경로는 로컬 smoke와 E2E 자동화를 위한 것이다. 제품 테스트에서는 Google OAuth 자체를 검증하지 않고, 인증 이후의 보호 route와 사용자 흐름을 검증한다.

## 실패 대응

- 실패를 우회하기 위한 조건문을 제품 코드에 추가하지 않는다.
- flaky 테스트는 먼저 재현 조건과 시간/외부 의존성을 분리한다.
- 테스트 수정이 실제 계약 변경인지, 오래된 기대값 수정인지 문서화한다.
