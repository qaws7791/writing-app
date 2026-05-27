# package.json 환경 변수 경계 정리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 루트 `package.json` 스크립트에서 환경 변수 값을 암시적으로 주입하지 않고, 누락된 필수 값은 앱과 시드 스크립트의 기존 검증에서 명시적으로 실패하게 만든다.

**Architecture:** `package.json`은 명령 조합과 `--filter` 같은 실행 인자만 소유한다. 환경 변수 값은 `.env`, 셸, CI, 배포 환경이 소유하고, 앱별 `env.ts`와 시드 스크립트가 누락 값을 빠르게 실패 처리한다.

**Tech Stack:** Bun workspace, Turbo, Next.js, Hono, Zod `@workspace/env`, Markdown docs.

---

## 파일 구조

- 수정: `package.json`
  - 루트 `dev:admin`, `dev:admin:setup`에서 `NAME=value` 형태의 환경 변수 주입을 제거한다.
  - `--filter` 인자는 유지한다.
- 수정: `BACKEND.md`
  - 어드민 로컬 통합 실행 설명을 “기본 계정 자동 보장”에서 “명시 환경 변수가 준비된 상태에서 setup 실행”으로 바꾼다.
- 수정: `docs/operations-environment.md`
  - `bun dev:admin` 실행 전 필요한 환경 변수 준비 절차를 명시한다.
  - `package.json`에서 기본값을 주입하지 않는 운영 원칙을 문서화한다.
- 수정: `docs/admin-site.md`
  - 이번 작업의 시작/완료 기록을 추가한다.
  - 기존 기록 중 `dev:admin:setup`이 기본 비밀번호를 강제 갱신한다는 설명을 현재 정책에 맞게 보정한다.

## Task 1: 문서 시작 기록 추가

**Files:**

- Modify: `docs/admin-site.md`

- [ ] **Step 1: 시작 기록을 추가한다**

`docs/admin-site.md` 끝에 다음 섹션을 추가한다.

```markdown
## 2026-05-28 package.json 환경 변수 경계 정리 시작

- 루트 `package.json`의 `dev:admin`, `dev:admin:setup`에서 환경 변수 기본값을 암시적으로 주입하는 패턴을 제거한다.
- `package.json`은 명령 조합과 Turbo filter만 담당하고, 환경 변수 값은 `.env`, 셸, CI, 배포 환경에서 명시적으로 제공한다.
- 필수 환경 변수가 없으면 앱별 환경 변수 파서와 시드 스크립트가 시작 단계에서 실패하도록 기존 경계를 유지한다.
```

- [ ] **Step 2: 문서 포맷을 확인한다**

Run:

```powershell
bunx prettier --check docs/admin-site.md
```

Expected: `docs/admin-site.md`가 통과한다. 기존 문서 포맷 불일치가 있으면 이번 추가 섹션만 `bunx prettier --write docs/admin-site.md`로 정리한다.

- [ ] **Step 3: 커밋한다**

```powershell
git add docs/admin-site.md
git commit -m "어드민 환경 변수 경계 정리를 시작"
```

## Task 2: 루트 package.json 환경 변수 주입 제거

**Files:**

- Modify: `package.json`

- [ ] **Step 1: 현재 주입 패턴을 확인한다**

Run:

```powershell
rg -n "([A-Z][A-Z0-9_]*=|\\$\\{[A-Z][A-Z0-9_]*:-)" package.json
```

Expected: `dev:admin`, `dev:admin:setup`에서 `ADMIN_API_BASE_URL=`, `ADMIN_BETTER_AUTH_SECRET=`, `DATABASE_URL=`, `ADMIN_SEED_RESET_PASSWORD=true` 같은 항목이 출력된다.

- [ ] **Step 2: 스크립트를 최소 형태로 수정한다**

`package.json`의 `scripts`에서 두 항목을 다음 값으로 바꾼다.

```json
{
  "dev:admin": "bun run dev:admin:setup && turbo dev --filter=@workspace/admin --filter=@workspace/admin-api",
  "dev:admin:setup": "bun --filter @workspace/db db:seed && bun --filter @workspace/admin-api seed:admin"
}
```

- [ ] **Step 3: JSON 유효성을 확인한다**

Run:

```powershell
bun -e "const pkg = await import('./package.json', { with: { type: 'json' } }); console.log(pkg.default.scripts['dev:admin']); console.log(pkg.default.scripts['dev:admin:setup']);"
```

Expected:

```text
bun run dev:admin:setup && turbo dev --filter=@workspace/admin --filter=@workspace/admin-api
bun --filter @workspace/db db:seed && bun --filter @workspace/admin-api seed:admin
```

- [ ] **Step 4: 환경 변수 대입이 남지 않았는지 확인한다**

Run:

```powershell
rg -n "([A-Z][A-Z0-9_]*=|\\$\\{[A-Z][A-Z0-9_]*:-)" package.json
```

Expected: 출력이 없다.

- [ ] **Step 5: 커밋한다**

```powershell
git add package.json
git commit -m "루트 스크립트의 환경 변수 주입을 제거"
```

