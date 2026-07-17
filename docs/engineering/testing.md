# 테스트 전략

이 문서는 테스트 범위, 검증 명령, 커버리지 기준, 테스트 환경을 설명하는 단일 진실 원천이다.

2026-07-13 변경 단위 2의 정적 검증·Turbo cache·Toolchain 계약 정렬을 완료했다. root `lint`가 install 전 Toolchain 검사, 저장소 전용 계약 검사, warning 없는 Oxlint를 소유하고 CI 정적 검증은 root `lint`, `format:check`, `typecheck`를 그대로 호출한다.

2026-07-13 변경 단위 4 단계 8을 완료했다. CI Playwright retry와 flaky 실패 판정, 첫 retry trace 보존 계약을 자동 검증한다.

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
- `apps/api`
- `apps/web`
- `packages/contracts`
- `packages/core`
- `packages/db`
- `packages/env`
- `packages/http-client`
- `packages/repository-tooling`
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

자료 문서 계약은 `packages/resource-document`에서 정규 GFM AST 기반 Markdown → Lexical → Markdown 의미 보존과 반복 정규화 안정성, 중복 reference definition의 first-wins 의미, 원시 HTML의 실행 불가 리터럴 보존, 지원하지 않는 AST 구조의 명시적 거부와 위험 URL 검증을 확인한다. 저장 전에는 지원 node 계층과 Markdown에 투영되지 않는 Text·Element·Link·Heading·ListItem·Table 속성, 알 수 없는 format bit, NodeState와 slot이 구체적인 `invalid` issue로 거부되는지 검증한다. 기본 직사각형 GFM 표, R2 이미지 URL과 필수 대체 텍스트를 포함한 모든 지원 블록의 왕복 fixture를 유지한다. React block drag 계약은 `apps/admin`의 jsdom 환경에서 실제 `DraggableBlockPlugin_EXPERIMENTAL` portal을 렌더링해 순서 변경을 검증한다.

자료 문서 저장 테스트는 같은 ETag를 읽은 두 요청 중 하나만 성공하고 다른 요청은 `412`와 최신 문서를 받는지 검증한다. 제목, Markdown, 수정 메타데이터, 검색 색인과 버전 증가가 하나의 SQLite transaction에서 확정되고 실패하면 모두 rollback되는지 확인한다. 관리자 UI는 충돌 뒤 로컬 Lexical 상태를 유지하고 최신 저장본 불러오기와 현재 편집본 유지 행동을 제공하는지 검증한다. 자료 트리는 최대 깊이 3, 1,000개 상한, 이름순 전체 조회, 폴더 대상 이동과 재귀 휴지통을 검증한다.

학습자 AI 피드백 repository 통합 테스트는 SQLite transaction에 50개 동시 요청을 입력해 provider 호출이 단일 in-flight 예약을 넘지 않는지 확인한다. file DB의 별도 connection이 provider callback 중 `BEGIN IMMEDIATE` write lock을 획득하는 fixture로 예약 transaction이 provider 대기 구간까지 열려 있지 않음도 검증한다. 동일 idempotency key 결과 재사용, provider fault와 timeout의 `failed` 전이, TTL 만료의 `expired` 전이와 slot 재사용, 성공 3회 한도, 기존 완료 row의 `succeeded` migration을 함께 검증한다.

OpenAI provider contract test는 concrete adapter와 함께 `apps/api/src/adapters/ai-feedback`가 소유한다. Responses API request의 Structured Outputs schema, payload parsing 실패의 `provider-unavailable` 변환, key 부재 fallback과 답안 본문을 포함하지 않는 token usage 이벤트를 고정한다. prompt 조립과 timeout·attempt 정책 테스트는 SDK와 독립적인 core domain/application 경계에 유지한다.

학습 진행 repository 통합 테스트는 file-backed SQLite 연결 2개에서 index 1과 2 저장을 100회 동시에 실행한다. 최종 index가 2보다 작아지지 않고 낮은 요청이 `stale`로 구분되는지, 완료 뒤 늦은 저장에도 `completed` 상태와 index가 유지되는지 검증한다. 서비스 테스트는 현재 index와 같거나 정확히 1 큰 index만 허용하는 기존 순차 정책과 저장 시점 stale conflict를 함께 고정한다.

