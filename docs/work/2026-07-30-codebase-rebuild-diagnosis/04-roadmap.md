# 04 · 로드맵

## 원칙

- 빅뱅 리라이트를 하지 않는다. 각 Step은 **단독으로 배포 가능**하고 **단독으로 되돌릴 수 있다**.
- Strangler: 새 경로를 먼저 세우고, 소비자를 옮기고, 마지막에 옛 경로를 지운다. 한 Step 안에서 세 단계를 모두 끝내지 않아도 된다.
- 각 Step의 검증은 **실행 가능한 명령**으로 표현한다. "확인한다"는 검증이 아니다.
- Step 0을 먼저 하지 않으면 이후 모든 Step의 검증이 성립하지 않는다.

## 우선순위 계산

`우선순위 = (영향 × 위험) ÷ 공수`. 영향·위험은 1~5, 공수는 맨데이(MD).

| 순위 | ID        | 영향 | 위험 | 공수 | 점수      | 근거 수치                                           |
| ---- | --------- | ---- | ---- | ---- | --------- | --------------------------------------------------- |
| 1    | F-01      | 5    | 5    | 0.2  | **125.0** | 14개 CI job 전부 실패 중, 실측 EXIT 1               |
| 2    | F-03      | 3    | 3    | 0.1  | **90.0**  | `ci:static` 전체 red, 미사용 export 1건             |
| 3    | F-02      | 4    | 4    | 0.3  | **53.3**  | DoD 명령 로컬 실패, 6개 build task 중 3개 실패      |
| 4    | F-20      | 3    | 3    | 0.3  | **30.0**  | 강제된다고 믿는 규칙이 0회 발동                     |
| 5    | F-25      | 5    | 4    | 1.0  | **20.0**  | 탭 종료 시 초안 유실, `keepalive` 0건               |
| 5    | F-18      | 2    | 2    | 0.2  | **20.0**  | 2,381,967 byte 바이너리 추적                        |
| 5    | F-13      | 2    | 1    | 0.1  | **20.0**  | 1줄 shim, 변경 이력 18회                            |
| 5    | F-32      | 2    | 1    | 0.1  | **20.0**  | repomix 컨텍스트 40,807줄                           |
| 5    | F-04      | 2    | 2    | 0.2  | **20.0**  | DoD 게이트에 typecheck·test 없음                    |
| 10   | F-14      | 3    | 3    | 0.5  | **18.0**  | 버그를 재시도 신호로 오분류                         |
| 11   | F-16+F-31 | 4    | 3    | 0.7  | **17.1**  | 무동작 플래그 9곳 + 테스트 7곳 + 잘못된 온보딩 안내 |
| 12   | F-24      | 4    | 3    | 0.8  | **15.0**  | ID 검증 강도 2등급, 팩토리 3개                      |
| 13   | F-22      | 5    | 4    | 1.5  | **13.3**  | 원인 폐기 25/31, 감사 실패 5곳 무흔적               |
| 13   | F-17      | 2    | 2    | 0.3  | **13.3**  | 사장 브랜드 2종                                     |
| 15   | F-33      | 4    | 3    | 1.0  | **12.0**  | 용어집 13줄, 다수 발견의 상류 원인                  |
| 16   | F-05      | 4    | 4    | 1.5  | **10.7**  | 시간대 7곳 5표현, 4곳은 SQL 문자열                  |
| 17   | F-19      | 2    | 1    | 0.2  | **10.0**  | 죽은 경로 참조 4곳                                  |
| 17   | F-30      | 1    | 1    | 0.1  | **10.0**  | 동어반복 테스트 1건                                 |
| 19   | F-12      | 3    | 3    | 1.0  | **9.0**   | 컨테이너당 리포팅 이중 조립                         |
| 19   | F-15      | 3    | 3    | 1.0  | **9.0**   | 병렬 조립 269줄, 변경 이력 20회                     |
| 21   | F-08      | 4    | 4    | 2.0  | **8.0**   | `./schema` 소비 12곳                                |
| 21   | F-10      | 2    | 2    | 0.5  | **8.0**   | 5개 모듈 3가지 관례                                 |
| 23   | F-06      | 5    | 4    | 3.0  | **6.7**   | purge 29파일, 개인정보 미삭제 위험                  |
| 24   | F-26      | 3    | 2    | 1.0  | **6.0**   | `AbortController` 0건                               |
| 24   | F-27      | 3    | 3    | 1.5  | **6.0**   | DTO 별칭 11곳                                       |
| 24   | F-07      | 4    | 3    | 2.0  | **6.0**   | raw SQL 380줄, 타입 미검증                          |
| 27   | F-21      | 2    | 1    | 0.5  | **4.0**   | 무효 lint 선언 15개                                 |
| 27   | F-09      | 3    | 2    | 1.5  | **4.0**   | infra 공개 5종                                      |
| 27   | F-11      | 2    | 1    | 0.5  | **4.0**   | 수동 subpath 170개                                  |
| 30   | F-28      | 3    | 2    | 2.0  | **3.0**   | 766줄 컴포넌트                                      |
| 30   | F-23      | 3    | 2    | 2.0  | **3.0**   | 에러 타입 44 / 매퍼 14                              |
| 30   | F-29      | 3    | 2    | 2.0  | **3.0**   | 케이스당 46.7줄                                     |

