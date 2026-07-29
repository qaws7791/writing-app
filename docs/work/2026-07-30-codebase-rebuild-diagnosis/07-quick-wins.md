# 07 · Quick Wins

조건: 1일 이내, 저위험, 단독 배포·롤백 가능. 우선순위 = `(영향 × 위험) ÷ 공수` 내림차순.

| #    | 작업                                          | 점수  | 공수   | 위험 | 검증                                      |
| ---- | --------------------------------------------- | ----- | ------ | ---- | ----------------------------------------- |
| Q-01 | CI `check:toolchain` 참조 정리                | 125.0 | 0.2 MD | 낮음 | `bun run ci:static`                       |
| Q-02 | `getFirstLessonStep` export 제거              | 90.0  | 0.1 MD | 낮음 | `bun run check:knip`                      |
| Q-03 | 로컬 `bun run build` 통과시키기               | 53.3  | 0.3 MD | 낮음 | `bun run build`                           |
| Q-04 | `no-restricted-imports` 패턴 정정             | 30.0  | 0.3 MD | 낮음 | `bun run lint`                            |
| Q-05 | `.playwright-cli/` 삭제 + gitignore           | 20.0  | 0.2 MD | 낮음 | `git status`                              |
| Q-06 | `apps/api/src/env.ts` shim 제거               | 20.0  | 0.1 MD | 낮음 | `bun run typecheck`                       |
| Q-07 | repomix에서 `docs/research` 제외              | 20.0  | 0.1 MD | 낮음 | 출력 줄 수                                |
| Q-08 | `operationError` 헬퍼 인라인화 + `query` 보존 | 18.0  | 0.4 MD | 낮음 | `bun --filter @workspace/operations test` |
| Q-09 | 죽은 설정 참조 4곳 제거                       | 10.0  | 0.2 MD | 낮음 | `bun run ci:static`                       |
| Q-10 | 동어반복 테스트 제거 + oxlint 무효 선언 정리  | 10.0  | 0.5 MD | 낮음 | `bun run test`, `bun run lint`            |

합계 **2.4 MD**. Q-01~Q-03을 먼저 하지 않으면 나머지 검증이 신뢰할 수 없다.

---

## Q-01 · CI `check:toolchain` 참조 정리 · 0.2 MD

실측: `bun run check:toolchain` → `EXIT=1 / error: Script not found "check:toolchain"`. 참조 14곳(`quality-gates.yml:56,108,133,164,190,216,246,278,321`, `image-release.yml:40,129,225,266,415`). 제거 commit `c8e22f26`(2026-07-26).

작업: 14곳의 `- run: bun run check:toolchain` 스텝을 제거한다. Bun·Node 버전 계약은 `setup-bun@v2`의 `bun-version: 1.3.10`과 `setup-node@v6`의 `node-version: 24.x`가 이미 고정하고 있고, 루트 `package.json`의 `packageManager`·`engines`가 정본이다. 별도 런타임 검증 스크립트는 중복이다.

검증

```sh
bun run ci:static
# CI: PR 생성 후 10개 job이 첫 스텝을 통과하는지 확인
```

롤백: revert. 현재 상태도 실패이므로 되돌려도 악화되지 않는다.

동시 권고: 같은 PR에 `scripts/check-workflow-scripts.ts`를 추가해 재발을 막는다(04 문서 Step 0). 30줄 이내로 구현 가능하다.

```ts
// workflow YAML에서 `bun run <name>` 을 추출해 package.json scripts와 대조
const declared = new Set(Object.keys(manifest.scripts))
for (const [file, name] of readWorkflowScriptReferences()) {
  if (!declared.has(name))
    throw new Error(`${file}: script "${name}" 가 없습니다.`)
}
```

---

## Q-02 · `getFirstLessonStep` export 제거 · 0.1 MD

실측: `bun run check:knip` → `EXIT=1`, `Unused exports (1) getFirstLessonStep function apps/web/src/features/lesson-session/model/lesson-logic.ts:24:17`.

작업: export 키워드 제거. 파일 내부 소비자가 없으면 함수 전체 삭제.

검증

```sh
bun run check:knip     # EXIT 0
bun run ci:static      # 8개 하위 검사 전부 green
bun --filter @workspace/web test
```