학습자 상태 전이 repository 통합 테스트는 file-backed SQLite 연결 2개에서 같은 step 완료를 동시에 요청해 step 위치와 완료 횟수가 한 번만 증가하는지 확인한다. 학습 시작은 최소 snapshot의 순수 `rejected | start | replay` decision과 idempotent effect를 별도 단위 테스트로 검증하며, 동시 시작의 unique conflict 수렴, replay의 활동 시각 갱신과 activity fault 전체 rollback을 실제 SQLite로 확인한다. 일반 단계 완료는 순수 plan 단위 테스트에서 rejection·retry·replay의 빈 effect와 답안 → step/lesson → course → activity 순서를 고정하고, 실제 SQLite의 마지막 activity fault가 먼저 적용된 답안·lesson·course 효과까지 모두 rollback하는지 확인한다. version pin과 레슨 잠금, 미래 step conflict와 오답 retry는 반환 오류·결과뿐 아니라 course progress, lesson progress, answer와 activity row가 바뀌지 않는지도 고정한다. accepted 제출은 답안을 한 번 저장하고 정확히 다음 step으로 이동하며, 같은 command replay와 마지막 step replay는 전체 반환 projection과 답안·활동·완료 집계를 중복하지 않는다. 실제 published curriculum의 마지막 활성 레슨 fixture는 course progress 완료, 진행률 100%, 다음 레슨 없음과 일일 완료·답안 집계를 함께 검증한다. AI 전이는 target·sequence·저장 답안 준비와 attempt/replay/finalize 순수 decision을 단위 테스트하고, provider 실패 시 진행 불변, 고정 version의 WRITE 답안 사용, 같은 idempotency key 결과 재사용과 feedback 성공 저장·step 전진을 통합 테스트로 고정한다. SQLite trigger로 finalize의 학습 진행 저장을 실패시키는 fault fixture는 같은 transaction에서 먼저 갱신한 feedback attempt와 전체 학습 진행이 함께 rollback되는지 확인한다. core policy와 service fixture는 HTTP body/result schema를 parse하지 않고 application command/result를 직접 사용한다. route 경계 fixture는 body를 `completion` command로 바꾸는 mapping, `retry | advanced | lesson-completed`의 기존 wire 변환, expected rejection 10종의 status·code, 잘못된 body와 누락된 `Idempotency-Key`가 service 호출보다 먼저 거부되는 순서를 고정한다.

학습자 read model과 profile/progress reader SQLite 특성 테스트는 concrete adapter와 함께 `apps/api/src/adapters/learning`이 소유한다. course 검색·category 정규화와 한글 정렬의 결정성을 검증하고, course 5개 정렬 각각의 동일 primary 동률을 course ID로 구분해 `limit=1` 첫·중간·마지막 page에 누락·중복이 없는지 고정한다. progress는 같은 timestamp의 course ID tie-break, `in_progress | completed` status와 빈 결과를 검증한다. null 또는 sort와 다른 primary type은 기존 false predicate의 빈 page를 유지한다. core 단위 테스트는 같은 cursor type·방향·next position과 course/progress learning projection의 완료·진행·잠금, `completedAt` fallback, 빈 결과 불변 조건을 DB 없이 검증한다. course/progress route와 app-local mapper는 유효한 서명 cursor 전달, 잘못된 cursor의 서비스 호출 전 `INVALID_CURSOR`, query fingerprint·학습자 scope와 기존 `{ items, nextCursor }` wire parity를 고정한다. 다중 유닛의 같은 레슨 sort order에서도 유닛 순서가 다음 레슨·잠금 상태와 직접 레슨 조회에 일관되게 적용되는지 확인한다. 대표 fixture의 Drizzle logger는 course list 1회, course detail 7회, progress 1건 8회, pinned lesson 10회의 실제 SQLite query 수를 고정하고 step `sort_order` ordering을 확인한다. progress page 비용은 기존처럼 page query 1회와 item당 course detail 7회이며 구조 분리에서 추가 query가 없는지 확인한다. persisted decoder 단위 테스트는 정상·빈 배열·문법 오류·schema 불일치·null·누락 값과 authoritative row metadata를 검증하며, SQLite fixture는 publish 전에 주입한 summary/step 손상이 부분 응답 대신 명시적 내부 오류가 되는지 확인한다. lesson route fixture는 이 오류가 세부 내용을 노출하지 않고 기존 `INTERNAL_SERVER_ERROR` 500과 관측 가능한 오류 class로 정규화되는지 고정한다. lesson 공개 JSON의 전체 key를 순회해 정답·해설·매칭 관계·분류 정답 field가 없는지 확인하고 직접 lesson 잠금도 함께 검증한다. core의 learner step presenter 단위 테스트는 10개 variant별 정확한 object literal projection과 금지 field, 결정적 선택지·항목 순서, top-level·중첩 미래 field 기본 거부와 stable ID 누락 거부를 15개 fixture로 고정한다. production switch의 `assertNever`는 새 variant가 추가될 때 typecheck에서 명시적 projection을 요구한다. cursor codec 단위 테스트는 signature, endpoint, query fingerprint와 학습자 scope가 하나라도 다르면 해석을 거부하는지 확인한다. core service 테스트는 query string과 page envelope 없이 decoded application query와 canonical item page만 repository 경계를 통과하는지 검증한다.

