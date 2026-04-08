# 홈 글감 탭(home?tab=prompts) API 구현 계획

> 작성일: 2026-04-08  
> 목표: `home?tab=prompts` 화면에서 글감 카테고리 필터 + 커서 기반 무한스크롤 목록을 실제 API와 연결한다.

---

## 1. 현재 상태 분석

### 문제점

- `PromptArchiveView`가 하드코딩된 더미 데이터를 사용
- `GET /prompts`에 커서 기반 페이지네이션 없음 (단순 전량 조회)
- `writing_prompts` DB 테이블에 `thumbnail_url` 컬럼 없음
- `PromptSummary` 타입에 thumbnailUrl 필드 없음

---

## 2. API 설계

### 2-1. `GET /prompts` — 글감 목록 (변경)

| 변경 사항 | 내용 |
|---|---|
| Query: `cursor` 추가 | `number?` — 마지막 아이템의 ID, 없으면 첫 페이지 |
| Query: `limit` 추가 | `number?` — 기본 20, 최대 50 |
| Response: `nextCursor` 추가 | `number \| null` — 다음 페이지 커서 |
| Response: `thumbnailUrl` 추가 | 각 글감 아이템에 포함 |

**Request (Query)**

```
GET /prompts?promptType=sensory&cursor=10&limit=20
```

**Response**

```json
{
  "items": [
    {
      "id": 11,
      "promptType": "sensory",
      "title": "오래된 노래 한 곡",
      "body": "...",
      "thumbnailUrl": "https://picsum.photos/seed/prompt-11/600/400",
      "responseCount": 184,
      "isBookmarked": false
    }
  ],
  "nextCursor": 30
}
```

**커서 기반 페이지네이션 원리**

- `id > cursor` 조건으로 다음 페이지 조회 (`ORDER BY id ASC`)
- `items.length === limit`이면 `nextCursor = items[last].id`, 아니면 `null`
- 첫 페이지는 cursor 없이 조회

### 2-2. `GET /prompts/categories` — 글감 카테고리 목록 (신규)

카테고리는 DB의 `promptType` 열거형과 동일. 정적 값이지만 API로 노출하여 프론트엔드가 동적으로 사용할 수 있게 한다.

**Response**

```json
{
  "items": [
    { "key": "sensory",    "label": "감각" },
    { "key": "reflection", "label": "회고" },
    { "key": "opinion",    "label": "의견" }
  ]
}
```

---

## 3. 구현 범위

### Layer-by-layer 변경 목록

```
packages/database
  schema/writing-prompts.ts         ← thumbnailUrl 컬럼 추가
  drizzle/0001_add_prompt_thumbnail.sql ← 마이그레이션
  seed-data/writing-prompts.ts       ← 시드 데이터에 thumbnailUrl 추가 (picsum.photos)
  repository/writing-prompt.repository.ts ← list/getById/getDailyPrompt thumbnailUrl 선택

packages/core
  modules/prompts/prompt-types.ts    ← PromptSummary에 thumbnailUrl 추가, PromptListPage 타입 추가
  modules/prompts/prompt-schemas.ts  ← promptSummarySchema / promptFiltersQuerySchema / promptListPageResponseSchema 업데이트
  modules/prompts/prompt-port.ts     ← PromptRepository.list() 반환을 PromptListPage로 변경
  modules/prompts/use-cases/list-prompts.ts ← 반환 타입 업데이트

apps/api
  routes/prompts/list-prompts.ts     ← 쿼리 + 응답 스키마 업데이트
  routes/prompts/list-categories.ts  ← 신규 (정적 카테고리 반환)
  routes/index.ts                    ← 새 라우트 등록

packages/api-client
  src/openapi.json                   ← /prompts 스키마 업데이트, /prompts/categories 추가
  src/schema.d.ts                    ← openapi.json에서 재생성

apps/web
  features/prompts/repositories/prompt.repository.ts ← API 호출 함수
  features/prompts/hooks/use-prompt-list.ts          ← useInfiniteQuery 훅
  features/prompts/index.ts                          ← 공개 인터페이스
  views/prompt-archive-view.tsx                      ← 실제 API 연결, 무한스크롤 구현
```

---

## 4. 썸네일 이미지 전략

스토리지가 없으므로 `picsum.photos`의 시드 기반 고정 이미지 URL 사용.

```
https://picsum.photos/seed/prompt-{id}/600/400
```

- 동일 ID → 항상 동일 이미지 (결정론적)
- Retina: `/600/400` → CSS에서 `object-fit: cover`
- DB에 URL을 직접 저장 (마이그레이션/시드 시점에 설정)

---

## 5. 무한 스크롤 구현 방식

TanStack Query `useInfiniteQuery` + Intersection Observer 패턴.

```
useInfiniteQuery({
  queryKey: ['prompts', { promptType }],
  queryFn: ({ pageParam }) => fetchPromptList(client, { promptType, cursor: pageParam, limit: 20 }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
})
```

뷰에서는 마지막 카드 하단에 `ref`를 부착한 sentinel 엘리먼트로 `fetchNextPage` 호출.

---

## 6. 제약사항 및 가정

- 스토리지 미구비 → picsum.photos URL 사용 (실 서비스 전환 시 URL만 교체)
- `getDailyPrompt`, `getById` 반환 타입도 thumbnailUrl 포함 (PromptSummary 확장에 따라 자동 반영)
- 카테고리 조회 API는 정적 데이터를 반환 (변경 빈도 없음)
- `PromptRepository.list()` 시그니처 변경 → DB 구현체만 해당, 다른 use-case에서 `list()` 미사용 확인됨
