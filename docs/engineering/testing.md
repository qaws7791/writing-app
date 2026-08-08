# 테스트 전략

## 목적

이 문서는 테스트 우선순위, 격리 원칙과 품질 판단 기준을 정의한다. 현재 test workspace, 명령, fixture와 CI job은 root task와 각 workspace의 test 설정이 소유한다.

## 원칙

- 사용자에게 보이는 동작과 보안·데이터 경계를 먼저 검증한다.
- 순수 정책은 단위 테스트로, I/O와 transaction은 통합 테스트로, 공개 HTTP·UI 흐름은 경계 테스트로 검증한다.
- 테스트 편의를 위해 production 동작을 우회하거나 제품 코드에 조건문을 추가하지 않는다.
- 테스트 fixture는 명시적으로 만들고, 개발자 데이터·설정·실행 중 process를 재사용하거나 삭제하지 않는다.
- DOM·앱 테스트는 예상하지 않은 `console.error`·`console.warn`을 실패로 올린다. 실패 경로를 의도적으로 실행해 서드파티 runtime이 로그를 남긴다면 allowlist를 두지 않고 해당 runtime에 로그 목적지를 주입해 끊는다.
- 실패 재현에 필요한 입력과 assertion은 test source에 두고, 특정 실행의 결과는 archive 보고서에 남긴다.
- 테스트 이름은 방지할 사용자·시스템 위험을 드러내고, 공개 동작과 실패 경계를 검증한다. source 문자열, 내부 이름·배열 순서, `Object.freeze` 적용 여부나 한 줄 wrapper의 mock 전달 자체는 회귀 계약으로 삼지 않는다.
- route 조립, health와 종료 signal 같은 runtime 연결은 반환 객체 단위 테스트보다 실제 HTTP, process 또는 배포 smoke 경계에서 검증한다.
- 고정 port와 개발 build directory를 사용하는 로컬 runtime smoke는 기본 repository test 대상에서 분리하고 전용 명령으로만 실행한다.

## 테스트 계층

| 계층     | 검증 대상                                                          |
| -------- | ------------------------------------------------------------------ |
| 단위     | 도메인 정책, parser, mapper, schema와 오류 변환                    |
| 서비스   | use case와 port의 성공·거부·재시도 의미                            |
| 통합     | persistence adapter, transaction, migration, 외부 provider adapter |
| HTTP     | request 검증, 인증·인가, response·header·오류 계약                 |
| UI       | 사용자 상태, 접근성, 오류와 loading·empty state                    |
| 브라우저 | 실제 runtime 조립에서의 핵심 사용자 흐름                           |
| 배포     | 설정 정합성, image smoke, bootstrap·복구 절차                      |

## 도구별 책임

| 도구                                 | 책임과 선택 기준                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vitest                               | 도메인의 순수 규칙과 application use case를 기본 검증한다. 공통 Node package 설정은 root workspace가 소유하고, DOM이 필요한 대상과 앱 고유 loader가 필요한 대상만 전용 config를 둔다. SQLite adapter는 격리된 실제 DB와 transaction·수명주기를 검증한다.                                                                                   |
| Testing Library                      | keyboard·focus·비동기 상태·오류 복구처럼 여러 사용자 동작과 상태 전이가 얽힌 복잡한 interaction을 검증한다. 구현 세부나 정적인 markup 존재 여부만 확인하는 용도로 확대하지 않는다.                                                                                                                                                         |
| MSW                                  | 생성 client를 소비하는 UI integration에서 실제 network 경계를 대체한다. 생성된 schema·handler를 계약으로 사용하고, 응답 shape를 테스트마다 수기로 복제하거나 application port를 우회하지 않는다.                                                                                                                                           |
| Playwright                           | 인증, routing, API와 browser rendering이 함께 동작해야 하는 핵심 사용자 흐름을 실제 runtime 조립으로 검증한다. 모든 분기나 하위 UI 상태를 E2E로 중복 검증하지 않는다.                                                                                                                                                                      |
| Lighthouse CI·route bundle budget·k6 | PR에서는 초기 client bundle 회귀를 빠르게 막고, main에서 사용자 체감 페이지를 검증한다. k6는 image release digest를 staging에 배포한 뒤 실행해 production 진행을 차단한다. 실제 대상·예산·시나리오는 실행 설정이 소유한다.                                                                                                                 |
| Storybook                            | story source는 실행 가능한 UI 카탈로그를 제공한다. `ci-test` 태그가 있는 story만 상태 전이·초점·키보드·오류·비활성·접근성 계약을 자동 검증한다. 공용 UI 패키지가 도메인 컴포넌트까지 소유하므로 제품 화면 조합도 Storybook의 대상이며, primitive story와 분리해 Pattern 또는 Recipe에 둔다. 삭제된 기능의 story나 fixture는 남기지 않는다. |