## 주요 명령

```bash
bun run check:toolchain
bun run check:components-config
bun run check:document-drift
bun test ./scripts
bun run test:admin-dev-lifecycle
node scripts/oxlint/workspace-rules.node-test.mjs
bun run check:workspace-inventory
bun run test
bun run test:coverage
bun run test:e2e:flaky-policy
bun run test:e2e
bun run test:storybook
bun run typecheck
bun run lint
bun run build
bun lefthook run pre-commit
```

`check:toolchain`은 루트 manifest의 Bun exact version과 Node major를 현재 runtime 및 모든 CI job의 install 전 setup 선언과 대조한다. `check:architecture-boundaries`, `check:package-interfaces`와 `check:localhost-literals`는 root `lint`의 필수 검사다. architecture ratchet은 파일·specifier 기준 신규 위반과 제거 뒤 남은 allowance를 모두 실패시키며 각 기존 allowance를 제거 MTA에 연결한다. pre-commit은 staged 파일에 관련된 빠른 검사만 실행하고 전체 검증을 복제하지 않는다. document drift와 components config는 `quality-gates.yml`의 root `lint`에서 한 번만 실행하며 별도 workflow를 두지 않는다.

`quality-gates.yml`의 외부 action은 Node.js 24 runtime 세대의 검증된 full commit SHA로 고정하며, `check:toolchain`은 필수 pin 누락과 tag 참조를 실패시킨다.

MTA-48 core contract hard-fail은 두 계층에서 검증한다. root architecture inventory는 test를 포함한 core의 static import·re-export·literal dynamic import·import type에 canonical learning/admin data entrypoint 8개 exact allowlist를 적용한다. Node Oxlint RuleTester는 같은 경계의 static·type-only import, named/all re-export, string·무치환 template dynamic import, TypeScript import type·import-equals와 computed dynamic import 거절 fixture를 고정한다. broad·legacy·임의 하위 source는 실패하고 `learning-tools` 같은 유사 package prefix와 비-core transport adapter는 통과해야 한다.

CI build job은 배포 산출물이 아닌 production build 검증을 위해 `.test` 예약 도메인의 web·admin·API origin을 명시한다. 이 job은 Bun `1.3.10`의 isolated linker로 설치한 뒤 Storybook, admin, web을 포함한 전체 build와 compiled UI CSS sentinel을 연속 검증한다.

`check:document-drift`는 실제 앱 route registry가 import한 HTTP route와 `main.ts`에서 발견되는 WebSocket upgrade 표면을 `BACKEND.md` 인벤토리와 양방향 비교한다. 현재 자료실에는 WebSocket upgrade 표면이 없다. route 추가·삭제 fixture 테스트는 문서 누락과 오래된 문서가 모두 실패로 분류되는지 검증하고, root·engineering·product current 문서의 고신호 자료실 설명도 역사·분석 문서를 제외해 검사한다.

`packages/ui/tsconfig.lint.json`은 실제 TypeScript source와 Vitest 설정 파일만 포함한다. 존재하지 않는 생성기 경로나 빌드 출력 경로를 lint tsconfig에 추가하지 않는다.
앱 `tsconfig.json`의 test alias는 실제 테스트 지원 디렉터리가 있을 때만 둔다.

워크스페이스 단위 검증 예시는 다음과 같다.

```bash
bun run --filter=@workspace/api test
bun run --filter=@workspace/core test
bun run --filter=@workspace/db test
bun run --filter=@workspace/resource-document test
bun run --filter=@workspace/web test
```

어드민 개발 감시 설정은 `bun run test:admin-dev-lifecycle`로 실제 dev server를 실행해 다음 조건을 확인한다. 이 smoke는 Windows·Linux CI matrix에서 실행한다.

- 앱과 API가 표준 포트에서 모두 기동한다.
- disposable DB와 전용 workspace fixture만 사용하고 기존 source를 변경하지 않는다.
- workspace fixture를 한 번 변경하면 이를 import하는 API process가 정확히 한 번 재시작한다.
- Bun이 import한 workspace 파일을 프로젝트 디렉터리 밖으로 판정하는 경고가 발생하지 않는다.
- harness가 소유한 process만 종료하고 3001·4001 port와 Next lock을 모두 해제한다.

## 커버리지 기준

