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

본문 transport는 HTTP transaction이다. 자료 문서·core·관리자 작업 공간 fixture는 같은 snapshot의 동시 update 수렴, 고정 transaction 재시도, 문서 전환·서버 재시작·version 알림 순서 역전·snapshot fallback을 검증한다. 실제 두 브라우저 context는 코드 블록 변경을 transaction으로 승인하고 다른 브라우저가 version 알림 뒤 HTTP pull로 표시하는지 확인한다. Bun WebSocket 테스트는 작업 공간 사건 구독, heartbeat, version·무효화 알림과 실패한 socket 격리에 한정한다.

학습자 AI 피드백 repository 통합 테스트는 SQLite transaction에 50개 동시 요청을 입력해 provider 호출이 단일 in-flight 예약을 넘지 않는지 확인한다. 동일 idempotency key 결과 재사용, provider fault와 timeout의 `failed` 전이, TTL 만료의 `expired` 전이와 slot 재사용, 성공 3회 한도, 기존 완료 row의 `succeeded` migration을 함께 검증한다.

학습 진행 repository 통합 테스트는 file-backed SQLite 연결 2개에서 index 1과 2 저장을 100회 동시에 실행한다. 최종 index가 2보다 작아지지 않고 낮은 요청이 `stale`로 구분되는지, 완료 뒤 늦은 저장에도 `completed` 상태와 index가 유지되는지 검증한다. 서비스 테스트는 현재 index와 같거나 정확히 1 큰 index만 허용하는 기존 순차 정책과 저장 시점 stale conflict를 함께 고정한다.

## 주요 명령

```bash
bun run check:components-config
bun run check:api-contract
bun run check:document-drift
bun test scripts/check-document-drift.test.ts
bun run check:workspace-inventory
bun run test
bun run test:coverage
bun run test:e2e
bun run test:storybook
bun run test:load:resource-library
bun run test:e2e:resource-library-load
bun run typecheck
bun run lint
bun run build
bun lefthook run pre-commit
```

`check:document-drift`는 실제 앱 route registry가 import한 HTTP route와 `main.ts`가 등록한 WebSocket upgrade 표면을 `BACKEND.md` 인벤토리와 양방향 비교한다. route 추가·삭제 fixture 테스트는 문서 누락과 오래된 문서가 모두 실패로 분류되는지 검증한다.

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

개발 감시 설정을 변경할 때는 실제 dev server를 실행해 다음 조건을 확인한다.

- 앱과 API가 표준 포트에서 모두 기동한다.
- workspace package source를 변경하면 이를 import하는 API 프로세스가 재시작한다.
- 임시 변경을 되돌린 뒤에도 재시작하며 디버그 표식이 남지 않는다.
- Bun이 import한 workspace 파일을 프로젝트 디렉터리 밖으로 판정하는 경고가 발생하지 않는다.

## 커버리지 기준

- `bun run test:coverage`는 13개 runtime workspace를 각각 해당 디렉터리에서 실행한다. `bun:sqlite` 경계는 Bun native coverage를 사용하고 나머지는 V8 coverage를 사용한다.
- 루트 `vitest.workspace.ts`의 13개 프로젝트와 coverage 실행 목록은 일치해야 한다. `apps/storybook`과 `packages/config`는 runtime test 프로젝트가 아니므로 제외한다.
- 각 runtime workspace는 `src`의 실행 코드를 `coverage.include`로 명시한다. 테스트, Storybook story, 타입 선언, 생성 파일, 설정 파일은 분모에서 제외한다.
- 인증, repository, migration, 동기화처럼 보안·데이터 무결성에 직접 영향을 주는 모듈은 `run-workspace-coverage.ts`의 파일별 threshold를 통과해야 한다.
- CI는 `coverage/<workspace>/`의 LCOV와 요약을 단일 artifact로 14일 보존한다. 새 runtime 파일은 테스트에서 import하지 않아도 분모에 포함되어 전체 coverage를 낮춘다.
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
- 어드민 API route의 wire contract schema는 `@workspace/contracts/admin`에서 직접 가져온다. `apps/admin`은 `@workspace/core`를 직접 import하지 않고, 관리자 contract는 허용된 feature Adapter에서만 사용한다는 아키텍처 테스트로 앱 모델 seam을 고정한다. 삭제된 중앙 `AdminApi`와 `http-admin-api` import가 다시 생기지 않는지도 함께 검사한다.

