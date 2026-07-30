# 확정 제품 기준선 검증 보고서

## 검증 기준

- 실행 시각: 2026-07-25 02:46 KST
- 환경: Windows 10, Bun 1.3.10, Node.js 24.15.0
- 브랜치: `refactor/confirmed-product-baseline`
- 검증 시작 commit: `f2096e727fad2b4ef0aefac2f989e9bca8bd319a`
- 검증 대상: 위 commit 기반 통합 변경. 검증 후 단일 commit으로 고정했다.

백로그 72개 티켓을 수용 기준, 코드 권위 소스와 실행 증거에 대조한 결과 저장소 내부 완료는 58개, 외부 승인·실환경 증거 대기는 14개, 내부 미완료는 0개다. 백로그 체크박스에는 티켓 상태가 기록되지 않았으므로 이 수치는 구현과 증거를 대조한 감사 판정이다.

## 저장소 검증 결과

| 검증                                                         | 결과                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `bun run format`, `bun run ci:static`                        | format, lint, Oxlint 규칙, architecture, dependency, Knip, typecheck 24/24 통과 |
| `bun run ci:tests`                                           | repository 121개, workspace task 20/20 통과                                     |
| `bun run test:storybook`                                     | 34 files, 147 tests 통과                                                        |
| `bun run build`, `bun run check:route-bundles`               | build task 6/6과 대상 route bundle 예산 통과                                    |
| `bun run generate` 전후 비교                                 | OpenAPI·Orval 생성 파일 digest 동일                                             |
| `bun run test:e2e:pr`                                        | 5/5, Playwright 47.1초·전체 명령 56.2초                                         |
| `bun run test:e2e:release`                                   | fresh web·admin build, Chromium 7/7, WebKit 7/7, 총 14/14                       |
| `bun run test:e2e:ui-style -- theme-surfaces.visual.spec.ts` | 4/4 통과                                                                        |
| `bun run test:performance:lighthouse`                        | landing, learner home, lesson route를 각각 3회 측정해 모든 assertion 통과       |

Lighthouse LCP 중앙값과 performance 중앙값은 `/` 2,633ms·0.96, `/app` 3,050ms·0.94, lesson route 2,723ms·0.94다. 9개 JSON·HTML과 manifest는 `output/lighthouse/`에 있다.

배포 전용 계약 테스트 51개, Actionlint v1.7.12, Compose 5-service config, Caddy v2.11.4 validation, Litestream v0.5.11 config load와 k6 v2.0.0 execution-requirements도 통과했다. Docker daemon은 WSL2·Hyper-V 비활성화로 시작하지 못했고 Linux Ansible 실행도 불가능했으므로 image smoke와 Ubuntu 결과를 통과로 기록하지 않는다.

## 외부 미완료

외부 증거가 필요한 티켓은 `GG-001`, `GG-003`, `GG-503`, `GG-807`, `GG-809`, `GG-905`, `GG-1005`, `GG-1006`, `GG-1101`~`GG-1106`이다.

2026-07-25 GitHub 조회에서 `main` branch protection은 없고 environment와 Actions secret은 각각 0개였다. 최근 quality gate는 실패했고 image release는 건너뛰었으며 현재 변경과 동일한 revision 성공 증거도 없다. 외부 법률 검토, 실제 DNS·TLS, Docker image·registry scan, Ubuntu Ansible, staging k6·restore·로그 보존, rollback·launch drill과 지원 브라우저 실기기 결과가 마련되기 전에는 전체 backlog와 production launch를 완료로 판정하지 않는다.