총 공수 **약 29.5 MD**.

---

## 1단계 · 게이트 복구와 위험 제거 (Step 0~4, 7.2 MD)

이 단계가 끝나면 저장소는 "변경이 자동으로 검증되는 상태"로 돌아온다. 이후 단계의 안전망이 된다.

### Step 0 · 검증 게이트 되살리기 — 0.9 MD

| 항목      | 내용                                         |
| --------- | -------------------------------------------- |
| 목표      | 모든 검증 명령이 로컬과 CI에서 동일하게 통과 |
| 선행조건  | 없음 (최우선)                                |
| 대상 발견 | F-01, F-03, F-02, F-20                       |

작업

1. F-01: `check:toolchain` 판단 — Bun/Node 버전 계약 검증이 필요하면 `scripts/check-toolchain.ts` 복원, 불필요하면 workflow 14곳(`quality-gates.yml:56,108,133,164,190,216,246,278,321`, `image-release.yml:40,129,225,266,415`) 제거. **권고: 제거** — `engines`와 `packageManager`가 이미 계약을 표현하고 setup-bun/setup-node가 고정 버전을 쓴다.
2. F-01 재발 방지: `scripts/check-workflow-scripts.ts` 신설 — workflow의 `bun run <name>` 전부가 루트 `package.json` `scripts`에 존재하는지 단정. `ci:static:workflow-scripts`로 등록.
3. F-03: `apps/web/src/features/lesson-session/model/lesson-logic.ts:24 getFirstLessonStep` export 제거.
4. F-02: `apps/web/.env.example`·`apps/admin/.env.example`의 `CONTENT_ASSET_PUBLIC_BASE_URL`을 loopback으로 허용하도록 `packages/config/env/src/public-url.ts`의 production 검사에 `isLoopbackHostname` 예외 추가. 같은 파일 `assertPublicUrlTransport:105-108`이 이미 동일 예외를 쓰고 있어 규칙 통일에 해당한다.
5. F-20: `.oxlintrc.json` `no-restricted-imports` 패턴을 `@/test/*`로 수정, 메시지 경로를 `apps/web/src/test`로 정정. 수정 후 나오는 위반은 별건으로 기록.

영향 파일: `.github/workflows/quality-gates.yml`, `.github/workflows/image-release.yml`, `package.json`, `scripts/check-workflow-scripts.ts`(신규), `packages/config/env/src/public-url.ts`, `apps/web/.env.example`, `apps/admin/.env.example`, `.oxlintrc.json`, `apps/web/src/features/lesson-session/model/lesson-logic.ts`

검증

```sh
bun run check:workflow-scripts   # 신규
bun run ci:static               # 전부 통과해야 함 (현재 knip 실패)
bun run build                   # 현재 실패 → 통과로 전환
bun run test
```

지표: `ci:static` 8개 하위 검사 전부 green, `bun run build` `Tasks: 6 successful, 6 total`.

롤백: 각 항목이 독립 commit. workflow 변경은 revert 후 즉시 이전 상태 복귀(현재 상태도 실패이므로 위험 없음). `public-url.ts` 변경은 production 경로에 영향 없음(loopback만 추가 허용).

### Step 1 · 무비용 삭제 — 1.3 MD

| 항목      | 내용                                                             |
| --------- | ---------------------------------------------------------------- |
| 목표      | 호출처 없는 코드·설정·바이너리 제거로 이후 단계의 탐색 비용 절감 |
| 선행조건  | Step 0 (게이트가 삭제 안전성을 검증)                             |
| 대상 발견 | F-13, F-18, F-19, F-21, F-30, F-32, F-04                         |

작업