- correctness는 `bun run test`가 소유하며 루트 `vitest.workspace.ts`의 test 가능 workspace 전체를 실행한다. CI는 root Bun tooling test와 Node 전용 Oxlint rule test도 별도로 실행한다.
- `bun run test:coverage`는 canonical inventory의 13개 runtime coverage target을 각각 해당 디렉터리에서 실행한다. Bun runtime 경계는 Bun native coverage를 사용하고 나머지는 Node/Vitest V8 coverage를 사용한다.
- `packages/repository-tooling`은 repository 실행 도구이므로 runtime coverage에서 제외한다. `apps/storybook`은 별도 interaction·접근성 job에서 실행하고 `packages/config`는 test script가 없어 제외한다.
- workspace별 LCOV는 `coverage/<workspace>/lcov.info`에 보관하고 전체 LCOV는 `coverage/lcov.info`로 집계한다.
- 각 runtime workspace는 `src`의 실행 코드를 `coverage.include`로 명시한다. 테스트, Storybook story, 타입 선언, 생성 파일, 설정 파일은 분모에서 제외한다.
- 인증, repository, migration, 동기화처럼 보안·데이터 무결성에 직접 영향을 주는 모듈은 측정 baseline 이하로 떨어지지 않아야 한다.
- CI는 `coverage/<workspace>/`의 LCOV와 요약을 단일 artifact로 14일 보존한다. 새 runtime 파일은 테스트에서 import하지 않아도 분모에 포함되어 전체 coverage를 낮춘다.
- 새 정책, 권한, 보안, 데이터 보존 로직은 threshold 유무와 관계없이 회귀 테스트를 추가한다.
- 단순 markup 변경은 UI smoke 수준으로 충분할 수 있다.
- 공유 package, repository, auth, migration 관련 변경은 테스트 범위를 넓힌다.

2026-07-13 변경 단위 2 회귀 검증은 목표 Toolchain인 Bun `1.3.10`, Node.js `24.15.0`에서 실행했다.

| 위험 파일                                                           | 측정 line coverage | 최소 기준 |
| ------------------------------------------------------------------- | -----------------: | --------: |
| `apps/admin/src/lib/auth/admin-auth-navigation.ts`                  |             75.00% |       75% |
| `apps/api/src/adapters/ai-chat/admin-ai-chat-drizzle.repository.ts` |            100.00% |      100% |
| `packages/db/src/migrations/migrate.ts`                             |             89.80% |       87% |
| `packages/resource-document/src/resource-markdown.ts`               |             87.84% |       87% |

같은 환경에서 전체 correctness는 46.34초, 순차 coverage는 33.98초였다. correctness와 coverage의 재실행은 독립 판정을 위한 의도된 비용이다. Bun 전체 테스트와 SQLite를 함께 사용하는 workspace의 경합 자료가 충분하지 않으므로 coverage는 순차 실행을 유지하며, runner가 workspace별 duration을 출력한다.

`packages/resource-document`의 coverage 실행 계획은 현재 공개 Markdown 계약을 소유한 `resource-markdown`, `resource-markdown-import`, `resource-image-node` 세 suite를 명시한다. 중심 변환 경계인 `resource-markdown.ts`의 현 기준선은 74개 실행 라인 중 65개를 실행한 87.84%이므로, 기존 데이터 무결성 경계와 같은 87% 최소 기준을 유지한다. 새 실행 라인은 이 기준을 통과하려면 해당 계약 suite에서 함께 검증해야 한다.

## API 테스트 기준

