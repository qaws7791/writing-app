# 여정 진행률 불일치 버그 수정 계획

## 문제 요약

3개 화면에서 동일한 여정(오감으로 쓰는 글, 세션 2/3 완료)의 진행률이 모두 다르게 표시됨.

| 화면 | 표시값 | 실제 정답 |
|------|--------|-----------|
| 홈 화면 | **1%** ❌ | 67% |
| 나의 여정 목록 | **100%** ❌ | 67% |
| 여정 상세 | **67%** ✅ | 67% |

---

## 근본 원인 분석

### 버그 1 — DB에 저장되는 `completionRate` 계산 오류 (데이터 오염)

**영향 파일 2곳:**

#### `packages/core/src/modules/progress/use-cases/submit-step.ts:181-184`

세션의 마지막 스텝 제출 시 자동으로 여정 진행률을 갱신하는 로직.

```ts
// 현재 (잘못됨)
const nextSessionOrder = session.order + 1       // 다음에 할 세션 번호
const completionRate = Math.min(
  1,
  nextSessionOrder / journey.sessionCount        // ← 버그: 완료된 세션 수가 아님
)
// 세션 2/3 완료 시: nextSessionOrder=3, sessionCount=3 → 3/3 = 1.0 (100%)

// 수정
const completionRate = Math.min(
  1,
  (nextSessionOrder - 1) / journey.sessionCount  // 완료된 세션 수 기준
)
// 세션 2/3 완료 시: (3-1)/3 = 0.667 (67%) ✓
// 세션 3/3 완료 시: nextSessionOrder=4, (4-1)/3 = 1.0 (100%) ✓
```

`nextSessionOrder`는 **다음에 진행할 세션 번호**이지, 완료된 세션 수가 아니다.  
세션 2를 완료하면 `nextSessionOrder = 3`이 되지만, 실제 완료 세션은 2개(2/3)다.

#### `packages/core/src/modules/progress/use-cases/complete-session.ts:22-24`

`POST /sessions/{id}/complete` API 경로에서도 동일한 공식 오류.

```ts
// 현재 (잘못됨)
const completionRate = Math.min(
  1,
  input.nextSessionOrder / input.totalSessions   // ← 버그
)

// 수정
const completionRate = Math.min(
  1,
  (input.nextSessionOrder - 1) / input.totalSessions
)
```

### 버그 2 — 홈 화면 진행률 표시 오류

**영향 파일** `apps/web/src/views/home-view.tsx:169`

`completionRate`는 `0~1` 범위의 소수인데, `* 100` 변환 없이 그대로 퍼센트로 표시.

```ts
// 현재 (잘못됨)
completionRate={Math.round(journey.completionRate)}       // 1.0 → 1%

// 수정
completionRate={Math.round(journey.completionRate * 100)} // 1.0 → 100%
```

`my-journeys-view.tsx`는 동일 데이터에 `* 100`을 적용하여 올바르게 100%를 표시함.  
`home-view.tsx`에서만 누락된 단순 실수다.

---

## 3개 화면 결과 재현 (세션 2/3 완료 상태)

DB에 저장된 값:

- `currentSessionOrder = 3` (다음 세션 번호)  
- `completionRate = 1.0` (버그로 인해 100%가 저장됨 → 버그 1로 오염)

| 화면 | 계산식 | 현재 결과 | 수정 후 결과 |
|------|--------|-----------|-------------|
| 홈 | `Math.round(1.0)` | **1%** ❌ | `Math.round(0.667 * 100)` = **67%** ✅ |
| 나의 여정 | `Math.round(1.0 * 100)` | **100%** ❌ | `Math.round(0.667 * 100)` = **67%** ✅ |
| 여정 상세 | `Math.round((3-1)/3 * 100)` | **67%** ✅ | **67%** ✅ (변경 없음) |

여정 상세만 `completionRate` DB 값을 무시하고 `currentSessionOrder - 1`로 직접 계산하기 때문에 우연히 정확하게 표시됨.

---

## 수정 계획

### 수정 대상 파일 3개

| 순서 | 파일 | 수정 내용 |
|------|------|-----------|
| 1 | `packages/core/src/modules/progress/use-cases/submit-step.ts` | `nextSessionOrder - 1` 로 수정 |
| 2 | `packages/core/src/modules/progress/use-cases/complete-session.ts` | `nextSessionOrder - 1` 로 수정 |
| 3 | `apps/web/src/views/home-view.tsx` | `* 100` 추가 |

### 수정 후 검증

- `bun lefthook run pre-commit` 로 lint/typecheck 통과 확인
- 새로 세션을 완료하면 모든 화면에서 동일한 진행률 표시 확인
- `completionRate = 0` (미시작), `0.667` (2/3), `1.0` (완료) 케이스 모두 경계값 확인

### 기존 오염 데이터

이미 DB에 잘못된 `completionRate = 1.0`이 저장된 레코드가 있을 수 있음.  
수정 이후 새로 완료하는 세션부터 올바른 값이 저장되며,  
기존 데이터는 여정 상세 화면이 `currentSessionOrder`를 직접 사용하기 때문에 표시상 큰 문제없음.  
(필요시 DB 마이그레이션 스크립트로 일괄 재계산 가능)
