---
title: 글숨 Labs 피벗 작업 계획
description: geulsoom_labs_prd_v1_1_calm.md 기반 전체 프로젝트 피벗을 추적하기 위한 실행 체크리스트입니다.
---

상태: in-progress
기준 PRD: repository root의 `geulsoom_labs_prd_v1_1_calm.md`
작성일: 2026-05-05
최종 갱신일: 2026-05-05

작업 로그:

- 2026-05-05: `2. 코드 절단선 확정`의 삭제 대상 제거 작업을 시작했다.
- 2026-05-05: 확정된 삭제 대상 모듈을 제거하고, 유지 경계가 typecheck와 unit test를 통과하도록 연결부를 정리했다.

## 목표

글숨 Labs 피벗의 목표는 기존 글필의 여정 중심 학습 플랫폼을 새 PRD의 첫 문장 루프 중심 제품으로 바꾸는 것이다.

핵심 루프는 다음 하나로 제한한다.

> 사진 업로드 → 표현 재료 선택 → 문장 씨앗 조립 → 한 문장 작성 → 표현 카드 저장

MVP 성공 조건은 신규 사용자가 5~10분 안에 AI가 대신 쓴 문장이 아니라 자신이 직접 작성한 한 문장을 문체 정원에 저장하는 것이다.

## 원칙

- [ ] 기존 런타임 골격은 유지하고 제품 도메인만 초기화한다.
- [ ] MVP는 첫 문장 루프 검증에 필요한 기능만 포함한다.
- [ ] 한 화면에는 사용자 의도 하나와 Primary CTA 하나만 둔다.
- [ ] AI는 대필자가 아니라 표현 재료, 문장 씨앗, 수정 힌트 제공자로 제한한다.
- [ ] 모든 저장 자산은 출처와 사용자 동의를 가진다.
- [ ] 장면 원정, 문장 아케이드, 리듬룸, 문장 지문은 P1 이후로 미룬다.

## 유지 범위

- [ ] Bun/Turbo 모노레포 구조 유지
- [ ] `apps/api` Hono 서버, OpenAPI 라우팅, env, auth/session, 로깅, rate limit 기반 유지
- [ ] `apps/web` Next.js, TanStack Query, API client, auth/navigation foundation 유지
- [ ] `packages/ui` shadcn/base-ui 컴포넌트 유지
- [ ] `packages/config`, `packages/api-client`, `packages/logging`, `packages/storage` 유지
- [ ] `packages/core` shared brand, error, schema, transaction 패턴 유지
- [ ] `packages/database` 연결, 테스트 DB, 트랜잭션 유틸, Better Auth 스키마 유지

## 초기화 범위

- [ ] 기존 `journeys`, `sessions`, `progress`, `prompts` 도메인 제거
- [ ] 기존 여정/세션/스텝/글감 중심 DB 스키마 제거
- [ ] 기존 seed 데이터 제거
- [ ] 홈/탭/상세 화면의 기존 정보 구조 제거
- [ ] AI 대필 또는 긴 글 피드백 중심 API 제거
- [ ] 진행률, 배지, 스트릭, 학습 대시보드 제거
- [ ] 기존 글필 문서 중 현재 기준과 충돌하는 문서를 archive 또는 replaced 상태로 정리

## 1. 문서 피벗

- [x] `docs/00-prd/v3.md`에 새 PRD를 canonical PRD로 등록한다.
- [x] `docs/index.md`에서 현행 PRD를 v3로 갱신한다.
- [x] `docs/01-product/problem.md`를 빈 화면, 관찰의 언어화, AI 대필로 인한 자기 언어 상실 문제로 갱신한다.
- [x] `docs/01-product/persona.md`를 사진 기반 첫 문장 사용자 중심으로 갱신한다.
- [x] `docs/01-product/principles.md`를 Calm Mode, 사용자 문장 소유권, 선택 우선 원칙으로 갱신한다.
- [x] `docs/02-design/information-architecture.md`를 홈/사진/정원/더보기 구조로 갱신한다.
- [x] `docs/02-design/design-principles.md`를 Calm Mode와 화면 복잡도 예산 기준으로 갱신한다.
- [x] `docs/02-design/screens` 하위 기존 여정 화면 명세를 archive 또는 새 화면 명세로 교체한다.
- [x] `docs/03-architecture/domain-model.md`를 새 도메인 모델로 갱신한다.
- [x] `docs/03-architecture/api-overview.md`를 새 MVP API 기준으로 갱신한다.
- [x] `docs/04-engineering/README.md`의 현재 상태를 글숨 Labs 피벗 상태로 갱신한다.

