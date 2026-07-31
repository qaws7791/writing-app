# 테스트 코드 카탈로그 기반 전수 감사

> 후속 조치(2026-07-31): P1 항목 TC-01~TC-09의 최소 권고를 코드와 권위 문서에 반영하고 전체 검증 대상으로 전환했다.
>
> 후속 조치(2026-07-31): P2 항목 TC-10~TC-28과 P3 항목 TC-29~TC-37의 최소 권고를 모두 반영했다. 최종 상태에서 build, 25개 workspace typecheck, 전체 Vitest 190개 파일(1,148 passed, 1 skipped), repository script 27건, format, lint, architecture, Knip, dependency·workflow·custom lint rule 검사와 pre-commit을 검증했다. 변경된 Playwright 흐름은 PR Chromium 6건, release Chromium 15개 시나리오, standalone WebKit browser-support 4건을 수정 후 모두 통과시켰다.

## 감사 기준과 범위

- 기준 revision: `f1dd31e8715148af236c5e2b4f9f533b816d9cfb`
- 감사 일자·환경: 2026-07-31, Windows, Asia/Seoul
- 판정 기준: 첨부된 `test-code-catalog`의 P-00~P-19, B-00~B-19와 [`docs/engineering/testing.md`](../../engineering/testing.md)
- 범위: 추적 중인 테스트 파일 204개와 fixture·test-support 31개
  - Vitest 대상 194개
  - Playwright spec 6개
  - repository script test 4개
- 실행 증거:
  - `bun run test`: 194 files, 1,155 passed, 1 platform-conditional skipped, 90.36s
  - `bun test ./scripts`: 26 passed, 0 failed
  - `bun run build`: sandbox의 Next trace 쓰기 EPERM 뒤 실제 사용자 컨텍스트 재실행 통과
  - `bun run typecheck`: 25 tasks 통과
  - `bun lefthook run pre-commit`: 통과. 변경 파일이 staged 상태가 아니어서 format·lint 대상은 없었으며, 보고서와 archive index는 별도 Oxfmt 검사로 통과했다.
  - 보고서의 local link 97개가 모두 실제 파일로 해석되는지 확인했다.
- Playwright E2E는 정적 분석과 하위 계층 중복 대조만 수행했다. 따라서 실제 flaky 발생 빈도와 절감 시간은 측정 사실이 아니라 추론이다.

좋은 사례는 요청에 따라 기록하지 않았다. 아래에는 제거하거나 개선해야 할 항목만 있다.

## 요약

| 우선순위 | 건수 | 의미                                                               |
| -------- | ---: | ------------------------------------------------------------------ |
| P1       |    9 | 보안·데이터 무결성·격리를 잘못 승인하거나 핵심 경계를 비워 둔 항목 |
| P2       |   19 | flaky·느린 실행·E2E 남용·취약한 격리·의미 있는 누락                |
| P3       |    9 | 구현 결합·중복·정적 markup·진단성 저하로 제거 또는 축소할 항목     |

가장 먼저 처리할 것은 테스트 개수 확대가 아니다. 거짓 양성을 만드는 E2E 불변성 검사, 임의 DB를 변경할 수 있는 fixture CLI, 모순된 learning fixture와 공유 E2E 상태를 먼저 바로잡아야 한다. 그다음 외부 provider·storage·보상 transaction의 실패 경계를 보완하고, 마지막으로 중복 E2E와 한 줄 wrapper 테스트를 제거하는 순서가 안전하다.

## P1 — 즉시 개선

### TC-01 발행본 불변성 검사가 모든 DB 오류를 성공으로 오인한다