1. F-13: `apps/api/src/env.test.ts:3`이 `@/config/env`를 직접 import하도록 수정, `apps/api/src/env.ts` 삭제.
2. F-18: `.playwright-cli/` 11파일 삭제, `.gitignore`에 `.playwright-cli/` 추가. 이력 재작성은 하지 않는다(force push 위험 > 2.4MB 이득).
3. F-19: `.oxlintrc.json:41,43`의 `docs/superpowers/evidence/**`·`Kwep/**` 제거, `knip.json:19`의 `!scripts/architecture/fixtures/**` 제거, `AGENTS.md:11`에서 `.tool-versions` 언급 제거(또는 파일 생성).
4. F-21: `.oxlintrc.json`에서 TS override가 다시 `off`하는 15개 규칙을 `rules` 블록과 override에서 동시 삭제.
5. F-30: `packages/modules/learning/src/test/domain/learning-date.test.ts:16` 케이스 삭제.
6. F-32: `package.json`의 `repomix:docs`·`repomix:analysis`에 `docs/research/**` 제외 추가.
7. F-04: `AGENTS.md` DoD에 `bun run test` 추가.

영향 파일: 위 8개 + 삭제 11개

검증

```sh
bun run ci:static
bun run test
git status --porcelain   # 의도한 삭제만 존재
bun run repomix:docs && (Get-Content .artifacts/repomix/combined-docs.md).Count  # 라인 수 대폭 감소 확인
```

지표: 추적 파일 수 −11, 저장소 작업 트리 −2.38MB, `.oxlintrc.json` −15줄.

롤백: 파일 단위 revert. 삭제된 코드에 프로덕션 소비자가 없음은 Step 0의 knip·typecheck·test로 이미 보장.

### Step 2 · 사용자 데이터 보호 — 2.0 MD

| 항목      | 내용                                       |
| --------- | ------------------------------------------ |
| 목표      | 학습자 초안 유실 경로 차단, 요청 취소 도입 |
| 선행조건  | Step 0                                     |
| 대상 발견 | F-25, F-26                                 |

작업

1. `apps/web/src/features/lesson-session/api/draft-transport.ts` 신설 — 언로드 전용 flush를 `fetch(..., { keepalive: true })`로 구현. 페이로드 크기가 64KB를 넘으면 `sendBeacon`이 아니라 `keepalive` fetch를 쓴다(브라우저 제한 고려).
2. `use-lesson-draft-sync.ts:459-468`의 `handlePageHide`·`handleVisibilityChange(hidden)` 경로를 새 전송 함수로 교체. 일반 저장 경로는 현행 유지.
3. F-26: 초안 저장·레슨 조회·목록 조회에 `AbortController` 배선. `packages/infra/http-client/src/generated-fetch.ts:118`이 이미 `signal`을 처리하므로 앱 측 배선만 필요.
4. `mountedRef` 억제는 취소 도입 후 남는 최소 지점만 유지.
5. `docs/engineering/lesson-runtime.md:41`을 실제 보장 범위로 정정.

영향 파일: `apps/web/src/features/lesson-session/api/draft-transport.ts`(신규), `hooks/use-lesson-draft-sync.ts`, `hooks/use-lesson-session.ts`, `docs/engineering/lesson-runtime.md`

검증

```sh
bun --filter @workspace/web test
bun run test:e2e:pr
```

추가 E2E 케이스: 초안 입력 → 800ms 이내에 `page.close()` → 재로그인 후 초안이 남아 있는지 단정. 이 케이스가 **현재 없고, 없기 때문에 F-25가 발견되지 않았다.**

지표: 새 E2E 케이스 통과. 레슨 이동 시 취소된 요청 수 > 0 (개발자 도구 수동 확인 1회로 충분, 자동화 불필요).

롤백: `draft-transport.ts`를 쓰지 않도록 훅의 두 줄만 되돌린다. wire 계약 변경 없음 → 서버 롤백 불필요.

### Step 3 · 관측 복구 — 2.0 MD

| 항목      | 내용                                   |
| --------- | -------------------------------------- |
| 목표      | 실패가 흔적을 남기고, 오류 등급이 정확 |
| 선행조건  | Step 0                                 |
| 대상 발견 | F-22, F-14                             |

작업

1. `packages/shared/kernel/src/failure.ts` 신설 — `Failure<TKind, TDetail>`에 `cause?: unknown`, `retryable: boolean`.
2. F-22: `catch → err` 25곳에 `cause` 전달. 우선순위: `audit-event-drizzle-repository.ts:25,46,54,69,89`(감사) → `deletion-marker-store.ts:43,64`·`deleted-learner-purge-repository.ts:54`·`deletion-marker-reapplication.repository.ts:116`(개인정보) → `content-drizzle-repository.ts:189,217,286,332,600` → 나머지.
3. 감사·개인정보 실패는 `logger.error` 필수. 로그 이벤트 이름을 `packages/infra/observability/src/events.ts`에 등록.
4. F-14: `mapOperationsError`가 `error.query`를 응답 message와 로그에 반영. `operationError` 헬퍼 제거(리터럴 타입으로 한 방향만 가능).
5. oxlint 커스텀 룰 추가 검토 — `catch (cause)` 블록에서 `err(` 호출 시 `cause` 미포함을 경고. `scripts/oxlint/workspace-rules.mjs`에 이미 커스텀 룰 인프라가 있다.