## 2. 코드 절단선 확정

- [x] 삭제 대상 모듈 목록을 확정한다.
- [x] 유지 대상 shared 모듈 목록을 확정한다.
- [x] `apps/api/src/routes/index.ts`에서 제거할 라우트 그룹을 확정한다.
- [x] `apps/web/src/features`에서 제거할 feature 그룹을 확정한다.
- [x] `apps/web/src/views`에서 제거할 view 그룹을 확정한다.
- [x] `packages/core/src/modules`에서 새 모듈 이름과 export 경계를 확정한다.
- [x] `packages/database/src/schema`에서 유지할 auth 스키마와 제거할 제품 스키마를 구분한다.

### 2.1 삭제 대상 모듈

다음 모듈은 기존 여정 중심 제품 표면이므로 새 MVP 구현 전에 삭제 또는 같은 경로의 replaced 구현으로 교체한다.

- `apps/api/src/routes/journeys`
- `apps/api/src/routes/sessions`
- `apps/api/src/routes/prompts`
- `apps/api/src/routes/writings`
- `apps/api/src/routes/ai`의 기존 긴 글 피드백, 문장 비교 라우트
- `apps/api/src/runtime/modules/journeys.ts`
- `apps/api/src/runtime/modules/sessions.ts`
- `apps/api/src/runtime/modules/prompts.ts`
- `apps/api/src/runtime/modules/writings.ts`
- `packages/core/src/modules/journeys`
- `packages/core/src/modules/progress`
- `packages/core/src/modules/prompts`
- `packages/core/src/modules/writings`
- `packages/core/src/modules/ai-feedback`
- `packages/database/src/repository/journey.repository.ts`
- `packages/database/src/repository/progress.repository*.ts`
- `packages/database/src/repository/writing*.repository.ts`
- `packages/database/src/seed-data/journeys.ts`
- `packages/database/src/seed-data/writing-prompts.ts`
- `apps/web/src/app/(tabs)/journeys`
- `apps/web/src/app/journeys`
- `apps/web/src/app/prompts`
- `apps/web/src/app/writings`
- `apps/web/src/data/journey-sessions.json`

### 2.2 유지 대상 shared 모듈

다음 모듈은 제품 도메인과 분리된 런타임 골격이므로 유지한다. 단, 응답 모델이나 문구가 기존 글필 도메인에 묶인 경우 해당 파일만 새 도메인으로 갱신한다.

- `packages/core/src/shared/brand`
- `packages/core/src/shared/error`
- `packages/core/src/shared/pagination`
- `packages/core/src/shared/transaction`
- `packages/core/src/shared/utilities/application-errors.ts`
- `packages/core/src/modules/auth`
- `packages/core/src/modules/users`
- `packages/config`
- `packages/logging`
- `packages/storage`
- `packages/ui`
- `packages/api-client`의 생성 흐름
- `packages/database/src/connection`
- `packages/database/src/testing`
- `packages/database/src/transaction`
- `apps/api/src/auth`
- `apps/api/src/http`
- `apps/api/src/middleware`
- `apps/api/src/observability`
- `apps/api/src/rate-limit`
- `apps/web/src/foundation`

`packages/core/src/shared/schema/writing-content-schema.ts`와 `packages/core/src/shared/utilities/writing-content-utilities.ts`는 긴 글 작성 도메인에 묶여 있으므로 shared 유지 대상에서 제외하고 문장 단위 모델 구현 시 삭제한다.

### 2.3 API 라우트 절단선

`apps/api/src/routes/index.ts`는 다음 라우트만 유지한다.

- `getHealth`
- `authHandler`
- `getMe`
- `getHome`
- `getUserProfile`

다음 라우트 그룹은 제거한다.

- `promptRoutes()`
- `journeyRoutes()`
- `sessionRoutes()`
- `writingRoutes()`
- 기존 `aiRoutes({ rateLimitBackend })`

새 MVP 라우트 그룹은 다음 이름으로 추가한다.

- `sceneRoutes()`
- `materialRoutes()`
- `materialSelectionRoutes()`
- `sentenceSeedRoutes()`
- `sentenceDraftRoutes()`
- `gardenCardRoutes()`

AI 호출은 공개 `/ai/*` 라우트로 두지 않고, 장면 분석, 씨앗 생성, 문장 힌트 use case 내부 포트로 연결한다.

