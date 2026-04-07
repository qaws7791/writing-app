# Web 앱 리팩토링 계획

> Mock 기반 프로토타입 → FSD 4-Layer 아키텍처 전환

## 현황 분석

### 현재 구조 (2-Layer)

```
src/
 ┣━ app/          ← Next.js App Router (page.tsx, client.tsx 혼재)
 ┣━ views/        ← 페이지 조립 + 비즈니스 로직 + Mock 데이터 혼합
 ┣━ foundation/ui ← 최소 (theme-provider, bottom-nav만 존재)
 ┗━ data/         ← journey-sessions.json (정적 커리큘럼)
```

### 주요 문제

| 영역 | 현재 상태 | 문제점 |
|------|-----------|--------|
| API 통신 | HTTP 클라이언트 없음 | `@workspace/api-client`, `@tanstack/react-query` 미연결 |
| Mock 데이터 | views/·app/ 내 하드코딩 | 5개 파일에 `MOCK_*` 상수 산재 |
| 상태 관리 | `useState` only | TanStack Query 미사용, 서버/클라이언트 상태 미분리 |
| foundation | `ui/` 2파일만 존재 | `api/`, `config/`, `lib/` 부재 |
| features | 미존재 | 기능별 캡슐화 없음, view에 모든 책임 집중 |
| domain | 미존재 | 비즈니스 타입·규칙이 views에 인라인 |
| 인증 | `better-auth` 미연결 | 설치만 됨, auth 클라이언트 미구성 |
| 환경 설정 | `@t3-oss/env-nextjs` 미사용 | 설치만 됨, env 접근 비정형 |

### 목표 구조 (FSD 4-Layer)

```
src/
 ┣━ app/          ← 라우팅·Provider (가장 얇은 진입점)
 ┣━ views/        ← 페이지 조립 (features + foundation 조합)
 ┣━ features/     ← 독립적 기능 단위 (components, hooks, repositories)
 ┣━ domain/       ← 비즈니스 엔티티 (타입·스키마·순수 서비스)
 ┗━ foundation/   ← 기술 인프라 (api, config, lib, ui)
```

---

## 리팩토링 단계

### Phase 1: foundation 인프라 구축

> 나머지 레이어가 의존할 기반 계층을 먼저 완성한다.

#### Step 1-1. `foundation/config/` — 환경 변수 중앙화

**범위:** `foundation/config/env.ts` 생성

- `@t3-oss/env-nextjs`로 환경 변수 스키마 정의 (API base URL, 공개 키 등)
- 타입 안전한 `env` 객체 export
- 기존 하드코딩된 URL 참조를 `env`로 교체

**산출물:**

- `foundation/config/env.ts`
- `foundation/config/index.ts`

**검증:** `bun run typecheck` 통과

---

#### Step 1-2. `foundation/api/` — HTTP 클라이언트 중앙화

**범위:** `@workspace/api-client`를 감싸는 중앙 HTTP 클라이언트 구성

- `foundation/api/client.ts`: `createApiClient()`를 호출해 싱글톤 인스턴스 생성, `env`에서 baseUrl 주입
- `foundation/api/index.ts`: `apiClient` export
- 인증 헤더, 에러 핸들링 등 횡단 관심사 설정

**산출물:**

- `foundation/api/client.ts`
- `foundation/api/index.ts`

**검증:** `bun run typecheck` 통과

---

#### Step 1-3. `foundation/ui/` — 공용 UI 레이어 정비

**범위:** 기존 `foundation/ui` 보강

- `index.ts` barrel export에 `BottomNav` 추가
- 공용 레이아웃 컴포넌트(있다면) 이동
- `@workspace/ui` re-export 전략 결정 및 적용

**산출물:**

- `foundation/ui/index.ts` 업데이트

**검증:** `bun run typecheck` 통과, 기존 import 경로 유지

---

#### Step 1-4. `foundation/lib/` — 공용 유틸리티

**범위:** views에 산재된 포맷팅·날짜 헬퍼를 추출