## DB 테스트 기준

자료실 실시간 연결 테스트는 실제 Bun WebSocket 경계를 사용해 문서 구독 확인, 문서별 version 사건 격리, 빠른 구독 전환 순서, 관리자 ID 기준 활성 편집자 집계와 heartbeat 만료 정리를 검증한다. fake clock으로 세션 만료 1008 종료를, 폐기 resolver로 heartbeat 재검증을, fake socket으로 actor/IP N+1 연결과 message·subscribe burst를 검증한다. 실제 Bun transport fixture는 4KiB 초과 payload가 앱 message handler에 도달하지 않는지 확인하고 handler 설정으로 64KiB backpressure 종료를 고정한다. 브라우저 Adapter 테스트는 문서 전환에서 소켓을 다시 만들지 않고 재연결 뒤 마지막 활성 문서를 다시 구독하는지 확인한다.

작업 공간 연결 수명 테스트는 문서를 100회 전환해도 실제 연결 Adapter 생성은 한 번이고, 같은 연결에서 문서 구독·해제만 교체되는지 검증한다.

자료 문서 HTTP 동기화 테스트는 Yjs update의 검증·Markdown 투영, 동일 transaction ID 재승인, 단조 state version, 200건·2MiB update log 정리, 정리 뒤 snapshot fallback과 승인 이후 version 사건 발행을 검증한다. snapshot byte·node·transaction quota와 projection deadline fixture는 거부 뒤 snapshot, Markdown revision과 FTS가 변하지 않고 구조화 거부 사건이 발생하는지 확인한다. file-backed SQLite 통합 테스트는 snapshot, Markdown, FTS, 수정자, update log와 멱등 receipt가 같은 transaction에서 확정되며 7일 보존 경계보다 오래된 receipt만 정리되는지 확인한다.

예약 부하 suite는 file-backed WAL connection 2개와 20개 논리 client를 사용해 latency p50·p95·p99, busy, retry, snapshot fallback과 최종 Yjs·Markdown 수렴을 artifact로 남긴다. Playwright smoke는 격리된 browser context 2개가 별도 Bun HTTP fixture process의 실제 file-backed transaction 경계를 거쳐 같은 상태로 수렴하는지 확인한다. 실행·threshold·정리 기준은 `resource-library-load-testing.md`를 따른다.

클라이언트 transaction queue 테스트는 500ms 유휴 batching, 연속 입력의 1초 상한과 일시적 실패 뒤 같은 transaction ID·Yjs payload 재시도를 가짜 타이머로 검증한다.

초기 HTTP 동기화 테스트는 `mode=snapshot` 요청이 현재 version과 같더라도 서버 snapshot을 반환하는지 검증한다. 클라이언트는 이 snapshot을 적용하기 전에는 편집 가능한 Y.Doc을 만들지 않는다.

`ResourceWorkspaceSync` 테스트는 초기 snapshot 전 편집 잠금, 500ms transaction 저장, 문서 재진입 cache 재사용, version 알림의 증분 pull, 문서 무효화 잠금과 깨끗한 문서 3개 LRU 한도에서 승인 대기 문서 보존을 검증한다. production 편집기 테스트는 문서별 WebSocket connector 대신 작업 공간 lease를 연결하는지 확인한다.

작업 공간 shell 테스트는 숨겨졌던 탭이 다시 보일 때만 활성 문서 version을 재확인하는지 검증한다. 동기화 Module 테스트는 재구독 확인에서 더 큰 서버 version을 받으면 누락 update를 HTTP로 가져와 문서에 적용하는지 확인한다.

작업 공간 동기화 통합 테스트는 일시적 HTTP 저장 실패 뒤 다른 문서를 거쳐 돌아와도 로컬 변경과 transaction ID·payload를 보존해 재시도하는지 확인한다. 이전 문서의 늦은 version update가 현재 문서에 적용되지 않고 원래 문서 cache에서만 복구되는지도 검증한다.

자신의 version 알림이 저장 응답보다 먼저 도착하는 fixture는 같은 update를 pull해도 추가 저장을 만들지 않고 durable 응답 전까지 `saving`을 유지하는지 검증한다. update log 보존 구간이 없을 때 최신 snapshot fallback을 현재 Y.Doc에 적용하는 경로도 확인한다.