## 테스트 데이터와 인증

- DB fixture는 각 테스트가 열고 닫으며, 실패 경로에서도 자원을 정리한다.
- SQLite fixture는 추적 중인 statement를 모두 finalize한 뒤 strict close하고 파일을 즉시 제거한다. 강제 GC, 지연 또는 삭제 재시도로 수명주기 결함을 숨기지 않는다.
- browser와 E2E 테스트는 production OAuth provider에 credential을 제출하지 않는다. Google 로그인은 가짜 client 설정으로 실제 시작 handler와 callback URL까지만 검증하고 외부 이동 직전에 가로챈다. 이메일 인증은 fixture DB의 확인된 사용자를 production과 같은 handler로 검증한다.
- 로컬 E2E는 Caddy를 기동하지 않으므로 기본 browser context마다 RFC 5737 문서용 trusted client IP를 주입하며, 이는 production Caddy의 client IP header 덮어쓰기 경계를 대체하거나 검증한 증거가 아니다.
- E2E fixture를 위한 test-only 인증 route나 제품 UI 조건문을 두지 않는다. 인증 runtime은 주입받은 입력만으로 조립하며, 환경을 직접 읽어 분기를 켜는 통로가 생기지 않도록 커스텀 lint 룰이 `process.env`·`Bun.env`·`import.meta.env` 접근을 차단한다.
- E2E에서 정지·삭제·탭 종료처럼 상태를 변경하거나 중간 실패 시 오염을 남길 수 있는 시나리오는 전용 seeded actor·lesson을 사용한다. 다른 시나리오의 선행 실행이나 조건부 시작 경로에 의존하지 않는다.
- secret, 실제 사용자 데이터, production endpoint와 공유 storage를 fixture에 사용하지 않는다.

## 브라우저 지원 smoke

브라우저 지원 profile과 실행 대상은 [Playwright config](../../playwright.config.ts)가 소유한다. 각 페이지의 console warning·error와 page error는 allowlist 없이 실패로 처리한다. spec이 `@playwright/test`에서 `test`·`expect`를 직접 가져와 이 gate를 우회하지 못하도록 lint가 value import를 차단한다.

| 지원 대상                           | 저장소 자동화 증거                                                    | 출시 승인 증거                                      |
| ----------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| 현재 Chromium                       | PR 핵심 smoke와 main 전체 흐름을 Playwright 번들 engine으로 검증한다. | 저장소 gate 결과를 사용한다.                        |
| 이전 Chromium                       | 저장소 Playwright가 검증하지 않는다.                                  | 외부 browser grid 또는 device farm 결과가 필요하다. |
| 최신·직전 iOS Safari 실기기         | 저장소 Playwright가 검증하지 않는다.                                  | 외부 device farm 실기기 결과가 필요하다.            |
| WebKit 기반 mobile 조기 호환성 신호 | main 전체 흐름을 iPhone descriptor로 검증한다.                        | 실기기 Safari 증거를 대신하지 않는다.               |

Playwright WebKit과 device descriptor는 실제 iOS Safari 기기 자체가 아니다. 따라서 `release-webkit` 성공을 최신·직전 iOS Safari 지원의 완료 증거로 과장하지 않는다.