- route 테스트는 HTTP status, JSON body, CORS, request id, 인증 실패를 확인한다.
- 학습자 API는 active session, unauthorized, unavailable account 케이스를 구분한다.
- 어드민 API는 operator와 owner 권한 차이를 검증한다.
- JSON body 오류는 malformed JSON과 schema 오류를 구분한다.
- OpenAPI 생성 route는 실제 등록 route 기준으로 검증한다.
- MTA-40에는 삭제 전 두 runtime의 최종 parity 실행 기록을 historical evidence로 보존한다. 최종 source에서는 `admin-foundation`과 `admin-content`, `admin-identity`, `admin-dashboard-analytics`, `admin-settings`, `admin-ai-chat`, `admin-resource-library` target contract suite가 target runner만 기동한다. status, header, JSON/text/bytes/SSE, effect journal과 exact OpenAPI path/component를 검증하고 cookie/session, Bearer-only 거절, CORS, trusted origin, body limit, password-change session revocation, owner/operator/비인증과 오류 redaction을 고정한다.
- 관리자 dashboard·analytics는 각각의 use case 테스트가 전용 reader에 전달하는 query와 반환값을 검증한다. typecheck fixture는 두 reader와 use case method key를 정확히 고정하고 composition fixture는 각 factory의 직접 조립을 검증한다. package-interface 검사는 제거된 catch-all 관리자 repository/service 파일·symbol 재도입을 실패시킨다.
- 관리자 content transport fixture는 flat application page가 기존 pagination response로 mapping되는지, archive `ok`가 기존 acknowledgement가 되는지와 course/editor/content-reset의 잘못된 application 성공값이 route response validation에서 `500`으로 격리되는지 확인한다. owner/operator, 저장·발행 stale version `409`, 게시 불가 draft `422`, `If-Match` 누락 `428` 의미도 route 경계에서 고정한다. content 전용 use case와 owner-command typecheck는 application 직접 호출의 이중 인가를, composition fixture는 content factory 직접 조립을 보호한다.
- 관리자 identity transport fixture는 flat application user page가 기존 pagination response로 mapping되는지, delete `ok`가 `{ deleted: true }`가 되는지와 user detail·status의 잘못된 application 성공값이 route response validation에서 `500`으로 격리되는지 확인한다. 비인증 `401`, operator `403`, not-found `404`, status body `400`, profile soft-delete와 OpenAPI path/security/status도 함께 고정한다. typecheck fixture는 admin reader/query와 auth mutation port/use case method를 capability별로 고정하고 composition fixture는 같은 adapter의 두 factory 직접 조립을 검증한다. SQLite fixture는 soft-delete의 `deletedAt`·`deleted`와 후속 상태 변경의 `deletedAt=null`을 보호한다.
- 관리자 dashboard·analytics transport fixture는 기간 상한, search·sort/direction·page query가 명시적 read query로 전달되고 flat lesson page가 기존 pagination response로 mapping되는지 확인한다. dashboard·summary·lesson page의 잘못된 application 성공값은 route validation에서 `500`으로 격리한다. SQLite fixture는 빈 snapshot/page, 기간 계산·정렬·DB pagination과 reader source의 write 호출 부재를, OpenAPI fixture는 기존 path·session security·query parameter를 고정한다. composition fixture는 두 reader가 forwarding use case 없이 route에 직접 주입됨을 확인한다.
- 관리자 settings transport fixture는 notice/legal body의 필드·길이 상한을 application 호출 전에 검증하고, 조회·두 저장 route의 잘못된 application snapshot을 response validation에서 `500`으로 격리한다. owner/operator `200`·`403`, 비인증 `401`, 잘못된 body `400`과 OpenAPI path·security·길이 제한도 고정하며 `If-Match`·`ETag` 부재를 보호한다. SQLite fixture는 빈 기본값, notice/legal 독립 저장, last-write-wins, transaction rollback과 같은 입력 재시도를 계속 보호한다. 전용 use case와 typecheck fixture는 `SettingsRepository` method·command/result를 고정하고 composition fixture는 독립 factory 직접 조립을 검증한다.
- 관리자 AI chat transport fixture는 canonical conversation 배열과 `messageItems` history가 기존 list/detail wrapper로 mapping되는지, 잘못된 application 결과가 JSON `500` 또는 schema 검증된 SSE error로 격리되는지 확인한다. message·pagination `400`, 비인증 `401`, not-found `404`, rate limit `429`, chunk→done 순서, provider 부재·실패, 소비자 취소와 30초 timeout의 assistant 미저장을 고정한다. OpenAPI fixture는 path·session security·query/body 상한과 `text/event-stream`을, SQLite fixture는 관리자 격리·title·ordering·pagination·message count·updatedAt을 유지한다. 전용 use case와 typecheck fixture는 `AiChatRepository`와 use case method를, composition fixture는 독립 factory 직접 조립을 고정한다. architecture fixture는 persistence adapter의 Mastra·OpenAI import와 route의 persistence adapter 직접 import를 거부한다.
- 관리자 자료실 transport fixture는 tree/search request와 세션 actor의 application mapping, `400`·`404`·`409`·`422` rejection, 문서 ETag와 stale `412`, import envelope, Markdown 다운로드 header, 이미지 signature·인증·asset command와 영구 삭제 object key 비노출을 고정한다. core가 잘못된 성공값을 반환하면 route response schema validation이 외부 응답 전에 `500`으로 격리하는지도 확인한다.
- MTA-48 회귀 검증은 위 learner/admin/resource route fixture와 OpenAPI fixture를 재사용한다. 별도 중복 parity harness를 만들지 않으며 AI chat의 JSON·SSE route와 전용 OpenAPI fixture도 함께 실행한다.
- 학습자 웹 앱은 `@workspace/core`를 직접 import하지 않는다는 아키텍처 테스트로 API 계약 경계를 고정한다.
- 어드민 API route의 wire contract schema는 `@workspace/contracts/admin`에서 직접 가져온다. `apps/admin`은 `@workspace/core`를 직접 import하지 않고, 관리자 contract는 허용된 feature Adapter에서만 사용한다는 아키텍처 테스트로 앱 모델 seam을 고정한다. feature HTTP 계약 테스트는 schema가 잘못된 성공 응답을 거절하고 검증된 canonical DTO를 identity mapper 없이 전달하는 성공 경로를 확인한다. 삭제된 중앙 `AdminApi`와 `http-admin-api` import가 다시 생기지 않는지도 함께 검사한다.