서버 operation coordinator 테스트는 같은 문서 작업의 순서, 다른 문서의 격리와 하위 문서 묶음의 선예약을 검증한다. Route 통합 테스트는 HTTP transaction 저장이 확정되기 전에 같은 문서의 Markdown 내보내기가 실행되지 않는지 확인한다.

자료 문서 조회 통합 테스트는 활성 문서 응답과 저장소 메타데이터 조회에 Markdown이 포함되지 않고, 같은 문서를 휴지통으로 이동한 뒤에는 읽기 전용 durable Markdown이 반환되는지 검증한다.

자료 문서 동기화 SQLite 통합 테스트는 같은 snapshot에서 두 클라이언트가 동시에 만든 update에 단조 version을 부여하고, 양쪽 클라이언트의 증분 적용 결과와 서버 durable Markdown이 동일하게 수렴하는지 검증한다.

서버 재시작 fixture는 같은 SQLite repository에 새 동기화 use case를 조립해 기존 update log를 pull하고, 다음 transaction의 version과 durable Markdown을 이어서 확정하는지 검증한다.

- baseline migration은 in-memory DB에 적용할 수 있어야 한다.
- seed는 반복 실행해도 stable ID 기준으로 같은 결과를 내야 한다.
- seed에서 빠진 콘텐츠는 삭제가 아니라 `archived` 전환으로 검증한다.
- repository test는 DB row와 도메인 DTO mapping을 함께 확인한다.

## 프론트엔드 테스트 기준

- 화면 텍스트와 접근성 role을 사용자 관점으로 조회한다.
- admin production build 뒤 `check:resource-route-bundle`을 실행해 `/resources`와 `/resources/trash` 초기 chunk에 Lexical/Yjs가 없고 합산 gzip이 275,000 bytes 이하인지 검사한다. 문서 편집 chunk는 `[documentId]` route의 동적 경계 뒤에서만 내려받는다.
- 같은 build 산출물에서 `check:admin-chart-route-bundle`을 실행해 대시보드와 `/analytics` 초기 chunk에 Recharts가 없는지 검사한다. 초기 JS gzip 예산은 각각 60,000 bytes와 75,000 bytes이며 요약·접근성 표는 서버에서 렌더링하고 차트 시각화 client island만 viewport 200px 이내에서 동적 로드한다.
- web landing build는 `check:landing-route-bundle`로 정적 section이 client module에 들어가지 않았는지 검사한다. landing client module은 `landing-motion.tsx` island만 허용하고 초기 JS 합산 gzip은 50,000 bytes 이하로 제한한다.
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

## 브라우저 E2E

- `bun run test:e2e`는 저장소 전용 임시 SQLite DB와 `ENABLE_TEST_AUTH=true` web server를 사용한다.
- fixture server가 DB 초기화를 마친 뒤 학습자 API·웹과 어드민 API·웹을 순서대로 기동하므로 실행 중인 API가 초기화 대상 DB를 먼저 열 수 없다.
- 학습자 로그인·코스·레슨 완료, 관리자 로그인·역할, 보호 route·logout·비로컬 API origin을 실제 Chromium에서 검증한다.
- Google OAuth 네트워크 요청은 허용하지 않는다. 실패 시 Playwright trace와 screenshot을 `output/playwright/`에 남긴다.

## Storybook interaction과 접근성

- Storybook build와 interaction·a11y 검증은 별도 명령과 CI 단계로 실행한다.
- button play, lesson answer, dialog, menu, resource tree의 키보드 상호작용을 우선 검증한다.
- `addon-a11y`의 error 설정과 axe 결과는 접근성 위반을 테스트 실패로 처리한다.
- 색상 대비는 디자인 토큰 정비 범위와 분리해 현재 runner에서 제외하고, Base UI가 포털에 삽입하는 focus guard만 axe context에서 제외한다. 이름 없는 control, 잘못된 ARIA, landmark 등 나머지 규칙은 실패한다.

## 테스트 console 정책