### 2.4 Web feature 절단선

`apps/web/src/features`에서 다음 feature 그룹을 제거한다.

- `journeys`
- `sessions`
- `prompts`
- `writings`
- `ai`

다음 feature 그룹은 유지하되 새 홈/프로필 요구사항에 맞게 응답 매핑만 갱신한다.

- `home`
- `users`

새 MVP feature 그룹은 다음 이름으로 추가한다.

- `scenes`
- `materials`
- `sentence-seeds`
- `sentence-drafts`
- `garden`

### 2.5 Web view 절단선

`apps/web/src/views`에서 다음 view를 제거한다.

- `journey-archive-view.tsx`
- `journey-detail-view.tsx`
- `journeys-view.tsx`
- `my-journeys-view.tsx`
- `prompt-archive-view.tsx`
- `prompt-bottom-sheet.tsx`
- `prompt-detail-view.tsx`
- `writing-entry-view.tsx`
- `writing-editor-view.tsx`
- `writings-list-view.tsx`
- `session-detail-view`
- `writing-editor`

다음 view는 유지하되 새 정보 구조로 다시 작성한다.

- `home-view.tsx`
- `profile-view.tsx`

새 MVP view는 다음 이름으로 추가한다.

- `scene-capture-view.tsx`
- `material-basket-view.tsx`
- `sentence-seed-composer-view.tsx`
- `sentence-editor-view.tsx`
- `garden-view.tsx`

### 2.6 Core 모듈 경계

`packages/core/src/modules`의 새 export 경계는 다음으로 확정한다.

- `scenes`: `Scene`, 사진 보관 상태, 분석 상태, 장면 생성, 사진 삭제, 장면 조회 use case, `SceneRepository`, `ScenePhotoStoragePort`
- `materials`: `MaterialNode`, `MaterialSelection`, 재료 조회, 수동 재료 추가, 선택/버림/정렬 use case, `MaterialRepository`, `SceneMaterialAnalyzerPort`
- `sentence-seeds`: `SentenceSeed`, 씨앗 생성/조회 use case, `SentenceSeedRepository`, `SentenceSeedGeneratorPort`
- `sentence-drafts`: `SentenceDraft`, 한 문장 저장 전 초안 생성/수정, 힌트 요청 use case, `SentenceDraftRepository`, `SentenceHintGeneratorPort`
- `garden`: `GardenCard`, `Provenance`, 카드 저장/목록/상세/삭제 use case, `GardenRepository`
- `home`: 홈 snapshot을 시작 카드 3개, 최근 작업 1개, 정원 요약 1개로 재정의
- `auth`: Better Auth 응답 스키마 유지
- `users`: 사용자 프로필 스키마 유지

모든 새 모듈은 `index.ts`에서 type, schema, error, port, use case를 명시적으로 export한다. 기존 `ai-feedback` 모듈은 독립 도메인으로 유지하지 않고 `materials`, `sentence-seeds`, `sentence-drafts`의 포트로 흡수한다.

### 2.7 Database 스키마 절단선

`packages/database/src/schema/auth.ts`는 유지한다. 이 파일의 `user`, `account`, `session`, `verification`은 Better Auth 소유 스키마로 남긴다.

다음 제품 스키마는 제거한다.

- `journeys.ts`
- `journey-sessions.ts`
- `steps.ts`
- `saved-prompts.ts`
- `user-journey-progress.ts`
- `user-session-progress.ts`
- `user-session-step-ai-state.ts`
- `writing-prompts.ts`
- `writings.ts`
- `writing-versions.ts`

새 제품 스키마는 다음 파일로 추가한다.

- `scenes.ts`
- `material-nodes.ts`
- `material-selections.ts`
- `sentence-seeds.ts`
- `sentence-seed-materials.ts`
- `sentence-drafts.ts`
- `garden-cards.ts`
- `provenance.ts`
- `photo-consents.ts`

`packages/database/src/schema/index.ts`는 auth export와 새 제품 스키마 export만 포함한다.

### 2.8 삭제 완료 결과

2026-05-05 기준 다음 제거 작업을 완료했다.

- 기존 `journeys`, `sessions`, `prompts`, `writings`, `ai-feedback` core 모듈을 삭제했다.
- 기존 journey/session/prompt/writing/feedback API 라우트 그룹을 삭제했다.
- 기존 Web journey/session/prompt/writing feature, route, view 그룹을 삭제했다.
- 기존 제품 DB schema, repository, seed-data 구현을 삭제하고 auth schema만 남겼다.
- 홈과 프로필은 삭제된 제품 카운터와 라우트에 의존하지 않도록 첫 문장 루프 초기 상태로 축소했다.
- OpenAPI spec과 `packages/api-client` 타입을 삭제 후 공개 API 기준으로 재생성했다.