- 구분: 개선
- 카탈로그: P-06, P-16, P-18, B-03, B-09
- 위치: [`assert-e2e-published-content-immutable.ts`](../../../apps/api/src/test-support/assert-e2e-published-content-immutable.ts#L12), [`admin-content-publishing.spec.ts`](../../../e2e/admin-content-publishing.spec.ts#L746)
- 확인 사실: update에서 발생한 예외 원인을 확인하지 않고 모두 `rejected = true`로 바꾸며, E2E는 process exit code만 본다. 기대하는 trigger 오류는 migration에 별도 메시지로 정의되어 있다.
- 영향: DB lock·schema 손상·driver 오류도 “불변성 보장”으로 승인하는 거짓 양성이 된다.
- 최소 권고: 기대한 SQLite trigger 오류만 수용하고, 다른 오류는 재던진다. 실패 뒤 title 불변과 후속 read 가능 여부도 확인한다.

### TC-02 E2E 인증 fixture CLI가 임의의 테스트 DB를 변경할 수 있다

- 구분: 개선
- 카탈로그: P-00, P-16, P-17, B-01, B-16
- 위치: [`setup-e2e-database.ts`](../../../apps/api/src/test-support/setup-e2e-database.ts#L14)
- 확인 사실: 직접 실행 경로는 `NODE_ENV=test`와 `DATABASE_URL` 존재만 확인한 뒤 migration과 고정 credential insert를 수행한다. 같은 용도의 콘텐츠 fixture는 `E2E_RUN_ROOT/writing-app.sqlite`와 canonical path 일치를 검사한다.
- 영향: 환경 변수가 잘못 연결되면 E2E 전용이 아닌 로컬 DB를 변경할 수 있다.
- 최소 권고: CLI 경로에 `E2E_RUN_ROOT`와 canonical DB 경로 일치 guard를 추가하고 불일치 거부를 검증한다.

### TC-03 CSP report 테스트가 민감 URL 로그 노출을 놓친다

- 구분: 개선
- 카탈로그: P-06, P-12, P-19, B-14
- 위치: [`csp-policy.test.ts`](../../../packages/config/nextjs-config/src/csp-policy.test.ts#L66), [`csp-report.ts`](../../../packages/config/nextjs-config/src/csp-report.ts#L48)
- 확인 사실: 테스트는 `blockedUri`만 부분 일치시키지만 구현은 `documentUri`와 `sourceFile`을 그대로 기록한다. 이는 URL query 전체를 로그에서 제거한다는 [`security.md`](../../engineering/security.md#L39) 계약과 충돌한다.
- 영향: token·credential이 포함된 query가 로그에 남아도 테스트가 통과한다.
- 최소 권고: hostile query·fragment·credential sentinel을 넣고 로그의 exact allowlist shape와 sentinel 부재를 검증한다. 구현의 URL 정규화도 같은 변경에서 바로잡아야 한다.

### TC-04 콘텐츠 asset 보상 실패가 검증되지 않는다

- 구분: 개선
- 카탈로그: P-17, P-19, B-14
- 위치: [`upload-content-asset.test.ts`](../../../packages/modules/content/src/application/upload-content-asset.test.ts#L65), [`cleanup-orphaned-content-assets.test.ts`](../../../packages/modules/content/src/application/cleanup-orphaned-content-assets.test.ts#L27)
- 확인 사실: asset DB 등록 실패 뒤 object 보상 삭제 성공만 검증하며, 보상 삭제의 `Err`·throw는 없다. orphan 정리도 storage 삭제 뒤 conditional DB delete 실패 경로가 없다.
- 영향: storage object 또는 DB row가 한쪽에만 남는 개인정보·비용·재시도 결함을 놓친다.
- 최소 권고: create 실패 + delete `Err`, cleanup의 후속 DB delete `Err`를 각각 한 건 추가하고 공개 Result와 남은 상태를 검증한다.

### TC-05 object storage의 대량·부분 실패 계약이 비어 있다

- 구분: 개선
- 카탈로그: P-12, P-19, B-14
- 위치: [`object-storage.test.ts`](../../../packages/infra/storage/src/object-storage.test.ts#L14), [`private-object-storage.test.ts`](../../../packages/infra/storage/src/private-object-storage.test.ts#L15)
- 확인 사실: 1,000개 삭제 batching, provider partial `Errors`, 빈 삭제, truncated page의 continuation token 누락, object `Body` 누락 분기가 테스트되지 않는다.
- 영향: 개인정보 삭제가 일부만 실패해도 성공으로 오인하거나 pagination이 누락·정지할 수 있다.
- 최소 권고: 1,001 keys의 2회 command, partial error의 typed `Err`, 빈 입력 0 call, token·Body 누락 오류를 최소 matrix로 추가한다.

### TC-06 AI provider 예외 변환이 adapter 경계에서 검증되지 않는다

- 구분: 개선
- 카탈로그: P-07, P-17, B-14
- 위치: [`openai-feedback-provider.test.ts`](../../../packages/modules/ai-feedback/src/infrastructure/adapters/openai-feedback-provider.test.ts#L99), [`ai-infrastructure.test.ts`](../../../packages/infra/ai/src/ai-infrastructure.test.ts#L52)
- 확인 사실: SDK reject가 `request-aborted`, `provider-timeout`, `provider-unavailable`로 변환되는 adapter 경로가 없다. 공통 AI infra도 Abort와 timeout 분기를 검증하지 않는다.
- 영향: 취소를 재시도하거나 timeout을 일반 장애로 바꾸는 회귀가 application mock 테스트를 모두 통과한다.
- 최소 권고: AbortError, timeout code, 일반 reject를 표로 넣고 공개 error kind·retryable·timeout metadata만 검증한다.

### TC-07 learning fixture가 완료 입력과 모순되는 DB row를 만든다

- 구분: 개선
- 카탈로그: P-00, P-05, P-16, B-01
- 위치: [`a-learner-with-progress.ts`](../../../packages/modules/learning/src/test/fixtures/a-learner-with-progress.ts#L19), [`operations-reporting-metrics-sqlite-repository.test.ts`](../../../packages/modules/operations/src/infrastructure/persistence/operations-reporting-metrics-sqlite-repository.test.ts#L287)
- 확인 사실: fixture는 `status`·`completedAt`을 받지만 course progress를 항상 `in_progress`·`NULL`로 저장하고 lesson에만 입력값을 반영한다. 완료 상태 소비자가 실제로 존재하며 answer/draft JSON도 discriminator가 없는 shape이다.
- 영향: 운영에서 불가능한 상태 조합으로 완료율·리포팅 테스트가 통과한다.
- 최소 권고: course와 lesson 상태·완료 시각을 일관되게 binding하고 answer/draft를 실제 `WRITE` payload schema로 만든다.

### TC-08 E2E가 고정 사용자·레슨의 공유 상태와 순서에 의존한다

- 구분: 개선
- 카탈로그: P-00, P-16, P-17, B-03, B-04, B-16
- 위치: [`lesson-draft-autosave.smoke.spec.ts`](../../../e2e/lesson-draft-autosave.smoke.spec.ts#L7), [`pr-smoke.spec.ts`](../../../e2e/pr-smoke.spec.ts#L22), [`writing-app.spec.ts`](../../../e2e/writing-app.spec.ts#L114), [`browser-support.smoke.spec.ts`](../../../e2e/browser-support.smoke.spec.ts#L58)
- 확인 사실: 앞 테스트가 남긴 draft를 뒤 테스트가 조건부로 수용한다. 같은 학습자를 suspend·delete하며 정상 경로에서만 복구하고, config는 이를 직렬 실행으로 감싼다.
- 영향: 단독 실행과 전체 실행의 경로가 달라지고, 중간 실패·shard·parallel 도입 시 연쇄 실패 또는 숨은 통과가 발생한다.
- 최소 권고: unload·suspend·delete 시나리오별 seeded actor/lesson을 분리하고 필요한 복구는 `finally`에서 production handler로 수행한다. 이후 `serial`과 조건부 시작 경로를 제거한다.

### TC-09 AI feedback SQLite 전이의 실제 transaction 경계가 비어 있다

- 구분: 개선
- 카탈로그: P-08, P-17, P-19, B-14
- 위치: [`learning-drizzle-repository.test.ts`](../../../packages/modules/learning/src/infrastructure/persistence/learning-drizzle-repository.test.ts#L142), [`learning-transition-drizzle-repository.ts`](../../../packages/modules/learning/src/infrastructure/persistence/learning-transition-drizzle-repository.ts#L93)
- 확인 사실: 순수 decision과 application mock은 있지만 실제 `prepareAiFeedback`·`completeAiFeedbackStep`의 pinned scope 조회, WRITE answer 복원, progress advance/replay, rollback을 호출하는 통합 테스트가 없다.
- 영향: 잘못된 user/version/lesson/step row 갱신이 하위 테스트를 모두 통과할 수 있다.
- 최소 권고: 실제 DB 성공 1건, scope/answer 거부 1건, replay 또는 rollback 1건만 기존 repository suite에 추가한다.

## P2 — 계획하여 개선 또는 제거

### TC-10 테스트 편의를 위한 production 분기를 제거한다

- 구분: 개선
- 카탈로그: B-19
- 위치: [`lesson-experience.tsx`](../../../apps/web/src/features/lesson-session/ui/lesson-experience.tsx#L105), [`order-answer.tsx`](../../../packages/shared/ui/src/components/lesson/order-answer.tsx#L112)
- 확인 사실: production 코드가 `jsdom` user agent를 감지해 scroll을 생략하고 “headless test environments”를 이유로 pointer capture 예외를 삼킨다.
- 영향: 테스트와 브라우저 실행 경로가 달라 실제 scroll·drag 결함을 숨긴다.
- 최소 권고: 환경 분기를 삭제하고 DOM 테스트에서 browser API를 명시적으로 stub한다. 실제 pointer interaction은 browser 기반 경계로 옮긴다.

### TC-11 `auth-proxy.test.ts`가 실제 proxy를 실행하도록 고친다

- 구분: 개선
- 카탈로그: P-05, P-06, P-18, B-13
- 위치: [`auth-proxy.test.ts`](../../../apps/api/src/http/auth-proxy.test.ts#L9), [`learner-app-fixture.ts`](../../../apps/api/src/test-support/learner-app-fixture.ts#L110)
- 확인 사실: 두 테스트 모두 handler를 전달하지 않아 `registerAuthProxy`가 즉시 반환하며 identity route만 검증한다.
- 영향: proxy의 session fallthrough와 `/auth/*` 위임이 깨져도 파일 전체가 통과한다.
- 최소 권고: 기존 사례는 identity HTTP 테스트로 합치고, 이 파일에는 실제 handler를 주입한 fallthrough·위임 결과만 남긴다.

### TC-12 maintenance dry-run의 무부작용을 직접 검증한다

- 구분: 개선
- 카탈로그: P-06, P-19, B-09
- 위치: [`daily-maintenance.integration.test.ts`](../../../apps/api/src/maintenance/daily-maintenance.integration.test.ts#L93)
- 확인 사실: 반환 count만 확인하며 preview 직후 DB 상태와 `storage.deleteObjects` 미호출을 보지 않는다.
- 영향: dry-run이 object를 삭제하거나 DB를 변경해도 반환값만 맞으면 통과한다.
- 최소 권고: preview 전후 state를 비교하고 storage 0 call을 확인한 뒤 actual 실행과 비교한다.

### TC-13 테스트 migration manifest의 production 복제를 제거한다

- 구분: 개선
- 카탈로그: B-01, B-05
- 위치: [`application-migration.ts`](../../../packages/infra/db/src/test-support/application-migration.ts#L5), [`migrate.ts`](../../../apps/api/src/db/migrate.ts#L9)
- 확인 사실: production과 test fixture가 migration 파일명·순서를 별도 배열로 관리한다.
- 영향: 신규 migration이 production에만 추가되면 통합 테스트가 과거 schema로 계속 통과한다.
- 최소 권고: production manifest/runner를 공유하거나 최소한 ID·checksum drift를 fail-fast한다.

### TC-14 setup 실패에서도 SQLite·임시 파일을 정리한다

- 구분: 개선
- 카탈로그: P-17, B-00, B-01
- 위치: [`database-backup.test.ts`](../../../packages/infra/db/src/database-backup.test.ts#L69), [`sqlite-database.test.ts`](../../../packages/infra/db/src/sqlite-database.test.ts#L16), [`client.test.ts`](../../../packages/infra/db/src/client.test.ts#L108), [`operations-reporting-metrics-sqlite-repository.test.ts`](../../../packages/modules/operations/src/infrastructure/persistence/operations-reporting-metrics-sqlite-repository.test.ts#L167), [`test-deployment-images.ts`](../../../scripts/test-deployment-images.ts#L232)
- 확인 사실: 일부 fixture는 open·migration·seed가 `try` 밖이며 assertion이나 setup이 실패하면 close/remove에 도달하지 않는다.
- 영향: Windows file lock, temp·secret-like fixture 잔존과 후속 테스트 간섭이 최초 실패를 가린다.
- 최소 권고: root 생성 직후 최외곽 `try/finally` 또는 disposable을 등록하고 close 후 remove 순서를 모든 경로에서 보장한다.

### TC-15 실제 1ms timer 기반 email timeout 테스트를 결정론적으로 만든다

- 구분: 개선
- 카탈로그: P-16, B-00
- 위치: [`resend.test.ts`](../../../packages/infra/auth/src/email/resend.test.ts#L76)
- 확인 사실: timeout 사례가 실제 timer와 event-loop scheduling에 의존한다.
- 영향: 부하·플랫폼별 flaky 가능성이 있고 불필요한 wall-clock 대기를 만든다. 발생 빈도는 실행 이력 없이 추론이다.
- 최소 권고: fake timer로 abort listener 등록 뒤 시간을 진행하거나 clock/scheduler를 주입한다.

### TC-16 Better Auth 내부 config hook 직접 호출을 공개 흐름으로 바꾼다

- 구분: 개선
- 카탈로그: B-05, B-12, B-13
- 위치: [`learner/server.test.ts`](../../../packages/infra/auth/src/learner/server.test.ts#L41)
- 확인 사실: `betterAuth.mock.calls`에서 config를 꺼내 private `databaseHooks.user.create.after`를 직접 호출한다.
- 영향: 외부 동작이 같은 library/config 리팩터링에도 깨지며 실제 hook 연결 여부는 검증하지 못한다.
- 최소 권고: 실제 sign-up HTTP 흐름에 provisioner spy를 주입하고 공개 가입 결과를 검증한다.

### TC-17 CSP report-only 값과 report 입력 경계를 검증한다

- 구분: 개선
- 카탈로그: P-12, B-14
- 위치: [`csp-policy.test.ts`](../../../packages/config/nextjs-config/src/csp-policy.test.ts#L50)
- 확인 사실: report-only 테스트는 header key만 보고 value를 검사하지 않는다. report recorder의 64KiB, invalid JSON, `Content-Length` 경계도 없다.
- 영향: 빈 CSP·약화된 directive·무제한 report body가 테스트를 통과한다.
- 최소 권고: enforcing CSP와 report-only value의 동등성을 비교하고 204/400/413 경계를 추가한다.

### TC-18 production readiness의 정확한 시간 경계를 검증한다

- 구분: 개선
- 카탈로그: P-12, B-14
- 위치: [`production-readiness.test.ts`](../../../scripts/production-readiness.test.ts#L84)
- 확인 사실: 이름은 31일·미래 경계를 주장하지만 53일 전과 +6분만 사용한다. 구현의 정확한 31일과 5분 skew 경계는 검증되지 않는다.
- 영향: `>`/`>=` 또는 단위 계산 오류로 stale 증거를 승인하거나 정상 배포를 차단할 수 있다.
- 최소 권고: 31d, 31d+1ms, +5m, +5m+1ms를 독립 사례로 둔다.

### TC-19 learning reporting SQLite adapter를 실제 DB로 검증한다

- 구분: 개선
- 카탈로그: P-08, P-19, B-14
- 위치: [`learning-reporting.test.ts`](../../../packages/modules/learning/src/application/learning-reporting.test.ts#L17), [`learning-reporting-drizzle-repository.ts`](../../../packages/modules/learning/src/infrastructure/persistence/learning-reporting-drizzle-repository.ts#L16)
- 확인 사실: application은 수기 stub만 검증하며 production reporting adapter를 호출하는 테스트가 없다.
- 영향: user scope, completed filter, group-by와 날짜 정렬 오류가 통과한다.
- 최소 권고: 두 사용자와 완료·진행 lesson, 비연속 activity date를 가진 격리 DB 통합 테스트 한 건을 추가한다.

### TC-20 cursor 테스트가 이름에서 주장한 fingerprint 격리를 확인하게 한다

- 구분: 개선
- 카탈로그: P-05, P-12, P-18, B-14
- 위치: [`learner-cursor.test.ts`](../../../packages/modules/learning/src/infrastructure/persistence/learner-cursor.test.ts#L20), [`learning-http.test.ts`](../../../packages/modules/learning/src/interface/http/learning-http.test.ts#L47)
- 확인 사실: 다른 endpoint·learner는 보지만 다른 filter fingerprint는 보지 않으며 HTTP에서 다른 learner cursor의 400 경계도 없다.
- 영향: cursor scope 전달 누락 또는 조건이 바뀐 cursor 재사용이 통과한다.
- 최소 권고: codec의 fingerprint 거부 1건과 HTTP의 다른 learner scope 거부 1건을 추가한다.

### TC-21 browser 내부 fetch monkey patch 기반 AI 실패 E2E를 제거한다

- 구분: 제거
- 카탈로그: P-02, P-06, P-08, B-13, B-17
- 위치: [`ai-feedback-fixture.ts`](../../../e2e/ai-feedback-fixture.ts#L12), [`pr-smoke.spec.ts`](../../../e2e/pr-smoke.spec.ts#L76), [`writing-app.spec.ts`](../../../e2e/writing-app.spec.ts#L51)
- 확인 사실: 실패 응답은 실제 API가 아니라 `window.fetch` 대체로 만들어지며 같은 provider/quota UI가 UI integration·HTTP 테스트에 존재한다.
- 영향: API error mapping이 깨져도 E2E는 통과하면서 browser runtime 비용만 남는다.
- 최소 권고: PR 실패 E2E를 제거하고 release에는 실제 provider fixture를 통과하는 대표 조립 흐름만 남긴다.

### TC-22 10개 활동 유형 완주 E2E를 대표 조립 위험으로 축소한다

- 구분: 제거·개선
- 카탈로그: P-02, P-08, B-06, B-07, B-17
- 위치: [`admin-content-publishing.spec.ts`](../../../e2e/admin-content-publishing.spec.ts#L293)
- 확인 사실: 5분 timeout 한 테스트가 10개 renderer·grading·autosave·keyboard·AI·mobile overflow를 연속 검증하며 하위 domain·mapping 테스트와 중복한다. exact 이미지 크기와 direct DB 불변성도 adapter·migration·repository 테스트와 중복한다.
- 영향: 한 단계 실패가 이후 검증을 모두 막고 두 release browser에서 같은 비용을 반복한다.
- 최소 권고: 일반 answer, ORDER keyboard+draft, AI처럼 조립 위험이 다른 2~3개만 남기고 exact 변환·DB·fixture 자기검증은 하위 경계로 돌린다.

### TC-23 browser-support God Test를 기능별로 분리하고 내부 CSS 단정을 제거한다

- 구분: 개선
- 카탈로그: P-06, P-18, B-03, B-05, B-07
- 위치: [`browser-support.smoke.spec.ts`](../../../e2e/browser-support.smoke.spec.ts#L12)
- 확인 사실: 한 테스트가 browser별 조건문으로 landing overflow, theme, admin drawer, user suspend, table, analytics, course page를 실행하고 `position`, `overflow-x`, `data-slot`을 단정한다.
- 영향: 실패 소유권이 불명확하고 CSS 리팩터링이 제품 회귀처럼 보이며 중간 실패 시 사용자 상태를 오염시킨다.
- 최소 권고: public responsiveness, theme persistence, admin navigation, analytics로 분리하고 사용자 상태 mutation과 내부 CSS 단정을 제거한다.

### TC-24 범용 `networkidle` 대기를 관찰 가능한 readiness로 바꾼다

- 구분: 개선
- 카탈로그: P-00, P-16, B-00, B-06
- 위치: [`auth.ts`](../../../e2e/auth.ts#L48), [`writing-app.spec.ts`](../../../e2e/writing-app.spec.ts#L16), [`pr-smoke.spec.ts`](../../../e2e/pr-smoke.spec.ts#L27), [`credentials-auth.spec.ts`](../../../e2e/credentials-auth.spec.ts#L101)
- 확인 사실: 대부분 바로 뒤에 role·URL 기반 assertion이 있는데도 `networkidle`을 추가 대기한다.
- 영향: polling·streaming이 추가되면 UI가 준비됐어도 느려지거나 timeout 날 가능성이 있다. 이는 향후 위험에 대한 추론이다.
- 최소 권고: 다음 동작에 필요한 heading·button·URL·response만 기다린다.

### TC-25 여러 핵심 E2E 흐름을 독립 actor 기준으로 나눈다

- 구분: 개선
- 카탈로그: P-01, P-17, B-02, B-07
- 위치: [`writing-app.spec.ts`](../../../e2e/writing-app.spec.ts#L10), [`credentials-auth.spec.ts`](../../../e2e/credentials-auth.spec.ts#L38)
- 확인 사실: 하나는 lesson·AI·profile·logout·redirect를, 다른 하나는 signup·verification·login·reset·session revoke를 한 함수에서 연속 수행한다.
- 영향: 앞 단계 하나가 실패하면 뒤 핵심 경로가 실행되지 않고 재현 범위가 과도하게 커진다.
- 최소 권고: lesson completion과 profile/session, signup/verification과 password reset/session revoke를 각각 별도 seeded actor로 분리한다.

### TC-26 피할 수 있는 느린 테스트 비용을 줄인다

- 구분: 제거·개선
- 카탈로그: P-00, B-06
- 위치: [`setup-e2e-database.test.ts`](../../../apps/api/src/test-support/setup-e2e-database.test.ts#L15), [`backup-restore.test.ts`](../../../apps/api/src/db/backup-restore.test.ts#L118), [`auth-page.test.tsx`](../../../apps/web/src/features/authentication/ui/auth-page.test.tsx#L66), [`password-reset-page.test.tsx`](../../../apps/web/src/features/authentication/ui/password-reset-page.test.tsx#L21)
- 확인 사실: E2E baseline 단일 테스트는 전체 table·credential·step type을 중복 검사하며 6초 이상 걸렸다. backup guard는 migration이면 충분한데 전체 seed를 수행한다. 인증 UI는 key event가 검증 대상이 아닌 긴 문자열도 `user.type`으로 입력해 여러 사례가 1~3초씩 걸린다.
- 영향: 기본 suite 반복 비용을 높이고 무관한 seed·타이핑 실패를 전파한다.
- 최소 권고: baseline 내부 구조 테스트를 제거하고 경로 guard만 남긴다. backup은 migration만 실행하고, 키 입력이 계약이 아닌 setup은 paste/change helper를 사용한다.

### TC-27 운영 지표 통합 God Test를 metric 책임별로 나눈다

- 구분: 개선
- 카탈로그: P-01, P-17, B-02, B-07
- 위치: [`operations-reporting-metrics-sqlite-repository.test.ts`](../../../packages/modules/operations/src/infrastructure/persistence/operations-reporting-metrics-sqlite-repository.test.ts#L24)
- 확인 사실: 한 테스트가 dashboard, cohort, daily series, lesson·AI ranking, 삭제 사용자 제외와 PII 부재를 한 대형 fixture로 검증하며 empty 집계와 read-only mutation 거부도 결합한다.
- 영향: metric 하나의 변경이 무관한 fixture 전체를 깨뜨리고 실패 진단 비용을 높인다.
- 최소 권고: dashboard/cohort, daily, lesson ranking, AI+PII, read-only를 최소 row fixture로 분리한다.

### TC-28 web wire fixture 복제를 공용 builder로 합친다

- 구분: 개선
- 카탈로그: P-15, B-08
- 위치: [`courses/[id]/page.test.tsx`](<../../../apps/web/src/app/(learner)/app/courses/[id]/page.test.tsx#L38>), [`course-curriculum.test.tsx`](../../../apps/web/src/features/course-detail/ui/course-curriculum.test.tsx#L8), [`lesson-experience.test.tsx`](../../../apps/web/src/features/lesson-session/ui/lesson-experience.test.tsx#L36), [`learner-api-fixtures.ts`](../../../apps/web/src/test/learner-api-fixtures.ts#L53)
- 확인 사실: 같은 course·lesson wire DTO가 여러 파일에서 50~100줄씩 복제되며 기존 공용 fixture 경계가 있다.
- 영향: generated DTO 변경 시 일부 mock이 실제 계약에서 벗어난 채 통과할 수 있다.
- 최소 권고: typed 기본 DTO와 필요한 override만 받는 작은 builder로 합친다.

## P3 — 제거 또는 축소

### TC-29 한 줄 wrapper·호출 전달 테스트를 제거한다

- 구분: 제거
- 카탈로그: P-06, P-18, B-05, B-13
- 대표 위치: [`courses/[id]/page.test.ts`](<../../../apps/admin/src/app/(admin)/courses/[id]/page.test.ts#L43>), [`get-admin-session-token.test.ts`](../../../apps/admin/src/server/auth/get-admin-session-token.test.ts#L12), [`profile-logout-button.test.tsx`](<../../../apps/web/src/app/(learner)/app/profile/_views/profile-logout-button.test.tsx#L20>), [`learning-application.test.ts`](../../../packages/modules/learning/src/application/learning-application.test.ts#L167), [`ai-infrastructure.test.ts`](../../../packages/infra/ai/src/ai-infrastructure.test.ts#L32)
- 확인 사실: mock 인자·호출 횟수·SDK 내부 필드·단순 반환 전달만 고정하며 실제 HTTP/UI/domain 경계에 같은 의미가 존재한다.
- 영향: 외부 동작이 같은 리팩터링에 깨지고 실제 회귀 신호를 늘리지 않는다.
- 최소 권고: 공개 거부·상태 전이·wire 결과를 추가하지 않는 사례는 삭제한다.

### TC-30 exact prompt·negative export·역사적 부재 테스트를 제거한다

- 구분: 제거
- 카탈로그: P-06, P-18, B-05, B-12
- 위치: [`ai-feedback-prompt.test.ts`](../../../packages/modules/ai-feedback/src/domain/ai-feedback-prompt.test.ts#L5), [`transport-neutral-entrypoints.test.ts`](../../../packages/shared/contracts/src/transport-neutral-entrypoints.test.ts#L7), [`dependency-audit-policy.test.ts`](../../../scripts/dependency-audit-policy.test.ts#L74)
- 확인 사실: 전체 prompt 문자열, 열거한 내부 export 이름의 부재, 특정 과거 override·script 문자열의 부재를 고정한다.
- 영향: 무해한 copy·rename·script 재구성에는 깨지지만 열거하지 않은 누출은 놓친다.
- 최소 권고: prompt는 허용·금지 데이터의 provider request 경계로, transport·dependency 정책은 정적 graph/parser 규칙으로 옮긴다.

### TC-31 정적 markup 존재만 보는 Testing Library 테스트를 제거한다

- 구분: 제거
- 카탈로그: P-06, B-05
- 대표 위치: [`landing-page.test.tsx`](../../../apps/web/src/features/landing/ui/landing-page.test.tsx#L7), [`global-nav.test.tsx`](<../../../apps/web/src/app/(learner)/app/_views/global-nav.test.tsx#L13>), [`course-detail-page.test.tsx`](../../../apps/web/src/features/course-detail/ui/course-detail-page.test.tsx#L65), [`lesson-experience.test.tsx`](../../../apps/web/src/features/lesson-session/ui/lesson-experience.test.tsx#L160)
- 확인 사실: interaction·상태 전이 없이 heading·text·link·초기 부재만 확인한다.
- 영향: copy·DOM 조합 변경마다 깨지지만 navigation·접근성·오류 복구 위험은 검증하지 않는다.
- 최소 권고: 정적 사례를 삭제하고 실제 클릭 결과나 접근성 위험이 있으면 Storybook/browser interaction에 둔다.

### TC-32 같은 UI 오류·진행 상태의 계층 중복을 제거한다

- 구분: 제거
- 카탈로그: P-03, P-13, B-08
- 위치: [`admin-api-ui.integration.test.tsx`](../../../apps/admin/src/test/admin-api-ui.integration.test.tsx#L119), [`course-editor-shell.test.tsx`](../../../apps/admin/src/features/course-editor/ui/course-editor-shell.test.tsx#L55), [`courses-page.test.tsx`](../../../apps/web/src/features/course-catalog/ui/courses-page.test.tsx#L122), [`learner-api-ui.integration.test.tsx`](../../../apps/web/src/test/learner-api-ui.integration.test.tsx#L77)
- 확인 사실: upload pending과 generated client의 401/network 오류가 mock component와 MSW integration에서 중복된다.
- 영향: 같은 정책 변경에 두 계층을 고치며 낮은 경계의 mock이 추가 확신을 주지 않는다.
- 최소 권고: wire 의미는 MSW integration, 순수 UI 고유 상태만 component 테스트가 소유하도록 중복 행을 삭제한다.

### TC-33 같은 동등 분할·mapper case의 반복을 축소한다

- 구분: 제거·축소
- 카탈로그: P-13, B-08
- 위치: [`api-error.test.ts`](../../../packages/shared/contracts/src/api-error.test.ts#L31), [`quality.test.ts`](../../../packages/shared/contracts/src/ai-feedback/quality.test.ts#L9), [`content-seed.test.ts`](../../../packages/modules/content/src/infrastructure/persistence/content-seed.test.ts#L22), [`learner-step-mapping.test.ts`](../../../packages/modules/learning/src/infrastructure/persistence/learner-step-mapping.test.ts#L43)
- 확인 사실: 분기 없는 unknown key 이름 7개, 입력하지 않은 속성의 부재, mapper의 항등적 parent/sort, 같은 10개 case table의 3회 순회를 검증한다.
- 영향: 테스트 수와 연쇄 실패는 늘지만 새로운 위험을 검증하지 않는다.
- 최소 권고: 대표 동등값 1개와 실제 악성 입력·nested secret·순열을 만드는 유형만 남긴다.

### TC-34 서로 다른 command·route·실패 단계를 독립 사례로 나눈다

- 구분: 개선
- 카탈로그: P-01, P-17, B-02, B-07
- 대표 위치: [`admin-course-actions.test.ts`](../../../apps/admin/src/features/course-catalog/server/admin-course-actions.test.ts#L37), [`admin-user-actions.test.ts`](../../../apps/admin/src/features/user-management/server/admin-user-actions.test.ts#L37), [`identity-http.test.ts`](../../../packages/modules/identity/src/interface/http/identity-http.test.ts#L84), [`admin-audit.integration.test.ts`](../../../apps/api/src/observability/admin-audit.integration.test.ts#L50), [`learning-application.test.ts`](../../../packages/modules/learning/src/application/learning-application.test.ts#L382)
- 확인 사실: create+archive, update+delete, 여러 route, 여섯 audit action, prepare/provider/finalize 실패를 한 테스트와 공유 상태에 묶는다.
- 영향: 앞 실패가 뒤 assertion을 가리고 실패 이름만으로 책임을 구분하기 어렵다.
- 최소 권고: `it.each`를 사용하더라도 각 행이 새 fixture에서 한 command·route·실패 단계만 실행하게 한다.

### TC-35 테스트 이름이 주장하는 행동을 실제 assertion으로 검증한다

- 구분: 개선
- 카탈로그: P-05, P-06, B-09, B-14
- 위치: [`admin-api-ui.integration.test.tsx`](../../../apps/admin/src/test/admin-api-ui.integration.test.tsx#L167), [`course-curriculum.test.tsx`](../../../apps/web/src/features/course-detail/ui/course-curriculum.test.tsx#L92), [`learner-cursor.test.ts`](../../../packages/modules/learning/src/infrastructure/persistence/learner-cursor.test.ts#L20)
- 확인 사실: “다시 시도 가능”은 enabled만, “접고 펼침”은 `aria-expanded`만, “fingerprint 일치”는 fingerprint가 아닌 endpoint·learner만 본다.
- 영향: 이름이 제공하는 살아있는 문서와 실제 검증이 달라 거짓 신뢰를 만든다.
- 최소 권고: 재클릭 뒤 성공, 콘텐츠 실제 부재·재등장, 다른 fingerprint 거부를 관찰 가능한 결과로 검증한다.

### TC-36 테스트 내부 조건문·loop를 값 기반 독립 사례로 바꾼다

- 구분: 개선
- 카탈로그: B-03
- 대표 위치: [`step-grading-policy.test.ts`](../../../packages/modules/learning/src/domain/step-grading-policy.test.ts#L191), [`csp-provider.test.tsx`](../../../packages/shared/ui/src/components/ui/csp-provider.test.tsx#L32), [`theme-selector.test.tsx`](../../../packages/shared/ui/src/components/ui/theme-selector.test.tsx#L40), [`resend.test.ts`](../../../packages/infra/auth/src/email/resend.test.ts#L31)
- 확인 사실: assertion 실행 여부를 `if`로 정하거나 loop 안에서 여러 값을 검증해 빈 집합·초기 assertion 실패 시 후속 의미가 사라진다.
- 영향: 사례 이름과 실패 원인이 분리되지 않고 일부 assertion이 조용히 실행되지 않을 수 있다.
- 최소 권고: 결과 전체 matcher, 집합 assertion 또는 독립 `it.each` 행으로 바꾼다.

### TC-37 query 순서·내부 call count·CSS selector 같은 비계약 값을 제거한다

- 구분: 제거
- 카탈로그: P-06, P-18, B-05
- 대표 위치: [`get-filter-url.test.ts`](../../../apps/admin/src/shared/navigation/get-filter-url.test.ts#L22), [`admin-api-request-options.test.ts`](../../../apps/admin/src/server/http/admin-api-request-options.test.ts#L41), [`courses-page.test.tsx`](../../../apps/web/src/features/course-catalog/ui/courses-page.test.tsx#L66), [`home-page.test.tsx`](../../../apps/web/src/features/learner-home/ui/home-page.test.tsx#L163)
- 확인 사실: query field 순서와 trailing `?`, token 구성 호출 횟수, 첫 번째 regex link, 정확한 DOM 출현 횟수를 고정한다.
- 영향: 사용자 결과가 같은 canonicalization·batching·responsive markup 변경에도 실패한다.
- 최소 권고: 필터 의미, 정확한 accessible name의 목적지, 공개 wire 결과만 남긴다.

## 권고 실행 순서

1. TC-01~TC-03을 먼저 수정해 데이터 무결성·fixture 안전·로그 민감정보의 거짓 승인을 제거한다.
2. TC-04~TC-09의 외부 실패·transaction·fixture·E2E 격리 경계를 보완한다.
3. TC-10~TC-20으로 production 오염, setup cleanup, 실제 adapter 공백을 해소한다.
4. TC-21~TC-28로 E2E와 기본 suite 비용을 줄인다.
5. TC-29~TC-37을 삭제·분리해 이후 변경의 유지비와 실패 노이즈를 낮춘다.

단기적으로는 현재 구조 안에서 위 순서대로 국소 수정하는 것이 가장 되돌리기 쉽다. 장기적으로는 “위험 하나당 가장 낮은 충분한 테스트 경계 하나”를 소유권 규칙으로 정하고, E2E는 runtime 조립에서만 발견 가능한 핵심 흐름으로 제한해야 같은 중복이 다시 생기지 않는다.