## Task 3: 운영 환경 문서 보정

**Files:**

- Modify: `docs/operations-environment.md`

- [ ] **Step 1: 로컬 실행 설명을 보정한다**

`docs/operations-environment.md`의 로컬 실행 표 아래 설명을 다음 내용으로 바꾼다.

```markdown
로컬 예시는 각 앱의 `.env.example`을 기준으로 만든다. API 앱 패키지에서 실행되는 `DATABASE_URL=file:../../data/api.sqlite`는 저장소 루트의 `data/api.sqlite`를 가리킨다.

루트 `package.json`은 환경 변수 값을 주입하지 않는다. `bun dev:admin`은 실행 전에 `bun run dev:admin:setup`으로 콘텐츠 시드와 관리자 계정 시드를 실행하지만, 필요한 값은 `.env`, 셸, CI 같은 실행 환경에서 명시적으로 제공되어야 한다. 필수 환경 변수가 없으면 `apps/admin-api/src/env.ts` 또는 `apps/admin-api/src/scripts/seed-admin.ts`에서 즉시 실패한다.
```

- [ ] **Step 2: 어드민 실행 전 체크리스트를 추가한다**

`docs/operations-environment.md`의 `## 어드민 API 환경 변수` 섹션 앞에 다음 섹션을 추가한다.

````markdown
## 어드민 로컬 실행 전 준비

`bun dev:admin`을 실행하기 전에 다음 값을 명시적으로 준비한다.

```env
ADMIN_API_BASE_URL=http://localhost:4001
ADMIN_BETTER_AUTH_SECRET=replace-with-32-byte-random-secret
ADMIN_BETTER_AUTH_URL=http://localhost:4001
ADMIN_CORS_ORIGIN=http://localhost:3001
DATABASE_URL=file:../../data/api.sqlite
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=replace-with-local-admin-password
```
````

기존 관리자 계정 비밀번호를 시드 값으로 갱신해야 할 때만 `ADMIN_SEED_RESET_PASSWORD=true`를 명시한다. 루트 스크립트는 이 값을 대신 설정하지 않는다.

````

- [ ] **Step 3: 로컬 기본값 표현을 제거한다**

`docs/operations-environment.md`의 마지막 체크리스트에서 다음 문장을 찾는다.

```markdown
- `DATABASE_URL`이 두 API에서 같은 SQLite 파일을 가리키며, 로컬 기본값은 저장소 루트 `data/api.sqlite`다.
````

다음 문장으로 바꾼다.

```markdown
- `DATABASE_URL`이 두 API에서 같은 SQLite 파일을 가리키며, 로컬 예시는 저장소 루트 `data/api.sqlite`다.
```

- [ ] **Step 4: 문서 포맷을 확인한다**

Run:

```powershell
bunx prettier --check docs/operations-environment.md
```

Expected: 통과한다. 실패하면 `bunx prettier --write docs/operations-environment.md`를 실행하고 다시 확인한다.

- [ ] **Step 5: 커밋한다**

```powershell
git add docs/operations-environment.md
git commit -m "어드민 환경 변수 준비 절차를 명시"
```

## Task 4: 백엔드 문서 보정

**Files:**

- Modify: `BACKEND.md`

- [ ] **Step 1: 어드민 로컬 통합 실행 설명을 교체한다**

`BACKEND.md`의 어드민 로컬 통합 실행 문단을 다음 내용으로 바꾼다.

```markdown
로컬 통합 실행에서는 루트 `bun run dev:admin`이 `bun run dev:admin:setup`을 먼저 실행한다. 이 setup은 콘텐츠 시드와 관리자 계정 시드를 실행하지만, 환경 변수 값은 루트 `package.json`에서 주입하지 않는다. `DATABASE_URL`, `ADMIN_BETTER_AUTH_SECRET`, `ADMIN_BETTER_AUTH_URL`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` 같은 필수 값은 `.env`, 셸, CI에서 명시적으로 제공한다. 필수 값이 없으면 시작 단계에서 실패한다.
```

- [ ] **Step 2: 시드 변수 표의 예시 표현을 보정한다**

`ADMIN_SEED_PASSWORD` 행의 예시가 `password-1234`라면 다음처럼 바꾼다.

```markdown
| `ADMIN_SEED_PASSWORD` | 시드 필수 | `replace-with-local-admin-password` | 최초 관리자 계정 시드에 사용할 비밀번호 |
```

- [ ] **Step 3: 문서 포맷을 확인한다**

Run:

```powershell
bunx prettier --check BACKEND.md
```

Expected: 통과한다. 실패하면 `bunx prettier --write BACKEND.md`를 실행하고 다시 확인한다.

- [ ] **Step 4: 커밋한다**

```powershell
git add BACKEND.md
git commit -m "어드민 백엔드 환경 변수 설명을 보정"
```

## Task 5: 변경 동작 검증

**Files:**

- Verify only

- [ ] **Step 1: package.json에 환경 변수 대입이 없는지 확인한다**

Run:

