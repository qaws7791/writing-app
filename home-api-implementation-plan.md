# 홈 탭 API 구현 계획 (web?tab=home)

> 목표: `/home?tab=home` 화면에서 사용하는 두 API(오늘의 추천 글감, 진행 중인 여정)를 백엔드와 연결한다.

## 현황 분석

### 백엔드 (완료)

| 항목 | 상태 | 위치 |
|------|------|------|
| `GET /home` 라우트 | ✅ 완료 | `apps/api/src/routes/home/get-home.ts` |
| `makeGetHomeUseCase` | ✅ 완료 | `packages/core/src/modules/home/use-cases/get-home.ts` |
| `PromptRepository.getDailyPrompt` | ✅ 완료 | `packages/database/src/repository/writing-prompt.repository.ts` |
| `ProgressRepository.listActiveJourneys` | ✅ 완료 | `packages/database/src/repository/progress.repository.ts` |
| OpenAPI 스키마 (`/home` 경로) | ✅ 완료 | `packages/api-client/src/schema.d.ts` |

### 프론트엔드 (미구현)

| 항목 | 상태 | 문제 |
|------|------|------|
| API 클라이언트 | ❌ 미연결 | `@workspace/api-client` 미사용 |
| QueryClientProvider | ❌ 미설정 | `@tanstack/react-query` 설치됨, Provider 없음 |
| 홈 데이터 훅 | ❌ 없음 | - |
| `home-view.tsx` | ❌ 하드코딩 | 정적 Mock 데이터 사용 |

---

## API 응답 구조

```typescript
// GET /home → 200
{
  dailyPrompt: {
    id: number
    promptType: "sensory" | "reflection" | "opinion"
    title: string
    body: string
    responseCount: number
    isBookmarked: boolean
  } | null,
  activeJourneys: Array<{
    journeyId: number
    title: string
    description: string
    thumbnailUrl: string | null
    completionRate: number
    currentSessionOrder: number
  }>  // 최대 2개 표시 (UI 제한)
}
```

---

## 구현 계획

### Step 1: `foundation/config/env.ts` — 환경 변수 중앙화

**파일:** `apps/web/src/foundation/config/env.ts`

- `@t3-oss/env-nextjs`로 `NEXT_PUBLIC_API_BASE_URL` 검증
- 타입 안전한 `env` 객체 export

```
apps/web/src/foundation/config/
  env.ts
  index.ts
```

---

### Step 2: `foundation/api/` — API 클라이언트 싱글톤

**파일:** `apps/web/src/foundation/api/client.ts`

- `@workspace/api-client`의 `createApiClient()` 호출
- `env.NEXT_PUBLIC_API_BASE_URL`을 baseUrl로 주입
- 전역 싱글톤 `apiClient` export

```
apps/web/src/foundation/api/
  client.ts
  query-client.ts
  query-provider.tsx
  index.ts
```

---

### Step 3: QueryClient Provider — `app/layout.tsx` 연결

- `foundation/api/query-client.ts`: `QueryClient` 기본 옵션 (staleTime: 60s)
- `foundation/api/query-provider.tsx`: `"use client"` + `QueryClientProvider`
- `app/layout.tsx`: `<QueryProvider>` 적용

---

### Step 4: `features/home/` — 홈 데이터 레이어

```
apps/web/src/features/home/
  repositories/
    home.repository.ts    ← GET /home 호출 함수
  hooks/
    use-home-snapshot.ts  ← TanStack Query 훅
  index.ts
```

**`home.repository.ts`**

```typescript
export async function fetchHomeSnapshot(client: ApiClient) {
  const { data, error } = await client.GET("/home")
  if (error) throw error
  return data
}
```

**`use-home-snapshot.ts`**

```typescript
export function useHomeSnapshot() {
  return useQuery({
    queryKey: ["home", "snapshot"],
    queryFn: () => fetchHomeSnapshot(apiClient),
    staleTime: 60_000,    // 1분 캐시
  })
}
```

---

### Step 5: `home-view.tsx` — 실제 데이터 연결

**제거 대상 (Mock):**

- `journeyData` import (`@/data/journey-sessions.json`)
- `JOURNEY_IMAGES` 상수 (Figma asset URL)
- `STAR_ICON` 상수
- 하드코딩된 `HomeContent` 내 텍스트·진행률

**교체 내용:**

- `useHomeSnapshot()` 훅으로 `data.dailyPrompt`, `data.activeJourneys` 조회
- 로딩 상태: Skeleton 카드 표시
- 에러 상태: 재시도 버튼 표시
- 여정 데이터: `data.activeJourneys.slice(0, 2)` (최대 2개)
- thumbanilUrl null 처리: placeholder 배경색 fallback

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `apps/web/src/foundation/config/env.ts` | 신규 |
| `apps/web/src/foundation/config/index.ts` | 신규 |
| `apps/web/src/foundation/api/client.ts` | 신규 |
| `apps/web/src/foundation/api/query-client.ts` | 신규 |
| `apps/web/src/foundation/api/query-provider.tsx` | 신규 |
| `apps/web/src/foundation/api/index.ts` | 신규 |
| `apps/web/src/app/layout.tsx` | 수정 (QueryProvider 추가) |
| `apps/web/src/features/home/repositories/home.repository.ts` | 신규 |
| `apps/web/src/features/home/hooks/use-home-snapshot.ts` | 신규 |
| `apps/web/src/features/home/index.ts` | 신규 |
| `apps/web/src/views/home-view.tsx` | 수정 (Mock → API 연결) |

---

## 검증 체크리스트

- [x] `bun run typecheck` — 타입 오류 없음
- [x] `bun run build` — 빌드 성공
- [ ] 개발 서버에서 `/home?tab=home` 접속 → 실제 API 데이터 렌더링 확인
- [ ] 로딩 상태 표시 확인
- [ ] 에러 상태 표시 확인 (서버 다운 시)
- [ ] `activeJourneys` 최대 2개 제한 확인
- [ ] `dailyPrompt: null` 일 때 빈 상태 처리 확인
