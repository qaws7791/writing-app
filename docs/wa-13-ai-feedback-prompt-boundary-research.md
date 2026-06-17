# WA-13 AI 피드백 프롬프트 경계 분석

## 2026-06-17 시작

- Notion 이슈: `WA-13 하드코딩된 프롬프트와 외부 API 결합`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-13 페이지
- 조사 범위: `apps/api/src/openai/openai-feedback-provider.ts`, `packages/core/src/ai-feedback`, AI 피드백 route와 API 조립 루트, 관련 백엔드 문서
- 목표: OpenAI provider 안의 프롬프트 하드코딩이 실제 구조 문제인지 판단하고, 같은 문제가 반복되지 않도록 시스템 관점의 개선 방안을 도출한다.

## 이슈 요약

WA-13은 `apps/api/src/openai/openai-feedback-provider.ts`의 `instructions`가 OpenAI adapter 구현 안에 직접 하드코딩되어 있어, AI 코칭 정책을 바꾸려면 외부 API adapter를 수정해야 한다고 지적한다.

현재 provider는 다음 책임을 한 곳에서 수행한다.

- 레슨 제목, 코칭 초점, 학습자 답변을 OpenAI `input` 문자열로 조립한다.
- 한국어 코치 역할, JSON schema 준수, 칭찬과 개선점의 문체, 점수 범위 같은 코칭 지침을 `instructions`로 조립한다.
- OpenAI Structured Outputs용 JSON schema를 provider 내부 상수로 보관한다.
- OpenAI 응답을 JSON parse 후 `aiFeedbackPayloadSchema`로 다시 검증한다.

## 코드 조사

### 현재 경계

- `packages/core/src/ai-feedback/ai-feedback.provider.ts`는 `AiFeedbackProviderInput`으로 `answer`, `focus`, `lessonTitle`만 정의한다.
- `packages/core/src/ai-feedback/ai-feedback.service.ts`는 레슨과 스텝을 조회하고, `AI_FEEDBACK` 스텝일 때 provider에 `answer`, `focus`, `lessonTitle`을 넘긴다.
- `apps/api/src/openai/openai-feedback-provider.ts`는 이 입력을 OpenAI request로 변환하면서 프롬프트와 Structured Outputs schema를 함께 결정한다.
- `apps/api/src/main.ts`는 API key 유무에 따라 OpenAI provider 또는 unavailable provider를 연결하고, 모델 이름만 provider에 주입한다.

### 문서와의 관계

- `BACKEND.md`는 AI 피드백에서 `apps/api`의 OpenAI provider가 Responses API와 Structured Outputs를 호출하고, `packages/core`의 AI 피드백 서비스가 재시도 제한과 저장 규칙을 담당한다고 설명한다.
- `docs/superpowers/specs/2026-05-26-platform-backend-api-design.md`는 `packages/core`가 OpenAI SDK를 직접 import하지 않고 provider 포트에 의존해야 한다고 정한다.
- 따라서 OpenAI SDK 호출을 `apps/api` adapter에 두는 결정은 문서와 일치한다.
- 하지만 코칭 정책 문구와 요청 메시지 구성은 OpenAI SDK 세부사항이 아니라 제품 도메인 정책에 가깝다. 이 부분까지 adapter 내부에 잠긴 것은 현재 문서가 말하는 경계보다 더 좁고 얕은 구조다.

### 테스트의 빈틈

- `packages/core/src/ai-feedback/ai-feedback.service.test.ts`는 provider가 어떤 입력을 받는지만 검증한다.
- `apps/api/src/openai/openai-feedback-provider.test.ts`는 모델, schema 이름, input에 레슨 제목과 초점과 답변이 포함되는지만 검증한다.
- 코칭 지침 자체가 어느 Module의 책임인지, 프롬프트 변경이 OpenAI adapter 수정 없이 가능한지는 테스트로 표현되어 있지 않다.

## 판단

WA-13은 타당하다. 현재 구조는 외부 API adapter가 OpenAI 호출 책임뿐 아니라 AI 코칭 정책과 prompt assembly 책임까지 함께 가진다.

