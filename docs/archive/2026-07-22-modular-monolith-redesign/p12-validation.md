# P12 구현 증거

## 검증 기준

- 기준 commit: `41978d9c0d9e85f8e046e10e2bc99b4dbaeeae75`
- 실행 시각·환경: 2026-07-23T07:26:00+0900, macOS arm64, Bun 1.3.10, Node.js 24.16.0
- production 배포·OAuth·실제 외부 AI/storage 호출은 실행하지 않았다.

## 공통 frontend 경계

web과 admin의 실제 import graph에서 module·DB·Drizzle 직접 의존과 feature 간 내부 import는 0개다. dependency-cruiser에 `app → features → entities → shared` 역방향 금지, feature 격리, client-facing source→server 경계 금지 규칙을 추가하고 허용·금지 fixture로 각 규칙의 포착을 검증했다. Storybook의 내부 dependency는 UI와 TypeScript config로 제한했다.

두 앱의 `src/server`와 feature `server` source는 `server-only` marker를 가져야 하며 package interface 검사가 누락을 거부한다. Next production build는 marker가 client graph에 유입되지 않음을 함께 검증한다. Vitest는 공식 package의 빈 server 구현만 alias해 DAL 단위 테스트를 유지하며 production bundler 동작은 완화하지 않는다.

초기 조회는 Server Component가 feature DAL 또는 transport-neutral feature adapter를 통해 통합 API를 직접 호출한다. 자기 Next Route Handler를 다시 호출하지 않으며 브라우저 상호작용 뒤의 조회·변경만 client adapter를 사용한다. URL은 route, 초기 server data는 Server Component, 입력 draft·dialog·theme는 가까운 client component가 소유한다. 모든 JSON 성공 응답은 endpoint별 canonical Zod schema로 parse하고 network·HTTP·contract error를 구분한다.

## web

학습자 인증은 auth infra의 learner client와 server session token 경계를 사용하고 course·lesson·progress·AI transition은 learning·identity canonical contract를 소비한다. route는 async params·searchParams와 server DAL을 사용하며 학습 전이 뒤 이동은 Link 또는 Next router 경계에 남는다. loading·empty·validation·contract error·auth expiry와 AI provider·제한 상태는 33개 test file의 91개 test로 검증했다.

landing production route는 client island를 motion 경계로 제한한다. bundle guard 결과 초기 chunk는 7개, gzip 45,302 bytes였으며 허용되지 않은 landing client module은 없었다.

## admin

관리자 인증은 분리된 admin auth client와 server session DAL을 사용한다. identity·content·resource-library·operations adapter는 context별 canonical contract를 parse하며 Server Action은 매 호출마다 session을 다시 확인하고 API의 최종 인가를 통과한다. owner-only mutation은 UI disabled 상태와 API 403을 독립 검증하고 archive·delete·reset은 확인 UI를 거친다.

Lexical React editor는 admin의 resource-document-editor feature에만 있고 document route에서 동적 import된다. Recharts도 viewport 인접 시 동적 import된다. `/resources`와 `/resources/trash` 초기 chunk에는 Lexical/Yjs가 없고 gzip 124,401 bytes이며, dashboard와 analytics 초기 chunk에는 Recharts가 없다. version conflict·permission·provider error·destructive confirm을 포함한 43개 test file의 114개 test가 통과했다.

## Storybook과 자동 검증

Storybook story는 제품 API·auth·module을 import하지 않고 shared UI의 공개 subpath만 소비한다. 42개 story file의 interaction·a11y 179개 test와 static build가 통과했다. vendor package의 기존 module directive·chunk 경고는 있었지만 build 종료 코드는 0이었다.

| 검증                                            | 결과                                            |
| ----------------------------------------------- | ----------------------------------------------- |
| frozen install                                  | `bun install --frozen-lockfile` 통과            |
| architecture·dead-code·package interface·Oxlint | root `lint` 통과, warning 0                     |
| typecheck                                       | 27/27 task 통과                                 |
| web·admin unit/UI                               | 33 files·91 tests, 43 files·114 tests 통과      |
| Storybook interaction·a11y                      | 42 files·179 tests 통과                         |
| web·admin·Storybook build                       | 3개 build 통과                                  |
| route bundle guard                              | landing·chart·resource 3개 검사 통과            |
| learner·admin E2E                               | `ENABLE_TEST_AUTH=true`, 3개 핵심 시나리오 통과 |
| process cleanup                                 | E2E port 3100·3101·4100·4199 listener 0개       |
| format                                          | 전체 1,375 files check 통과                     |

E2E artifact는 `output/playwright/report`와 `output/playwright/test-results`에 생성되며 실행용 DB와 server는 임시 디렉터리에서 정리됐다.

## 선택과 제한

`server-only` marker는 실수로 인한 client bundle 유입을 build 시점에 차단하지만 각 frontend workspace에 작은 직접 dependency와 test alias가 추가된다. 경로명만 신뢰하는 정적 규칙보다 보안 실패가 더 이르게 드러나는 이점을 우선했다.

feature별 root barrel은 새로 만들지 않았다. app 조립자가 필요한 좁은 내부 subpath를 직접 읽는 현재 방식은 공개 surface 유지 비용이 작지만, feature를 별도 package로 추출할 때는 소비 계약을 다시 정의해야 한다. 현재 두 앱 안의 feature는 독립 배포 단위가 아니므로 이 trade-off가 더 단순하다.

검증은 repository fixture와 격리된 local E2E에 근거한다. production CSP report, 실제 OAuth, 실제 provider 장애와 운영 브라우저 분포까지 검증됐다는 주장은 하지 않는다.
