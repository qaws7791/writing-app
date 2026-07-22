# P0 착수 기준선과 실행 안전 조건

## 기준

- 기준 시각: 2026-07-22, Asia/Seoul
- 기준 branch·commit: `main`, `4e255e414167029a42fc9d2ccb7c63fe71cfae09`
- upstream 차이: ahead 0, behind 0
- 시작 worktree: tracked·untracked 변경 없음
- production 배포·migration·복구·외부 자원 변경: 별도 승인 전까지 범위 밖
- 시작 시 writing-app dev server와 background process: 없음

작업 owner는 이 요청을 수행하는 Codex다. merge 전 architecture review는 repository maintainer, 데이터 변경 review는 DB migration maintainer, 보안 review는 auth·deployment maintainer 역할이 맡는다. 한 사람이 여러 역할을 맡더라도 세 관점의 승인 기록은 분리한다. 이번 로컬 작업은 reviewer 역할과 gate를 정한 것이며 사람의 승인이나 production 적용을 했다고 주장하지 않는다.

## 변경과 rollback 경계

| 경계                      | 작업 단계 | rollback 단위                                                                                                                  |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 기준선·책임 결정          | P0        | 문서만 되돌린다. runtime은 바꾸지 않는다.                                                                                      |
| workspace·검증 도구       | P1        | manifest, lockfile, config package와 root 검사 변경을 함께 되돌린다.                                                           |
| shared·infra 기반         | P2~P3     | package별 commit으로 되돌린다. 공개 subpath 소비 전에는 package만 제거할 수 있다.                                              |
| capability 전환           | P4~P9     | identity, content, ai-feedback, learning, resource-library, operations별 route·schema·adapter 묶음으로 되돌린다.               |
| composition·data·frontend | P10~P12   | API 조립, append-only migration, frontend 소비를 각각 독립 rollback 지점으로 둔다. 적용된 migration 파일은 되돌려 쓰지 않는다. |
| 운영·제거·완료            | P13~P17   | 검증과 문서 갱신을 먼저 되돌리고, 이전 구조 제거는 모든 consumer가 0인 상태에서만 수행한다.                                    |

임시 호환 항목은 `식별자 / 도입 이유 / 정확한 edge·경로 / owner / 제거 단계 / 만료 조건`을 기록한다. 현재 등록 항목은 다음 두 종류다.

- `workspace-flat-glob`: 기존 flat package를 발견하기 위한 `packages/*`; owner는 이 개편 작업이며 P15에서 flat package가 0개가 되면 제거한다.
- `legacy-*` dependency-cruiser 규칙: 기존 flat core·UI·frontend에 목표 경계를 적용하기 위한 규칙; owner와 제거 단계는 [아키텍처 검증 도구](../../engineering/repository-architecture-tooling.md)에 고정했고 P15에서 legacy path가 0개가 되면 제거한다.

## 시작 품질 기준선

시작 상태의 직접 관찰 결과다.

| 명령                          | 결과                                                               | 분류                           |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `bun lefthook run pre-commit` | staged file이 없어 hook이 검사를 건너뜀                            | 기준선 제약                    |
| `bun run lint`                | 로컬 Bun 1.3.14와 당시 exact 1.3.10 검사 불일치로 즉시 실패        | 기존 toolchain 제약            |
| `bun run test`                | stale workspace link 때문에 auth 관련 4 suite가 module을 찾지 못함 | 설치 상태 결함                 |
| `bun run build`               | Storybook 성공, web·admin은 출력 없이 대기해 4분 31초 뒤 중단      | 기존 local build 기준선 미확보 |

P1에서 manifest·lockfile을 정리하고 frozen install 가능한 상태를 복구했다. 최종 기준선과 사용자 흐름 결과는 [P0 검증](./p0-validation.md)에 기록한다. 로컬 Bun 1.3.14에서 Lexical 0.46.0 ESM cycle이 발생하지만 repository가 고정한 Bun 1.3.10 전체 테스트는 통과한다. 이는 P1 source 회귀가 아니라 실행 version에 따른 재현 차이라는 것이 두 version의 동일 API suite 실행으로 확인됐다.

## 코드·운영 inventory 진입점

- workspace, name, export, alias와 dependency: root·각 workspace `package.json`, `scripts/workspace-inventory.ts`
- root catalog, script, engine과 package manager: root `package.json`
- runtime·type-only graph와 public surface: [Dependency inventory](./p0-dependency-inventory.md)
- route, OpenAPI, frontend consumer와 DB: [Route·data inventory](./p0-route-and-data-inventory.md)
- env: `packages/config/env`, `apps/{api,web,admin}/.env.example`, `deploy/compose/.env.example`
- build·release·rollback: `deploy/compose/compose.yaml`, `deploy/caddy/caddyfile`, `deploy/docker/`, `.github/workflows/image-release.yml`, `infra/ansible/playbooks/{deploy,rollback,restore}.yaml`
- test: `vitest.workspace.ts`, `apps/storybook/vitest.storybook.config.ts`, `playwright.config.ts`, `playwright.ui-style.config.ts`

현재 값은 위 코드 권위 source가 소유한다. 이 문서는 시작 commit과 실행 결과만 고정한다.
