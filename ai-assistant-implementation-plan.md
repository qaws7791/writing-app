# AI 보조 기능 실제 구현 계획

## 현황

현재 `apps/web/src/features/ai-assistant/repositories/mock-ai.ts`에 모든 AI 기능이 하드코딩된 mock으로 구현되어 있다.
이를 실제 Gemini AI 모델 기반으로 전환한다.

## 기술 스택

- **AI SDK**: `6.0.140` (Vercel AI SDK v6)
- **Provider**: `@ai-sdk/google` (Google Generative AI)
- **Model**: `gemini-3.1-flash-lite-preview` (빠른 응답용)
- **Schema**: `zod` (구조화된 출력 검증)

## 아키텍처

```
packages/ai          ← 새 내부 패키지 (AI 프롬프트, 스키마, 서비스)
packages/core        ← AI 도메인 타입 추가
packages/database    ← AI 요청 이력 스키마 추가
apps/api             ← AI 라우트 (POST /ai/suggestions, POST /ai/review)
apps/web             ← mock → API 호출로 교체
```

### 의존성 방향

```
apps/api → packages/ai → packages/core
apps/web → apps/api (HTTP)
packages/ai → ai, @ai-sdk/google
```

## 패키지별 변경 사항

### 1. `packages/ai` (신규)

AI 관련 로직을 독립적으로 관리하는 내부 패키지.

```
packages/ai/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts           ← 공개 API
    ├── provider.ts        ← Google AI 모델 인스턴스
    ├── prompts/
    │   ├── suggestion-prompt.ts   ← 어휘/명료화/리듬 프롬프트
    │   ├── review-prompt.ts       ← 맞춤법/중복 검토 프롬프트
    │   └── flow-prompt.ts         ← 문단 흐름 프롬프트
    └── schemas/
        ├── suggestion-schema.ts   ← AISuggestion Zod 스키마
        └── review-schema.ts       ← ReviewItem Zod 스키마
```

**역할:**

- Gemini 모델 인스턴스 생성 및 래핑
- 각 기능별 프롬프트 템플릿 관리
- `generateObject`를 사용한 구조화된 AI 응답 생성
- Zod 스키마로 출력 타입 보장

### 2. `packages/core` (수정)

AI 도메인 타입을 core 모듈에 추가.

```
packages/core/src/modules/ai-assistant/
├── index.ts
├── ai-assistant-types.ts    ← AIFeatureType, AISuggestion, ReviewItem 등
└── ai-assistant-schemas.ts  ← Zod 스키마 (API 검증용)
```

### 3. `packages/database` (수정)

AI 요청 이력 테이블 추가.

```
packages/database/src/schema/ai-requests.ts   ← ai_requests 테이블
```

| 컬럼         | 타입                | 설명                                                  |
| ------------ | ------------------- | ----------------------------------------------------- |
| id           | text (PK)           | 요청 ID                                               |
| user_id      | text (FK)           | 사용자 ID                                             |
| writing_id   | text (FK, nullable) | 관련 글 ID                                            |
| feature_type | text                | vocabulary/clarity/rhythm/spelling-review/flow-review |
| input_text   | text                | 입력 텍스트                                           |
| output_json  | text                | AI 응답 JSON                                          |
| model        | text                | 사용 모델명                                           |
| created_at   | integer             | 생성 시각                                             |

### 4. `apps/api` (수정)

새 AI 라우트 추가.

```
apps/api/src/routes/ai/
├── get-suggestions.ts       ← POST /ai/suggestions
├── get-document-review.ts   ← POST /ai/review/document
└── get-flow-review.ts       ← POST /ai/review/flow
```

**엔드포인트:**

#### `POST /ai/suggestions`

- Body: `{ text: string, type: "vocabulary" | "clarity" | "rhythm" }`
- Response: `{ suggestions: AISuggestion[] }`
- 인증 필요

#### `POST /ai/review/document`

- Body: `{ paragraphs: { from: number, to: number, text: string }[] }`
- Response: `{ items: ReviewItem[] }`
- 인증 필요

#### `POST /ai/review/flow`

- Body: `{ paragraphs: { from: number, to: number, text: string }[] }`
- Response: `{ items: ReviewItem[] }`
- 인증 필요

### 5. `apps/web` (수정)

mock 호출을 API 호출로 교체.

```
apps/web/src/features/ai-assistant/repositories/
├── mock-ai.ts       ← 기존 유지 (개발 fallback)
└── api-ai.ts        ← 새 API 클라이언트 기반 구현
```

- `use-ai-suggestion.ts`: `getAISuggestions` → API 호출
- `use-ai-review.ts`: `getDocumentReview`, `getFlowReview` → API 호출

## 구현 순서

1. `packages/core` - AI 도메인 타입/스키마 정의
2. `packages/ai` - 내부 패키지 생성 (프롬프트, 서비스)
3. `packages/database` - AI 요청 이력 스키마
4. `apps/api` - AI 라우트 구현
5. `apps/web` - mock → 실제 API 호출 교체
6. 빌드/타입체크 검증

## 환경 변수

| 변수                           | 위치       | 설명             |
| ------------------------------ | ---------- | ---------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `apps/api` | Google AI API 키 |
