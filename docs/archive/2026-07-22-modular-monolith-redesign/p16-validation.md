# P16 전체 검증과 완료 판정

## 판정 기준

P16은 P1~P15 결과를 현재 source에서 다시 실행해 정적 품질, 데이터·복구, 사용자 흐름과 목표 구조를 함께 판정한다. 아래 항목은 로컬 비운영 환경에서 확인한 사실이다. production 배포·migration·restore·rollback은 실행하지 않았으며, production 성공 여부를 추론하지 않는다.

- 기준 commit: `bc9b17d7c3180c8ef67ecf0deb9f29cbfcaf5e81`
- 주 검증 구간·host: `2026-07-23 13:10–13:37 KST`, macOS 26.5.2 arm64, Bun 1.3.10, Node.js 24.16.0
- 현재 source 1차 재검증: `2026-07-23 13:41–13:50 KST`, cache 없는 전체 test부터 image smoke, Storybook, E2E와 staged pre-commit까지 재실행
- 리뷰 지적 수정 후 재검증: `2026-07-23 14:10–14:29 KST`, setup 상태 보존, cache 없는 전체 test, build·audit, Storybook, E2E와 배포 image smoke 재실행
- container 검증: Docker CLI 29.6.2, daemon 29.5.2, Buildx 0.35.0, Compose 5.3.1, Colima 0.10.3의 `linux/amd64` emulation
- Ansible 검증: 임시 Python 환경의 ansible-core 2.21.2, ansible-lint 26.6.0, community.docker 5.2.1
- 결과 artifact: 이 문서, `output/playwright/report/index.html`, flaky-policy trace, 각 앱 `.next`와 `apps/storybook/dist`

## 검증 중 발견해 해결한 문제

fresh detached worktree에서 `bun run setup`을 실행하자 환경 파일 생성 뒤 첫 migration이 부모 `data` 디렉터리 부재로 `SQLITE_CANTOPEN`에 실패했다. 또한 `bun --filter @workspace/api`가 data script를 API workspace에서 실행해, root 기준 `file:data/api.sqlite` 계약과 실제 상대 경로가 달랐다.

setup이 실제 `DATABASE_URL`의 부모만 생성하고 기존 DB 파일은 건드리지 않게 했으며, API의 database·audit entrypoint는 기존 `dev`와 같은 방식으로 repository root와 `apps/api/.env`를 명시한다. DB adapter가 임의의 production 경로까지 묵시적으로 생성하게 만드는 대안은 권한·오설정 실패를 숨길 수 있어 채택하지 않았다. Knip에는 shell의 `cd` 뒤에서 자동 추론할 수 없는 실제 entrypoint만 명시했다.

1차 독립 리뷰는 기존 setup의 content seed가 seed 밖 활성 course를 보관하고 기존 draft를 교체하며, learner·admin seed도 기존 상태를 갱신한다는 반례를 확인했다. 같은 DB에서 content seed를 두 번 실행하면 draft `editVersion`도 증가해 P16-004의 데이터 보존과 P16-015의 결정성 판정이 성립하지 않았다. 상속된 shell `DATABASE_URL`이 Bun의 env-file보다 우선해 준비 대상과 실제 migration 대상이 달라질 수 있는 문제도 확인했다.

기본 seed를 누락 row 삽입으로 바꾸되 content는 course aggregate가 없을 때만 전체 계층을 삽입한다. 기존 aggregate·custom course·learner auth/profile은 보존하고, admin은 user·credential·owner identity가 모두 없을 때만 한 transaction에서 생성한다. 관리자 부분 상태나 operator role은 자동 승격하지 않고 실패하며, 명시적 password reset만 기존 credential hash를 바꿀 수 있다. setup은 API env와 상속 환경의 같은 key가 다르면 값 없이 key 이름만 보고하고 중단하며, 검증된 한 환경을 자식 process에 전달한다. 개발 환경·password 보존 설정만 허용하고 database 경로 보간과 non-file 경로는 fail-closed한다.

