# P0·P1 검증 기록

> 상태: P0·P1 gate 통과
> 기준: `main`의 `4e255e414167029a42fc9d2ccb7c63fe71cfae09`에서 시작한 P0·P1 worktree
> 환경: macOS arm64, Node.js 24.x, 검증 Bun 1.3.10

## 사용자와 데이터 기준선

`bunx bun@1.3.10 run test` 결과 11개 workspace task, test file 194개, test 835개가 모두 통과했다.

- 학습자 인증·코스·레슨·진행·시작·답안·완료와 AI 성공·한도·provider 부재·timeout
- 관리자 인증, role·owner 거부, session 폐기, content draft·publish·archive·reset
- dashboard·analytics·settings·AI chat과 자료실 14개 operation, ETag version conflict, upload·delete
- learner·admin health, request drain, SIGTERM, DB close와 port release
- migration·seed·destructive guard, file-backed WAL backup과 격리 restore
- production test auth fail-closed와 browser·server runtime config 분리

세부 test owner는 API·core·auth·DB·web·admin workspace의 route, application, repository와 target contract test다. DB만 분리 실행한 결과도 8 files·45 tests, env는 2 files·26 tests, API는 56 files·278 tests가 통과했다.

## 기존 결함과 실행 환경 분리

- 시작 전 node_modules workspace link가 stale해 root test의 auth suite가 실패했고 frozen install로 해소했다.
- Bun 1.3.14는 Lexical 0.46.0 ESM cycle을 직접 실행할 때 초기화 오류가 나지만 같은 source를 repository 고정 Bun 1.3.10으로 실행하면 API 278 tests와 root 835 tests가 통과한다.
- 시작 build에서 web·admin이 대기한 기록은 최종 build 결과와 별도로 유지한다.

위 항목은 architecture 전환 성공을 거짓으로 만들지 않도록 source 회귀와 환경 차이를 분리한 기준선이다. 최종 품질 gate 결과는 아래에 추가한다.

## 최종 gate

| 명령                                                       | 결과                                                                  |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `bunx bun@1.3.10 install --frozen-lockfile`                | 896 installs·1145 packages 확인, lockfile 변경 없음                   |
| `bunx bun@1.3.10 test ./scripts`                           | 27 files·119 tests 통과; dev lifecycle가 소유 process와 port를 정리함 |
| `bunx bun@1.3.10 run test`                                 | 11 tasks·194 files·835 tests 통과                                     |
| `bunx bun@1.3.10 run test:e2e`                             | 테스트 인증 기반 browser E2E 3건 통과, 소유 port·lock 정리 확인       |
| `bunx bun@1.3.10 run lint`                                 | architecture, Knip, package interface와 Oxlint warning gate 통과      |
| `bunx bun@1.3.10 run typecheck`                            | 13 tasks 통과                                                         |
| CI 공개 origin을 주입한 `bunx bun@1.3.10 run build`        | web, admin, Storybook 3 tasks 통과                                    |
| `bun run format:check`                                     | 추적 파일 1,223개 Oxfmt 검사 통과                                     |
| `bun lefthook run pre-commit --all-files --no-stage-fixed` | format, architecture, dead code, workspace lint gate 통과             |
| `bun run check:document-drift`                             | 문서 구조와 참조 검사 통과                                            |

환경값 없는 production build는 의도대로 `production web origin is required`에서 fail-fast했다. 성공 build는 quality-gates workflow와 같은 비밀 아닌 example origin을 명시적으로 주입했으며 parser 기본값을 완화하지 않았다. Storybook의 기존 Vite `use client`·chunk size warning은 exit code와 artifact 생성을 실패시키지 않았다.

E2E가 소유하는 3100, 3101, 4100, 4199 port는 종료 후 모두 닫혔고 repository가 시작한 잔존 process는 없다. `git diff --check`도 통과했으며 pre-commit은 `--no-stage-fixed`로 실행해 index를 변경하지 않았다.