검증:

- `bun run typecheck`: 통과
- `bun run test:unit`: 통과
- 변경 범위 lint: `api`, `web`, `@workspace/core`, `@workspace/database`, `@workspace/api-client`, `@workspace/ai` 통과
- `bun run lint`: Storybook story의 기존 unused import 오류로 실패. 삭제 작업 범위 밖의 `apps/storybook/src/stories/components/*` 파일에서 발생한다.

## 3. 데이터 모델 재설계

- [ ] `scene` 모델을 정의한다.
- [ ] `material-node` 모델을 정의한다.
- [ ] `material-selection` 모델을 정의한다.
- [ ] `sentence-seed` 모델을 정의한다.
- [ ] `sentence-draft` 모델을 정의한다.
- [ ] `garden-card` 모델을 정의한다.
- [ ] `provenance` 모델을 정의한다.
- [ ] `safety-consent` 또는 사진 저장 동의 필드를 정의한다.
- [ ] 사진 삭제와 카드 출처 보존 정책을 문서화한다.
- [ ] 기존 제품 테이블 마이그레이션 폐기 여부를 결정한다.
- [ ] 새 Drizzle 초기 마이그레이션을 생성한다.

## 4. Core 도메인 구현

- [ ] `packages/core/src/modules/scenes`를 만든다.
- [ ] `packages/core/src/modules/materials`를 만든다.
- [ ] `packages/core/src/modules/sentence-seeds`를 만든다.
- [ ] `packages/core/src/modules/garden`을 만든다.
- [ ] 각 모듈에 brand type을 적용한다.
- [ ] 각 모듈에 real type 기반 schema를 적용한다.
- [ ] vague `{ success: boolean }` 형태 없이 명시적 result variant를 사용한다.
- [ ] 사진 분석 실패 시 직접 재료 입력으로 이어지는 use case를 정의한다.
- [ ] 저장 실패 시 로컬 임시 저장 또는 재시도 정책의 서버 경계를 정의한다.
- [ ] core use case 단위 테스트를 작성한다.

## 5. Database 구현

- [ ] auth 테이블은 유지한다.
- [ ] 기존 journey/session/prompt/writing 테이블을 제거한다.
- [ ] `scenes` 테이블을 추가한다.
- [ ] `material_nodes` 테이블을 추가한다.
- [ ] `material_selections` 테이블을 추가한다.
- [ ] `sentence_seeds` 테이블을 추가한다.
- [ ] `sentence_drafts` 테이블을 추가한다.
- [ ] `garden_cards` 테이블을 추가한다.
- [ ] repository mapper와 parser를 새 스키마 기준으로 작성한다.
- [ ] repository 테스트를 작성한다.
- [ ] seed는 MVP 데모에 필요한 최소 데이터만 남긴다.

## 6. API 구현

- [ ] 기존 journeys route를 제거한다.
- [ ] 기존 sessions route를 제거한다.
- [ ] 기존 prompts route를 제거한다.
- [ ] 기존 writings route를 새 sentence/garden 흐름으로 대체한다.
- [ ] `POST /scenes`를 구현한다.
- [ ] `GET /scenes/:sceneId/materials`를 구현한다.
- [ ] `POST /scenes/:sceneId/material-selections`를 구현한다.
- [ ] `POST /sentence-seeds`를 구현한다.
- [ ] `POST /garden-cards`를 구현한다.
- [ ] `GET /garden-cards`를 구현한다.
- [ ] `DELETE /scenes/:sceneId/photo`를 구현한다.
- [ ] OpenAPI spec을 갱신한다.
- [ ] `packages/api-client`를 재생성한다.

## 7. AI 경계 구현

- [ ] 사진에서 재료 노드 3~5개를 빠르게 반환하는 adapter contract를 정의한다.
- [ ] 전체 레이어 데이터는 10초 안에 준비되는 비동기 흐름으로 분리한다.
- [ ] 인물 식별과 민감 속성 추론 금지 규칙을 system prompt와 schema에 반영한다.
- [ ] 선택 재료 3개 이상으로 sentence seed 1~3개를 생성한다.
- [ ] 한 문장 에디터의 AI 피드백은 수정 힌트 최대 3개로 제한한다.
- [ ] AI가 완성 긴 글을 기본 출력하지 않도록 API contract를 제한한다.
- [ ] AI 실패 시 사용자가 직접 재료를 입력할 수 있게 한다.