수정 뒤 fresh worktree에서 setup을 실행하고 seed draft·하위 unit, seed 밖 활성 course, learner auth/profile, admin metadata·role·password hash를 변경했다. 두 번째 setup은 env를 보존하고 migration을 모두 `skipped`로 판정했으며 변경 전후 application-state JSON이 같았다. 충돌하는 shell `DATABASE_URL` 실행은 다른 DB를 만들기 전에 중단됐다. 회귀 test는 content 중간 실패 뒤 재실행, 동일 DB seed 상태 불변, admin 부분 상태 거부, 공백·quoted·file URL과 기존 DB byte 보존을 고정한다. DB byte나 서로 다른 fresh DB hash는 password salt·timestamp·WAL 때문에 결정성 근거로 사용하지 않는다.

## 정적 품질과 build

| 명령                                                                | 확인 결과                                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| root `package.json` 재검토, `bun run check:toolchain`               | authoritative script와 Bun 1.3.10·Node 24.x 계약 확인                        |
| `bun install --frozen-lockfile`                                     | 28개 workspace, lockfile 변경 없이 통과                                      |
| `bun run lint`, `bun run format:check`                              | architecture 28개 workspace, Knip, interface·문서·정책 검사와 warning 0 통과 |
| `bun run typecheck`                                                 | 27/27 task 통과                                                              |
| `bunx turbo test --force`                                           | cache 0, 22/22 unit/integration/HTTP/UI test task 통과                       |
| `bun test ./scripts`, Oxlint workspace rule node test               | 최종 29개 파일·144개 test와 custom rule test 통과                            |
| CI 공개 origin을 명시한 `bun run build`                             | API, web, admin, Storybook 4/4 build 통과                                    |
| 세 route bundle guard와 compiled CSS guard                          | landing 45,334 B, admin 최대 55,906 B, resources 124,427 B gzip 예산 통과    |
| `bun run audit:production`, `bun run audit:full`, `bun pm ls --all` | 두 audit 범위와 repository dependency 정책 통과                              |
| `bun lefthook run pre-commit`                                       | staged format, Knip, architecture, inventory와 document drift 통과           |

## 데이터·운영 검증

| 환경·명령                                                                             | 확인 결과                                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| fresh detached worktree `bun run setup` 2회와 `bun run doctor`                        | env·기존 application state 보존, migration 적용 후 재실행 skip, seed와 doctor 통과       |
| 수정한 seed aggregate·learner·admin 상태의 재실행 snapshot                            | draft·custom course·profile·role·password hash를 포함한 application-state JSON 불변      |
| 충돌 shell env와 중간 seed 실패 회귀 test                                             | 다른 DB 생성 전 key-only fail-closed, 누락 aggregate만 재시도해 완료                     |
| fresh DB `bun run db:backup --source=data/api.sqlite --output=data/p16-backup.sqlite` | 독립 backup, integrity `ok`, 필수 table read smoke 통과                                  |
| fresh DB `bun --filter @workspace/api db:reconcile`                                   | dangling cross-module reference 0                                                        |
| cache 없는 전체 DB·module test                                                        | 빈 DB·기준선 upgrade, application read/write, cross-module FK와 schema join 0 계약 통과  |
| 실제 process lifecycle test와 Playwright runner                                       | liveness·DB readiness 분리, SIGTERM drain·DB close·port release 통과                     |
| `bun run check:deployment-config`                                                     | Compose, Caddy, Litestream 해석과 설정 검증 통과                                         |
| 고정 Ansible 환경 `bun run check:deployment-ansible`                                  | production profile failure/warning 0, 5개 playbook syntax 통과                           |
| `bun run test:deployment-images`                                                      | 세 `linux/amd64` image build, 비루트 health, API migration·backup, Caddy Host route 통과 |

Docker 검증은 macOS 기본 임시 경로가 Colima에 공유되지 않아 `TMPDIR=/Users/mac/github/writing-app`만 주입했다. 스크립트는 task 전용 container·network·image·임시 데이터를 제거했고 Colima VM도 종료했다. 실제 production secret, network, host와 remote backup은 검증 범위가 아니다.

rollback은 immutable 이전 image가 현재 DB와 호환된다는 별도 승인이 있을 때만 허용된다. 호환성을 증명할 수 없으면 application rollback이 아니라 검증된 backup의 별도 restore 절차가 필요하며, destructive data rollback은 자동화하지 않는다. 이 한계와 production 미실행 경계는 P16 독립 reviewer의 승인 대상이다.