롤백: revert.

---

## Q-03 · 로컬 `bun run build` 통과시키기 · 0.3 MD

실측: `bun run build` → `EXIT 1`, `Tasks: 3 successful, 6 total`, `Failed: @workspace/web#build`.
원인: `bun run setup`이 생성한 `apps/web/.env`의 `CONTENT_ASSET_PUBLIC_BASE_URL=http://localhost:9000/writing-app-assets` → Next build는 `NODE_ENV=production` → `packages/config/env/src/public-url.ts:36`이 `content asset public base URL must use HTTPS in production` throw.
CI가 통과하는 이유: `build` job이 이 변수를 설정하지 않아 `undefined` → `:22`에서 `null` 조기 반환.

작업: `parseContentAssetPublicBaseUrl`의 production HTTPS 검사에 loopback 예외를 추가한다. 같은 파일 `assertPublicUrlTransport:105-108`이 이미 `isLoopbackHostname` 예외를 쓰고 있으므로 **규칙 통일**에 해당하며 새 완화가 아니다.

```ts
// packages/config/env/src/public-url.ts:36 근처
if (
  nodeEnvironment === "production" &&
  url.protocol !== "https:" &&
  !isLoopbackHostname(url.hostname) // 이미 같은 파일 :117 에 존재
) {
  throw new Error(`${description} must use HTTPS in production`)
}
```

보안 영향: loopback(`localhost`, `*.localhost`, `127.0.0.1`, `::1`)만 허용한다. 실제 프로덕션 배포는 `infra/ansible/.../web.env.j2`가 공개 HTTPS URL을 주입하므로 영향이 없고, `assertContentAssetPublicBaseUrlAllowed:80-95`의 allowlist 검사도 그대로 유지된다.

검증

```sh
bun run build          # Tasks: 6 successful, 6 total
bun --filter @workspace/env test    # 29 케이스
bun run check:route-bundles
```

추가 테스트 1건: loopback http URL이 production 모드에서 허용되고 비-loopback http URL은 여전히 거부되는지 단정(`packages/config/env` 테스트에 추가).

롤백: revert. 로컬 build가 다시 실패 상태로 돌아간다.

---

## Q-04 · `no-restricted-imports` 패턴 정정 · 0.3 MD

실측: 규칙이 차단하는 패턴은 `@test/*`·`../test/*` 인데 실제 코드는 `@/test/learner-api-fixtures`를 사용(`apps/web/src/app/(learner)/app/page.test.tsx:32,33`, `features/learner-profile/ui/profile-page.test.tsx:6`). 패턴 불일치로 **규칙이 한 번도 발동하지 않는다.** 메시지가 지목한 `apps/web/test`는 부재(`Test-Path` false), 실 위치는 `apps/web/src/test`.

작업: 패턴을 `@/test/*`로 수정, 메시지 경로를 `apps/web/src/test`로 정정.

```json
{
  "group": ["@/test/*"],
  "message": "제품 소스는 테스트 지원 경계를 import할 수 없습니다. 테스트 fixture와 fake는 apps/web/src/test 안에서만 사용하세요."
}
```

검증

```sh
bun run lint    # 위반이 나오면 그것이 진짜 발견 → 별건으로 기록
```

주의: 수정 후 프로덕션 소스가 `@/test/*`를 import하는 위반이 드러날 수 있다. 그 경우 위반을 고치는 것이 이 작업의 본래 목적이며, 위반 수가 많으면 Q-04를 별도 Step으로 승격한다. 기존 `overrides`가 `apps/web/src/**/*.test.{ts,tsx}`에서 규칙을 off하고 있으므로 테스트 파일은 영향받지 않는다.

롤백: revert.

---

## Q-05 · `.playwright-cli/` 삭제 + gitignore · 0.2 MD

실측: 11개 추적 파일 합계 **2,381,967 B**. `hqaf004.pdf` 2,018,057 / `hqaf004-supplementary-data.docx` 127,287 / `sj-docx-1-ero-10-1177-23328584231176451.docx` 115,003 / `console-*.log` 2건 / `page-*.yml` 6건(2쌍은 바이트 동일). commit `1baa864e`(2026-07-27, "코스 시드 재구축 연구 자료를 정리한다"). `.gitignore:24`는 `playwright-report`만 무시.