영향 파일: `packages/shared/kernel/src/failure.ts`(신규), 25개 어댑터·리포지토리, `packages/infra/observability/src/events.ts`, `packages/modules/operations/src/interface/http/operations-http-support.ts`, `scripts/oxlint/workspace-rules.mjs`

검증

```sh
bun run ci:static
bun run test
bun run test:oxlint-rules
```

추가 테스트: 감사 이벤트 저장 실패 시 `logger.error`가 호출되고 `cause`가 전달되는지 1케이스(`operations` 통합 테스트에 추가). 나머지 24곳은 새 lint 룰이 정적으로 보장하므로 테스트를 추가하지 않는다.

지표: `err({ cause` 발생 수 6 → 31. 새 lint 룰 위반 0.

롤백: `cause` 추가는 순수 확장(기존 필드 유지)이므로 wire·타입 호환. Step 단위 revert 안전.

### Step 4 · 죽은 기능 제거 — 1.0 MD

| 항목      | 내용                                              |
| --------- | ------------------------------------------------- |
| 목표      | 존재하지 않는 기능을 지키는 코드·테스트·문서 제거 |
| 선행조건  | Step 0                                            |
| 대상 발견 | F-16, F-31, F-17                                  |

작업

1. F-16: `packages/config/env/src/parse-env.ts:26`의 `ENABLE_TEST_AUTH` 선언과 `:117-123` production 검증 제거. `infra/ansible/.../api.env.j2:11`, `web.env.j2:7`, `scripts/admin-dev-lifecycle.smoke.ts:47`, `scripts/test-deployment-images.ts:58`에서 제거. `AGENTS.md:57`을 실제 E2E 로그인 방식(이메일·비밀번호 핸들러, `e2e/auth.ts`)으로 정정.
2. F-31: `parse-env.test.ts:60,72,74,80,136,145,149` 관련 케이스 제거.
3. F-17: `packages/shared/types/src/ids.ts:5,12`(`ConversationId`, `MessageId`), `packages/shared/contracts/src/identity/admin-ids.ts:27,28`(스키마), `admin-ids.typecheck.ts`·`ids.typecheck.ts`의 해당 케이스, `admin-ids.test.ts:5,12` 제거.
4. `knip.json:3`의 `ignoreFiles: ["packages/**/src/**/*.typecheck.{ts,tsx}"]` 재검토 — 이 설정이 F-17 탐지를 막았다. `.typecheck.ts`를 knip 대상에 포함하고 필요한 예외만 좁게 지정.

영향 파일: 위 12개

검증

```sh
bun run ci:static
bun run test
bun run test:e2e:pr          # 로그인 경로가 플래그와 무관함을 재확인
bun run check:deployment-ansible
```

지표: `git grep -c ENABLE_TEST_AUTH` → docs/archive 외 0건. `git grep -c ConversationId` → 0건.

롤백: 파일 단위 revert. 플래그가 무동작임이 실측으로 확인되었으므로 런타임 영향 없음.

---

## 2단계 · 경계 정본화 (Step 5~9, 14.8 MD)

이 단계가 끝나면 도메인 개념과 데이터 경계가 타입으로 강제된다.

### Step 5 · 도메인 언어 정본 확립 — 3.3 MD

| 항목      | 내용                                                            |
| --------- | --------------------------------------------------------------- |
| 목표      | 시간대·식별자 스키마의 정본을 1곳으로. 용어집이 코드를 가리킨다 |
| 선행조건  | Step 0, Step 1                                                  |
| 대상 발견 | F-33, F-05, F-24                                                |

작업 (Strangler 3단계)

1. **세운다**: `packages/shared/kernel/src/day-boundary.ts` — `platformDayBoundary = { timeZone, sqliteOffset }`. `packages/shared/contracts/src/identifier.ts` — 단일 `createIdentifierSchema`(강한 규칙: 형식 + `max(200)` + `u` 플래그).
2. **옮긴다**: 시간대 소비자 7곳을 새 정본으로 전환. SQL 4곳은 문자열 리터럴 대신 파라미터 바인딩으로 offset 주입. `contracts/learning/ids.ts:6`·`contracts/content/ids.ts:21`의 중복 팩토리를 새 정본 소비로 교체.
3. **지운다**: `learning-date.ts:6`의 `platformLearningTimeZone`을 재수출로 남기거나 삭제(learning 내부 소비자만 남으면 삭제). 중복 팩토리 2개 제거.
4. `docs/glossary.md`를 03 문서의 "도메인 언어 정본" 표 기준으로 재작성.

