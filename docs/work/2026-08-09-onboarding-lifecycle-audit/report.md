# 신규 개발자 온보딩·출시 생명주기 감사

## 범위와 기준

이 감사는 2026-08-09 KST에 `38176d9b2e31aba0b238bf66b5d67e24da3423c7`을 기준으로 시작했다. 작업 branch는 `codex/focused-writing-mvp`다. 기존 checkout에는 사용자 변경이 있었으므로 해당 변경을 보존했다.

감사는 저장소 탐색, 도구 설치, 환경 설정, 로컬 실행, 실제 이메일 가입 handler, 테스트, 수정, build, release 사전 점검, 운영과 장애 대응 순서로 진행했다. 실제 production 데이터 변경은 실행하지 않았다. 실제 staging·production 인프라 값이 없으므로 원격 배포와 복구는 실행하지 않았다.

우선순위는 다음 기준을 사용한다.

- P0은 보안, 데이터 무결성 또는 production 출시를 차단한다.
- P1은 신규 개발자나 CI의 정상 경로를 차단한다.
- P2는 정상 경로를 지연시키거나 진단 비용을 높인다.

## 단계별 시행 기록

| 단계            | 멈칫한 질문                                                | 실행과 관찰                                                                                                             | 판정                                                                                                              |
| --------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| clone           | 공개 원격의 fresh checkout이 로컬 cache 없이 준비되는가?   | 임시 shallow clone에서 frozen install, 기존 setup과 doctor를 실행했다. 원격 `main`의 `5c738f2`는 세 명령을 통과했다.    | 현재 local HEAD는 원격 `main`보다 commit 3개 앞선다. 미공개 변경은 원격 clone으로 검증할 수 없다.                 |
| 저장소 진입     | 무엇부터 읽어야 하는가?                                    | `AGENTS.md`, `docs/_index.md`, `docs/authority-map.md`와 관련 권위 문서를 순서대로 확인했다.                            | 문서 지도는 있으나 root 기여 진입점이 없었다. `CONTRIBUTING.md`를 추가했다.                                       |
| 도구 확인       | Bun·Node·Git 버전은 어디에 정의되는가?                     | root manifest와 실제 실행 파일을 비교했다. Git, Bun 1.3.14와 Node 24.x를 확인했다.                                      | `setup`과 `doctor`가 세 도구와 Git checkout을 검사하도록 보강했다.                                                |
| 의존성 설치     | lockfile을 그대로 신뢰해도 되는가?                         | frozen install과 전체 dependency audit를 실행했다. 만료된 image 예외와 HIGH advisory가 확인됐다.                        | Hono, Next.js, Sharp와 transitive override를 갱신했다. 현재 audit는 통과한다.                                     |
| 환경 파일       | 값은 어디서 얻고 기존 값을 덮어쓰지 않는가?                | 세 앱의 example과 실제 환경 파일을 비교했다. setup은 기존 값을 보존하고 누락값과 정확한 placeholder만 보충했다.         | 공개 origin은 로컬에서 결정할 수 있다. 외부 credential은 owner가 승인된 secret source에서 제공해야 한다.          |
| 생성 단계       | dev 전에 OpenAPI·client를 누가 만드는가?                   | 생성물이 없으면 일부 task가 암묵적 선행 순서에 의존했다.                                                                | `setup`과 Turbo `dev`가 generation을 명시적으로 선행한다.                                                         |
| DB 준비         | 기존 DB를 migration 전에 어떻게 보호하는가?                | setup이 현재 DB의 integrity와 schema를 확인했다. 검증된 snapshot 한 개를 `data/backups/setup/`에 만들었다.              | migration 전 백업과 repository 단위 operation lock을 추가했다.                                                    |
| 로컬 실행       | 어떤 서비스가 어느 주소에서 떠야 하는가?                   | API learner/admin health, web, admin과 UI 문서의 HTTP 200을 확인했다.                                                   | UI 문서는 `localhost`에서 성공했다. `127.0.0.1`은 Astro bind 차이로 실패했다.                                     |
| 가입 흐름       | 로컬 이메일 인증 링크는 어디에서 얻는가?                   | 실제 이메일·password 가입 handler를 호출했다. 로컬 mailbox에서 verification callback과 token 존재를 확인했다.           | 개발용 mailbox 경로와 secret 비출력 계약을 코드와 문서에 연결했다.                                                |
| 테스트          | 어떤 명령이 완료 기준인가?                                 | focused test, dependency audit, production frontend runtime, build와 route bundle 검사를 실행했다.                      | root `verify`가 핵심 완료 순서를 한 명령으로 실행한다. 전체 gate는 최종 검증에서 다시 실행한다.                   |
| 작은 수정       | 실패를 가장 작은 변경으로 어떻게 고치는가?                 | Next.js 16.3 build가 aliased TypeScript CLI를 찾지 못했다. 두 Next 설정에서 JavaScript TypeScript API 경로를 명시했다.  | web과 admin production build가 통과했다.                                                                          |
| 실제 E2E        | 브라우저가 현재 접근성 의미와 write schema를 사용하는가?   | 선택지와 정렬 손잡이 locator가 현재 접근성 tree와 달랐다. 관리자 fixture도 허용되지 않은 category를 사용했다.           | locator와 fixture를 현재 계약에 맞췄다. PR Chromium 7건이 통과했다.                                               |
| 릴리스 E2E      | 실제 standalone 산출물이 두 browser engine에서 동작하는가? | build와 runtime의 asset origin이 달랐다. 추가 browser context도 rate-limit bucket을 공유했다. 로컬 WebKit도 없었다.     | origin과 context 격리를 통일하고 WebKit을 설치했다. Chromium 15건과 WebKit 15건이 통과했다.                       |
| 성능            | 성능 검사가 로컬에서 실행되고 예산을 통과하는가?           | Windows Chromium profile 정리 실패를 고쳐 9개 report를 만들었다. learner home과 lesson shell LCP 중앙값이 실패했다.     | 예산은 유지했다. report를 보존하고 font·CSS·client bundle 최적화를 release 차단 작업으로 분리했다.                |
| CI              | 로컬 통과와 Linux CI 차이는 어디에서 생기는가?             | 최근 main Actions log에서 Ansible task naming, line length와 package bin 실행 권한 실패를 확인했다.                     | YAML을 수정했다. package bin executable mode를 index에 기록했다. Linux 재검증은 push 뒤 필요하다.                 |
| 배포 준비       | 어떤 GitHub 값이 어느 scope에 필요한가?                    | workflow 참조를 repository, `staging`, `Production` scope로 분류했다. 현재 GitHub 설정에는 필수 입력이 없다.            | machine-readable 계약과 읽기 전용 `preflight:release`를 추가했다. 현재 preflight는 누락 이름을 보고하고 실패한다. |
| staging 배포    | 어떻게 배포하고 무엇으로 성공을 판정하는가?                | image workflow, immutable digest, Ansible deploy·verify와 k6 흐름을 추적했다.                                           | host, DNS, Vault, SSH, fixture와 session이 없어 실행할 수 없다.                                                   |
| production 배포 | reviewer 승인만 있으면 되는가?                             | branch와 environment 보호를 설정했다. Production job은 법률, 복구 훈련과 동일 revision E2E 증거도 요구한다.             | 외부 증거가 없으므로 production gate는 닫혀 있다.                                                                 |
| 운영            | 문제 생기면 어디를 보는가?                                 | local daily maintenance를 dry-run으로 실행했다. 모든 stage는 성공했고 external log retention은 `unverified`로 보고됐다. | 외부 log sink, dashboard, 실제 alert channel과 on-call contact가 결정되지 않았다.                                 |
| 장애 대응       | code rollback과 DB restore 중 무엇을 선택하는가?           | rollback, restore와 verify 실패 handoff 절차를 확인했다.                                                                | 실제 staging replica 복구 훈련 증거가 없다. 월간 복구 기준은 아직 미충족이다.                                     |