## DB 테스트 기준

자료실 DB 테스트는 같은 문서 버전의 조건부 갱신 경합, 최대 깊이 3, 이름 충돌, 폴더 대상 이동, 하위 트리 휴지통 이동·복원·영구 삭제와 활성 문서 전용 FTS를 검증한다. 이미지 경계는 JPEG·PNG·WebP MIME signature, 5MB 상한, 필수 대체 텍스트, 문서 소속과 R2 실패 로그를 확인한다. 브라우저 스모크는 `ENABLE_TEST_AUTH=true`로 로그인해 명시적 저장, 미저장 이탈 경고, 포커스 복귀 재검증과 충돌 복구를 확인한다.

자료실 HTTP 통합 테스트는 조회 응답의 Markdown·version·강한 ETag, `If-Match` 누락의 `428`, stale 버전의 `412`와 최신 문서 반환을 검증한다. 저장 실패와 충돌은 기존 Markdown·검색 색인·버전을 바꾸지 않아야 한다. 프론트엔드 테스트는 명시적 저장 전 dirty 상태, 저장 중 중복 제출 차단, 포커스 복귀 재검증과 충돌 뒤 로컬 편집본 보존을 고정한다.

관리자 persistence SQLite 특성 테스트는 capability adapter와 함께 `apps/api`에 있다. content, identity, dashboard·analytics, settings, AI chat, 자료실 테스트는 각각 `apps/api/src/adapters/content`, `apps/api/src/adapters/identity`, `apps/api/src/adapters/dashboard`·`apps/api/src/adapters/analytics`, `apps/api/src/adapters/settings`, `apps/api/src/adapters/ai-chat`, `apps/api/src/adapters/resource-library`가 소유한다. AI chat fixture는 소유 관리자 격리, ID·title normalization, conversation/message ordering과 pagination, message count·updatedAt을 고정한다. settings fixture는 빈 기본값, notice/legal 독립 저장, last-write-wins, 두 번째 행 실패의 전체 rollback과 같은 입력 재시도를 메모리·파일 DB에서 고정한다. 각 DB fixture는 자기 client를 열고 `finally`에서 닫으며, 업무 seed는 capability test에 명시적으로 둔다. 삭제된 concrete admin aggregate와 전용 composition test를 다시 만들지 않는다.

- baseline migration은 in-memory DB에 적용할 수 있어야 한다.
- seed는 반복 실행해도 stable ID 기준으로 같은 결과를 내야 한다.
- seed에서 빠진 콘텐츠는 삭제가 아니라 `archived` 전환으로 검증한다.
- repository test는 DB row와 도메인 DTO mapping을 함께 확인한다.

## 프론트엔드 테스트 기준