영향 파일: `packages/shared/kernel/src/day-boundary.ts`(신규), `packages/shared/contracts/src/identifier.ts`(신규), `learning-date.ts`, `identity-queries.ts`, `operations-reporting.ts`, `ai-feedback-quota.ts`, `ai-feedback-answer.tsx`, `operations-reporting-sqlite-repository.ts`, `contracts/learning/ids.ts`, `contracts/content/ids.ts`, `contracts/identity/admin-ids.ts`, `docs/glossary.md`

검증

```sh
bun run ci:static
bun run test
```

추가 테스트: ID 스키마가 형식 위반·200자 초과를 거부하는 케이스 1건(현재 `courseIdSchema`는 통과시킨다). 시간대는 `learning-date.test.ts`의 기존 날짜 경계 케이스로 충분하며 상수 동어반복 테스트는 추가하지 않는다.

지표: `git grep -cE '"Asia/Seoul"|\+9 hours|9 \* 60 \* 60'` → 정본 1곳. `createIdSchema` 정의 수 3 → 1.

롤백: 정본 도입은 순수 추가. 소비자 전환은 파일 단위 revert 가능. ID 검증 강화는 **행위 변경**이므로 별도 commit으로 분리하고, 기존 시드·E2E 픽스처 ID가 새 규칙을 통과하는지 Step 내에서 먼저 확인한다.

주의: ID 규칙 강화는 이미 저장된 데이터에 소급 적용되지 않는다(읽기 경로는 DB 값을 신뢰). 그러나 저장된 ID가 새 규칙을 위반하면 그 ID를 입력으로 받는 API가 400을 반환한다. `bun --filter @workspace/api db:inspect`로 기존 ID 형식을 먼저 확인할 것.

### Step 6 · 조립 정리 — 2.0 MD

| 항목      | 내용                                                        |
| --------- | ----------------------------------------------------------- |
| 목표      | 컨테이너에서 중복 조립 제거, 테스트 조립이 실 조립을 재사용 |
| 선행조건  | Step 0                                                      |
| 대상 발견 | F-12, F-15                                                  |

작업

1. F-12: `create-container.ts`에서 learning 모듈을 identity보다 먼저 조립하고 `learning.reportingQuery`를 identity에 주입. `create-container.ts:189-192`의 별도 `createLearningReportingQuery` 호출 제거. `@workspace/learning/reporting` export와 `packages/modules/learning/src/learning-reporting.ts` 삭제. `learning-module.composition.ts:37`의 `createLearningContentQueryPort` export를 내부 함수로 되돌림.
2. F-15: `apps/api/src/routes/test-dependencies.ts` → `apps/api/src/test-support/learner-app-fixture.ts`로 이동. `createTestLearnerApp`이 라우트 등록 순서·미들웨어 조합을 자체 작성하지 않고 실제 `createApp`을 호출하도록 전환. 픽스처는 `ApiContainer` 형태의 의존성만 제공. `apps/api/src/routes/` 디렉터리 제거.

영향 파일: `apps/api/src/composition/create-container.ts`, `composition/learning-module.composition.ts`, `packages/modules/learning/package.json`, `packages/modules/learning/src/learning-reporting.ts`(삭제), `apps/api/src/test-support/learner-app-fixture.ts`(이동), 4개 테스트 파일의 import

검증

```sh
bun run ci:static
bun --filter @workspace/api test     # 37파일 137케이스 유지
bun run test:e2e:pr
```

지표: `create-container.ts`에서 `createDrizzleLearningReportingRepository` 경로 1회만 실행(조립 테스트에서 인스턴스 수 단정 가능하나, 과잉이므로 코드 리뷰로 확인). `learning` exports 7 → 6.

롤백: 조립 순서 변경은 단일 파일 revert. 테스트 이동은 import 경로 revert.

주의: identity가 learning에 의존하고 learning이 content에 의존하는 순서가 되므로, `createLearnerIdentityBridge`(`create-container.ts:376`)의 late-binding 필요성이 달라질 수 있다. 순서 변경으로 bridge를 제거할 수 있는지 이 Step에서 확인하고, 가능하면 별도 commit으로 제거한다(런타임 throw 하나가 줄어든다).

### Step 7 · 모듈 공개 표면 축약 — 4.5 MD

| 항목      | 내용                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| 목표      | 모듈 exports를 `module` / `http` / `ports` / `migration-schema` 4개로 정규화 |
| 선행조건  | Step 6 (조립 경로가 하나로 정리된 뒤)                                        |
| 대상 발견 | F-10, F-09, F-08, F-11                                                       |

작업 (모듈 단위로 5회 반복 — 각 모듈이 독립 배포 단위)

