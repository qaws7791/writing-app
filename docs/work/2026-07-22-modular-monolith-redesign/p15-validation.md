# P15 이전 구조·임시 호환 계층 제거 검증

## 판정 기준

P15는 모듈러 모놀리스 전환 중에만 필요했던 package, alias, graph 규칙과 inventory 항목을 제거하고 최종 workspace 구조를 고정한다. 아래 결과는 source와 로컬 실행으로 확인한 사실이며, 역사 문서의 과거 경로나 production 환경 상태까지 현재 구조라고 추론하지 않는다.

- 기준 commit: `68b90d48f8e941f4382cb89921e1618d38fcfa84`
- 검증 실행 구간·host: `2026-07-23 12:34–13:04 KST`, macOS Darwin 25.5.0 arm64, Bun 1.3.10, Node.js 24.16.0
- 명령·결과 artifact: 이 문서의 [검증 환경과 게이트](#검증-환경과-게이트)

## 제거와 최종 구조

- `packages/core`, core 공개 surface fixture, DB schema 전환 ledger, `#core` alias와 `@workspace/core` lockfile 항목을 제거했다. P0 ledger의 `workspace-flat-glob`과 `legacy-*` dependency-cruiser 규칙도 함께 제거했다.
- 이전 flat package의 추적 source는 없었다. 남아 있던 `packages/auth-proxy`, `packages/core`, `packages/env`, `packages/repository-tooling` 아래의 `.turbo`, coverage와 workspace link만 확인한 뒤 삭제했다. API의 이전 adapter·module 빈 디렉터리와 DB infra의 빈 migration·schema·seed 디렉터리도 정리했다.
- root manifest, Knip, Vitest, CI cache와 Docker manifest COPY의 실행 대상은 2단계 package 경로만 사용한다. Lefthook은 현재 실행 대상과 별개로 flat package manifest·source가 staged될 때 제거 구조 검사가 실행되도록 이전 경로 pattern을 재도입 감지용으로 유지한다. 편집기·lint·PR 설정과 DB ignore 경로에 남아 있던 이전 UI·DB 경로도 현재 위치로 갱신했다.
- workspace inventory 검사는 target fixture와 실제 디렉터리를 대조해 앱 4개와 package 24개만 허용한다. package root는 `config`, `infra`, `modules`, `shared`만 허용하고, 이름은 `@workspace/<kebab-case>`로 강제하며 중복 이름도 거부한다.
- `bun install`로 `bun.lock`을 갱신했다. 격리 복사본은 새 checkout과 같은 Git metadata를 만든 뒤 `bun install --frozen-lockfile`을 통과했다.

`apps/api/src/db/legacy-curriculum-migration.ts`는 임시 architecture adapter가 아니라 이미 배포될 수 있는 이전 schema를 append-only 계보로 이관하는 데이터 호환 경계이므로 유지했다. 이 분류는 파일 이름만으로 한 추론이 아니라 migration checksum·증분 적용 test와 현재 API migration composition을 대조한 결과다.

## 정적 잔존물 감사

- 제품 source의 `@workspace/core`, `#core`와 `@workspace/repository-tooling` consumer는 0개다. 이전 flat package 문자열도 현재 runtime source·manifest·CI·배포 실행 설정에서는 0개이며, package interface의 제거 경로 tombstone과 Lefthook의 staged 재도입 감지 pattern만 의도적으로 남겼다.
- package interface 검사는 `src` deep import, 확장자 import, package 내부 상대 import, 자기 공개 경로 역참조, broad root barrel, 제거된 source·DB infra schema/migration/seed 디렉터리 재도입과 module domain/application의 환경 접근을 거부한다. architecture 검사는 runtime cycle, cross-module schema·repository·table 접근, domain/application의 framework·provider 접근, frontend의 module·DB·Drizzle 접근과 미선언 dependency를 거부한다.
- product source의 정확한 `utils`, `common`, `service` 경로 검색 결과는 `packages/shared/ui/src/lib/utils.ts` 하나다. 이는 `cn`을 제공하는 UI package의 명시적 공개 subpath다. HTTP validation 전용 `utils.ts`는 책임이 드러나는 `zod-path.ts`로 바꿨다.
- 대문자가 포함된 경로는 문서 표준 이름 `README.md`, `AGENTS.md`, `CLAUDE.md`와 Next 동적 segment `[documentId]`뿐이다. underscore 경로는 Next private colocation의 `_providers`, `_views`뿐이며 제품 source의 새 non-kebab-case 항목은 없다.
- 제거된 `admin-api` runtime 문자열과 hostname은 별도 재도입 검사와 고의 위반 fixture에만 남는다. 인증 runtime test도 통합 API origin을 사용한다. `AdminApiResult`와 `admin-api-error`는 현재 통합 API의 관리자 HTTP 의미 이름이며 삭제된 실행 runtime 식별자가 아니다. Bun 외 lockfile·workspace 전제와 이전 DB data 경로는 현재 설정에 없다.
- ADR, `docs/archive`와 이 작업의 이전 단계 inventory에 남은 옛 경로는 역사 기록이므로 현재 사실 검색에서 제외했다. root의 `Kwep`와 `.worktrees`도 제품 구조가 아니며 repository 지시에 따라 수정하지 않았다.

## 검증 환경과 게이트

| 검증                                               | 결과                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `bun run check:workspace-inventory`                | 28개 workspace, 앱 4개·package 24개 exact inventory 통과                           |
| `bun run lint`                                     | architecture 28개 workspace, Knip, package interface, 문서·설정 검사와 Oxlint 통과 |
| `bun run format:check`                             | 통과                                                                               |
| `bun run typecheck`                                | 27개 task 통과                                                                     |
| `bun run test`                                     | 22개 task·939개 test 통과                                                          |
| production origin/API URL을 명시한 `bun run build` | API, web, admin, Storybook 4개 build 통과                                          |
| P15 관련 root 회귀 test                            | 5개 파일·46개 test 통과                                                            |
| 격리 복사본 `bun install --frozen-lockfile`        | 28개 workspace 기준 통과                                                           |
| `bun lefthook run pre-commit`                      | 통과                                                                               |

P15 관련 root 회귀는 `bun test scripts/workspace-inventory.test.ts scripts/static-verification-interface.test.ts scripts/test-deployment-images.test.ts scripts/package-interface-tombstones.test.ts scripts/check-admin-api-runtime-removal.test.ts`로 실행했다. 리뷰 보정 뒤 최종 staged source에서 이 명령과 `bun run typecheck`, `bun run test`, `bun run format:check`, `bun lefthook run pre-commit`을 다시 통과시켰다. production build는 리뷰 보정 전에 실행했으며, 이후 변경은 정적 gate 설정·검사기·fixture·test·문서에 한정되어 app runtime과 build 입력이 달라지지 않았음을 staged diff로 확인했다.

초기 병렬 탐색 실행에서는 CPU 경쟁으로 API import test가 timeout됐고, origin을 주입하지 않은 production build는 의도한 fail-closed 검증에 걸렸다. source 우회나 timeout 완화 없이 각 gate를 단독으로 재실행하고 명시적 production URL을 주입해 위 최종 결과를 얻었다.
