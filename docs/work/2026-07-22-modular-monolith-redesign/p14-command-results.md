# P14 명령 실행 기록

## 기준

- 기준 commit: `d98dcdef6f70d6bcedb821391bb4b9cfd6f7dc69`
- 대상 source patch SHA-256: `436e83165ebd00f0ac66dd5d86c6f5f216c7d2658c8cf16ec2cf5cda8d1ac129`
- digest 명령: `git diff --cached --binary d98dcdef -- . ':(exclude)docs/work/**' | shasum -a 256`
- 증거 확정 시각: `2026-07-23T12:07:51+09:00`
- host: macOS 26.5.2 arm64, Bun 1.3.10, Node.js 24.16.0

## 실행 결과

| 환경·명령                                                                                             | 결과 artifact 요약                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| disposable arm64 VM, `linux/amd64` binfmt, `bun run test:deployment-images`                           | 세 image build·비루트·파일 경계·health·API migration/backup·Compose route 통과. web/admin PNG `1,801,739 → 155,243` bytes              |
| checksum 검증 Docker Compose v5.1.4 standalone, `check:deployment-config --skip-container-validation` | 최종 source의 Compose JSON 해석과 immutable image 계약 통과                                                                            |
| 일회성 VM Docker daemon, `bun run check:deployment-config`                                            | Caddy·Litestream container 설정 계약 통과                                                                                              |
| Python 3.13.14, ansible-core 2.21.2, ansible-lint 26.6.0, community.docker 5.2.1                      | `bun run check:deployment-ansible`: production profile 25/27 files, failure 0·warning 0, bootstrap/deploy/restore/rollback/verify 통과 |
| `bun install --frozen-lockfile`                                                                       | lockfile 변경 없이 통과                                                                                                                |
| `bun run audit:production`, `bun run audit:full`                                                      | production은 `--prod` 적용, 두 범위 모두 정책 검증과 기한부 예외 1건을 적용해 통과                                                     |
| `bun run format:check`, `bun run lint`, `bun run typecheck`                                           | 1,392 files format, warning 0 lint, 27/27 typecheck task 통과                                                                          |
| `bun run test`, `bun test ./scripts`, `node scripts/oxlint/workspace-rules.node-test.mjs`             | 22 task·939 tests, 28 files·131 tests, workspace rule test 통과                                                                        |
| production origin을 명시한 `bun run build`와 UI·resource·chart·landing bundle 검사                    | API·web·admin·Storybook 4/4 build와 네 bundle guard 통과                                                                               |
| staged 51개 파일 대상 `bun lefthook run pre-commit`                                                   | format·workspace lint·inventory·document drift·architecture·dead-code·package interface 통과                                           |

Docker 검증의 terminal 출력은 이 기록에 결과값으로 고정했다. 최종 Compose 해석에는 공식 checksum과 v5.1.4 version 출력을 확인한 임시 standalone binary를 사용하고 삭제했다. 일회성 VM·image도 검증 뒤 삭제했으며 VM의 Docker daemon binary version 원문은 보존하지 못했다. 따라서 해당 daemon의 exact version은 검증된 사실로 주장하지 않는다. Storybook 정적 산출물의 CI artifact 이름과 14일 보존 위치는 [quality workflow](../../../.github/workflows/quality-gates.yml)가 소유한다.