1. content: `./application`·`./maintenance`·`./register-routes`를 `./module`·`./http`로 통합. `createContentModule` 신설.
2. operations: `./audit-repository`·`./reporting-repository`를 `./module` 내부로 흡수. `composition/operations-module.composition.ts`가 concrete factory를 몰라도 되게 함.
3. ai-feedback: `./provider`를 `./module` 파라미터(`provider?: AiFeedbackProvider`)로 전환. 테스트의 `createUnavailableAiFeedbackProvider` 주입 경로는 `./ports` 타입 + 테스트 로컬 구현으로 대체.
4. identity: 12개 → 4개. `./admin-actor`·`./learner-profile`·`./user-status`·`./queries`·`./sessions`·`./purge`·`./seed`를 `./ports`와 `./module`로 흡수.
5. learning: `./mapping`·`./application`을 내부화.
6. 전 모듈 `./schema` → `./migration-schema` 개명 + depcruise 규칙 `migration-schema-is-app-database-only` 추가(03 문서 참조).
7. F-11: `@workspace/ui`만 wildcard exports로 전환(49 → 3). **모듈 패키지는 wildcard 금지** — `dependency-cruiser.config.mjs:135`의 `modulePublicTargetPattern`이 `exports`에서 파생되므로 경계 검사가 무력화된다.

영향 파일: 5개 모듈 `package.json`, 각 모듈 `module.ts`, `apps/api/src/composition/*.ts`, `apps/api/src/db/schema.ts`, `packages/shared/ui/package.json`, `dependency-cruiser.config.mjs`

검증

```sh
bun run check:architecture   # 새 규칙 포함, 위반 0
bun run ci:static
bun run test
bun run build
```

지표: 모듈 exports 합계 40 → 20. 전체 subpath 170 → 약 95. `check:architecture` 위반 0 유지.

롤백: **모듈별 독립 commit**. 한 모듈의 exports 변경이 실패하면 그 모듈만 revert. depcruise 규칙 추가는 별도 commit(규칙만 revert 가능).

### Step 8 · 데이터 경계 강제와 purge 포트 — 3.0 MD

| 항목      | 내용                                                                |
| --------- | ------------------------------------------------------------------- |
| 목표      | 타 모듈 테이블 쓰기를 컴파일 차단. 학습자 삭제를 모듈 책임으로 이전 |
| 선행조건  | Step 7 (`migration-schema` 격리 완료)                               |
| 대상 발견 | F-06                                                                |

작업 (Strangler)

1. **세운다**: `packages/shared/kernel/src/learner-data.ts`에 `LearnerDataPurgePort`. 각 모듈(`learning`, `ai-feedback`, `identity`)에 `infrastructure/persistence/learner-purge.ts` 구현 추가 후 `./module` 반환값에 포함.
2. **옮긴다**: `apps/api/src/privacy/purge-learner.ts`가 포트 배열을 순회. `adapters/identity/learner-data-purge.ts`의 각 삭제를 해당 모듈 포트로 이전하며 **한 모듈씩** 전환(전환 중에는 두 경로가 공존하고 통합 테스트가 동일 결과를 단정).
3. **지운다**: `adapters/identity/learner-data-purge.ts` 삭제. `@workspace/ai-feedback/migration-schema`·`@workspace/learning/migration-schema`에 대한 app 외부 import가 사라졌음을 depcruise로 확인.

영향 파일: `packages/shared/kernel/src/learner-data.ts`(신규), 3개 모듈의 `learner-purge.ts`(신규) + `module.ts`, `apps/api/src/privacy/purge-learner.ts`(신규), `apps/api/src/adapters/identity/learner-data-purge.ts`(삭제), `apps/api/src/scripts/purge-deleted-learners.ts`, `apps/api/src/maintenance/daily-maintenance.ts`

검증

```sh
bun run check:architecture
bun --filter @workspace/api test
bun run test   # deleted-learner-purge-repository.test.ts 가 동일 결과 단정
```

핵심 검증: 전환 전후로 **삭제되는 행 집합이 동일**함을 단정하는 통합 테스트. 기존 `apps/api/src/adapters/identity/deleted-learner-purge-repository.test.ts`(332줄/1케이스)를 이 목적으로 재사용하고, 포트별 삭제 카운트를 반환값으로 검증하도록 확장한다.

지표: `git grep -lE 'purge|deletion' -- apps/api/src` 파일 수 14 → 6. FK 순서가 포트 배열에 명시.

롤백: 모듈별 포트 추가는 순수 확장. app 경로 전환은 한 모듈씩 revert 가능. **삭제 대상 행 집합이 바뀌면 데이터가 남거나 과삭제된다** — 이 Step은 스테이징에서 실 데이터 사본으로 1회 검증한 뒤 프로덕션에 반영한다.

### Step 9 · 리포팅 읽기 뷰 — 2.0 MD

