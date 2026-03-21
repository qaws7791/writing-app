# `@workspace/db` 패키지 신설 계획

## 목표

- `packages/infrastructure`에 모여 있는 **SQLite 접근·스키마·시드·리포지토리 구현**을 분리하여, **`drizzle-orm` + `bun:sqlite`** 기반의 전용 데이터 접근 패키지(`packages/db`)를 둔다.
- 도메인 경계는 유지한다: **리포지토리 구현체는 `DraftRepository` / `PromptRepository` 등 도메인 포트를 구현**하고, API·애플리케이션은 기존과 같이 포트에만 의존한다.

## 현재 상태 요약

| 구분 | 위치 | 비고 |
|------|------|------|
| DB 파일 열기·닫기, JSONB 지원 검사, DDL(`createSchema`) | `packages/infrastructure/src/sqlite-database.ts` | raw `database.exec` |
| `SqliteDraftRepository`, `SqlitePromptRepository` | `packages/infrastructure/src/sqlite-*.ts` | raw `database.query`, `@workspace/domain` 의존 |
| 시드 데이터·삽입 | `seed-data.ts`, `sqlite-seed.ts` | |
| 소비자 | `apps/api` (`bootstrap`, `scripts/db-reset`, `scripts/seed`) | `better-auth`는 동일 `bun:sqlite` `Database` 인스턴스 사용 |

`apps/api`의 `auth.ts`는 **better-auth가 마이그레이션으로 `user` 등 테이블을 관리**한다. 앱 스키마(`prompts`, `saved_prompts`, `drafts`)는 `createSchema`에서 생성되며 FK로 `"user"(id)`를 참조한다. **DB 패키지 도입 시에도 이 순서(인증 테이블 준비 후 앱 DDL/마이그레이션)를 유지**해야 한다.

---

## 목표 디렉터리 구조

```
packages/db/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── src/
    ├── schema/          # Drizzle 테이블·관계 정의 (prompts, saved_prompts, drafts 등)
    ├── client/          # bun:sqlite + Drizzle 인스턴스 생성·헬퍼 (open/close, JSONB 검증 등)
    ├── types/           # Drizzle `$inferSelect` / `$inferInsert` 재수출, 공용 row 타입 등
    └── index.ts         # 배럴(공개 API)
```

**추가 권장(코드 이전 시):** 기존 `sqlite-*-repository.ts`, `sqlite-seed.ts`, `seed-data.ts`는 `src/repositories/`, `src/seed/` 등으로 옮기거나 `src/`에 두되, **배럴에서만 외부에 노출**해 경계를 명확히 한다. (사용자가 제시한 최소 구조에 맞추되, 이전 작업 시 파일 배치만 합의하면 된다.)

---

## 패키지 식별자·의존성

- **이름:** `@workspace/db` (기존 `@workspace/domain`, `@workspace/infrastructure`와 동일 스코프).
- **런타임 의존성(예상):**
  - `drizzle-orm`
  - `@workspace/domain` — 리포지토리 구현체가 포트·브랜드 타입을 사용.
- **개발 의존성:** `drizzle-kit`, `@workspace/typescript-config`, `@workspace/eslint-config`, `typescript`, `@types/bun` / `bun-types` 등 (기존 `infrastructure`와 유사).
- **peer/엔진:** Bun 1.3.x — `bun:sqlite` 및 API 테스트 환경과 일치.

`drizzle.config.ts`는 `schema` 경로·SQLite DB 파일 경로(로컬/CI)를 읽도록 두고, **마이그레이션 산출물**은 `packages/db` 내부(예: `drizzle/` 폴더)에 두는 것을 권장한다.

---

## 의존성 방향 (모노레포 규칙 준수)

```
apps/api  →  @workspace/application, @workspace/db (또는 infrastructure가 db를 래핑하는 경우만)
@workspace/db  →  @workspace/domain
@workspace/infrastructure  →  (DB 제거 후) domain만 또는 제거/축소
```

- **UI / application이 `db`의 스키마 세부에 직접 의존하지 않도록** 공개 표면은 `index.ts`로 제한한다.
- **도메인 패키지는 `db`에 의존하지 않는다.**

---

## 단계별 실행 계획

### 1. 스캐폴딩

- `packages/db` 생성, `package.json`의 `exports`로 `src/index.ts` 진입점 지정.
- `tsconfig.json`은 `@workspace/typescript-config/base.json` 확장, `compilerOptions.types`에 `bun-types`(및 필요 시 vitest) 포함.
- 루트 `package.json` 워크스페이스는 이미 `packages/*`이므로 **추가 설정 불필요**.
- `turbo`/`test`/`typecheck` 스크립트에 `@workspace/db` 필터 추가 검토.

### 2. Drizzle 스키마로 옮기기