## 성능 회귀 gate

PR production build는 [route bundle 검사](../../scripts/check-route-bundles.ts)로 web의 landing·learner home·lesson shell과 admin 초기 client chunk의 gzip 합계를 검사한다. 예산을 넘으면 큰 chunk부터 경로와 gzip 크기를 출력해 원인을 찾을 수 있어야 한다. 이 검사는 `size-limit`과 같은 빠른 build artifact 예산 역할이며 별도 cache나 측정 우회 계층을 두지 않는다.

main 품질 workflow는 격리 fixture와 테스트 인증 위에 web production standalone을 새로 조립하고 [Lighthouse CI 설정](../../lighthouse-ci.config.cjs)의 landing·learner home·lesson shell mobile 예산을 세 번 측정한다. 실행 wrapper는 fixture와 서버 수명주기, 인증 cookie와 Playwright Chromium 경로만 제공하고 측정·재시도·판정은 Lighthouse CI에 맡긴다. `error` assertion은 [Lighthouse CI 공식 설정 계약](https://github.com/GoogleChrome/lighthouse-ci/blob/v0.15.1/docs/configuration.md)에 따라 non-zero로 실패하며 report는 CI artifact로 보존한다.

staging k6는 전용 학습자 session과 고정 fixture로 health, course list, lesson start, multiple-choice 오답 submit만 실행한다. 오답은 `retry`에 머물러 같은 시나리오를 반복할 수 있고 AI feedback endpoint와 provider는 호출하지 않는다. [k6 threshold](https://grafana.com/docs/k6/latest/using-k6/thresholds/)가 check·오류율·지연 경계를 넘으면 실패하며, [시나리오](https://grafana.com/docs/k6/latest/using-k6/scenarios/)와 숫자 예산은 [실행 설정](../../scripts/k6-staging-config.js)이 소유한다. 로컬에서는 source·설정·bundle 산출물만 검증한다. 실제 외부 부하는 image release가 검증한 동일 digest를 승인된 `staging` environment에 배포한 뒤 실행하며, 성공해야 production 배포로 진행한다.

## 품질 기준

- 권한, 인증, migration, backup·restore, transaction, 입력 검증, 민감 데이터 보호 변경에는 회귀 테스트를 추가한다.
- 테스트 수나 coverage 수치보다 권한, 상태 전이, transaction과 복구처럼 실패 비용이 큰 동작의 관찰 가능한 결과를 우선한다.
- 새 실행 경로는 기존 assertion을 약화하거나 삭제하는 방식으로 통과시키지 않는다.
- UI markup만 바뀐 경우에도 접근성 또는 해당 화면의 사용자 흐름 영향을 확인한다.
- 쓰기 저장 검증은 800ms debounce, 즉시 flush, 네트워크 재시도와 version 충돌에서 로컬 입력 보존을 다룬다.
- 쓰기 수명주기 검증은 만료 학습자 purge에서 글 원문과 쓰기 event가 함께 제거되는지 확인한다.
- 쓰기 지표 검증은 제목과 본문 없이 event만 집계하는지 확인한다.
- flaky 실패는 retry로 성공 처리하지 않는다. 원인을 격리해 재현하고 수정하며, 해결 전까지 실패 사실과 영향을 기록한다.

## 테스트를 추가할 때

| 추가한다                   | 추가하지 않는다           |
| -------------------------- | ------------------------- |
| 권한·인증 경계 변경        | 상수 값                   |
| 상태 전이와 불변식         | 타입이 이미 강제하는 사실 |
| 트랜잭션·복구 경로         | 한 줄 wrapper의 위임      |
| 재현된 결함                | 정적 markup 존재 여부     |
| 데이터 삭제·보존 정책      | 프레임워크 동작           |
| 외부 계약(wire, migration) | 계층마다 같은 동작 중복   |

정적 검사·타입·lint 룰로 막을 수 있으면 테스트를 쓰지 않는다. 예: `catch`의 `cause` 보존은 커스텀 lint 룰이 강제한다.

## 테스트 작성 규약

- 상수가 자기 리터럴과 같은지 단정하지 않는다.
- 동작이 없는 설정·플래그를 검증하는 테스트를 만들지 않는다.
- 테스트 조립이 프로덕션 조립을 복제하지 않는다. 실제 조립 함수를 재사용하고 의존성만 주입한다.
- 통합 테스트 셋업은 모듈별 `test/fixtures` 빌더를 쓴다. 새 테스트가 시드를 인라인으로 다시 짜지 않는다.
- fixture는 자기 모듈의 데이터만 시드한다. 다른 모듈의 표를 채워야 하면 그 모듈의 fixture를 소비하고, 필요한 입력이 없으면 소유 모듈의 fixture를 확장한다.
- 테스트 지원 코드는 `test/` 또는 `test-support/` 아래에만 둔다. 제품 소스에서 `@/test/*`를 import하지 않으며, 이 경계는 dependency 규칙이 차단한다.
- 모듈의 fixture 공개 표면에는 실제 소비자가 있는 export만 둔다. 소비자가 없어지면 표면도 함께 지운다.

## 실행과 검증

공개 검증 명령과 tool version은 [root manifest](../../package.json), Vitest 대상 구성은 [Vitest workspace](../../vitest.workspace.ts), browser 실행 설정은 [Playwright config](../../playwright.config.ts), Storybook source는 [Storybook manifest](../../apps/storybook/package.json)와 [Storybook config](../../apps/storybook/.storybook/main.ts), Storybook 테스트 실행 설정은 [Storybook Vitest config](../../apps/storybook/vitest.storybook.config.ts)가 소유한다. CI trigger, job 배치와 실제 gate는 [quality workflow](../../.github/workflows/quality-gates.yml)를 확인한다. 이 문서는 현재 script, 대상 목록, retry 횟수, report 형식과 숫자 예산을 복제하지 않는다.

저장소 전체 unit·integration은 root manifest의 `test`가 Vitest workspace를 단일 process로 한 번 실행한다. 패키지마다 러너를 띄우면 실제 테스트 시간보다 기동·transform 비용이 커지므로 project를 나누되 process는 나누지 않는다. 앱·패키지 manifest의 `test` script는 `--project` 필터로 부분 실행하는 개발자 편의용이다.

Vitest workspace가 참조하는 앱 config는 각자 고유 사유가 있을 때만 둔다. `apps/api`는 migration `.sql`을 text로 불러오는 loader, web·admin·shared/ui는 DOM 환경과 React 단일 인스턴스 고정이 그 사유이며 공통 부분은 [React Vitest factory](../../packages/config/vitest-config/src/react.ts)가 소유한다. 단일 process에서 project별 `maxWorkers`를 다르게 두면 Vitest가 실행 순서를 결정할 수 없으므로 worker 상한은 project별로 나누지 않는다.

배포 runtime smoke(`test:frontend-production-runtime`)와 관리자 개발 서버 수명주기 smoke(`test:admin-dev-lifecycle`)는 전용 명령으로만 실행하며 CI 차단 gate가 아니다. coverage는 수집하지 않는다. provider를 manifest에 선언하지 않고 수집 설정·명령도 두지 않으며, coverage 숫자는 어떤 경계에서도 gate로 쓰지 않는다. `@vitest/coverage-v8`이 lockfile과 `node_modules`에 있는 것은 bun이 `vitest`의 optional peer를 함께 해석한 결과이고 저장소가 선언한 의존성이 아니다.

CI는 OpenAPI·Orval 생성 전용 job에서 content-addressed cache를 복원하거나 한 번 생성한 뒤 생성물과 Turbo cache를 단기 artifact로 배포한다. 정적 검사, repository 테스트, build와 browser job은 이 artifact를 받아 병렬 실행하며 각자 생성하지 않는다. 정적 job은 형식·lint·custom lint rule·architecture·dependency 일관성·Knip·type 검사를 한 번의 설치 뒤 병렬 실행하고, 테스트 job도 `scripts` 계약 테스트와 workspace 전체 unit·integration을 병렬 실행한다.

| 경계          | 차단 검증                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull request  | 형식·lint·architecture·dependency·생성물·type, repository와 workspace 전체 unit·integration, production build와 route bundle, 현재 Chromium의 학습자·관리자 핵심 smoke        |
| Main push     | 위 정적·생성 계약, repository와 workspace 전체 unit·integration, Storybook interaction, 설정된 Chromium·WebKit 전체 E2E, Lighthouse, source image Compose smoke               |
| Image release | 성공한 동일 revision main 품질 결과, 취약점 정책·attestation, registry digest의 격리 Compose smoke, 동일 digest staging 배포 후 k6, production 외부 준비 증거와 public verify |

PR의 학습자·관리자 핵심 smoke는 서버 조립을 한 번만 띄우는 단일 Chromium 실행이다. fixture, API와 Next runtime의 준비·종료는 Playwright `webServer`가 소유하고 실행 wrapper는 격리 디렉터리와 환경만 제공한다. Main release E2E는 web과 admin의 최적화 build를 새로 만든 뒤 production standalone runtime으로 실행한다. Chromium과 WebKit은 브라우저별 새 DB·서버·임시 디렉터리에서 순차 실행하고 PR 전용 smoke spec을 중복 실행하지 않는다. 브라우저별 실제 test 범위는 config의 project 계약이 소유하며, 모든 시나리오가 모든 engine에서 동작한다고 과장하지 않는다.

PR 필수 gate는 production 배포 환경과 같은 Linux에서 실행한다. 다른 운영체제의 로컬 개발 호환성은 매 PR 전체 검증이 아니라 필요할 때 설치 smoke나 주기 실행으로 확인한다. 배포 설정은 자체 parser로 재해석하지 않고 Compose, Caddy, Ansible과 실제 container가 직접 읽게 한다.

배포 승인 gate도 같은 원칙을 따른다. playbook의 승인 task만 골라 `--check`로 실제 실행하고, 완결된 production 증거는 통과하며 승인 누락·증거 revision 불일치·placeholder 증거·기간이 지난 복구 훈련·대상 환경 불일치는 각각 멈추는지 확인한다. 조건식의 문자열이나 task 순서를 단정하지 않는다.

Storybook interaction·접근성 검사는 browser runtime 비용 때문에 main push에서만 차단한다. 따라서 공유 UI primitive의 상태 전이·초점·axe 회귀는 PR을 통과해 main에서 처음 드러날 수 있고, PR 단계에서는 `packages/shared/ui`의 Vitest 범위만 이를 막는다. 이 지연을 허용하지 않으려면 PR gate에 browser 설치와 story 부분집합 실행을 함께 추가해야 한다.

## 알려진 검증 공백

모듈 경계 때문에 아직 만들 수 없는 회귀가 두 개 있다. 우회 코드로 덮지 않고 공백으로 남긴다.

- content HTTP에는 인가 거부(403) 경로가 없어 인증은 되지만 권한이 없는 actor의 회귀를 어느 계층에서도 만들 수 없다. 인가 경계를 추가할 때 함께 검증한다.
- content의 seed 통합 테스트는 학습자 시드를 인라인 SQL로 유지한다. `@workspace/identity`·`@workspace/learning`의 fixture를 쓰려면 content가 두 모듈에 의존해야 하는데 learning이 content에 의존하므로 순환이다.

## 검증 기록

특정 날짜의 실행 시간, toolchain, 테스트 수치, CI 결과와 production 적용 여부는 living guide에 기록하지 않는다. 재현 가능한 검증 보고서는 기준 commit, 실행 시각·환경, 명령, 결과와 artifact 위치를 포함해 작업 완료 후 archive에 보관한다.