- `foundation/lib/format.ts`: 날짜 포맷, 단어 수 포맷 등
- `foundation/lib/index.ts`

**산출물:**

- `foundation/lib/format.ts`
- `foundation/lib/index.ts`

**검증:** `bun run typecheck` 통과

---

### Phase 2: 인증 연결

#### Step 2-1. Auth 클라이언트 구성

**범위:** `better-auth` 클라이언트 초기화 및 세션 관리

- `foundation/auth/client.ts`: `better-auth` 클라이언트 인스턴스 생성
- `foundation/auth/index.ts`: auth 유틸 export
- `app/layout.tsx`에 auth Provider 추가 (필요시)

**산출물:**

- `foundation/auth/client.ts`
- `foundation/auth/index.ts`
- `app/layout.tsx` 수정

**검증:** 테스트 계정(`test@example.com`)으로 로그인 흐름 동작 확인

---

### Phase 3: TanStack Query 인프라

#### Step 3-1. QueryClient Provider 구성

**범위:** TanStack Query 전역 설정

- `foundation/api/query-client.ts`: `QueryClient` 인스턴스 생성 및 기본 옵션 설정
- `foundation/api/query-provider.tsx`: `QueryClientProvider` 래퍼 컴포넌트
- `app/layout.tsx`에 `QueryProvider` 추가

**산출물:**

- `foundation/api/query-client.ts`
- `foundation/api/query-provider.tsx`
- `app/layout.tsx` 수정

**검증:** `bun run build` 통과, 런타임 에러 없음

---

### Phase 4: domain 레이어 도입

> 도메인 모델 문서(`docs/03-architecture/domain-model.md`) 기반으로 프론트엔드 도메인 타입을 정의한다.

#### Step 4-1. Writing 도메인

**범위:** Writing 관련 타입·스키마 분리

- `domain/writing/model/writing.types.ts`: `Writing`, `WritingSummary`, `WritingVersion` 타입 (branded ID)
- `domain/writing/model/writing.schema.ts`: Zod 스키마
- `domain/writing/index.ts`

**산출물:**

- `domain/writing/` 디렉토리

**검증:** `bun run typecheck` 통과

---

#### Step 4-2. Prompt 도메인

**범위:** WritingPrompt 관련 타입·스키마

- `domain/prompt/model/prompt.types.ts`: `WritingPrompt` 타입
- `domain/prompt/model/prompt.schema.ts`: Zod 스키마
- `domain/prompt/index.ts`

**산출물:**

- `domain/prompt/` 디렉토리

**검증:** `bun run typecheck` 통과

---

#### Step 4-3. Journey 도메인

**범위:** Journey·Session·Step 관련 타입·스키마

- `domain/journey/model/journey.types.ts`: `Journey`, `JourneySession`, `Step`, `UserJourneyProgress` 등
- `domain/journey/model/journey.schema.ts`: Zod 스키마
- `domain/journey/model/journey.constants.ts`: 스텝 유형, 진행 상태 상수
- `domain/journey/index.ts`

**산출물:**

- `domain/journey/` 디렉토리

**검증:** `bun run typecheck` 통과

---

#### Step 4-4. User 도메인

**범위:** User 관련 타입

- `domain/user/model/user.types.ts`: `User` 타입
- `domain/user/index.ts`

**산출물:**

- `domain/user/` 디렉토리

**검증:** `bun run typecheck` 통과

---

### Phase 5: features 레이어 도입

> 각 feature는 `components/`, `hooks/`, `repositories/`, `index.ts`로 구성한다. Mock 데이터를 실제 API 호출로 교체하는 것이 핵심 목표다.

#### Step 5-1. `features/writing/` — 글쓰기 기능

**범위:** 글 목록 조회·상세 조회·작성·수정 기능 캡슐화