- `sqlite-database.ts`의 `createSchema` DDL을 **`src/schema/*.ts` 테이블 정의**로 이식한다.
  - `STRICT`, FK, 인덱스는 Drizzle 스키마·`index` 정의로 반영.
  - `drafts.body_jsonb` blob, `json()` 사용 쿼리 등 **기존 리포지토리 동작과 동일한 SQLite 타입**을 유지한다.
- better-auth가 관리하는 **`user` 테이블은 Drizzle 스키마에 포함할지 정책 결정**:
  - **권장:** 앱 테이블만 Drizzle으로 관리하고, `user`는 better-auth 마이그레이션에 맡긴다. FK는 기존과 같이 런타임에서만 검증되도록 유지(이미 그렇게 동작 중이면 변경 최소화).

### 3. 클라이언트 계층 (`src/client`)

- `openSqliteDatabase` / `closeSqliteDatabase`를 유지하되, **Drizzle `drizzle-orm/bun-sqlite`** 로 래핑한 `db` 인스턴스를 반환하는 팩토리 추가.
- `ensureSqliteJsonbSupport`는 **Drizzle raw 또는 동일 `Database`에 대한 사전 쿼리**로 유지(api 부트스트랩 계약 유지).
- 스키마 적용 방식 선택:
  - **A)** Drizzle Kit 마이그레이션으로 `createSchema` 대체  
  - **B)** 전환 초기에만 기존 `exec` DDL을 클라이언트 모듈에 두고, 이후 A로 이전  

### 4. 리포지토리·시드 이전

- `SqliteDraftRepository`, `SqlitePromptRepository`를 `packages/db`로 이동.
- raw SQL을 **단계적으로** `drizzle-orm` 쿼리 빌더로 치환(한 번에 전부가 아니라 파일/메서드 단위로 검증 가능).
- `seed-data.ts` / `seedDatabase`는 시드 전용 모듈로 이동; 삽입은 Drizzle `insert` + `onConflictDoUpdate` 등으로 대응.

### 5. `infrastructure` 정리

- SQLite 관련 export를 `@workspace/db`로 이전 후 `infrastructure`의 `index.ts`에서 제거.
- **패키지가 비게 되면:** `infrastructure` 제거 또는 향후 비-DB 인프라 전용으로 이름·범위 재정의(별도 결정).

### 6. 소비자 갱신

- `apps/api`: `@workspace/infrastructure` → `@workspace/db` import 변경 (`bootstrap.ts`, `scripts/db-reset.ts`, `scripts/seed.ts`).
- `apps/api/package.json` 의존성 갱신.
- `vitest.workspace.ts`: `packages/db/vitest.config.ts` 추가(필요 시).
- 루트 `test:unit` / `typecheck:phase-one` 필터에 `@workspace/db` 반영.

### 7. 검증

- `bun run typecheck`, `bun run test:unit`, API 관련 테스트.
- 로컬에서 `db:reset` / `seed` 후 부트스트랩·인증·초안/프롬프트 플로우 스모크.

---

## `types/` 디렉터리 역할

- Drizzle 테이블에서 **`$inferSelect` / `$inferInsert`** 를 재수출해 리포지토리 내부 매핑에 사용.
- 도메인 엔티티와 1:1이 아닌 **저장용 row 타입**만 두고, 도메인 변환은 리포지토리 구현체에서 유지한다.

---

## 리스크·주의사항

| 리스크 | 완화 |
|--------|------|
| better-auth와 Drizzle 마이그레이션 순서 충돌 | 부트스트랩 순서 유지: DB 열기 → `ensureAuthTables` → 앱 스키마/마이그레이션 |
| Drizzle Kit과 기존 파일 DB 경로 | `drizzle.config.ts`·환경변수로 경로 단일화 |
| 대규모 한 번에 치환 | 리포지토리별 또는 쿼리별 PR로 분할 |

---

## 완료 기준 (체크리스트)

- [ ] `packages/db`가 단독으로 `lint` / `typecheck` / `test`(해당 시) 통과
- [ ] `apps/api`가 `@workspace/db`만으로 DB·시드·리포지토리 생성 가능
- [ ] 기존 도메인 포트 시그니처 및 동작(특히 JSONB·저장 프롬프트·초안) 회귀 없음
- [ ] `drizzle-kit`으로 스키마 diff·마이그레이션 재현 가능(정책 A 채택 시)

---

## 참고: 이전 대상 파일 (현재 `infrastructure`)

- `sqlite-database.ts`, `sqlite-draft-repository.ts`, `sqlite-prompt-repository.ts`, `sqlite-seed.ts`, `seed-data.ts`, `sqlite-repositories.test.ts`

이 문서는 **구현 순서와 경계 합의용**이며, 실제 PR에서는 위 단계를 더 잘게 쪼개 적용하는 것을 권장한다.