작업: 11파일 삭제, `.gitignore`에 `.playwright-cli/` 추가.

**이력 재작성은 하지 않는다.** force push 위험이 2.4MB 이득을 넘는다. 다만 저작권 있는 논문 PDF가 영구 이력에 남으므로 라이선스 검토가 필요하면 별건으로 판단한다.

검증

```sh
git status --porcelain     # 11개 삭제만 표시
bun run test:e2e:pr        # 이 파일들이 테스트에 쓰이지 않음을 확인
```

롤백: revert.

---

## Q-06 · `apps/api/src/env.ts` shim 제거 · 0.1 MD

실측: 파일 내용은 `export { parseApiEnv } from "@/config/env"` 1줄. 프로덕션 소비자 0(`main.ts:10`, `create-container.ts:71`, `maintenance-daily.ts:15`, `reapply-deletion-markers.ts:10` 모두 `@/config/env` 직접 import). 유일 소비자는 `apps/api/src/env.test.ts:3`. 변경 이력 18회.

작업: `env.test.ts:3`을 `@/config/env`로 변경하고 `env.ts` 삭제.

검증

```sh
bun run typecheck
bun --filter @workspace/api test    # 37파일 137케이스
bun run check:knip
```

선택: 같은 PR에서 `config/env.ts` → `env.ts`로 되돌릴 수 있다. 다만 `config/` 디렉터리에 다른 파일이 없어 디렉터리가 비게 되므로 파일 이동을 함께 하는 것이 정리에 부합한다. 이동은 `smart_relocate`류 도구로 import를 자동 갱신할 수 있다.

롤백: revert.

---

## Q-07 · repomix에서 `docs/research` 제외 · 0.1 MD

실측: `docs/research` 215파일 / **40,807줄** = 전체 문서 61,086줄의 67%. `package.json:111 repomix:docs`와 `:100 repomix:analysis`가 `docs/work`·`docs/archive`만 제외하고 research는 포함한다. `docs/authority-map.md`는 research가 현재 제품 정책의 권위 소스가 아니라고 명시.

작업: 두 script의 `--ignore` 목록에 `docs/research/**` 추가.

검증

```sh
bun run repomix:docs
(Get-Content .artifacts/repomix/combined-docs.md).Count    # 대폭 감소
```

기대: 문서 컨텍스트 61,086줄 → 약 20,300줄(−67%).

주의: 이것은 **삭제가 아니라 컨텍스트 제외**다. 파일은 저장소에 남고 사람이 직접 읽을 수 있다. research 자체의 외부화 여부는 소유자 판단(05 문서 D-22).

롤백: revert.

---

## Q-08 · `operationError` 헬퍼 인라인화 + `query` 보존 · 0.4 MD

실측: `packages/modules/operations/src/interface/http/operations-http-support.ts:20-30`.

```ts
export function mapOperationsError(_error: OperationsError): AppError {
  return operationError(503, "OPERATIONS_REPORTING_UNAVAILABLE", "Operations reporting is unavailable")
}
function operationError(status: 503, code: string, message: string): AppError { ... }
```

문제 둘. (1) 파라미터를 읽지 않으므로 `OperationsError.query`(`'ai-feedback-quality' | 'analytics' | 'dashboard' | 'lesson-analytics'`)가 버려진다. (2) 헬퍼의 `status`가 리터럴 `503`이라 한 가지 호출만 가능한 얕은 간접층이다.

작업

```ts
export function mapOperationsError(error: OperationsError): AppError {
  return new AppError({
    cause: error,
    code: "OPERATIONS_REPORTING_UNAVAILABLE",
    message: `${error.query} reporting is unavailable`,
    status: 503,
  })
}
```

헬퍼 `operationError` 삭제.

wire 영향: `code`는 그대로이므로 클라이언트 분기는 불변. `message`만 구체화된다. `docs/engineering/api-contract.md`의 호환성 규칙상 `message` 문구 변경은 계약 변경이 아니다.

검증

```sh
bun --filter @workspace/operations test    # 6파일 23케이스
bun run test:e2e:pr
```

롤백: revert.