- `features/writing/repositories/writing.repository.ts`: API 호출 함수 (`fetchWritings`, `fetchWriting`, `createWriting`, `updateWriting`)
- `features/writing/hooks/use-writings.ts`: TanStack Query 훅 (`useWritings`, `useWriting`)
- `features/writing/hooks/use-writing-mutation.ts`: Mutation 훅 (`useCreateWriting`, `useUpdateWriting`)
- `features/writing/index.ts`: Public API

**Mock 제거 대상:**

- `views/writings-list-view.tsx` → `MOCK_WRITINGS`
- `app/writings/[writingId]/client.tsx` → `MOCK_WRITING`
- `views/writing-editor-view.tsx` → `MOCK_PROMPTS` (writing 관련 부분)

**산출물:**

- `features/writing/` 디렉토리
- views에서 Mock 제거 및 훅 호출로 교체

**검증:** `bun run typecheck` 통과, `bun run build` 통과

---

#### Step 5-2. `features/prompt/` — 글감 기능

**범위:** 글감 목록·상세 조회 기능 캡슐화

- `features/prompt/repositories/prompt.repository.ts`: `fetchPrompts`, `fetchPrompt`
- `features/prompt/hooks/use-prompts.ts`: `usePrompts`, `usePrompt`
- `features/prompt/index.ts`

**Mock 제거 대상:**

- `app/prompts/[promptId]/client.tsx` → `MOCK_PROMPTS`, `MOCK_ESSAYS`

**산출물:**

- `features/prompt/` 디렉토리
- client.tsx에서 Mock 제거 및 훅 호출로 교체

**검증:** `bun run typecheck` 통과, `bun run build` 통과

---

#### Step 5-3. `features/journey/` — 여정 기능

**범위:** 여정 탐색·세션 진행 기능 캡슐화

- `features/journey/repositories/journey.repository.ts`: `fetchJourneys`, `fetchJourney`, `fetchSession`
- `features/journey/hooks/use-journeys.ts`: `useJourneys`, `useJourney`, `useSession`
- `features/journey/components/`: 여정 카드 등 feature-specific UI (views에서 추출)
- `features/journey/index.ts`

**데이터 전환 대상:**

- `data/journey-sessions.json` → API 기반 조회로 전환 (API 미준비 시 임시 유지)
- `views/journey-detail-view.tsx`의 `JOURNEY_DETAILS` 매핑 로직

**산출물:**

- `features/journey/` 디렉토리
- views 정비

**검증:** `bun run typecheck` 통과, `bun run build` 통과

---

#### Step 5-4. `features/profile/` — 프로필 기능

**범위:** 사용자 프로필 조회·설정 기능

- `features/profile/repositories/profile.repository.ts`: `fetchProfile`
- `features/profile/hooks/use-profile.ts`: `useProfile`
- `features/profile/index.ts`

**Mock 제거 대상:**

- `views/profile-view.tsx`의 하드코딩된 프로필 데이터

**산출물:**

- `features/profile/` 디렉토리
- `profile-view.tsx` 정비

**검증:** `bun run typecheck` 통과, `bun run build` 통과

---

### Phase 6: views 레이어 정비

#### Step 6-1. app/ → views 위임 일관성 확보

**범위:** `app/` 내 client.tsx 파일의 로직을 views/로 이동

- `app/writings/[writingId]/client.tsx`: Mock 데이터 + view 호출 → view만 호출
- `app/prompts/[promptId]/client.tsx`: Mock 데이터 + view 호출 → view만 호출
- `app/journeys/[journeyId]/client.tsx`: 데이터 fetch 로직 → features 훅 사용
- 각 `client.tsx`는 features 훅으로 데이터를 가져온 뒤 view에 전달하거나, view 자체에서 훅 호출

**원칙:**

- `page.tsx`는 view 렌더링만 수행
- `client.tsx`가 꼭 필요한 경우에만 유지 (params 추출 + view 위임)
- 비즈니스 로직·데이터 fetching은 features 훅에 위임

**산출물:**

- `app/` 내 client.tsx 정비
- 불필요한 client.tsx 제거 가능한 곳 정리