문제의 핵심은 프롬프트 문자열이 코드에 있다는 사실 자체가 아니다. 제품이 보장해야 하는 코칭 정책, 입력 메시지 구성, 출력 계약이 OpenAI provider 구현 내부에 섞여 있어, 정책 변경이 provider 교체나 테스트 격리와 분리되지 않는다는 점이다.

다만 `packages/core`가 OpenAI SDK나 OpenAI 전용 request 형식을 알아서는 안 된다. 개선 방향은 OpenAI 호출은 `apps/api` adapter에 남기되, 도메인 수준의 코칭 요청과 프롬프트 정책을 core의 명시적 Module로 끌어올리는 것이다.

## 해결 방안

### 방안 1. core에 AI 코칭 프롬프트 정책 Module을 만든다

`packages/core/src/ai-feedback/ai-feedback-prompt.ts` 같은 Module을 만들고, `AiFeedbackProviderInput`을 받아 도메인 수준의 `AiFeedbackPrompt`를 생성한다.

예상 역할:

- 레슨 제목, 코칭 초점, 학습자 답변을 안정적인 메시지 구조로 변환한다.
- 한국어 글쓰기 코치 지침, 점수 정책, 개선점 문체 정책을 한 곳에서 관리한다.
- provider 포트는 원시 입력 대신 이미 조립된 `AiFeedbackPrompt` 또는 `AiFeedbackProviderRequest`를 받는다.

장점은 코칭 정책이 OpenAI adapter에서 분리되고, provider 교체 시에도 같은 도메인 prompt 정책을 재사용할 수 있다는 점이다. 테스트 표면도 core Module로 좁아져 OpenAI client 없이 정책 회귀를 검증할 수 있다.

추천 강도: 높음.

### 방안 2. provider 포트를 구조화된 코칭 명령으로 깊게 만든다

현재 provider 포트는 `answer/focus/lessonTitle`만 받는 얇은 interface다. 이를 `AiFeedbackCoachingRequest`로 확장해 source step, rubric, score policy, learner locale, output contract version 같은 도메인 정보를 명시한다.

예상 효과:

- 프롬프트 문자열 조립보다 먼저 "AI 코칭 요청이 무엇을 의미하는지"가 타입으로 표현된다.
- `AI_FEEDBACK` step content가 늘어나도 provider adapter에 임의 필드를 추가하지 않고 core 명령을 확장할 수 있다.
- 향후 OpenAI가 아닌 다른 provider를 붙여도 adapter는 동일 명령을 provider별 request로 변환하는 역할만 맡는다.

단점은 포트 변경 범위가 service, provider test, API adapter로 퍼진다. 그러나 이 이슈는 향후 동일 문제가 반복되지 않게 구조를 바꾸는 목적이므로 단순 문자열 이동보다 더 안정적이다.

추천 강도: 높음.

### 방안 3. 출력 계약 schema를 provider 내부 상수에서 core 계약으로 승격한다

OpenAI Structured Outputs가 요구하는 JSON schema는 provider 전용 형식이지만, 그 근본 계약은 `AiFeedbackPayload`다. core에 `aiFeedbackOutputContract`를 두고, OpenAI adapter는 그 계약을 OpenAI JSON schema 형태로 변환하거나 참조하게 한다.

예상 효과:

- DTO Zod schema와 OpenAI schema가 서로 다른 진실의 원천으로 갈라지는 일을 줄인다.
- score range, 필수 필드, 배열 최소 개수 같은 출력 정책을 core 테스트에서 검증할 수 있다.
- provider adapter는 OpenAI가 요구하는 schema 포맷 차이만 담당한다.

단점은 Zod schema에서 OpenAI 호환 JSON schema를 자동 생성할지, 명시 상수를 둘지 결정해야 한다. 자동 변환을 도입하면 새 의존성이 생길 수 있으므로, 현재는 명시 상수와 테스트로 동기화를 보장하는 편이 더 단순하다.

추천 강도: 중간 이상.

### 방안 4. AI 코칭 정책을 운영 문서와 버전으로 관리한다

프롬프트 정책을 단순 코드 상수로만 두지 않고, `docs`에 AI 코칭 정책 문서를 만들고 코드의 prompt policy에 `version`을 둔다. 저장되는 `feedback_attempts`에는 필요 시 prompt policy version을 함께 기록할 수 있게 schema 확장을 검토한다.