- jsdom 테스트의 예상하지 않은 `console.error`와 `console.warn`은 즉시 실패한다.
- React duplicate key, act, hydration 경고는 허용하지 않는다.
- 의도한 경고를 검증하는 테스트만 해당 테스트 안에서 좁게 spy하고 메시지를 assertion한 뒤 복원한다.

## 실패 대응

- 실패를 우회하기 위한 조건문을 제품 코드에 추가하지 않는다.
- flaky 테스트는 먼저 재현 조건과 시간/외부 의존성을 분리한다.
- 테스트 수정이 실제 계약 변경인지, 오래된 기대값 수정인지 문서화한다.

## 종료와 백업 복구 테스트

- 학습자 API 수명주기 단위 테스트는 종료 중 신규 요청의 `503`, 진행 요청 drain, 중복 신호에서 한 번만 실행되는 `core.close()`를 확인한다.
- process smoke test는 실제 Bun server에 진행 요청을 보낸 상태에서 종료 신호를 전달하고, 응답 완료와 DB 자원 종료 결과를 별도 보고서로 확인한다. Windows에서는 Node가 child process의 Unix signal handler를 전달하지 않으므로 동일한 종료 callback을 표준 입력으로 호출한다.
- SQLite 백업 테스트는 공백이 포함된 file-backed WAL 경로를 snapshot으로 만들고, 원본 변경 뒤에도 백업이 독립적으로 열리는지 확인한다.
- 복구 검증은 임시 경로에서 `integrity_check`, schema version, 필수 테이블 읽기를 수행한다. 손상 파일과 기존 출력 경로를 사용한 실패가 운영 파일을 바꾸지 않는지도 확인한다.

## HTTP 보안 계약 회귀 테스트

- 운영 환경 표 기반 테스트는 HTTPS 공개 URL, 명시적 DB, 분리된 고엔트로피 인증 비밀값을 허용하고 누락·HTTP·localhost·동일하거나 약한 비밀값·운영 테스트 인증을 거부한다.
- 실제 HTTPS 테스트 로그인 응답의 `Set-Cookie`에서 세션 쿠키 이름과 `Secure`, `HttpOnly`, `SameSite=Lax`를 확인한다.
- 보호 route 매트릭스는 쿠키 인증 성공 시 `private, no-store`와 `Vary: Cookie`, Bearer 단독 요청의 `401`, 공개 route의 정책 비적용을 확인한다.
- OpenAPI 테스트는 실제 인증 설정과 공유하는 쿠키 이름과 보호 route security scheme을 확인한다.
- SSE와 파일 다운로드 테스트는 캐시 정책 적용 뒤에도 스트림 content type과 첨부 응답 계약이 유지되는지 확인한다.

## 관리자 API 경계 검증 (2026-07-12)

공통 HTTP 전송 계층은 정상 JSON, 빈 응답, 잘못된 JSON, 다운로드, 네트워크 실패를 표 기반으로 검증한다. 각 관리자 기능 어댑터는 독립 계약 테스트를 가지며, 구조 테스트는 기능 간 DTO 결합과 삭제된 중앙 API로의 회귀를 차단한다. 서버 조립 테스트는 기능별 서비스 연결과 데이터베이스 종료가 한 번만 수행됨을 검증한다.

## Root tooling 회귀 테스트

공통 dependency version drift와 디자인 baseline 증감은 `scripts/*.test.ts`의 negative fixture로 검증한다. CI tests job은 workspace 테스트와 별도로 이 tooling fixture를 먼저 실행한다. 정적 검증은 제품 lint warning을 오류로 취급한다.

## 관리자 MFA 회귀 테스트

- 실제 Better Auth와 in-memory DB로 owner 등록, TOTP 활성화, 비밀번호 로그인 challenge, TOTP session 발급을 검증한다.
- MFA 미등록 activation session, 만료 step-up, operator, 최근 owner session의 route·application 권한 매트릭스를 검증한다.
- 복구 코드 원문 비저장, 1회 소비, TOTP 초기화와 전체 session 폐기를 한 트랜잭션으로 검증한다.
- 관리자 UI는 등록 key, TOTP challenge, 인증 앱 분실 복구, step-up 만료 재로그인 상태를 검증한다.
- 비밀번호 변경 통합 테스트는 실제 Better Auth adapter가 교체 발급한 session과 기존 session이 모두 서버에서 폐기되는지 검증한다.
