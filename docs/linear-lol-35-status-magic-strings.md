# Linear LOL-35 상태 매직 스트링 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-35 상태 관련 하드코딩 매직 스트링`
- 조사 범위: 상태값 `active`, `archived`, `suspended`, `deleted`가 쓰이는 core DTO, DB schema, repository, API route, admin UI
- 목표: 상태 문자열이 중앙 정의 없이 흩어져 있어 오타와 계약 불일치 위험이 있는지 판단한다.

## 2026-06-15 변경 시작

- 별도 plan 문서는 만들지 않는다.
- 상태값의 단일 출처를 `packages/core`에 두고, core DTO, DB schema, repository, API route가 이를 참조하도록 정리한다.
- 테스트 fixture와 외부 계약 문서 성격의 OpenAPI enum은 이번 변경의 핵심 범위에서 제외한다.

## 판단

이슈는 타당하다. 다만 문서, 테스트 fixture, OpenAPI 정적 계약, select option의 HTML value까지 모두 같은 우선순위의 문제로 보면 범위가 과하다.

타당한 근거는 다음과 같다.

- 콘텐츠 상태는 `packages/db/src/schema/content.schema.ts`의 `contentStatusValues`, `packages/core/src/content/content.dto.ts`의 `contentStatusSchema`, `packages/core/src/admin/admin.dto.ts`의 `adminContentStatusSchema`에 각각 정의되어 있다.
- 사용자 상태도 `packages/db/src/schema/learning.schema.ts`의 `learnerProfileStatusValues`, `packages/core/src/admin/admin.dto.ts`의 `adminUserStatusSchema`, `apps/api/src/auth/session.ts`의 `LearnerAccountStatus`에 중복 정의되어 있다.
- `packages/db/src/repositories/admin.repository.ts`는 `"active"`, `"archived"`, `"deleted"`를 SQL 조건, 메모리 필터, 생성 기본값, seed reset, 삭제 상태 전환에 반복해서 사용한다. 이 파일은 오타가 실제 조회 결과나 변경 동작을 바꿀 수 있는 핵심 위험 지점이다.
- `apps/api/src/routes/route-helpers.ts`와 여러 API route는 활성 계정 검증을 `session.user.status !== "active"` 형태로 직접 비교한다.
- `docs/micro-level-code-quality.md`는 커리큘럼 노드 상태값이 `curriculumNodeStatuses`와 `curriculumNodeStatusSchema`로 관리된다고 적지만, 현재 코드베이스에는 해당 심볼이 없다. 문서와 구현도 불일치한다.

## 범위 조정

우선 정리 대상은 런타임 동작을 결정하는 도메인 상태값이다.

- 콘텐츠 상태: `active`, `archived`
- 학습자 계정 상태: `active`, `suspended`, `deleted`
- 레슨 진행 상태: `in_progress`, `completed`

다음 항목은 별도 판단이 필요하다.

- 테스트 fixture의 명시적 상태값은 읽기 쉬움을 위해 남길 수 있다.
- OpenAPI enum은 외부 계약 문서라서 source schema에서 생성하거나, 생성하지 않는다면 중복을 감수하되 검증 테스트로 묶는 편이 낫다.
- admin UI의 `<option value="active">` 같은 값은 URL/API 계약 경계라서 상수화할 수 있지만, 사용자 표시 라벨과 혼동하지 않게 다뤄야 한다.

## 권장 변경

- `packages/core`에 상태값 배열과 Zod schema를 공개 API로 둔다.
- DB schema는 같은 배열을 import해 Drizzle enum에 사용한다.
- repository와 route는 `"active"` 같은 문자열 대신 `contentStatuses.active`, `learnerAccountStatuses.active`처럼 이름이 있는 상수를 사용한다.
- `admin.dto.ts`의 update-user 상태처럼 전체 사용자 상태의 부분집합은 원본 상태 배열에서 명시적으로 파생한다.
- `docs/micro-level-code-quality.md`는 실제 심볼명 또는 현재 구현 상태에 맞게 갱신한다.

## 검토 결과

`LOL-35`는 실제 개선 가치가 있는 이슈다. 특히 `packages/db/src/repositories/admin.repository.ts`와 API 활성 계정 검증 경계는 먼저 정리할 만하다. 단, 모든 리터럴을 기계적으로 제거하는 작업으로 확대하지 말고, 도메인 상태 계약과 런타임 분기에 한정해서 작은 diff로 진행하는 편이 안전하다.

## 2026-06-15 완료

- `packages/core/src/status.ts`에 콘텐츠 상태, 학습자 계정 상태, 운영자가 변경 가능한 학습자 상태, 레슨 진행 저장 상태의 값 배열과 Zod schema를 추가했다.
- core DTO는 새 상태 schema를 참조하도록 변경했다.
- DB schema는 같은 상태값 배열을 Drizzle enum과 기본값에 사용한다.
- DB repository, seed, API route의 런타임 분기와 쓰기 값은 이름 있는 상태 상수를 참조하도록 변경했다.
- admin-api route와 admin 화면의 API 입력 타입/비교도 core 상태 타입과 상수를 사용한다.
- web 앱은 `@workspace/core` 직접 의존성이 없으므로 OpenAPI/generated 계약 경계의 상태 타입과 fallback fixture 리터럴은 유지했다.
- OpenAPI 정적 enum과 테스트 fixture의 리터럴은 이번 변경 범위에서 제외했다.

## 검증

- `bun --filter @workspace/core test`
- `bun --filter @workspace/db test`
- `bun --filter @workspace/api test`
- `bun --filter @workspace/admin-api test`
- `bun --filter @workspace/admin test`
- `bun --filter @workspace/web test src/features/courses/courses-page.test.tsx src/features/courses/course-api-mappers.test.ts src/features/profile/profile-api-mappers.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/admin-api typecheck`
- `bun --filter @workspace/admin typecheck`
- `bun --filter @workspace/web typecheck`
- `bun --filter @workspace/core lint`
- `bun --filter @workspace/db lint`
- `bun --filter @workspace/api lint`
- `bun --filter @workspace/admin-api lint`
- `bun --filter @workspace/admin lint`
- `bun --filter @workspace/web lint`

참고: `bun --filter @workspace/web test` 전체 실행은 기존 OAuth redirect URL 기대값 불일치로 2개 테스트가 실패한다. 실제 호출은 `http://localhost:4000/api/auth/...`이고 테스트 기대값은 `/api/auth/...`다. 이번 변경과 관련된 course/profile mapper 및 courses page 테스트는 별도로 통과했다.