| 항목      | 내용                                                       |
| --------- | ---------------------------------------------------------- |
| 목표      | operations의 크로스-모듈 raw SQL을 계약화된 읽기 뷰로 전환 |
| 선행조건  | Step 7, Step 8                                             |
| 대상 발견 | F-07                                                       |

작업 (03 문서 대안 1 채택)

1. 각 모듈이 `infrastructure/persistence/reporting-view.ts`에서 리포팅용 view를 정의하고 `./migration-schema`에 포함.
2. `operations-reporting-sqlite-repository.ts`의 6개 SQL 상수(`:65,127,224,306,354,373`)가 타 모듈 테이블 대신 view만 참조.
3. migration에 view 생성 추가 — 컬럼 불일치 시 **migration이 실패**하므로 드리프트가 배포 전에 드러난다.
4. depcruise 규칙 `operations-reporting-does-not-import-module-implementations` 유지(view 이름은 문자열이지만 존재는 migration이 보장).

영향 파일: 4개 모듈 `reporting-view.ts`(신규), `operations-reporting-sqlite-repository.ts`, `apps/api/drizzle/**`(신규 migration)

검증

```sh
bun --filter @workspace/api db:migrate   # view 생성 성공
bun run test                              # operations 리포팅 3케이스 동일 결과
bun run test:e2e:pr
```

핵심 검증: 전환 전후 대시보드·분석 응답이 **바이트 단위 동일**함을 단정. 기존 `operations-reporting-metrics-sqlite-repository.test.ts`(697줄/3케이스)의 고정 시드를 기준값으로 사용.

지표: `operations-reporting-sqlite-repository.ts`에서 타 모듈 테이블명 리터럴 0건.

롤백: view는 추가만 하고 SQL 전환은 상수 단위로 되돌릴 수 있다. migration은 `DROP VIEW`로 되돌린다(데이터 손실 없음 — view는 저장하지 않는다).

---

## 3단계 · 표현 계층과 테스트 (Step 10~12, 7.5 MD)

### Step 10 · 오류 변환 축약 — 2.0 MD

| 항목      | 내용                                       |
| --------- | ------------------------------------------ |
| 목표      | domain 실패 → `AppError` 2회 변환으로 축약 |
| 선행조건  | Step 3 (`Failure` 도입 완료)               |
| 대상 발견 | F-23                                       |

작업

1. `packages/modules/learning/src/module.ts:33-63`의 `LearningAiFeedbackHttpCommandError` 중간 shape 제거. `learning-http-mapper.ts:181 mapLearningCommandError`가 domain 실패를 직접 받는다.
2. `module.ts:144`의 `mapAiFeedbackHttpError`를 제거하거나 `mapLearningAiFeedbackError`로 개명(`ai-feedback-routes.ts:159`와 동명 충돌 해소).
3. `domain/learning-error.ts:9 LearningExpectedFailure` + `:31 classifyLearningTransitionError` 제거 — 실측 결과 프로덕션 소비자 0이고 유일 소비자는 `test/domain/learning-error.test.ts`다. 테스트 파일도 함께 삭제한다(05 문서 D-26). `AnswerRejectedFailure`·`createAnswerRejectedFailure`는 별도 확인 후 판단.
4. `assertExhaustiveHttpResult`와 `http-result-exhaustiveness.typecheck.ts`는 유지 — 축약 과정의 variant 누락을 컴파일 시 잡는다.

검증: `bun run ci:static`, `bun run test`, `bun run test:e2e:pr`. wire 응답 코드가 바뀌지 않았음을 `learning-http.test.ts`(15케이스)로 단정.

지표: 에러 타입 선언 44 → 35 이하, 매퍼 14 → 10 이하. AI 피드백 실패 1건 추가 시 수정 지점 3~5곳 → 2곳.

롤백: 중간 shape를 되돌리는 단일 파일 revert. wire 계약 불변이므로 프론트 영향 없음.

### Step 11 · 프론트엔드 모델 경계 — 3.5 MD

| 항목      | 내용                                                   |
| --------- | ------------------------------------------------------ |
| 목표      | UI가 전송 DTO에 직결되지 않게 함. 편집기 컴포넌트 분해 |
| 선행조건  | Step 2                                                 |
| 대상 발견 | F-27, F-28                                             |

작업