- 화면 텍스트와 접근성 role을 사용자 관점으로 조회한다.
- admin production build 뒤 `check:resource-route-bundle`을 실행해 `/resources`와 `/resources/trash` 초기 chunk에 Lexical을 포함한 편집기 런타임이 없고 합산 gzip이 275,000 bytes 이하인지 검사한다. 문서 편집 chunk는 `[documentId]` route의 동적 경계 뒤에서만 내려받는다.
- 같은 build 산출물에서 `check:admin-chart-route-bundle`을 실행해 대시보드와 `/analytics` 초기 chunk에 Recharts가 없는지 검사한다. 초기 JS gzip 예산은 각각 60,000 bytes와 75,000 bytes이며 요약·접근성 표는 서버에서 렌더링하고 차트 시각화 client island만 viewport 200px 이내에서 동적 로드한다.
- web landing build는 `check:landing-route-bundle`로 정적 section이 client module에 들어가지 않았는지 검사한다. landing client module은 `landing-motion.tsx` island만 허용하고 초기 JS 합산 gzip은 50,000 bytes 이하로 제한한다.
- API는 포트 mock 또는 명시적 test double로 대체한다.
- 학습자 웹 HTTP adapter와 feature는 `@workspace/contracts/learning`의 schema와 추론 타입을 직접 사용한다. identity mapper, 복제 제품 타입, generated OpenAPI 타입과 `writing-app-api-contract` 파일은 아키텍처 테스트에서 금지한다.
- 학습자·관리자 HTTP transport 테스트는 `@workspace/http-client`의 canonical result 생성자를 직접 사용한 뒤에도 앱별 오류 union narrowing, network/contract 오류 분류와 `status: "ok" | "error"` 분기가 유지되는지 검증한다. 앱 local result 파일은 type-only 오류 specialization만 소유한다.
- 학습자 API route 테스트는 unknown request field의 `VALIDATION_ERROR`, 성공 응답 runtime parse 실패의 redacted `api.contract.response_invalid` event와 request ID가 포함된 `INTERNAL_SERVER_ERROR`를 검증한다.
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
- fixture server가 DB 초기화를 마친 뒤 단일 `apps/api` process와 학습자·관리자 Next.js 웹을 순서대로 기동하므로 실행 중인 API가 초기화 대상 DB를 먼저 열 수 없다.
- UI style 시각 테스트는 레슨 시작 저장 요청을 브라우저 경계에서 고정 응답으로 대체해 공유 E2E DB의 학습 진행을 변경하지 않는다. 이후 correctness 시나리오는 초기 레슨 상태를 독립적으로 검증한다.
- 학습자 E2E fixture는 draft 콘텐츠를 넣은 뒤 실제 불변성 제약을 거쳐 published로 전환한 단일 레슨 코스를 사용한다. 실제 Chromium에서 레슨 시작, 객관식 오답 재시도와 정답, WRITE 답안, 결정적 test AI provider의 코칭, 레슨·코스 완료를 검증한다.
- 관리자 owner/operator 로그인·역할, 보호 route·logout·비로컬 API origin을 실제 Chromium에서 검증한다. 관리자 웹과 통합 API는 각각 `admin-api.localhost:3101`·`admin-api.localhost:4100`을 사용하므로 host-only session cookie가 관리자 SSR에도 전달된다.
- runner는 시작 전 점유 port·lock을 fail-fast하고, 종료 후에는 종료된 PID가 기록된 stale Next lock만 회수한다. 3100·3101·4100·4199 listener와 lock이 남으면 E2E를 실패로 처리한다.
- 로컬은 retry 0으로 즉시 실패하고 CI만 retry 1회를 허용한다. 고정 port와 공유 SQLite를 격리하기 전까지 `workers: 1`을 유지한다.
- CI는 `failOnFlakyTests`를 활성화해 최초 실패 뒤 retry 성공도 job 실패로 처리한다. list reporter는 최초 실패와 retry 결과를 함께 출력한다.
- trace는 최초 실패 실행이 아니라 첫 retry 실행에만 생성한다. 실패 screenshot과 첫 retry trace는 `output/playwright/`에 남기며 CI가 성공·실패와 무관하게 14일 artifact로 보존한다.
- `bun run test:e2e:flaky-policy`는 제품 E2E와 server를 사용하지 않는 격리 fixture로 최초 실패·retry 성공·flaky 실패 종료·단일 `trace.zip` 생성을 검증한다. CI는 실제 E2E보다 먼저 이 계약을 검증한다.
- Google OAuth 네트워크 요청은 허용하지 않는다.

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
- 공통 Hono fixture는 body limit의 `max`와 `max+1`, 쿠키 mutation의 trusted origin, 쿠키 없는 bearer mutation을 검증한다. 실행 앱 fixture는 같은 관찰 항목으로 학습자 `1 MiB`와 관리자 `6 MiB`의 실제 ASCII JSON byte 수를 확인하고 초과 요청이 application service를 호출하지 않는지 검증한다.
- 학습자와 관리자 앱의 표 기반 fixture는 빈 body·잘못된 JSON, 신뢰하지 않은 origin, request ID와 최종 오류 shape를 각각 고정한다. 공통 logger sentinel은 Authorization, Cookie, password, token, raw body와 query secret이 request·감사 로그에 나타나지 않는지 확인한다.
- 현재 characterization에서 공통 origin/body-limit 거절은 관리자 API에서 각각 `403`/`413`이지만 학습자 오류 정규화 뒤에는 모두 `500 INTERNAL_SERVER_ERROR`다. 이 차이는 현재 동작에 대한 검증된 사실이며 목표 정책으로 해석하지 않는다.
- OpenAPI 테스트는 실제 인증 설정과 공유하는 쿠키 이름과 보호 route security scheme을 확인한다.
- SSE와 파일 다운로드 테스트는 캐시 정책 적용 뒤에도 스트림 content type과 첨부 응답 계약이 유지되는지 확인한다.

MTA-4 기준선은 저장소 고정 Bun 버전으로 다음 다섯 workspace를 검증한다.