예상 효과:

- 프롬프트 변경이 제품 정책 변경으로 추적된다.
- 과거 피드백 결과가 어떤 정책으로 생성되었는지 설명할 수 있다.
- A/B 테스트나 모델 전환이 필요해질 때 정책 버전을 기준으로 안전하게 관찰할 수 있다.

단점은 DB schema 변경까지 포함하면 범위가 커진다. 지금 당장 저장소 schema를 바꾸기보다, 먼저 policy Module에 version을 두고 저장 필요성이 생길 때 migration을 설계하는 순서가 안전하다.

추천 강도: 탐색 가치 있음.

## 권장 순서

1. `packages/core/src/ai-feedback`에 prompt policy Module을 추가하고, 코칭 지침과 입력 조립을 core 테스트로 고정한다.
2. `AiFeedbackProvider` 포트가 원시 입력이 아니라 core가 만든 코칭 요청을 받도록 바꾼다.
3. OpenAI adapter는 OpenAI Responses API request 변환, SDK 호출, 응답 parse와 provider 오류 변환만 담당하게 줄인다.
4. 출력 계약 schema가 DTO와 어긋나지 않도록 core 계약과 adapter schema 사이에 회귀 테스트를 추가한다.
5. 운영상 프롬프트 변경 추적이 필요해지면 policy version과 `feedback_attempts` 기록 확장을 별도 이슈로 분리한다.

## 검증 계획

- `bun --filter @workspace/core test src/ai-feedback/ai-feedback.service.test.ts`
- `bun --filter @workspace/api test src/openai/openai-feedback-provider.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/api typecheck`
- 필요 시 `bun --filter @workspace/api test src/routes/ai-feedback.route.test.ts`

## 2026-06-17 완료

- Notion `WA-13` 내용을 확인했다.
- AI 피드백 core 포트, service, API OpenAI provider, 조립 루트, 관련 문서를 조사했다.
- WA-13은 타당하다고 판단했다.
- OpenAI SDK 호출 경계는 `apps/api`에 유지하되, 코칭 정책과 prompt assembly는 core의 명시적 Module로 분리하는 방향을 추천한다.
- prompt policy Module, 구조화된 provider 명령, 출력 계약 승격, 정책 버전 관리의 4가지 개선 방안을 도출했다.

## 2026-06-17 구현 완료

- `packages/core/src/ai-feedback/ai-feedback.prompt.ts`를 추가해 한국어 글쓰기 코칭 지침, 입력 메시지 조립, prompt policy version을 core 도메인 정책으로 분리했다.
- `AiFeedbackProviderInput`을 `AiFeedbackPrompt`로 바꿔 provider 포트가 원시 `answer/focus/lessonTitle` 묶음이 아니라 core가 만든 코칭 prompt를 받게 했다.
- `createAiFeedbackService()`는 `AI_FEEDBACK` 스텝의 `focus`, 레슨 제목, 학습자 답변으로 `createAiFeedbackPrompt()`를 호출한 뒤 provider에 전달한다.
- `apps/api/src/openai/openai-feedback-provider.ts`는 더 이상 코칭 지침과 입력 문자열을 직접 조립하지 않는다. OpenAI Responses API request 변환, SDK 호출, 응답 검증, provider 오류 변환만 담당한다.
- `packages/core/src/ai-feedback/ai-feedback.prompt.test.ts`를 추가해 prompt policy를 OpenAI client 없이 검증한다.
- `apps/api/src/openai/openai-feedback-provider.test.ts`는 core prompt를 받아 OpenAI request로 변환하는 adapter 책임을 검증한다.
- `BACKEND.md`에 AI 피드백 prompt policy의 단일 출처를 기록했다.

## 검증 결과

- `bun --filter @workspace/core test src/ai-feedback/ai-feedback.prompt.test.ts src/ai-feedback/ai-feedback.service.test.ts`
- `bun --filter @workspace/api test src/openai/openai-feedback-provider.test.ts src/routes/ai-feedback.route.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/api typecheck`