주의: 이것은 F-14의 절반만 해결한다. "reporting SQL 버그가 재시도 가능 신호로 위장된다"는 오류 등급 문제는 `Failure.retryable` 도입(04 문서 Step 3)이 필요하다. Q-08은 진단 정보 손실만 막는다.

---

## Q-09 · 죽은 설정 참조 4곳 제거 · 0.2 MD

실측 (`Test-Path` 전부 false)

| 위치                | 참조                                | 상태                                  |
| ------------------- | ----------------------------------- | ------------------------------------- |
| `.oxlintrc.json:41` | `docs/superpowers/evidence/**`      | 부재                                  |
| `.oxlintrc.json:43` | `Kwep/**`                           | 부재                                  |
| `knip.json:19`      | `!scripts/architecture/fixtures/**` | `scripts/architecture` 부재           |
| `AGENTS.md:11`      | `.tool-versions`                    | 부재 (AGENTS.md가 "권위 소스"로 지목) |

작업: 앞 3개 제거. `.tool-versions`는 생성하거나 AGENTS.md 문구를 `package.json` `engines`만 남기도록 수정한다. **권고: 문구 수정** — `engines: { node: "24.x" }` + `packageManager: "bun@1.3.10"` + `.nvmrc: 24`가 이미 정본이고 파일을 더 만들면 정본이 넷이 된다.

검증

```sh
bun run ci:static
```

롤백: revert.

---

## Q-10 · 동어반복 테스트 제거 + oxlint 무효 선언 정리 · 0.5 MD

### 10-a. 동어반복 테스트

`packages/modules/learning/src/test/domain/learning-date.test.ts:16`

```ts
expect(platformLearningTimeZone).toBe("Asia/Seoul")
```

상수가 자기 리터럴과 같은지 단정한다. 상수를 바꾸면 테스트도 바뀌므로 방어력이 0이다. `docs/engineering/testing.md`가 이미 "source 문자열, 내부 이름을 회귀 계약으로 삼지 않는다"고 규정하고 있어 규칙 위반에 해당한다.

작업: 케이스 삭제. 같은 파일의 날짜 경계 계산 케이스는 유지한다.

### 10-b. oxlint 무효 선언

`.oxlintrc.json`이 `categories.correctness: "off"` 후 60여 규칙을 개별 `error`로 켜고, `overrides[0]`(`**/*.{ts,tsx,mts,cts}`)에서 그중 15~17개를 다시 `off` 한다. TS 전용 저장소이므로 이 규칙들은 **어디서도 실행되지 않는다**.

대상: `constructor-super`, `getter-return`, `no-class-assign`, `no-const-assign`, `no-dupe-class-members`, `no-dupe-keys`, `no-func-assign`, `no-import-assign`, `no-new-native-nonconstructor`, `no-obj-calls`, `no-redeclare`, `no-setter-return`, `no-this-before-super`, `no-undef`, `no-unreachable`, `no-unsafe-negation`, `no-with`

작업: `rules` 블록과 `overrides[0]`에서 동시 삭제. tsc가 담당하는 영역이므로 lint 커버리지 손실은 없다.

검증

```sh
bun run lint            # 위반 0 유지
bun run typecheck       # tsc가 여전히 해당 오류를 잡는지 확인
bun run test            # 케이스 수 742 → 741
```

기대: `.oxlintrc.json` 약 30줄 감소, 258줄 설정에서 "실제로 켜진 규칙"을 읽어내는 비용 감소.

롤백: revert. 규칙이 실행되지 않았음이 실측으로 확인되므로 삭제가 코드 품질에 영향을 주지 않는다.

---

## 실행 순서

```
Q-01 ─┬─> Q-02 ─> Q-04 ─┬─> Q-06 ─> Q-08 ─> Q-10
      │                  │
      └─> Q-03 ──────────┘
Q-05, Q-07, Q-09  (병렬, 의존 없음)
```

Q-01·Q-02·Q-03이 끝나면 `bun run ci:static`과 `bun run build`가 모두 green이 되고, 그 시점부터 나머지 작업의 검증이 신뢰할 수 있다. Q-05·Q-07·Q-09는 다른 작업과 무관하므로 언제든 병렬로 진행한다.