## 마찰과 개선안

| 상황                  | 마찰                                                                                     | 원인                                                                                  | 영향                                                                  | 개선안                                                                                   | 우선순위 |
| --------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| 첫 진입               | root에서 작업 규칙과 완료 명령을 한 번에 찾기 어렵다.                                    | 지식이 README와 여러 권위 문서에 분산됐다.                                            | 신규 개발자가 잘못된 명령이나 과거 문서를 따를 수 있다.               | `CONTRIBUTING.md`와 root `verify`를 유지한다.                                            | P1       |
| Windows checkout      | LF 전제 파일의 EOL 정책을 바로 알 수 없다.                                               | `.gitattributes`가 없었다.                                                            | shell·YAML diff와 CI 동작이 OS에 따라 달라질 수 있다.                 | root `.gitattributes`를 권위 설정으로 유지한다.                                          | P1       |
| 도구 설치             | manifest version과 실제 실행 파일 차이를 setup 전에 알기 어렵다.                         | 기존 진단이 전체 toolchain과 Git checkout을 확인하지 않았다.                          | 설치 중간에 실패하고 원인이 뒤늦게 드러난다.                          | `setup`과 `doctor`의 fail-fast 검사를 유지한다.                                          | P1       |
| dependency audit      | 만료된 image 예외가 정상 운영처럼 남았다.                                                | 예외 만료 전 알림과 정기 검사가 없었다.                                               | 알려진 취약점이 release 정책에 남을 수 있다.                          | 매일 audit하고 만료 14일 전부터 owner에게 경고한다.                                      | P0       |
| transitive dependency | 상위 도구가 취약한 exact version을 고정했다.                                             | Bun은 필요한 깊이에만 적용하는 nested override를 제공하지 않는다.                     | 전역 override의 호환성 위험을 수동으로 검증해야 한다.                 | override 근거와 제거 조건을 유지하고 generation·test·build를 함께 실행한다.              | P0       |
| dev 시작              | generated source의 선행 조건이 암묵적이었다.                                             | `dev` graph가 generation에 의존하지 않았다.                                           | fresh checkout의 첫 실행이 파일 존재 여부에 따라 달라진다.            | Turbo graph와 setup에서 generation을 명시한다.                                           | P1       |
| 환경 설정             | placeholder와 사용자가 입력한 값을 구분하기 어렵다.                                      | 단순 copy 또는 overwrite 절차만으로는 소유권을 표현할 수 없다.                        | credential 손실 또는 잘못된 기본값 사용이 발생할 수 있다.             | exact placeholder만 교체하고 기존 값을 보존한다.                                         | P0       |
| 로컬 인증             | verification callback을 받을 위치가 숨겨져 있었다.                                       | 실제 provider와 개발용 email transport가 같은 설명에 섞였다.                          | OAuth를 잘못 사용하거나 token을 로그에 노출할 수 있다.                | 로컬 mailbox를 구조화 파일로 제공하고 token 값을 출력하지 않는다.                        | P1       |
| setup과 DB            | migration 전에 자동 snapshot과 동시 실행 차단이 없었다.                                  | setup이 단일 개발자와 신규 DB만 가정했다.                                             | 기존 DB 손상이나 두 writer 충돌의 복구 비용이 커진다.                 | 검증 백업과 ownership token이 있는 fail-closed lock을 유지한다.                          | P0       |
| frontend build        | Next.js가 aliased TypeScript package의 `bin/tsc`를 가정했다.                             | Next.js 16.3의 TypeScript CLI 기본 경로가 저장소 compiler 구성과 달랐다.              | typecheck는 통과해도 production build가 실패한다.                     | 두 앱에서 `experimental.useTypeScriptCli=false`를 명시한다.                              | P1       |
| generated route types | 중단된 dev server가 손상된 `.next/dev/types`를 남겼다.                                   | type generation이 기존 output을 정리하지 않았다.                                      | 이후 정적 검사가 소스와 무관한 parse error로 실패한다.                | typegen이 생성 대상 디렉토리만 먼저 제거하도록 만들었다.                                 | P1       |
| E2E server runtime    | Playwright가 Next dev server를 Bun으로 직접 실행했다.                                    | test runner와 framework runtime의 책임이 분리되지 않았다.                             | Sharp native module을 externalize하지 못해 server가 뜨지 않는다.      | Next dev server는 Node로 실행하고 fixture·API orchestration만 Bun에 맡긴다.              | P1       |
| E2E 의미 계약         | 선택지 role과 관리자 category fixture가 현재 코드 계약과 달랐다.                         | 테스트가 접근성 tree와 schema 변경을 따라가지 못했다.                                 | 실제 UI가 정상이어도 smoke 2건이 timeout 또는 parse error로 실패한다. | `radio` locator와 `구성과 표현` category로 현재 계약을 검증한다.                         | P1       |
| E2E timeout           | 존재하지 않는 locator 하나가 300초 시나리오 timeout을 모두 사용했다.                     | locator action timeout과 긴 발행 시나리오 timeout이 분리되지 않았다.                  | 첫 실패가 늦게 드러나고 후속 browser 검증이 실행되지 않는다.          | locator action timeout을 10초로 유지한다.                                                | P1       |
| 릴리스 asset origin   | standalone 관리자 화면이 fixture 이미지를 CSP로 차단했다.                                | build는 fixture origin을 사용했지만 runtime은 예시 production origin으로 덮어썼다.    | 발행 성공 뒤 이미지 진단에서 서로 무관한 시나리오 3건이 실패한다.     | build와 runtime이 `e2eRuntime.assetOrigin` 한 값을 사용한다.                             | P1       |
| E2E context 격리      | 전체 릴리스 스위트의 마지막 로그인이 HTTP 429를 반환했다.                                | 기본 context만 테스트별 IP를 받았다. 추가 context 9개는 `unknown` bucket을 공유했다.  | 단독 실행은 통과하지만 전체 순서에서 인증 시나리오가 실패한다.        | 테스트별 client header를 모든 추가 context에 전달한다.                                   | P1       |
| 로컬 WebKit 준비      | release WebKit 15건이 실행 전 1ms 안에 모두 실패했다.                                    | CI만 browser 설치 명령을 갖고 로컬 setup과 기여 절차에는 단계가 없었다.               | 신규 개발자는 제품 실패처럼 보이는 15개 오류를 한 번에 받는다.        | 첫 browser 검증 전에 로컬 Playwright CLI로 Chromium과 WebKit을 설치한다.                 | P1       |
| mobile 정렬 검증      | Chromium mouse drag는 통과하지만 iPhone WebKit touch context에서는 이동하지 않았다.      | Playwright mouse emulation은 실제 iOS touch drag가 아니다.                            | browser engine 결과가 input 장치 지원 증거로 오해될 수 있다.          | 자동 E2E는 키보드 정렬·저장 계약을 검증한다. 실제 touch drag는 device farm에서 검증한다. | P1       |
| WebKit 로그아웃       | 로그아웃 직후 같은 탭에서 보호 route로 이동하면 취소된 RSC prefetch가 page error가 됐다. | WebKit의 navigation과 이전 화면 prefetch 취소가 경쟁했다.                             | 세션 폐기 동작은 정상이어도 browser diagnostics가 실패한다.           | 보호 route redirect는 같은 context의 독립 탭에서 관찰한다.                               | P1       |
| E2E 출력              | 모든 server process가 `NO_COLOR` 무시 경고를 반복한다.                                   | 실행 환경이 `NO_COLOR`와 `FORCE_COLOR`를 동시에 설정한다.                             | 오류가 아닌 경고가 실제 server 진단을 가린다.                         | wrapper가 두 변수 중 하나만 전달하도록 별도 정리한다.                                    | P2       |
| unit test 동기화      | 관리자 로그아웃 재시도 테스트가 전체 suite에서만 간헐적으로 실패했다.                    | 실패 alert가 보여도 React transition이 끝나지 않아 버튼이 잠시 disabled였다.          | 단독 통과와 전체 실패가 달라 회귀 판별 비용이 커진다.                 | 재시도 전에 버튼의 enabled 상태를 관찰한다.                                              | P1       |
| Lighthouse on Windows | Chromium 종료 뒤 임시 profile 삭제가 `EPERM`으로 실패했다.                               | LHCI의 Windows launcher가 process 종료와 directory unlock을 동시에 가정한다.          | 생성된 측정값을 버리고 첫 URL에서 전체 검사를 중단한다.               | Windows wrapper가 Chromium 하나를 관리하고 LHCI는 debugging port에 연결한다.             | P1       |
| Lighthouse 예산       | learner home LCP는 4,359ms이고 lesson shell LCP는 4,214ms다.                             | text LCP가 2개 root CSS와 6개 Pretendard subset 요청 및 초기 client bundle 뒤에 있다. | main release 성능 gate가 4,000ms 예산에서 실패한다.                   | 예산을 올리지 않는다. font activation·root CSS 결합과 route별 client 분할을 측정한다.    | P1       |
| Lighthouse 선행 조건  | 최근 main run에서 Lighthouse job이 계속 `skipped`였다.                                   | Lighthouse가 실패한 generated-contract job을 `needs`로 사용한다.                      | 성능 예산이 설정돼 있어도 실제 기준선은 증명되지 않았다.              | 생성 job을 고친 동일 revision에서 Lighthouse artifact까지 필수로 확인한다.               | P1       |
| test discovery        | Vitest가 작업 트리의 미추적 `ui/tsconfig.json`을 읽고 경고했다.                          | root test discovery가 사용자 소유 임시 디렉토리까지 탐색한다.                         | 실제 실패와 무관한 경고가 원인 분석 시간을 늘린다.                    | 사용자 파일은 보존한다. root include·exclude 경계를 별도 변경으로 명시한다.              | P2       |
| Linux CI              | package `bin` 파일의 executable bit가 Windows 작업 트리에서 보이지 않았다.               | Windows filesystem mode와 Git index mode가 다르다.                                    | Ubuntu cache generation job이 permission denied로 실패한다.           | executable mode를 Git index에 보존하고 Linux CI에서 재검증한다.                          | P1       |
| 원격 검증             | local HEAD가 원격 `main`보다 3 commits 앞서고 작업 트리 변경도 남아 있다.                | commit과 push는 이번 요청의 승인 범위가 아니다.                                       | GitHub Actions는 현재 변경을 아직 실행할 수 없다.                     | owner 승인 뒤 의도한 변경만 commit·push하고 동일 revision gate를 확인한다.               | P1       |
| Ansible lint          | Windows에는 repository가 고정한 Ansible 실행 환경이 없다.                                | Ubuntu 전용 controller 검증이 CI에만 있다.                                            | 로컬에서 YAML 수정의 최종 lint를 증명할 수 없다.                      | WSL2 또는 일회성 Ubuntu 24.04 검증 진입점을 제공한다.                                    | P2       |
| branch 보호           | 필수 검사 display name과 job name의 관계가 숨겨져 있었다.                                | 보호 규칙이 workflow source와 별도 GitHub 설정에 존재한다.                            | 오타 난 필수 검사가 merge를 영구 차단하거나 gate를 우회한다.          | 실제 Actions check name을 조회해 strict 보호 규칙을 정기 감사한다.                       | P0       |
| release 입력          | workflow 전체에서 variable과 secret 이름을 수작업으로 찾아야 했다.                       | machine-readable 외부 입력 계약이 없었다.                                             | 배포가 image build 뒤늦게 빈 값으로 실패한다.                         | `deploy/github-release-inputs.json`과 두 preflight 명령을 유지한다.                      | P0       |
| GitHub environment    | workflow는 소문자 `production`을 사용하고 보호 대상은 `Production`이었다.                | environment 이름의 대소문자를 정적으로 비교하지 않았다.                               | 잘못된 environment에서 승인이나 secret을 조회할 수 있다.              | 계약 검사가 exact environment 이름을 강제한다.                                           | P0       |
| staging 출시          | 필수 repository·environment 입력이 모두 비어 있다.                                       | VPS, DNS, storage, SSH, Vault와 fixture가 아직 준비되지 않았다.                       | image release는 실제 staging deploy에 도달할 수 없다.                 | owner가 승인된 secret manager와 GitHub environment에 계약의 값을 제공한다.               | P0       |
| production 출시       | 법률 검토와 최근 staging restore evidence가 없다.                                        | 저장소가 외부 검토와 실제 복구 성공을 만들어낼 수 없다.                               | production readiness가 의도대로 실패한다.                             | 실제 증거를 검증한 owner만 `Production` 변수를 갱신한다.                                 | P0       |
| 운영 관측             | stdout 이후의 외부 sink, dashboard와 alert 전달 경로가 없다.                             | provider, 비용, 보존, 접근 권한과 장애 책임자가 결정되지 않았다.                      | 사용자 신고 전에 장애를 탐지하거나 보존 기간을 증명할 수 없다.        | backend, alert channel, on-call contact와 실제 전달 시험을 결정한다.                     | P0       |
| 복구 훈련             | 월간 staging restore가 문서 절차로만 존재한다.                                           | 분리된 staging host와 replica credential이 없다.                                      | RPO·RTO와 삭제 사용자 비부활을 증명할 수 없다.                        | 빈 data path에서 실제 restore를 실행하고 `result.json`과 public smoke를 보존한다.        | P0       |

