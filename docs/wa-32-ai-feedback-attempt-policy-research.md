# WA-32 AI 피드백 시도 한도 정책 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-32 `하드코딩된 비즈니스 규칙 (Magic Numbers)`
- 조사 범위: `packages/core/src/ai-feedback/ai-feedback.service.ts`, AI 피드백 repository port, API route, web renderer, 제품 문서

## 이슈 요약

WA-32는 `packages/core/src/ai-feedback/ai-feedback.service.ts`의 `const maxAiFeedbackAttempts = 3`이 service 내부에 하드코딩되어 있어 프리미엄 사용자, 이벤트, 코스별 정책 변경에 대응하기 어렵다고 지적한다.

## 코드 조사

현재 core service는 `maxAiFeedbackAttempts = 3`을 다음 지점에서 사용한다.

- 완료 시도 수를 읽은 뒤 남은 횟수 계산
- 남은 횟수가 0이면 provider 호출 없이 제한 오류 반환
- provider 성공 후 repository 저장 시 `maxAttempts`로 전달
- 저장 결과의 attempt number로 `remainingAttempts` 계산

repository port도 `saveCompletedAttempt(record, maxAttempts)`를 받아 저장 트랜잭션 경계에서 한도 초과를 다시 확인한다. 이는 동시 요청 정합성 면에서는 좋은 구조다.

제품 문서에는 AI 평가 재시도 최대 3회가 명시되어 있다. 따라서 `3` 자체는 현재 제품 요구와 맞는 숫자다. 그러나 정책 출처가 문서와 service 상수로만 연결되어 있고, lesson step의 `allowRetry`, 사용자 등급, 운영 설정과는 연결되어 있지 않다.

## 판단

이슈는 타당하다. 다만 “근거 없는 magic number”라기보다는 “문서화된 비즈니스 정책이 실행 정책 객체로 모델링되지 않았다”가 더 정확하다.

현재 정책이 3회로 고정된 것은 제품 요구와 일치한다. 하지만 core service 내부 상수는 정책 변형과 테스트를 어렵게 만든다. AI 피드백은 비용, abuse 방지, 사용자 경험, 유료화와 연결되므로 단순 숫자 상수보다 명시적인 attempt policy로 다루는 편이 안전하다.

## 개선 방안

### 방안 1. `AiFeedbackAttemptPolicy`를 service dependency로 주입한다

`createAiFeedbackService()`에 다음 정책을 주입한다.

```ts
type AiFeedbackAttemptPolicy = {
  readonly maxCompletedAttempts: number
}
```

production composition root는 기본 정책 `3`을 주입한다. 테스트는 정책을 바꿔 1회/2회/무제한에 가까운 edge case를 검증할 수 있다.

장점은 현재 DB repository의 `maxAttempts` 재확인 구조를 유지하면서도 service의 숫자 상수를 제거한다.

### 방안 2. 정책 resolver를 도입한다

단순 숫자 주입보다 확장성을 열려면 command context를 받는 resolver를 둔다.

```ts
resolveAttemptPolicy({ userId, lessonId, stepId })
```

초기 구현은 항상 `{ maxCompletedAttempts: 3 }`을 반환한다. 이후 사용자 등급, 코스 정책, 이벤트 기간, step metadata를 반영할 수 있다.

장점은 현재 요구를 유지하면서도 확장 지점을 명확히 만든다.

### 방안 3. attempt policy를 content step metadata와 연결한다

현재 web renderer는 step의 `allowRetry`와 `remainingAttempts`를 함께 본다. core content model에 AI feedback step의 retry policy를 명시하면 lesson authoring과 runtime enforcement가 같은 계약을 공유할 수 있다.

- `allowRetry`
- `maxAttempts`
- `attemptWindow`

장점은 콘텐츠 설계자가 step별 정책을 이해할 수 있고, admin editor도 같은 정책을 편집/검증할 수 있다. 단점은 기존 seed/content DTO migration이 필요하다.

### 방안 4. 운영 설정 기반 정책을 별도 경계로 둔다

AI feedback은 비용과 rate limit에 직접 연결된다. 운영 설정이나 feature flag에서 기본 max attempts를 읽는 adapter를 만들 수 있다.

- core service는 policy resolver port만 안다.
- API composition root가 운영 설정 repository나 env adapter를 연결한다.
- 정책 값 변경은 배포 없이 가능하되, 변경 이력과 캐시 정책을 둔다.

장점은 비용 대응과 이벤트 운영에 유연하다. 단점은 실시간 설정 변경이 product correctness에 영향을 주므로 감사 로그와 검증이 필요하다.

### 방안 5. 정책 버전과 저장 record를 연결한다

피드백 시도 저장 시 당시 적용된 정책을 record에 남긴다.

- `attemptPolicyVersion`
- `maxAttemptsAtCreation`

장점은 정책이 바뀐 뒤에도 과거 시도와 남은 횟수 계산을 설명할 수 있다. 특히 유료화/이벤트 변경 시 관측성이 좋아진다.

## 권장 진행 순서

1. `AiFeedbackAttemptPolicy`와 기본 정책 상수를 core에 명시한다.
2. `createAiFeedbackService()`가 정책을 dependency로 받게 한다.
3. API composition root에서 기본 3회 정책을 주입한다.
4. repository 저장 경계에 전달되는 `maxAttempts`는 policy에서 온 값을 사용한다.
5. 1회/3회/동시 저장 한도 초과 테스트를 정책 주입 기반으로 보강한다.
6. 장기적으로 사용자/스텝/운영 설정 기반 policy resolver와 정책 버전 저장을 검토한다.

## 검증 계획

- `bun --filter @workspace/core test -- ai-feedback.service`
- `bun --filter @workspace/db test -- feedback.repository`
- `bun --filter @workspace/api test -- ai-feedback.route`
- `bun --filter @workspace/web test -- lesson-step-renderer`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-32 본문을 읽고 AI 피드백 core service, repository port, API route, web renderer, 제품 문서를 조사했다.
- `3`은 문서화된 현재 요구이나 실행 정책 객체로 분리되지 않은 구조는 타당한 개선 대상이라고 판단했다.
- 개선 방향은 단순 생성자 숫자 주입을 넘어 policy resolver, content metadata, 운영 설정, 정책 버전 저장까지 포함해 정리했다.
- `AiFeedbackAttemptPolicy`와 `defaultAiFeedbackAttemptPolicy`를 core의 명시적 계약으로 추가했다.
- `createAiFeedbackService()`가 완료 시도 한도를 내부 상수가 아니라 주입된 attempt policy에서 읽도록 변경했다.
- API 조립 루트는 기본 정책을 서비스에 주입하고, repository 저장 경계에도 동일한 정책 한도를 전달한다.
- 서비스 테스트는 기본 3회 정책뿐 아니라 주입된 1회 정책이 남은 횟수와 저장 한도에 반영되는지 검증한다.

## 검증 결과

- `bun --filter @workspace/core test src/ai-feedback/ai-feedback-attempt-policy.test.ts src/ai-feedback/ai-feedback.service.test.ts`
- `bun --filter @workspace/api test src/routes/ai-feedback.route.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/core lint`
- `bun --filter @workspace/api lint`