**검증:** `bun run build` 통과, 전체 페이지 라우팅 동작

---

#### Step 6-2. session-detail-view 리팩토링

**범위:** `views/session-detail-view/` 내부의 타입·로직을 적절한 레이어로 분배

- `types.ts`의 스텝 타입 정의 → `domain/journey/` 이동
- 세션 진행 상태 관리 로직 → `features/journey/hooks/` 이동
- view는 컴포넌트 조립만 담당하도록 정비

**산출물:**

- `views/session-detail-view/` 경량화
- domain·features에 관련 코드 배치

**검증:** `bun run typecheck` 통과, `bun run build` 통과

---

### Phase 7: 정리 및 검증

#### Step 7-1. 불용 코드 정리

**범위:**

- `data/journey-sessions.json`: API 전환 완료 시 제거 (API 미준비면 유지)
- `test-support/` 빈 디렉토리 정리
- 미사용 import 정리
- 미사용 의존성 검토 (`xstate`, `dexie` 등 사용 계획 없으면 제거 후보 기록)

**산출물:**

- 불용 파일·코드 제거

**검증:** `bun run lint`, `bun run typecheck`

---

#### Step 7-2. 전체 검증

**범위:**

- `bun run typecheck` 통과
- `bun run lint` 통과
- `bun run build` 통과
- `bun lefthook run pre-commit` 통과
- 주요 화면 수동 동작 확인

---

## 의존성 그래프 (단계 간)

```
Phase 1 (foundation)
  ├─ Step 1-1 config
  ├─ Step 1-2 api ───────── depends on 1-1
  ├─ Step 1-3 ui
  └─ Step 1-4 lib
       │
Phase 2 (auth)
  └─ Step 2-1 ──────────── depends on 1-1, 1-2
       │
Phase 3 (TanStack Query)
  └─ Step 3-1 ──────────── depends on 1-2
       │
Phase 4 (domain) ────────── independent, can start after Phase 1
  ├─ Step 4-1 writing
  ├─ Step 4-2 prompt
  ├─ Step 4-3 journey
  └─ Step 4-4 user
       │
Phase 5 (features) ──────── depends on Phase 3 + Phase 4
  ├─ Step 5-1 writing ───── depends on 4-1, 3-1
  ├─ Step 5-2 prompt ────── depends on 4-2, 3-1
  ├─ Step 5-3 journey ───── depends on 4-3, 3-1
  └─ Step 5-4 profile ───── depends on 4-4, 3-1
       │
Phase 6 (views) ─────────── depends on Phase 5
  ├─ Step 6-1 app cleanup
  └─ Step 6-2 session view
       │
Phase 7 (정리) ──────────── depends on Phase 6
  ├─ Step 7-1 cleanup
  └─ Step 7-2 validation
```

## 머지 전략

각 Step은 **독립적으로 머지 가능한 단위**로 설계되었다.

| 원칙 | 설명 |
|------|------|
| 빌드 무결성 | 각 Step 머지 후 `bun run build` 통과 |
| 점진적 전환 | Mock → API 전환은 feature 단위로 진행, 미전환 feature는 기존 Mock 유지 |
| 하위 호환성 | 기존 라우팅·화면은 각 단계에서 깨지지 않음 |
| 브랜치 전략 | `feat/web-refactor-{step}` (예: `feat/web-refactor-1-1-config`) |

## 참고 문서

- [프론트엔드 아키텍처 가이드](docs/04-engineering/frontend-architecture-guide.md)
- [HTTP 클라이언트 중앙화](docs/04-engineering/frontend/http-client-centralization.md)
- [API 호출 함수 분리](docs/04-engineering/frontend/api-call-function-separation.md)
- [API 경계와 DTO](docs/04-engineering/frontend/api-boundary-dto.md)
- [도메인 레이어](docs/04-engineering/frontend/domain-layer.md)
- [TanStack Query](docs/04-engineering/frontend/tanstack-query.md)
- [도메인 모델](docs/03-architecture/domain-model.md)