```powershell
rg -n "([A-Z][A-Z0-9_]*=|\\$\\{[A-Z][A-Z0-9_]*:-)" package.json
```

Expected: 출력이 없다.

- [ ] **Step 2: 필수 환경 변수 누락 시 명시 실패하는지 확인한다**

Run:

```powershell
bun --filter @workspace/admin-api seed:admin
```

Expected: 실패한다. 오류 메시지에는 누락된 환경 변수 이름이 포함되어야 하며, 비밀값 내용은 출력되지 않아야 한다. `ADMIN_BETTER_AUTH_SECRET`, `ADMIN_BETTER_AUTH_URL`, `DATABASE_URL` 중 첫 누락 변수 또는 `Invalid environment variables` 형식이 보이면 정상이다.

- [ ] **Step 3: 명시 환경 변수로 시드가 실행되는지 임시 DB에서 확인한다**

PowerShell에서 다음 명령을 실행한다.

```powershell
$env:ADMIN_BETTER_AUTH_SECRET = "local-admin-secret-for-plan-verification"
$env:ADMIN_BETTER_AUTH_URL = "http://localhost:4001"
$env:ADMIN_CORS_ORIGIN = "http://localhost:3001"
$env:DATABASE_URL = "file:../../data/plan-verification-admin.sqlite"
$env:ADMIN_SEED_EMAIL = "admin@example.com"
$env:ADMIN_SEED_PASSWORD = "password-1234"
bun --filter @workspace/db db:seed
bun --filter @workspace/admin-api seed:admin
Remove-Item Env:\ADMIN_BETTER_AUTH_SECRET
Remove-Item Env:\ADMIN_BETTER_AUTH_URL
Remove-Item Env:\ADMIN_CORS_ORIGIN
Remove-Item Env:\DATABASE_URL
Remove-Item Env:\ADMIN_SEED_EMAIL
Remove-Item Env:\ADMIN_SEED_PASSWORD
```

Expected: `seed:admin`이 `{"status":"created"}` 또는 기존 임시 DB 재사용 시 `{"status":"already-exists"}`를 출력한다.

- [ ] **Step 4: 임시 DB 파일을 제거한다**

Run:

```powershell
Remove-Item -LiteralPath data\plan-verification-admin.sqlite -ErrorAction SilentlyContinue
```

Expected: 명령이 성공한다. 파일이 없어도 오류 없이 완료된다.

- [ ] **Step 5: 일반 검증을 실행한다**

Run:

```powershell
bun run format:check
bun run typecheck
```

Expected: 가능한 범위에서 통과한다. 기존 `@workspace/ui`의 `clsx` 타입 해석 실패나 기존 포맷 불일치가 재현되면 이번 변경 파일과 무관한 기존 이슈로 기록한다.

## Task 6: 완료 문서 기록

**Files:**

- Modify: `docs/admin-site.md`

- [ ] **Step 1: 완료 기록을 추가한다**

`docs/admin-site.md`의 시작 기록 아래에 다음 내용을 추가한다.

```markdown
## 2026-05-28 package.json 환경 변수 경계 정리 완료

- 루트 `dev:admin`, `dev:admin:setup`에서 `ADMIN_*`, `DATABASE_URL`, `ADMIN_SEED_*` 환경 변수 주입을 제거했다.
- 어드민 로컬 통합 실행은 환경 변수가 준비된 상태에서만 setup과 dev server를 실행한다.
- 필수 환경 변수 누락은 `@workspace/env` 기반 어드민 API 환경 검증 또는 관리자 시드 스크립트의 필수 시드 값 검증에서 명시적으로 실패한다.
- `ADMIN_SEED_RESET_PASSWORD=true`는 더 이상 루트 스크립트가 대신 설정하지 않으며, 기존 관리자 비밀번호 갱신이 필요한 실행자가 직접 명시한다.
```

- [ ] **Step 2: 문서 포맷을 확인한다**

Run:

```powershell
bunx prettier --check docs/admin-site.md
```

Expected: 통과한다. 실패하면 `bunx prettier --write docs/admin-site.md`를 실행하고 다시 확인한다.

- [ ] **Step 3: 최종 diff를 확인한다**

Run:

```powershell
git diff -- package.json BACKEND.md docs/operations-environment.md docs/admin-site.md
```

Expected: 변경은 루트 스크립트의 환경 변수 주입 제거와 관련 문서 보정으로만 제한된다.

- [ ] **Step 4: 커밋한다**

```powershell
git add docs/admin-site.md
git commit -m "어드민 환경 변수 경계 정리를 완료"
```

## Self-Review

- Spec coverage: 루트 `package.json` 환경 변수 주입 제거, 암시 기본값 제거, 명시 실패 유지, 문서 시작/완료 갱신을 모두 포함했다.
- Placeholder scan: `TBD`, `TODO`, `적절한 처리`, `나중에` 같은 placeholder 없이 정확한 파일과 명령을 적었다.
- Type consistency: 새 타입이나 공개 API는 추가하지 않는다. 기존 `parseAdminApiEnv`, `seed-admin.ts`, `@workspace/env` 검증 경계를 그대로 사용한다.