```bash
bunx bun@1.3.10 run --filter=@workspace/api test
bunx bun@1.3.10 run --filter=@workspace/contracts test
```

## 관리자 API 경계 검증 (2026-07-12)

공통 HTTP 전송 계층은 정상 JSON, 빈 응답, 잘못된 JSON, 다운로드, 네트워크 실패를 표 기반으로 검증한다. 각 관리자 기능 어댑터는 독립 계약 테스트를 가지며, 구조 테스트는 기능 간 DTO 결합과 삭제된 중앙 API로의 회귀를 차단한다. route 테스트는 wire request가 application command로 변환되는 값을 확인한다. 서버 조립 테스트는 기능별 서비스 연결, 조립 실패 정리와 중복 종료에서도 데이터베이스 close가 한 번만 수행됨을 검증한다.

## Root tooling 회귀 테스트

공통 dependency version drift와 디자인 baseline 증감은 `scripts/*.test.ts`의 negative fixture로 검증한다. Bun 테스트는 exact directory path인 `bun test ./scripts`로 실행해 앱 내부 `src/scripts`를 선택하지 않는다. Oxlint plugin test는 Bun discovery와 겹치지 않는 `workspace-rules.node-test.mjs`를 Node.js로 실행한다. 정적 검증은 제품 lint warning을 오류로 취급한다.

`scripts/local-onboarding.test.ts`는 누락된 `.env`의 credential 치환 생성, 기존 파일 보존, 두 번째 실행의 멱등성, toolchain·테스트 인증·공유 SQLite 진단을 disposable fixture에서 검증한다. 실제 사용자 `.env`와 `data/api.sqlite`는 테스트 대상으로 사용하거나 변경하지 않는다.

배포 tooling unit test는 Compose의 필수 서비스·port·network·SQLite volume 계약, Ansible playbook 선택, 네 production image의 Buildx 인자·host port 비공개·DB volume 경계·비 root user 판정을 Docker daemon 없이 검증한다. MTA-40 저장소 구성 계약은 `api`의 `admin-api-unified` alias, `admin-api`의 rollback profile, 두 public API host를 `api:4000`으로 보내는 Caddy upstream을 함께 확인한다. 이는 저장소 정적 구성 검증일 뿐 실제 production 적용·관찰 결과는 아니다. Container image lock test는 Bun·Node base와 Caddy·Cloudflared·Litestream 운영 image의 중앙 tag+digest와 실제 사용 경로가 일치하는지 검증한다. Registry 보존 test는 7일이 지난 candidate-only version만 정리 대상으로 분류하고 release·untagged·최근 candidate와 자동 삭제 설정을 거부하는지 확인한다. Ubuntu bootstrap 검사는 일회성 runner 플래그, OS·architecture와 두 번째 Ansible recap의 `changed=0` 판정을 unit test로 보호한다. Image release metadata test는 production origin, source SHA, GHCR image name·digest, 공개 설정·취약점 정책 digest와 네 service manifest의 동일성을 검증한다. 취약점 정책 test는 `HIGH` 이상 차단, 예외 필수 metadata·만료·중복과 service별 최소 Grype 설정 생성을 검증한다. Workflow contract test는 성공한 동일 저장소 `main` 품질 게이트만 exact SHA로 candidate를 만들고 고정 Grype 검사 뒤 release tag, SBOM·provenance·attestation과 digest artifact를 생성하는지 정적으로 검사한다. 실제 Caddy·Litestream 설정, image build·runtime smoke와 bootstrap 두 번 실행은 Docker와 passwordless sudo가 제공되는 명시적인 Ubuntu 24.04 CI job에서 실행한다.

CI의 전체 test job은 `bun run test -- --summarize --continue=always` 결과와 Turborepo `2.10.4` summary v1을 사용한다. manifest에 명령이 있다는 사실은 `지원`으로만 표시하며 실제 summary가 있을 때만 `실행`, `cache hit`, `실패`, `건너뜀`, `제외`를 보고한다. correctness job과 coverage job은 서로 독립적으로 실패 원인을 판정한다.

## 관리자 인증·권한 회귀 테스트

- 실제 Better Auth와 in-memory DB로 owner의 비밀번호 로그인과 세션 발급을 검증한다.
- owner/operator의 route·application 권한 매트릭스와 owner 변경 작업의 역할 기반 거부를 검증한다.
- 관리자 UI는 비밀번호 로그인 성공·실패와 안전한 다음 경로 이동을 검증한다.
- 비밀번호 변경 통합 테스트는 실제 Better Auth adapter가 교체 발급한 session과 기존 session이 모두 서버에서 폐기되는지 검증한다.