## 사용자 흐름과 비기능 검증

| 명령                                        | 확인 결과                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `bun run test:e2e:flaky-policy`             | CI retry 1회와 trace 보존 정책 통과                                    |
| `bun run test:e2e`                          | `ENABLE_TEST_AUTH=true`, 1 worker, learner·admin·UI seam 3/3 통과      |
| `bun run test:storybook`                    | 42개 파일·179개 interaction/a11y test 통과                             |
| AI feedback와 operations 경계 test          | success, unavailable, timeout, quota와 retry 분기 통과                 |
| resource application·persistence·HTTP와 E2E | upload/import, save conflict, delete, compensation·reconciliation 통과 |
| unified API route registry·OpenAPI test     | learner/admin runtime registry와 승인된 contract 일치                  |
| observability·security audit test           | 중첩 secret, credential, session, raw answer와 PII redaction 통과      |

E2E runner는 API·web·admin·fixture server와 격리 DB를 직접 소유하고 종료했다. 종료 뒤 3000, 3001, 3100, 3101, 4000, 4100, 4199 listener와 Next dev lock은 0개였고, 임시 worktree·Ansible 환경도 제거했다.

## 목표 구조 완료 판정

- workspace inventory는 앱 4개와 `modules` 6개, `infra` 8개, `shared` 7개, `config` 3개만 허용한다. 내부 이름, root group과 공개 subpath는 manifest·inventory·package interface 검사가 함께 고정한다.
- 여섯 module은 domain/application/infrastructure/interface 수직 책임을 소유한다. module 간 접근은 공개 query/application port와 domain event만 허용하고 schema·repository·table deep import와 runtime cycle은 architecture fixture가 거부한다.
- expected failure는 Result/discriminated union으로, aggregate 상태 전이는 frozen `DomainDecision`으로 검증된다. frontend의 module·DB·Drizzle import도 architecture 검사상 0개다.
- unified migration·seed·backup/restore는 단일 API composition과 module-owned schema를 사용한다. 현재 schema의 cross-module FK·dangling reference는 0이며 application 수준 reference 검증은 각 module이 소유한다.
- P15의 제거 검사와 tombstone은 deprecated alias, forwarding, flat package, dual runtime과 compatibility facade의 재도입을 거부한다.
- ADR-0020은 전환기의 app-owned persistence 결정을 module-owned 수직 슬라이스로 대체하며, runtime·data model·migration 권위 문서는 안전한 setup과 insert-missing seed 계약을 반영한다.
- lint, typecheck, cache 없는 전체 test, 4개 build, audit, Storybook a11y, Playwright와 image smoke가 함께 통과했으므로 목표 가이드의 구현·검증 완료 조건을 충족한다. 영구 문서 전체의 최종 대조와 archive 생명주기는 P17에서 별도 완료한다.

## 독립 리뷰

독립 reviewer `/root/p16_review`는 기준 commit 대비 staged diff를 재검토하고 발견사항 없음으로 판정했다. seed 보존·재시도·transaction rollback, setup 환경 일치와 fail-closed 동작, ADR-0014에서 ADR-0020으로의 대체 관계를 확인했으며 다음 두 완료 판정을 명시적으로 승인했다.

- P16-019: 이전 immutable image의 현재 DB 호환성이 승인된 경우에만 code rollback을 허용하고, 그렇지 않으면 writer 중지와 검증된 backup의 별도 restore가 필요하다는 한계를 승인했다.
- P16-037: 목표 아키텍처 가이드 26절의 17개 완료 조건을 모두 충족하며, P17의 영구 문서 전체 대조와 archive는 별도 생명주기라고 판정했다.

리뷰어의 첫 cache 없는 전체 test에서는 변경 범위 밖 AdminShell test가 한 차례 timeout됐지만 단독 6회와 전체 22/22 재실행은 통과했다. 부하성 원인이라는 해석은 추론이며 staged 변경에서 재현 가능한 결함은 발견되지 않았다. 최종 판정은 `승인: 커밋 가능`이다.
