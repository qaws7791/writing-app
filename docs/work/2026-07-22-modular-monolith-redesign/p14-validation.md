# P14 배포·운영 automation 검증

## 판정 기준

P14는 새 중첩 workspace와 단일 API runtime에 맞춰 build, CI, deployment와 recovery automation을 전환했다. 아래 source와 비운영 로컬 실행 결과는 확인된 사실이다. 실제 production deploy·rollback·restore는 실행하지 않았으며 그 성공 여부를 추론하지 않는다.

- 기준 commit: `d98dcdef6f70d6bcedb821391bb4b9cfd6f7dc69`
- 검증 대상 source patch SHA-256: `436e83165ebd00f0ac66dd5d86c6f5f216c7d2658c8cf16ec2cf5cda8d1ac129`
- 증거 확정 시각·host: `2026-07-23T12:07:51+09:00`, macOS 26.5.2 arm64, Bun 1.3.10, Node.js 24.16.0
- 명령·환경·결과 artifact: [P14 명령 실행 기록](./p14-command-results.md)

## build와 CI

- 세 Docker build는 repository root context에서 manifest를 source보다 먼저 복사하고, filtered·isolated·frozen install과 BuildKit cache를 사용한다. build stage는 host와 같은 platform에서 실행하고 최종 image만 `linux/amd64`로 만든다. Next build는 Node 24가, dependency install은 Bun이 담당한다.
- web·admin 최종 stage에는 Next standalone과 정적 asset만 남는다. 두 app은 Next가 지원하는 `sharp` 0.34.5를 직접 소유하며 server 준비 전에 NSGIF·TIFF·VIPS decoder를 차단한다. image smoke는 PNG가 원본과 다른 더 작은 응답으로 변환되는지 검증한다.
- API 최종 stage에는 API·migration·backup Bun bundle과 bundle 의미 보존에 필요한 `prismjs` 하나만 둔다. migration SQL은 Bun text import로 bundle에 포함하고 Vitest도 같은 loader 의미를 사용한다.
- [quality workflow](../../../.github/workflows/quality-gates.yml)는 경로 allowlist 없이 모든 pull request와 main push에 실행한다. architecture·dead-code·lint·format·typecheck·test·build, 중첩 manifest cache key와 Storybook 14일 artifact 계약은 source test가 고정한다.
- HIGH 이상 audit의 명령문 직접 예외 19개를 제거했다. production audit은 `--prod`로 devDependency를 제외한다. 남은 `sharp` advisory 한 건은 [실행 정책](../../../deploy/security/image-vulnerability-policy.json)이 audit·image scan 대상, 도달 경로, 완화책, owner, 2026-08-06 만료일과 제거 조건을 함께 소유한다. 이는 취약점 해소 주장이 아니라 decoder 차단을 둔 기한부 위험 수용이며, Next가 `sharp` 0.35 이상을 지원하면 제거한다.

## deployment와 recovery

- [Compose](../../../deploy/compose/compose.yaml)와 Caddy는 learner·admin HTTP 표면을 하나의 API image와 `api:4000` upstream에 연결한다. migration·backup은 같은 image의 전용 Bun bundle을 network 없이 실행하고 integrity check도 같은 DB volume을 사용한다.
- production 환경 이름은 parser, example, Ansible template와 Compose를 함께 대조한다. 운영 seed는 승인·DB URL·확인값을 모두 요구하고 기존 reset guard도 production에서 fail-closed한다.
- backup은 성공과 실패 뒤 SQLite partial sidecar를 정리한다. restore는 통합 migration service를 사용한다.
- deploy는 host 변경 전 승인을 요구한다. rollback은 root 소유·`0640`인 직전 환경을 Compose로 해석한 최종 세 application image의 immutable digest와 DB 호환성 승인을 검증하며, 비호환 DB는 [별도 restore 절차](../../engineering/rollback.md)로 분리한다.
- deploy·rollback·restore·verify는 같은 operation lock을 사용하고 획득 실패나 stale lock을 자동 우회하지 않는다. 변경된 Caddy handler는 lock 안에서 실행하고 성공한 뒤에만 배포 기록을 남긴다. verify는 learner·admin readiness의 DB check와 사용자 영향 신호를 함께 검증한다. 실제 production 작업은 실행하지 않았다.

## 자동 검증과 증거 한계

| 검증                               | 결과                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| Compose 배포 계약                  | 최종 source의 Compose JSON 해석과 immutable image 계약 통과    |
| Caddy·Litestream 설정              | container 기반 설정 검증 통과                                  |
| `bun run check:deployment-ansible` | ansible-lint production profile 0건, 5개 playbook syntax 통과  |
| `bun run test:deployment-images`   | 세 `linux/amd64` image build·비루트 실행·파일 경계·health 통과 |
| API operation image smoke          | baseline·module migration 적용, 검증된 SQLite backup 생성 통과 |
| Next image optimizer smoke         | web·admin PNG 실제 축소 변환 통과                              |
| Compose traffic smoke              | Caddy Host route, 단일 API namespace와 Admin SSR upstream 통과 |
| dependency audit                   | production·full 모두 정책 검증과 함께 통과, 기한부 예외 1건    |
| root 정적 품질 게이트              | format, lint, 27개 typecheck task 통과                         |
| root test·build 게이트             | 22개 test task·939개 test, 4개 build task와 번들 검사 통과     |
| 독립 script test                   | 28개 파일·131개 test 통과                                      |

최종 source의 Compose JSON 계약은 checksum을 확인한 Docker Compose v5.1.4 standalone으로 재검증했다. container 검증은 일회성 arm64 VM에서 `linux/amd64` binfmt를 사용했고, Ansible 검증은 고정 requirements와 collection을 임시 환경에 설치해 실행했다. VM의 Docker daemon binary version 출력은 보존하지 못했으므로 명령 기록에서 이를 증거 한계로 분리했다. 이 결과는 image와 automation의 비운영 실행 증거지만 실제 production network, secret store, host 상태나 복구 훈련을 증명하지 않는다. production 실행에는 별도 승인과 환경별 검증이 여전히 필요하다.
