# 콘텐츠 저장소 Result 구현 계획

> **에이전트 작업자 필수 하위 skill:** 이 계획을 실행할 때는 `superpowers:executing-plans`를 사용한다. 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** `ContentRepository` 포트가 `unknown` 원시값을 반환하지 않고, 검증된 DTO 또는 명시적 실패 Result만 반환하도록 바꾼다.

**아키텍처:** DB adapter는 `JSON.parse` 직후 DTO schema를 검증하고, Core 포트 밖으로는 검증된 읽기 모델만 내보낸다. Content service는 저장소 실패 상태를 서비스 오류 DTO로 변환하고, 플레이 가능한 레슨 불변식만 검증한다.

**기술 스택:** TypeScript, Zod, Vitest, Drizzle SQLite, Bun workspace.

---

### 작업 1: Repository 계약을 Result 기반으로 고정

**파일:**

- 수정: `packages/core/src/content/content.repository.ts`
- 수정: `packages/core/src/content/content.service.test.ts`
- 수정: `packages/db/src/repositories/drizzle-content.repository.test.ts`
- 수정: `docs/codebase-improvement-progress.md`

- [x] **단계 1: 시작 문서 갱신**

`docs/codebase-improvement-progress.md`에 `DATA-11` 시작 상태와 조사 방향을 추가한다.

- [x] **단계 2: 실패 테스트 작성**

`content.service.test.ts`의 invalid DTO fixture를 Repository Result 실패로 바꿀 준비를 하고, `drizzle-content.repository.test.ts`에서 손상된 JSON이 `findLesson()`의 `invalid-content` 결과로 직접 반환되는 테스트를 작성한다.

- [x] **단계 3: RED 확인**

실행: `bun --filter @workspace/db test src/repositories/drizzle-content.repository.test.ts`

기대 결과: `findLesson()`이 아직 raw lesson 또는 `undefined`를 반환하므로 새 Result 기대값에서 실패한다.

### 작업 2: Core와 DB 구현 변경

**파일:**

- 수정: `packages/core/src/content/content.repository.ts`
- 수정: `packages/core/src/content/content.service.ts`
- 수정: `packages/core/src/content/content.service.test.ts`
- 수정: `packages/db/src/repositories/drizzle-content.repository.ts`
- 수정: `packages/db/src/repositories/drizzle-content.repository.test.ts`

- [x] **단계 1: Repository Result 타입 추가**

`ContentRepositoryListResult<TValue>`와 `ContentRepositoryFindResult<TValue>`를 추가하고, `ContentRepository` 메서드 반환 타입을 DTO 기반 Result로 바꾼다.

- [x] **단계 2: Content service에서 DTO 재파싱 제거**

Repository Result status를 서비스 Result로 변환하고, `getLesson()`에는 step order와 playable lesson 검증만 남긴다.

- [x] **단계 3: Drizzle adapter에서 DTO 검증 수행**

각 메서드가 `safeParse` 성공 시 `ok`, 조회 실패 시 `not-found`, schema 실패 시 `invalid-content`, 예외 발생 시 `unavailable`을 반환하도록 바꾼다.

- [x] **단계 4: GREEN 확인**

실행: `bun --filter @workspace/core test src/content/content.service.test.ts`

실행: `bun --filter @workspace/db test src/repositories/drizzle-content.repository.test.ts`

기대 결과: 두 테스트 명령이 성공한다.

### 작업 3: 완료 문서와 최종 검증

**파일:**

- 수정: `docs/codebase-improvement-progress.md`

- [x] **단계 1: 완료 문서 갱신**

`DATA-11` 상태를 완료로 바꾸고 변경 내용과 검증 명령을 기록한다.

- [x] **단계 2: 최종 검증**

실행: `bun --filter @workspace/core typecheck`

실행: `bun --filter @workspace/db typecheck`

실행: `bun --filter @workspace/core lint`

실행: `bun --filter @workspace/db lint`

실행: `bun prettier --check packages/core/src/content/content.repository.ts packages/core/src/content/content.service.ts packages/core/src/content/content.service.test.ts packages/db/src/repositories/drizzle-content.repository.ts packages/db/src/repositories/drizzle-content.repository.test.ts docs/codebase-improvement-progress.md docs/superpowers/plans/2026-05-31-content-repository-result.md`

실행: `git diff --check`

- [x] **단계 3: 커밋**

한국어 커밋 메시지:

```text
content repository 결과 타입을 명시화

- 저장소 포트가 검증된 DTO 또는 명시적 실패 Result를 반환하게 변경
- DB adapter에서 콘텐츠 JSON 검증 실패를 invalid-content로 분류
```
