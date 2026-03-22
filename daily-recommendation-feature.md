# 글감 일일 추천 기능 고도화

## 개요

홈페이지에서 매일 2개의 글감을 추천하는 기능을 구현했습니다. 모든 사용자가 동일한 글감을 제안받으며, 한국 시간(KST) 자정에 추천이 갱신됩니다.

## 핵심 동작

- **추천 개수**: 매일 고정 2개
- **일관성**: 모든 사용자에게 동일한 글감 추천
- **갱신 시점**: KST 자정 (UTC+9)
- **선택 로직**: 가중 랜덤 — 최근 추천된 글감일수록 낮은 확률, 한 번도 추천되지 않은 글감은 최대 가중치
- **시드 데이터**: 100개 글감 (자기이해, 사회, 일상, 문화, 기술, 관계, 성장, 여행, 감정, 기억, 경험, 상상, 진로 카테고리)

## 아키텍처

### 레이어 구조

```
apps/web (프론트엔드) → apps/api (API 서버) → packages/core (도메인) → packages/database (인프라)
```

### 호출 흐름

1. 사용자가 홈 화면 진입
2. API의 `getHome` 엔드포인트 호출
3. `ensureTodayRecommendations` 유스케이스 실행
   - KST 기준 오늘 날짜 계산
   - `daily_recommendations` 테이블에 오늘자 레코드 존재 확인
   - 없으면: 가중 랜덤으로 2개 선택 → 저장 → `prompts` 테이블 플래그 갱신
   - 있으면: 아무 작업 없음 (이미 생성됨)
4. `listTodayPrompts`로 오늘의 추천 글감 2개 조회
5. 홈 스냅샷과 함께 응답 반환

## 변경 파일

### packages/core (도메인 계층)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/modules/daily-recommendation/daily-recommendation-types.ts` | 신규 | `DailyRecommendation`, `RecommendationHistoryEntry` 타입 |
| `src/modules/daily-recommendation/daily-recommendation-port.ts` | 신규 | `DailyRecommendationRepository` 인터페이스 |
| `src/modules/daily-recommendation/kst-date.ts` | 신규 | KST 기준 날짜 문자열 유틸리티 |
| `src/modules/daily-recommendation/weighted-selection.ts` | 신규 | 가중 랜덤 선택 알고리즘 |
| `src/modules/daily-recommendation/use-cases/ensure-today-recommendations.ts` | 신규 | 오늘의 추천 보장 유스케이스 |
| `src/modules/daily-recommendation/index.ts` | 신규 | 모듈 배럴 익스포트 |
| `src/modules/home/use-cases/get-home.ts` | 수정 | `dailyRecommendationRepository` 의존성 추가, 추천 수 4→2 |
| `src/modules/home/adapters/application-compatibility.ts` | 수정 | 호환 어댑터에 새 의존성 반영 |
| `src/index.ts` | 수정 | 새 모듈 익스포트 추가 |
| `package.json` | 수정 | `./modules/daily-recommendation` 익스포트 경로 추가 |

### packages/database (인프라 계층)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/schema/daily-recommendations.ts` | 신규 | `daily_recommendations` 테이블 스키마 |
| `src/repository/daily-recommendation.repository.ts` | 신규 | 리포지토리 구현체 |
| `src/seed-data/prompts.ts` | 수정 | 시드 데이터 10개→100개, `isTodayRecommended`/`todayRecommendationOrder` 제거 |
| `src/connection/seed.ts` | 수정 | 시드 함수에서 추천 플래그 하드코딩 (false/null) |
| `src/schema/index.ts` | 수정 | 새 스키마 익스포트 |
| `src/types/db.ts` | 수정 | 새 타입 추가 |
| `src/repository/index.ts` | 수정 | 새 리포지토리 익스포트 |
| `src/index.ts` | 수정 | 새 익스포트 추가 |
| `drizzle/0001_daily_recommendations.sql` | 신규 | 마이그레이션 SQL |
| `drizzle/meta/_journal.json` | 수정 | 마이그레이션 저널 항목 추가 |

### apps/api (API 서버)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/application-services.ts` | 수정 | `createHomeApiService`에 `dailyRecommendationRepository` 매개변수 추가 |
| `src/runtime/bootstrap.ts` | 수정 | `dailyRecommendationRepository` 생성 및 주입 |

### apps/web (프론트엔드)

| 파일 | 변경 | 설명 |
|------|------|------|
| `app/(protected)/home/page.tsx` | 수정 | 그리드 레이아웃 `lg:grid-cols-4` → `sm:grid-cols-2` |
| `lib/phase-one-fixtures.ts` | 수정 | 픽스처에서 `isTodayRecommended` 제거, `todayPrompts`를 2개로 축소 |

### 테스트 파일 업데이트

| 파일 | 설명 |
|------|------|
| `packages/core/src/modules/home/use-cases/get-home.test.ts` | 새 의존성 모킹, 추천 수 기대값 수정 |
| `packages/database/src/connection/migrate.test.ts` | 새 테이블명 추가 |
| `packages/database/src/repository/prompt.repository.test.ts` | 시드 수 100개 반영, 수동 플래그 설정 |
| `apps/api/src/app.test.ts` | `todayPrompts` 기대값 4→2 |
| `apps/api/src/runtime/bootstrap.test.ts` | 새 리포지토리 모킹 추가 |
| `apps/api/src/test-support/create-test-app.ts` | `todayPrompts`를 2개로 제한 |

## 가중 선택 알고리즘

```
MAX_WEIGHT = 100

각 글감의 가중치:
- 한 번도 추천되지 않음 → 100
- N일 전 추천됨 → max(N, 1)

가중 랜덤으로 2개 선택 (복원 없이)
```

## 데이터베이스 스키마

### daily_recommendations 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | 자동 증가 ID |
| date | TEXT NOT NULL | KST 날짜 (YYYY-MM-DD) |
| prompt_id | INTEGER NOT NULL FK | 글감 ID |
| display_order | INTEGER NOT NULL | 표시 순서 |
| created_at | TEXT NOT NULL | 생성 시각 |

### 인덱스

- `daily_rec_date_order_idx` (UNIQUE): date + display_order
- `daily_rec_date_prompt_idx` (UNIQUE): date + prompt_id
- `daily_rec_date_idx`: date

## 동시성 안전

- `daily_recommendations` 삽입 시 `onConflictDoNothing`으로 레이스 컨디션 처리
- 같은 날짜에 여러 요청이 동시에 도착해도 중복 생성 방지