1. F-27: `apps/web/src/features/lesson-session/model/lesson-view-model.ts` 신설 — `@workspace/contracts`의 learner 스키마에서 뷰 모델 도출. `api/lesson-session-effect-adapter.ts`에서 DTO → 뷰 모델 변환. `Dto as [A-Z]` 별칭 11곳 제거.
2. F-28: `course-editor-shell.tsx`
   - 상태 술어를 `model/course-editor-reducer.ts`의 `isUnsaved(state)`·`canSave(state)`로 이동(switch 기반 → variant 추가 시 컴파일 에러)
   - `CONTENT_CONFLICT` 복구를 `withConflictRecovery(operation)` 1개로 통합(`:186-198`, `:205-228` 중복 제거)
   - `getAdminCourseEditor`·`uploadAdminContentAsset`를 prop 주입으로 전환(같은 컴포넌트의 `saveCourse`·`publishCourse` 패턴과 통일)
   - 탭 본문을 `CourseInfoTab`·`CourseCurriculumTab`으로 분리

검증

```sh
bun --filter @workspace/web test    # 35파일 126케이스
bun --filter @workspace/admin test  # 37파일 111케이스
bun run test:e2e:release            # admin-content-publishing.spec.ts 785줄이 편집기 흐름을 검증
bun run check:route-bundles         # 번들 예산 회귀 확인
```

지표: `Dto as [A-Z]` 0건. `course-editor-shell.tsx` 766줄 → 300줄 이하. 라우트 번들 예산 유지.

롤백: 뷰 모델 도입은 어댑터 1개 추가로 시작하므로 부분 전환 가능. 편집기 분해는 컴포넌트 단위 revert.

### Step 12 · 테스트 셋업 공유 — 2.0 MD

| 항목      | 내용                                         |
| --------- | -------------------------------------------- |
| 목표      | 통합 테스트 셋업 중복 제거. 케이스 수는 유지 |
| 선행조건  | Step 8, Step 9 (스키마 변경 완료 후)         |
| 대상 발견 | F-29                                         |

작업

1. 모듈별 `test/fixtures/` 신설 — `aLearner()`, `aPublishedCourse()`, `aLearnerWithProgress()` 등 선언적 빌더.
2. 300줄 이상 셋업을 가진 테스트를 빌더로 전환: `deleted-learner-purge-repository.test.ts`(332줄/1케이스), `daily-maintenance.integration.test.ts`(310줄/1케이스), `identity-lifecycle.integration.test.ts`(202줄/1케이스), `operations-reporting-metrics-sqlite-repository.test.ts`(697줄/3케이스).
3. **케이스를 삭제하지 않는다.** 셋업만 축약한다. 삭제 대상 테스트는 05 문서 목록에 한정.

검증: `bun run test` — 케이스 수 742 유지(F-30·F-31 제거분 8건 차감 후 734), 전부 통과.

지표: 테스트 SLOC 34,678 → 27,000 이하. 케이스당 46.7줄 → 37줄 이하.

롤백: 파일 단위. 빌더 도입은 순수 추가.

---

## 배포 가능성 점검

각 Step 종료 시점의 상태.

| Step | 배포 가능 | wire 계약 변경               | 데이터 마이그레이션 | 스테이징 검증 필요           |
| ---- | --------- | ---------------------------- | ------------------- | ---------------------------- |
| 0    | O         | 없음                         | 없음                | 불필요                       |
| 1    | O         | 없음                         | 없음                | 불필요                       |
| 2    | O         | 없음                         | 없음                | 권장(초안 flush 실기기)      |
| 3    | O         | 없음 (message 문구만)        | 없음                | 불필요                       |
| 4    | O         | 없음                         | 없음                | 불필요                       |
| 5    | O         | **ID 검증 강화 = 행위 변경** | 없음                | **필요**                     |
| 6    | O         | 없음                         | 없음                | 불필요                       |
| 7    | O         | 없음                         | 없음                | 불필요                       |
| 8    | O         | 없음                         | 없음                | **필요 (삭제 대상 행 집합)** |
| 9    | O         | 없음                         | **view 생성**       | **필요**                     |
| 10   | O         | 없음 (코드 동일 단정)        | 없음                | 불필요                       |
| 11   | O         | 없음                         | 없음                | 권장                         |
| 12   | O         | 없음                         | 없음                | 불필요                       |

## 공수 요약

| 단계                          | Step  | 공수        |
| ----------------------------- | ----- | ----------- |
| 1단계 게이트 복구와 위험 제거 | 0~4   | 7.2 MD      |
| 2단계 경계 정본화             | 5~9   | 14.8 MD     |
| 3단계 표현 계층과 테스트      | 10~12 | 7.5 MD      |
| **합계**                      |       | **29.5 MD** |

맨먼스 미신 주의: 이 29.5 MD는 **한 사람의 순차 작업량**이다. 인원을 늘려도 Step 0→1→5→7→8→9의 의존 사슬은 압축되지 않는다. 병렬화가 가능한 구간은 Step 2·3·4(서로 독립), Step 7의 모듈 5개, Step 10·11·12뿐이다. 2인 작업 시 실질 단축은 약 30%로 보는 것이 안전하다.