## 검증 결과

| 명령 또는 경계                                    | 결과                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| fresh shallow clone의 frozen install·setup·doctor | 통과                                                                                 |
| `bun install --frozen-lockfile`                   | 통과                                                                                 |
| dependency audit·image policy·image lock          | 통과                                                                                 |
| `bun run ci:static`                               | 통과                                                                                 |
| `bun run ci:tests`                                | repository 35건과 workspace 1,086건 통과, 1건 skip                                   |
| `bun run build`                                   | 통과                                                                                 |
| `bun run check:route-bundles`                     | 통과                                                                                 |
| production frontend runtime                       | web과 admin 통과                                                                     |
| Astro UI browser contract                         | 45건 통과                                                                            |
| `bun run test:e2e:pr`                             | Chromium 7건 통과                                                                    |
| `bun run test:e2e:release`                        | fresh build, Chromium 15건과 WebKit 15건 통과                                        |
| `bun run test:performance:lighthouse`             | 9개 report 생성, learner home 4,359ms와 lesson shell 4,214ms가 LCP 4,000ms 예산 초과 |
| local daily maintenance dry-run                   | 모든 local stage 통과, external retention `unverified`                               |
| `bun run preflight:release`                       | 예상대로 실패, repository·staging·Production 외부 입력 누락                          |
| Ansible 승인·disposable Ubuntu bootstrap 검증     | Windows에 Linux 또는 WSL2 controller가 없어서 미실행                                 |