## 8. Web 정보 구조 구현

- [ ] 모바일 하단 탭을 홈/사진/정원/더보기로 바꾼다.
- [ ] 홈은 시작 카드 3개, 최근 작업 1개, 정원 요약 1개로 제한한다.
- [ ] 사진 글감 empty state를 구현한다.
- [ ] 사진 글감 analyzing state를 구현한다.
- [ ] 사진 글감 ready/calm mode를 구현한다.
- [ ] 접힌 재료 바구니를 구현한다.
- [ ] 상세 재료 바구니를 명시적 열기 동작으로 구현한다.
- [ ] 문장 씨앗 조합기를 구현한다.
- [ ] 한 문장 에디터를 구현한다.
- [ ] 문체 정원 Lite 목록을 구현한다.
- [ ] 사진 삭제와 저장 동의 UI를 구현한다.

## 9. Calm UX 검증

- [ ] 각 창작 화면의 Primary CTA가 하나인지 확인한다.
- [ ] 기본 화면에서 동시에 보이는 사진 오버레이 칩이 5개 이하인지 확인한다.
- [ ] 확장 상태에서도 칩이 7개 이하인지 확인한다.
- [ ] 우측 패널과 하단 패널이 동시에 열리지 않도록 확인한다.
- [ ] 팁, 최근 업로드, 빠른 액션, 보상, 조합기가 동시에 노출되지 않도록 확인한다.
- [ ] 사용자가 화면 진입 후 5초 안에 다음 행동을 이해할 수 있는지 자체 점검한다.
- [ ] 모바일 viewport에서 텍스트 겹침이 없는지 확인한다.

## 10. 테스트와 검증

- [ ] `bun run typecheck`를 통과시킨다.
- [ ] `bun run lint`를 통과시킨다.
- [ ] `bun run test:unit`을 통과시킨다.
- [ ] `bun run test:e2e`에 첫 문장 루프 시나리오를 추가한다.
- [ ] 사진 업로드 mock → 재료 3개 선택 → 씨앗 생성 → 문장 저장 → 정원 카드 확인 E2E를 통과시킨다.
- [ ] `bun lefthook run pre-commit`을 통과시킨다.

## 11. 릴리스 전 정리

- [ ] README를 글숨 Labs 기준으로 갱신한다.
- [ ] `.env` 문서를 새 AI/스토리지 요구사항 기준으로 갱신한다.
- [ ] `docs/06-operations/security.md`에 사진 저장, 삭제, 민감 추론 금지 정책을 반영한다.
- [ ] `docs/06-operations/operational-risks.md`에 AI 분석 실패, 사진 개인정보, 저장 실패 리스크를 반영한다.
- [ ] 제거된 기존 기능 문서는 `docs/99-archive`로 이동하거나 replaced 상태를 명시한다.
- [ ] 미구현 P1/P2 기능 목록을 roadmap에 남긴다.

## 보류 항목

- [ ] 장면 원정 Lite
- [ ] 문장 아케이드
- [ ] 리듬룸 Lite
- [ ] 문장 지문 Lite
- [ ] 공개 공유
- [ ] 교육자 모드
- [ ] 독자 극장
- [ ] 긴 글 퇴고 실험실

## 미확정 사항

- [ ] 기존 개발 데이터 삭제가 허용되는지 확인한다.
- [ ] 사진 원본을 서버에 저장할지, 분석 후 즉시 삭제할지 결정한다.
- [ ] MVP에서 실제 이미지 AI 분석을 바로 붙일지, mock adapter로 첫 루프를 먼저 검증할지 결정한다.
- [ ] 로그인 전 체험을 허용할지 결정한다.
- [ ] 문체 정원 카드의 로컬 우선 저장 범위를 결정한다.

## 완료 기준

- [ ] 문서 기준이 글숨 Labs PRD v1.1로 전환되어 있다.
- [ ] 기존 여정 중심 제품 표면이 제거되어 있다.
- [ ] 첫 문장 루프가 웹에서 end-to-end로 작동한다.
- [ ] 저장된 문장 카드가 출처와 작성자 구분 정보를 가진다.
- [ ] 사진 삭제와 민감 추론 금지 정책이 코드와 문서에 반영되어 있다.
- [ ] typecheck, lint, unit test, 핵심 E2E가 통과한다.
