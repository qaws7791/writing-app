# 코드베이스 재구축 진행 상황

기준 commit `6adc206` · 진단 완료일 2026-07-30 · 총 공수 29.5 MD

발견 ID(`F-nn`)는 [`02-findings.md`](./02-findings.md), 삭제 ID(`D-nn`)는 [`05-deletion-backlog.md`](./05-deletion-backlog.md), Step 상세는 [`04-roadmap.md`](./04-roadmap.md)를 참조한다.

## 진행 현황

- [ ] M0 · 소유자 결정 (0.2 MD)
- [x] M1 · 게이트 복구와 위험 제거 (7.2 MD) — 2026-07-30 완료, 편차 6건은 [M1 실행 기록](#m1-실행-기록) 참조
- [ ] M2 · 경계 정본화 (14.8 MD)
- [ ] M3 · 표현 계층과 테스트 (7.5 MD)
- [ ] M4 · 작업 종료와 지식 반영 (0.5 MD)

---

## M0 · 소유자 결정

착수 전에 답이 필요한 항목이다. 미결이면 M1은 진행 가능하지만 M2 이후의 범위와 위험 등급이 확정되지 않는다.

### T-00 · 범위와 제약 확정 — 0.2 MD · 선행 없음

- [ ] 운영 단계 확정: 실사용자가 있는 프로덕션인가 배포 전 개발 단계인가
- [ ] 위 답에 따라 T-09(purge 포트 전환)·T-10(리포팅 뷰)의 스테이징 실데이터 검증 필수 여부 결정
- [ ] 팀 규모와 가용 공수 확정 (29.5 MD는 1인 순차 기준, 2인 투입 시 실질 단축 약 30%)
- [ ] `docs/archive/2026-07-22-modular-monolith-redesign/`의 17단계 재설계를 완료로 볼지 확정 (완료 → 현 구조를 기준선으로, 미완 → 잔여 항목 선행)
- [ ] `docs/work` 진행 중 3건(2026-07-16 / 07-23 / 07-24)과 겹치는 항목의 처리 방침 결정
- [ ] D-22 `docs/research` 215파일 / 40,807줄 외부화 여부 결정 (즉시 조치인 repomix 제외는 T-02에서 별도 진행)
- [ ] D-23 `.agents/skills` 122파일 벤더 사본 유지 여부 결정
- [ ] D-24 `apps/storybook` / D-25 `scripts` 검증 스크립트군은 조사 결과 삭제 비권고임을 확인하고 종결

---

## M1 · 게이트 복구와 위험 제거

종료 조건: 변경이 자동 검증되는 상태 · 사용자 데이터 손실 경로 0 · 모든 실패가 `cause` 보유.

### T-01 · 검증 게이트 되살리기 — 0.9 MD · 선행 없음 · F-01 F-02 F-03 F-20

Quick Win Q-01~Q-04. 이 티켓 전에는 다른 티켓의 검증을 신뢰할 수 없다.

- [x] `check:toolchain` 처리 방침 결정: 참조 제거 (`engines`·`packageManager`·setup-bun/node가 이미 버전 계약을 고정)
- [x] `.github/workflows/quality-gates.yml` 의 `- run: bun run check:toolchain` 9곳 제거
- [x] `.github/workflows/image-release.yml` 의 동일 스텝 5곳 제거
- [x] `scripts/check-workflow-scripts.ts` 신설 — workflow의 `bun run <name>` 전부가 루트 `package.json` `scripts`에 존재함을 단정
- [x] `package.json`에 `check:workflow-scripts` + `ci:static:workflow-scripts` 등록
- [x] F-03: `getFirstLessonStep` 함수 전체 삭제 (소비자 0)
- [x] F-02: `public-url.ts` 에 `violatesProductionHttps()` 를 두고 `parseContentAssetPublicBaseUrl`·`parseContentAssetImageAllowedOrigins` 두 검사에 loopback 예외 적용
- [x] F-02 회귀 테스트 추가: loopback http는 허용, 비-loopback http는 거부
- [x] F-20: `no-restricted-imports` 패턴을 `@test/*` → `@/test/*` 로 정정
- [x] F-20: 같은 규칙의 메시지 경로를 `apps/web/test` → `apps/web/src/test` 로 정정
- [x] F-20 정정 후 위반 0건 — `@/test/*` 소비자 4곳이 모두 `.test.tsx` 라 기존 override로 규칙이 꺼진다. 별건 없음
- [x] 검증: `bun run check:workflow-scripts` 통과
- [x] 검증: `bun run ci:static` — 하위 검사 전부 green
- [x] 검증: `bun run build` — `Tasks: 6 successful, 6 total`
- [x] 검증: `bun run test`
- [ ] 검증: PR 생성 후 CI job이 첫 스텝을 통과하는지 확인 — **로컬에서 불가**
- [ ] 롤백 준비: 항목별 독립 commit으로 분리 — **미실행**, 티켓 단위 commit 분리를 소유자 확인 후 진행

### T-02 · 무비용 삭제 — 1.3 MD · 선행 T-01 · F-04 F-13 F-18 F-19 F-21 F-30 F-32

Quick Win Q-05~Q-07, Q-09, Q-10.

- [x] D-01: `env.test.ts` 를 `@/config/env` 직접 import로 변경
- [x] D-01: `apps/api/src/env.ts` 삭제
- [x] D-01 후속 판단: 파일 이동하지 않음. 소비자 6곳 import를 건드리는 이득이 없고 `config/` 는 T-08 의 디렉터리 정리 대상이 아니다. 대신 테스트를 `apps/api/src/config/env.test.ts` 로 옮겨 콜로케이션만 복구
- [x] D-03: `.playwright-cli/` 11파일 삭제 (실측 2,361,967 B)
- [x] D-03: `.gitignore`에 `.playwright-cli/` 추가
- [x] D-03: 이력 재작성은 하지 않음 (force push 위험 > 2.4MB 이득)
- [ ] D-03 후속 판단: 저작권 논문 PDF가 영구 이력에 남는 것에 대한 라이선스 검토 — **소유자 판단 대기**
- [x] D-04: `.oxlintrc.json` `docs/superpowers/evidence/**` 제거
- [x] D-04: `.oxlintrc.json` `Kwep/**` 제거
- [x] D-05: `knip.json` `!scripts/architecture/fixtures/**` 제거
- [x] D-06: `AGENTS.md` 의 `.tool-versions` 언급을 `package.json` `engines`·`packageManager` 로 정정
- [ ] D-07: `.oxlintrc.json` 의 무효 규칙 15~17개 삭제 — **실행하지 않음, 전제가 틀렸다** (아래 실행 기록)
- [x] D-08: `learning-date.test.ts` 동어반복 **어서션**만 삭제 (케이스는 유지 — 같은 케이스의 KST 경계 단정 2건이 실질 방어)
- [x] F-32: `repomix:docs`·`repomix:analysis` 에 `docs/research/**` 제외 추가
- [x] F-04: `AGENTS.md` Definition of Done 에 `bun run test` 추가
- [x] 검증: `bun run ci:static`
- [x] 검증: `bun run test` — 케이스 수 불변(912). 어서션만 제거했으므로 문서의 742 → 741 기대와 다르다
- [x] 검증: `git status --porcelain` 에 의도한 삭제만 존재
- [x] 검증: `bun run repomix:docs` 출력 줄 수 50,830 → 8,942 (−82%)

### T-03 · 사용자 데이터 보호 — 2.0 MD · 선행 T-01 · F-25 F-26

- [x] `apps/web/src/features/lesson-session/api/draft-transport.ts` 신설 — `DraftSaveTransport` 판별 유니온(`default` 는 `signal` 보유, `unload` 는 보유하지 않음)으로 언로드 flush가 취소되지 않음을 타입으로 강제
- [x] 페이로드가 `keepalive` 제한(64KiB)을 넘으면 일반 요청으로 보낸다. 서버 상한 `learnerStepDraftAnswerJsonMaxBytes` 가 같은 값이라 최대 크기 초안은 언로드 보장 밖이며, 이 경계를 문서에 명시했다
- [x] `handlePageHide` 를 언로드 전송으로 교체
- [x] `handleVisibilityChange(hidden)` 를 언로드 전송으로 교체
- [x] 일반(debounce) 저장 경로는 현행 유지 — 같은 `flushStepDraft` 본문을 transport만 바꿔 재사용
- [x] F-26: 초안 저장에 `AbortController` 배선
- [x] F-26: 레슨 조회(`getLesson`)·목록 조회(`getCourses`, `getProgress` 3곳)·레슨 시작·단계 제출·AI 코칭에 `AbortController` 배선
- [x] F-26: `mountedRef` 는 `setStepStatus` 1곳만 유지 (`bumpRenderRevision`·`discardSubmittedDraft` 에서 제거)
- [x] E2E 케이스 추가: 초안 입력 → debounce 전 `page.close({ runBeforeUnload: true })` → 재로그인 후 초안 존재 단정. **keepalive를 제거한 상태로 재실행해 실패를 확인한 뒤 복원했다** → F-25가 실제 유실 버그였음을 증명
- [x] `docs/engineering/lesson-runtime.md` 의 pagehide flush 보장 범위를 코드와 일치시킴
- [x] 검증: `bun --filter @workspace/web test`
- [x] 검증: `bun run test:e2e:pr` + `release-chromium` 초안 2케이스
- [ ] 검증: 레슨 이동 시 이전 요청 취소를 개발자 도구로 1회 확인 — **수동 항목 미실행**. 배선은 타입과 테스트 단정으로 확인
- [x] 롤백 준비: 이벤트 핸들러 두 줄을 `defaultTransport()` 로 되돌리면 복귀 (wire 계약 변경 없음)

### T-04 · 관측 복구 — 2.0 MD · 선행 T-01 · F-14 F-22

Quick Win Q-08은 이 티켓의 F-14 부분 선행.

- [x] `packages/shared/kernel/src/failure.ts` 신설 — `Failure<TKind, TDetail>` 에 `cause?: unknown`. **`retryable` 은 도입하지 않았다** (아래 실행 기록)
- [x] `packages/infra/observability/src/events.ts` 에 `auditPersistenceFailed` 등록. 개인정보용 이름은 소비자가 없어 등록하지 않았다 — 개인정보 실패는 `cause` 전파로 추적한다
- [x] F-22 (1순위 감사): `audit-event-drizzle-repository.ts` 5곳에 `cause` 전달 + `AuditEventFailureObserver` 로 조립 계층에서 `logger.error`
- [x] F-22 (2순위 개인정보): `deletion-marker-store.ts`(4) · `deleted-learner-purge-repository.ts` · `deletion-marker-reapplication.repository.ts` 에 `cause` 전달. `daily-maintenance` 와 `purge-deleted-learners` 가 `cause` 를 버리던 지점도 함께 연결
- [x] F-22 (3순위): `content-drizzle-repository.ts` 4곳에 `cause` 전달. `:600` 은 `DraftSaveAbort` 를 되돌려 보내는 제어 흐름이라 버리는 원인이 없어 대상 아님
- [x] F-22 (나머지): `identity-session-revocation` · `sharp-content-asset-image-processor` · `expired-session-maintenance` · `start-e2e-api`(2) · `openai-feedback-provider`(3) · `cleanup-orphaned-content-assets` · `upload-content-asset`(4) · `content-normalization`
- [x] **P-12 보존 확인**: 의도적 빈 `catch` 는 `container-cleanup.ts` · `create-container.ts` · `lifecycle/server-lifecycle.ts`(2) · `main.ts` 5곳이며 전부 미변경. 새 lint 룰도 이들을 잡지 않는다(`err` 호출이 없다). 문서가 지목한 `auth/learner/server.ts:84` 는 존재하지 않는다
- [x] F-14: `mapOperationsError` 가 `error.query` 를 message 에 반영하고 `cause: error` 를 담는다
- [x] F-14: `operationError` 헬퍼 인라인화 후 삭제
- [x] oxlint 커스텀 룰 `catch-preserves-cause` 신설 — `catch` 블록의 `err({...})` 에 `cause` 미포함 시 error
- [x] 룰 테스트를 `scripts/oxlint/workspace-rules.node-test.mjs` 에 추가 (invalid 2 / valid 3)
- [x] 통합 테스트 1건 추가: 감사 insert 실패 시 observer 수신 + `cause` 가 `Error` 임을 단정
- [x] 검증: `bun run ci:static`
- [x] 검증: `bun run test:oxlint-rules`
- [x] 검증: `err({ cause` 1 → 26 (단일행 19 + 멀티라인 7). 더 강한 보증은 **새 lint 룰 위반 0**
- [x] 검증: `bun run test`

### T-05 · 죽은 기능 제거 — 1.0 MD · 선행 T-01 · F-16 F-17 F-31

- [x] D-09: `AGENTS.md` 를 실제 E2E 로그인 방식으로 정정 — 자격증명과 라우트는 `e2e/auth.ts` 가 소유하므로 문서는 그 파일을 가리키기만 한다
- [x] D-09: `parse-env.ts` 의 `ENABLE_TEST_AUTH` 선언 제거 (미사용이 된 `booleanFlagSchema` 포함)
- [x] D-09: production 차단 검증 제거
- [x] D-09: secret 엔트로피 검증은 **P-05로 보존** — `ENABLE_TEST_AUTH` 항목만 제거
- [x] D-09: `api.env.j2` · `web.env.j2` 에서 제거
- [x] D-09: `scripts/admin-dev-lifecycle.smoke.ts` · `scripts/test-deployment-images.ts` 에서 제거
- [x] F-31: `parse-env.test.ts` 관련 케이스 제거 (전용 케이스 1건 삭제, production 거부 목록에서 1건 삭제, development 케이스를 origin 기본값 검증으로 재작성)
- [x] D-10: `types/src/ids.ts` 의 `ConversationId`·`MessageId` 제거
- [x] D-10: `contracts/identity/admin-ids.ts` 의 타입 재수출·`conversationIdSchema`·`messageIdSchema` 제거
- [x] D-10: `admin-ids.typecheck.ts` 를 `AdminId`↔`UserId` 양방향 `@ts-expect-error` 로 재작성해 브랜드 분리 보증을 유지, `ids.typecheck.ts` 케이스 제거 (**파일 패턴 P-02 보존**)
- [x] D-10: `admin-ids.test.ts` 의 `conversationIdSchema` 케이스를 `adminIdSchema` 로 대체
- [x] `knip.json` 의 `ignoreFiles` 재검토 결과 **현행 유지**. probe로 무력화해 실측하니 `.typecheck.ts` 4파일이 전부 `Unused files` 로 보고된다(P-02가 보존을 요구). D-10을 가린 것은 이 설정이 아니라 테스트 전용 소비자였고, knip은 이 구성에서 테스트 전용 사용을 구분하지 못한다
- [x] 검증: `git grep ENABLE_TEST_AUTH` → `docs/archive`·`docs/work` 외 0건
- [x] 검증: `git grep ConversationId` → 0건
- [x] 검증: `bun run ci:static`
- [ ] 검증: `bun run check:deployment-ansible` — **Linux/WSL2 제어 노드 필요, Windows에서 실행 불가**. `check-deployment-ansible.ts` 가 env 템플릿 키 목록을 하드코딩하지 않음은 확인
- [x] 검증: `bun run test:e2e:pr` — 로그인이 플래그와 무관함을 재확인

### M1 실행 기록

2026-07-30 실행. 계획과 다르게 처리한 6건과 남은 항목이다.

| #   | 계획                                        | 실제                                                               | 근거                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | D-07 무효 lint 규칙 15~17개 삭제            | **실행하지 않음**                                                  | 전제가 틀렸다. 추적되는 `.js`/`.mjs` 10개(`scripts/*.mjs`, `postcss.config.mjs` 3, `k6-*.js` 2, `run-tsc.mjs`, `workspace-rules*.mjs`)가 있고 `overrides[0]` 는 TS 확장자만 끄므로 이 규칙들은 비-TS 파일에서 활성이다. probe 파일로 `no-const-assign`·`no-dupe-keys`·`no-unreachable`·`no-undef` 4건 실제 검출을 확인했다. tsc는 이 파일들을 커버하지 않아 삭제하면 유일한 lint 커버리지가 사라진다 |
| 2   | `Failure` 에 `retryable: boolean` 필수 필드 | **`cause` 만 도입**                                                | catch 지점에서 일괄 `true` 를 넣으면 F-14가 지적한 "영구 오류를 재시도 신호로 위장"을 필드 이름만 바꿔 재현한다. 의미 있는 값에는 드라이버 예외 분류가 필요하고 이는 오류 등급을 재작업하는 T-11의 범위다. 로드맵의 롤백 노트도 "cause 추가는 순수 확장"을 전제하는데 필수 `retryable` 은 순수 확장이 아니다                                                                                         |
| 3   | D-08 동어반복 **케이스** 삭제               | 어서션 1건만 삭제, 케이스 유지                                     | 같은 케이스의 나머지 두 단정이 KST 날짜 경계(14:59:59Z / 15:00:00Z)를 검증하는 실질 방어다. 결과로 knip이 `platformLearningTimeZone` 미사용 export를 탐지해 `export` 키워드를 제거했다                                                                                                                                                                                                               |
| 4   | D-01 `config/env.ts` → `env.ts` 이동 검토   | 이동하지 않음                                                      | 소비자 6곳 import를 바꾸는 이득이 없고 `config/` 는 T-08의 디렉터리 축약 대상이 아니다. 테스트만 `config/` 로 옮겨 콜로케이션을 복구했다                                                                                                                                                                                                                                                             |
| 5   | knip `ignoreFiles` 재검토                   | 현행 유지                                                          | 무력화 실측 시 `.typecheck.ts` 4파일이 `Unused files` 로 보고된다. D-10을 가린 것은 테스트 전용 소비자다                                                                                                                                                                                                                                                                                             |
| 6   | `catch` 는 모두 `cause` 보유                | `openai-feedback-provider` 의 `JSON.parse` catch 1건은 의도적 예외 | `SyntaxError` message가 provider 원문 조각을 포함한다. 이 provider가 원문을 보관하지 않는 것은 기존 계약(테스트 "원문 없이")이므로 `oxlint-disable-next-line` + 이유 주석으로 남겼다                                                                                                                                                                                                                 |

계획에 없었으나 함께 고친 것: `daily-maintenance` 의 `maintenanceError` 가 스테이지 실패 원인을 버리던 문제, `purge-deleted-learners` 가 `result.error` 를 버리고 새 `Error` 를 던지던 문제, `upload-content-asset` 의 `createAsset` catch 1곳.

남은 항목: PR CI 첫 스텝 확인, `check:deployment-ansible`(Linux 필요), 레슨 이동 시 요청 취소 수동 확인, `.playwright-cli` PDF 라이선스 검토, 티켓 단위 commit 분리.

M1 종료 조건 대조: 변경이 자동 검증되는 상태(`ci:static` 8종 green, `build` 6/6) · 사용자 데이터 손실 경로 0(F-25를 실패하는 E2E로 증명 후 수정) · `catch` 에서 만드는 실패가 모두 `cause` 보유(lint 룰이 정적 강제, 문서화된 예외 1건).

---

## M2 · 경계 정본화

종료 조건: 타 모듈 테이블 쓰기가 컴파일 에러 · 시간대·식별자 정본 1곳 · 공개 subpath 170 → 95.

### T-06 · 도메인 언어 정본 확립 — 3.3 MD · 선행 T-01 T-02 · F-05 F-24 F-33

Strangler 3단계(세운다 → 옮긴다 → 지운다)로 진행한다.

- [ ] **세운다**: `packages/shared/kernel/src/day-boundary.ts` 신설 — `platformDayBoundary = { timeZone, sqliteOffset }`
- [ ] **세운다**: `packages/shared/contracts/src/identifier.ts` 신설 — 단일 `createIdentifierSchema` (형식 + `max(200)` + `u` 플래그)
- [ ] 사전 확인: `bun --filter @workspace/api db:inspect` 로 기존 저장 ID가 새 규칙을 통과하는지 점검
- [ ] 사전 확인: 시드·E2E 픽스처 ID가 새 규칙을 통과하는지 점검
- [ ] **옮긴다**: `identity-queries.ts:225` 를 새 정본 소비로 전환
- [ ] **옮긴다**: `operations-reporting.ts:111` 을 새 정본 소비로 전환
- [ ] **옮긴다**: `ai-feedback-answer.tsx:280` 을 새 정본 소비로 전환
- [ ] **옮긴다**: `ai-feedback-quota.ts:51` 의 고정 offset `9*60*60*1_000` 을 새 정본으로 전환 (IANA 표현과 의미가 다름에 주의)
- [ ] **옮긴다**: `operations-reporting-sqlite-repository.ts:80,149,158,173` 의 `'+9 hours'` 를 파라미터 바인딩으로 전환
- [ ] **옮긴다**: `contracts/learning/ids.ts:6-11` 의 `createIdSchema` 를 새 정본 소비로 교체
- [ ] **옮긴다**: `contracts/content/ids.ts:21-26` 의 `createIdSchema` 를 새 정본 소비로 교체
- [ ] **옮긴다**: `contracts/identity/admin-ids.ts:18-25` 의 `identifierSchema` 를 새 정본 소비로 교체
- [ ] **지운다**: D-14 중복 팩토리 2개 제거
- [ ] **지운다**: `learning-date.ts:6 platformLearningTimeZone` — 내부 소비자만 남으면 삭제, 아니면 재수출로 축소
- [ ] ID 검증 강화 케이스 추가: 형식 위반·200자 초과 거부 (현재 `courseIdSchema` 는 통과시킨다)
- [ ] `docs/glossary.md` 를 [`03-target-design.md`](./03-target-design.md) "도메인 언어 정본" 표 기준으로 재작성
- [ ] 검증: `git grep -cE '"Asia/Seoul"|\+9 hours|9 \* 60 \* 60'` → 정본 1곳
- [ ] 검증: `createIdSchema` 정의 수 3 → 1
- [ ] 검증: `bun run ci:static` · `bun run test`
- [ ] **스테이징 검증 필요** — ID 검증 강화는 행위 변경이다. 저장된 ID가 새 규칙을 위반하면 해당 API가 400을 반환한다
- [ ] 롤백 준비: ID 검증 강화를 별도 commit으로 분리

### T-07 · 조립 정리 — 2.0 MD · 선행 T-01 · F-12 F-15

- [ ] F-12: `create-container.ts` 에서 learning 모듈을 identity보다 먼저 조립
- [ ] F-12: `learning.reportingQuery` 를 identity에 주입
- [ ] F-12: `create-container.ts:189-192` 의 별도 `createLearningReportingQuery` 호출 제거
- [ ] F-12: `learning-module.composition.ts:37 createLearningContentQueryPort` 를 내부 함수로 되돌림
- [ ] D-12: `packages/modules/learning/src/learning-reporting.ts` 삭제 + `package.json` `"./reporting"` export 제거
- [ ] 조립 순서 변경으로 `create-container.ts:376 createLearnerIdentityBridge` 의 late-binding을 제거할 수 있는지 확인 (가능하면 별도 commit — 런타임 throw 1건 감소)
- [ ] D-15: `apps/api/src/routes/test-dependencies.ts` → `apps/api/src/test-support/learner-app-fixture.ts` 이동
- [ ] D-15: `createTestLearnerApp` 이 라우트 등록 순서·미들웨어 조합을 자체 작성하지 않고 실제 `createApp` 을 호출하도록 전환
- [ ] D-15: 픽스처는 의존성만 제공하도록 축약 (269 → 약 120줄)
- [ ] D-15: `auth-proxy.test.ts:3` · `learner-app.test.ts:5` · `openapi.route.test.ts:6` · `unified-app.test.ts:7` 의 import 경로 갱신
- [ ] D-15: `apps/api/src/routes/` 디렉터리 제거
- [ ] 검증: `bun --filter @workspace/api test` — 37파일 137케이스 유지
- [ ] 검증: `bun run ci:static` · `bun run test:e2e:pr`
- [ ] 검증: `learning` exports 7 → 6

### T-08 · 모듈 공개 표면 축약 — 4.5 MD · 선행 T-07 · F-08 F-09 F-10 F-11

모듈별 독립 commit으로 진행한다. 한 모듈이 실패하면 그 모듈만 되돌린다.

- [ ] content: `./application`·`./maintenance`·`./register-routes` → `./module`·`./http` 로 통합, `createContentModule` 신설
- [ ] operations: `./audit-repository`·`./reporting-repository`·`./audit`·`./audit-event` → `./module` 내부로 흡수
- [ ] ai-feedback: `./provider` → `./module` 파라미터(`provider?: AiFeedbackProvider`) 로 전환
- [ ] ai-feedback: 테스트의 `createUnavailableAiFeedbackProvider` 주입 경로를 `./ports` 타입 + 테스트 로컬 구현으로 대체
- [ ] identity: 12개 subpath → 4개 (`./admin-actor`·`./learner-profile`·`./user-status`·`./queries`·`./sessions`·`./purge`·`./seed` 흡수)
- [ ] learning: `./mapping`·`./application` 내부화
- [ ] 전 모듈 `./schema` → `./migration-schema` 개명
- [ ] `dependency-cruiser.config.mjs` 에 규칙 `migration-schema-is-app-database-only` 추가 (별도 commit)
- [ ] `apps/api/src/db/schema.ts` 가 `./migration-schema` 만 소비하도록 갱신
- [ ] D-17: `packages/shared/ui/package.json` exports 49 → 3 (wildcard)
- [ ] **모듈 패키지 wildcard 금지 확인** — `dependency-cruiser.config.mjs:135 modulePublicTargetPattern` 이 `exports` 에서 경계 패턴을 파생하므로 wildcard는 경계 검사를 무력화한다 (P-01 보존)
- [ ] D-19: `apps/api/src/{admin,openapi,context}` 3개 디렉터리를 `http/`·`middleware/` 로 흡수 (로직 변경 없는 이동만)
- [ ] `docs/engineering/package-interface-and-import-rules.md` 에 4개 subpath 관례 반영
- [ ] 검증: `bun run check:architecture` — 신규 규칙 포함 위반 0
- [ ] 검증: 모듈 exports 합계 40 → 20, 전체 subpath 170 → 약 95
- [ ] 검증: `bun run ci:static` · `bun run test` · `bun run build`
- [ ] 검증: `apps/api/src` 최상위 디렉터리 19 → 16

### T-09 · 데이터 경계 강제와 purge 포트 — 3.0 MD · 선행 T-08 · F-06

- [ ] **세운다**: `packages/shared/kernel/src/learner-data.ts` 에 `LearnerDataPurgePort` 선언
- [ ] **세운다**: `learning` 에 `infrastructure/persistence/learner-purge.ts` 추가 (자기 테이블만 삭제)
- [ ] **세운다**: `ai-feedback` 에 동일 추가
- [ ] **세운다**: `identity` 에 동일 추가
- [ ] **세운다**: 각 모듈 `./module` 반환값에 포트 포함
- [ ] **세운다**: `apps/api/src/privacy/purge-learner.ts` 신설 — 포트 배열 순회 · 실패 격리 · `cause` 보존
- [ ] FK 의존에 따른 삭제 순서를 `create-container.ts` 의 명시적 배열로 가시화
- [ ] **옮긴다**: `learner-data-purge.ts` 의 삭제를 모듈 포트로 **한 모듈씩** 이전 (전환 중 두 경로 공존 + 동일 결과 단정)
- [ ] **옮긴다**: `apps/api/src/scripts/purge-deleted-learners.ts` 를 새 경로로 전환
- [ ] **옮긴다**: `apps/api/src/maintenance/daily-maintenance.ts` 를 새 경로로 전환
- [ ] **지운다**: D-18 `apps/api/src/adapters/identity/learner-data-purge.ts` 삭제
- [ ] 핵심 검증: 전환 전후 **삭제되는 행 집합이 동일**함을 단정 — `deleted-learner-purge-repository.test.ts` 를 포트별 삭제 카운트 검증으로 확장
- [ ] 검증: `bun run check:architecture` — 모듈 `migration-schema` 에 대한 app 외부 import 0
- [ ] 검증: `git grep -lE 'purge|deletion' -- apps/api/src` 파일 수 14 → 6
- [ ] 검증: `bun --filter @workspace/api test` · `bun run test`
- [ ] **스테이징 검증 필요** — 삭제 대상 행 집합이 바뀌면 데이터 잔존 또는 과삭제. 실 데이터 사본으로 1회 검증 후 프로덕션 반영
- [ ] `docs/engineering/privacy.md` 에 purge 소유권 변경 반영

### T-10 · 리포팅 읽기 뷰 — 2.0 MD · 선행 T-08 T-09 · F-07

[`03-target-design.md`](./03-target-design.md) 대안 1 채택. 대안 2(이벤트 기반)는 비가역·복잡도 과다로 제외.

- [ ] `content` 에 `infrastructure/persistence/reporting-view.ts` 추가 후 `./migration-schema` 에 포함
- [ ] `learning` 에 동일 추가
- [ ] `identity` 에 동일 추가
- [ ] `ai-feedback` 에 동일 추가
- [ ] `apps/api/drizzle/**` 에 view 생성 migration 추가
- [ ] `operations-reporting-sqlite-repository.ts:65 dashboardSql` 을 view 참조로 전환
- [ ] `:127 dailySeriesSql` 전환
- [ ] `:224 lessonAnalyticsCte` 전환
- [ ] `:306 aiFeedbackQualitySql` 전환
- [ ] `:354 aiFeedbackFailureCountsSql` 전환
- [ ] `:373 aiFeedbackLessonFailuresSql` 전환
- [ ] depcruise 규칙 `operations-reporting-does-not-import-module-implementations` 유지 확인
- [ ] 핵심 검증: 전환 전후 대시보드·분석 응답이 **바이트 단위 동일** — `operations-reporting-metrics-sqlite-repository.test.ts` 고정 시드를 기준값으로 사용
- [ ] 검증: `bun --filter @workspace/api db:migrate` — view 생성 성공 (컬럼 불일치는 여기서 실패해야 한다)
- [ ] 검증: `operations-reporting-sqlite-repository.ts` 에 타 모듈 테이블명 리터럴 0건
- [ ] 검증: `bun run test` · `bun run test:e2e:pr`
- [ ] **스테이징 검증 필요** — migration이 view를 생성한다
- [ ] `docs/engineering/data-model.md` 에 리포팅 뷰 계약 반영

---

## M3 · 표현 계층과 테스트

종료 조건: 에러 변환 5회 → 2회 · UI가 전송 DTO와 분리 · 테스트 SLOC −25%.

### T-11 · 오류 변환 축약 — 2.0 MD · 선행 T-04 · F-23

- [ ] D-13: `packages/modules/learning/src/module.ts:33-63 LearningAiFeedbackHttpCommandError` 중간 shape 제거
- [ ] `learning-http-mapper.ts:181 mapLearningCommandError` 가 domain 실패를 직접 받도록 전환
- [ ] D-13: `module.ts:144 mapAiFeedbackHttpError` 제거 또는 `mapLearningAiFeedbackError` 로 개명 (`ai-feedback-routes.ts:159` 와 동명 충돌 해소)
- [ ] D-26: `domain/learning-error.ts:9 LearningExpectedFailure` + `:31 classifyLearningTransitionError` 제거 (프로덕션 소비자 0, 유일 소비자는 자기 테스트)
- [ ] D-26: `test/domain/learning-error.test.ts` 삭제
- [ ] D-26: `AnswerRejectedFailure`·`createAnswerRejectedFailure` 의 소비자 확인 후 유지·제거 판단
- [ ] **P-10 보존 확인**: `assertExhaustiveHttpResult` 와 `http-result-exhaustiveness.typecheck.ts` 는 유지 — 축약 과정의 variant 누락을 컴파일 시 잡는 안전망이다
- [ ] 검증: wire 응답 코드 불변 — `learning-http.test.ts` 15케이스 통과
- [ ] 검증: 에러 타입 선언 44 → 35 이하, 매퍼 14 → 10 이하
- [ ] 검증: AI 피드백 실패 1건 추가 시 수정 지점이 2곳인지 확인
- [ ] 검증: `bun run ci:static` · `bun run test` · `bun run test:e2e:pr`

### T-12 · 프론트엔드 모델 경계 — 3.5 MD · 선행 T-03 · F-27 F-28

- [ ] F-27: `apps/web/src/features/lesson-session/model/lesson-view-model.ts` 신설 — `@workspace/contracts` learner 스키마에서 뷰 모델 도출
- [ ] F-27: `api/lesson-session-effect-adapter.ts` 에서 DTO → 뷰 모델 변환 추가
- [ ] F-27: `Dto as [A-Z]` 별칭 11곳 제거 — `use-lesson-session.ts:23,24` · `lesson-step-presentation.ts:2` · `lesson-active-screen.tsx:17,18` · `lesson-ai-feedback-answer.tsx:10` · `lesson-complete-screen.tsx:7` · `lesson-experience.tsx:11` · `lesson-start-screen.tsx:3` · `lesson-step-renderer.tsx:30` · `lesson-write-answer.tsx:7`
- [ ] F-27: `shared/http/learner-api-client.ts:70-108` 은 오류 분류만 담당하도록 축약
- [ ] F-28: 상태 술어를 `model/course-editor-reducer.ts` 의 `isUnsaved(state)`·`canSave(state)` 로 이동 (switch 기반 → variant 추가 시 컴파일 에러)
- [ ] F-28: `course-editor-shell.tsx:113-118`·`:306-308` 의 문자열 배열 술어 제거
- [ ] F-28: `CONTENT_CONFLICT` 복구를 `withConflictRecovery(operation)` 1개로 통합 (`:186-198`·`:205-228` 중복 제거)
- [ ] F-28: `getAdminCourseEditor`·`uploadAdminContentAsset` 를 prop 주입으로 전환 (`saveCourse`·`publishCourse` 패턴과 통일)
- [ ] F-28: 탭 본문을 `CourseInfoTab`·`CourseCurriculumTab` 으로 분리
- [ ] oxlint 커스텀 룰 `no-dto-domain-alias` 신설 — `import type { XxxDto as Domain }` 금지
- [ ] 검증: `git grep -cE 'Dto as [A-Z]'` → 0건
- [ ] 검증: `course-editor-shell.tsx` 766줄 → 300줄 이하
- [ ] 검증: `bun --filter @workspace/web test` (35파일 126케이스) · `bun --filter @workspace/admin test` (37파일 111케이스)
- [ ] 검증: `bun run test:e2e:release` — `admin-content-publishing.spec.ts` 785줄 통과
- [ ] 검증: `bun run check:route-bundles` — 번들 예산 유지

### T-13 · 테스트 셋업 공유 — 2.0 MD · 선행 T-09 T-10 · F-29

스키마 변경이 끝난 뒤 진행한다. **케이스를 삭제하지 않고 셋업만 축약한다.**

- [ ] 모듈별 `test/fixtures/` 신설 — `aLearner()` · `aPublishedCourse()` · `aLearnerWithProgress()` 등 선언적 빌더
- [ ] `deleted-learner-purge-repository.test.ts` (332줄/1케이스) 를 빌더로 전환
- [ ] `daily-maintenance.integration.test.ts` (310줄/1케이스) 전환
- [ ] `operations-reporting-metrics-sqlite-repository.test.ts` (697줄/3케이스) 전환
- [ ] `identity-lifecycle.integration.test.ts` (202줄/1케이스) 전환
- [ ] `learner-step-mapping.test.ts` (492줄/4케이스) 전환
- [ ] 검증: 케이스 수 유지 (M1에서 8건 제거 후 기준선 대비 동일)
- [ ] 검증: 테스트 SLOC 34,678 → 26,000 이하
- [ ] 검증: 케이스당 46.7줄 → 37줄 이하
- [ ] 검증: `bun run test` 전부 통과

---

## M4 · 작업 종료와 지식 반영

### T-14 · 결론을 권위 문서로 승격하고 작업 단위 보관 — 0.5 MD · 선행 T-13

- [ ] [`06-conventions.md`](./06-conventions.md) 의 네이밍·오류·경계·테스트 규칙을 `docs/engineering/code-style.md` 와 `testing.md` 에 반영
- [ ] [`06-conventions.md`](./06-conventions.md) 리뷰 체크리스트를 `.github/pull_request_template.md` 에 반영
- [ ] [`03-target-design.md`](./03-target-design.md) 의 모듈 4개 subpath 관례를 `docs/engineering/package-interface-and-import-rules.md` 에 반영
- [ ] [`03-target-design.md`](./03-target-design.md) 의 오류 3층 모델을 `docs/engineering/api-contract.md` 에 반영
- [ ] 되돌리기 어려운 결정을 ADR로 기록: 모듈 공개 표면 4개 고정 (T-08)
- [ ] 되돌리기 어려운 결정을 ADR로 기록: 리포팅 읽기 뷰 채택과 이벤트 기반 대안 제외 근거 (T-10)
- [ ] 되돌리기 어려운 결정을 ADR로 기록: 학습자 데이터 삭제의 모듈 포트 소유 (T-09)
- [ ] `docs/engineering/_index.md` 파일 지도 갱신
- [ ] 최종 검증: `bun run build` · `bun run typecheck` · `bun run test` · `bun run ci:static` · `bun lefthook run pre-commit`
- [ ] 최종 검증: `bun run test:e2e:release`
- [ ] 최종 지표 대조: [`05-deletion-backlog.md`](./05-deletion-backlog.md) "최종 규모 목표" 표의 각 항목 실측
- [ ] 이 작업 단위 전체를 `docs/archive/2026-07-30-codebase-rebuild-diagnosis/` 로 이동 (복사본 남기지 않음)
- [ ] `docs/work/_index.md` 와 `docs/archive/_index.md` 갱신
- [ ] 작업 중 시작한 모든 프로세스(dev server, watcher 등) 종료 확인