Lighthouse 결과는 `output/lighthouse/`에 있다. Playwright 성공 결과는 `output/playwright/`에 있다. 두 경로는 검증 artifact이며 source가 아니다.

## 외부 입력 대기 항목

다음 값은 저장소에서 추론하거나 임의 생성할 수 없다.

1. Owner는 staging과 production의 public origin, VPS inventory, SSH trust material과 Vault payload를 제공해야 한다.
2. Owner는 staging k6 fixture 식별자와 전용 학습자 session을 제공해야 한다.
3. Legal owner는 실제 검토 evidence 식별자와 검증 시각을 제공해야 한다.
4. Incident owner는 실제 staging restore drill evidence 식별자와 검증 시각을 제공해야 한다.
5. Operations owner는 telemetry backend, alert channel, on-call contact와 retention evidence 갱신 책임자를 결정해야 한다.
6. Repository owner는 현재 branch를 push한 뒤 Ubuntu Actions의 전체 gate를 확인해야 한다.

Secret은 이 문서, issue, PR body 또는 shell history에 기록하면 안 된다. Secret 노출은 credential 탈취를 일으킬 수 있다. Owner는 값을 GitHub environment 또는 승인된 secret manager에 직접 입력해야 한다.

## 완료 조건

`bun run preflight:release`가 누락 없이 종료해야 staging release를 시작할 수 있다. Staging의 immutable digest deploy, public verify, k6 핵심 흐름과 실제 restore drill이 성공해야 production 승인 증거를 만들 수 있다. 외부 log sink와 alert 전달 시험이 성공해야 운영 준비를 완료로 판정할 수 있다. 동일 revision의 Ubuntu 품질 gate가 모두 통과해야 코드 변경 검증을 완료로 판정할 수 있다.
