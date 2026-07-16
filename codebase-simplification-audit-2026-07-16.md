# 코드베이스 과잉 복잡성 및 단순화 감사

작성일: 2026-07-16  
분석 대상: `codebase(9).md` Repomix 스냅샷

## 1. 결론

이 코드베이스는 **제품 전체가 무질서하게 복잡한 상태는 아니지만, 현재 제품 규모에 비해 특정 영역이 명백히 과대 설계된 상태**다.

가장 큰 문제는 다음 세 축에 집중되어 있다.

1. 관리자 자료실이 단순한 내부 문서 기능을 넘어 별도의 실시간 협업 제품처럼 구현되어 있다.
2. 계약, 모델, 포트, 결과 타입, 매퍼가 같은 정보를 여러 계층에서 반복 표현한다.
3. 저장소 자체를 검증하고 배포하는 메타 시스템이 실제 제품 런타임만큼 중요한 하위 시스템으로 성장했다.

AI 코딩 에이전트가 구현 시간을 크게 낮추더라도 다음 비용은 0이 되지 않는다.

- 사람이 구조를 이해하고 변경 범위를 판단하는 비용
- 리뷰에서 안전성을 증명하는 비용
- 의존성 업데이트와 프레임워크 변경을 따라가는 비용
- 테스트 실패와 CI 실패를 진단하는 비용
- 운영 중 장애 원인을 좁히는 비용
- 기능을 삭제하거나 방향을 바꿀 때 발생하는 마이그레이션 비용

따라서 이 프로젝트의 복잡성 예산은 “구현에 걸린 시간”이 아니라 **유지해야 하는 개념 수, 런타임 수, 영속 상태 수, 실패 모드 수**로 계산해야 한다.

현재 제공된 스냅샷 기준으로는 핵심 학습자 경험을 유지하면서도 **가시 코드의 약 25~40%를 제거하거나 평탄화할 가능성**이 있다. 이 수치는 정적 분석에 기반한 방향성 추정이며, 실제 삭제량은 자료실 공동 편집과 관리자 AI 채팅을 제품 요구로 유지할지에 따라 달라진다.

## 2. 분석 범위와 한계

Repomix 스냅샷에는 786개 파일, 약 73,500줄이 포함되어 있다. 주요 영역별 규모는 다음과 같다.

| 영역                         | 파일 수 |    줄 수 |
| ---------------------------- | ------: | -------: |
| `apps/admin`                 |     169 |   17,038 |
| `packages/ui`                |     118 |   12,351 |
| `packages/core`              |     109 |   10,124 |
| `apps/web`                   |     109 |   10,197 |
| `apps/admin-api`             |      45 |    4,771 |
| `packages/db`                |      28 |    4,413 |
| `packages/resource-document` |      13 |    2,968 |
| `packages/contracts`         |      44 |    1,739 |
| `apps/api`                   |      40 |    1,561 |
| 기타 패키지·인프라·루트      |     131 | 약 8,400 |

스냅샷 생성 규칙상 `scripts`, `docs`, `apps/storybook`, `packages/config`, 일부 테스트와 실험 디렉터리가 제외되어 있다. 따라서 다음 판단은 구분해서 봐야 한다.

- 제품 코드와 공개된 아키텍처에 대한 평가는 비교적 확실하다.
- 자동화는 루트 `package.json`, GitHub Actions, Lefthook, 배포 설정을 통해 구조를 평가했지만, 제외된 각 스크립트의 내부 구현까지 모두 검증한 것은 아니다.
- UI 미사용 탐지는 제공된 제품 코드의 정적 import 그래프 기준이다. 제외된 Storybook에서 사용되는 컴포넌트는 있을 수 있으나, Storybook 전용 사용은 제품 유지 필요성을 자동으로 증명하지 않는다.

## 3. 전체 판정

| 영역                         | 판정                 | 설명                                                                                                                            |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 학습자 레슨 상태와 답변 저장 | 대체로 적정          | 상태 전이, 재시도, AI 피드백, 저장 순서에는 실제 복잡성이 존재한다. 다만 타입 경유 계층은 줄일 수 있다.                         |
| 관리자 콘텐츠 편집           | 부분 과대            | 실제 편집 기능보다 타입/폼/registry 구조가 앞서 있다.                                                                           |
| 관리자 자료실                | 심각한 과대 설계     | Yjs, WebSocket, transaction queue, projection worker, snapshot, FTS, active editor 수, 부하 테스트까지 별도 협업 제품 수준이다. |
| API 계약과 클라이언트        | 과도한 중복          | 공유 Zod DTO, OpenAPI 생성 타입, 앱 모델, 매퍼, 포트가 동시에 존재한다.                                                         |
| `packages/core` 계층         | 부분 과대            | 유효한 정책 분리는 있지만, 1개 구현을 위한 port/adapter와 무의미한 재수출 파일이 많다.                                          |
| 공유 UI                      | 재고 과다            | 제품에서 도달되지 않는 프리미티브가 다수 포함되어 있다.                                                                         |
| 테스트                       | 양보다 결합도가 문제 | 중요한 정책 테스트도 있으나, DOM 구조·문구·CSS·서드파티 동작에 묶인 저신호 테스트가 많다.                                       |
| CI·배포 자동화               | 현재 단계 대비 과함  | 단일 서버·SQLite 초기 범위인데 릴리스 공급망과 저장소 정책 시스템은 성숙 조직 수준이다.                                         |
| 보안·데이터 보호             | 유지 필요            | 인증 분리, DB transaction, 백업·복구, request 제한, origin 검증 등은 제거 대상이 아니다.                                        |

## 4. 최우선 발견 사항

### 4.1 관리자 자료실은 기능이 아니라 별도의 플랫폼이 되었다

자료실 관련 코드는 정적 분류 기준 약 89개 파일, 16,100줄이다. 테스트를 제외한 제품 코드만 약 13,900줄이다. 비교를 위해 학습자 레슨·콘텐츠·학습 정책 관련 묶음은 약 7,700줄이다.

자료실은 현재 다음 개념을 모두 가진다.

- 무제한 트리, 정렬, 이동, 복원, 휴지통
- FTS 검색과 Markdown import/export
- Lexical WYSIWYG와 커스텀 이미지·표·구분선 노드
- slash menu, floating toolbar, experimental draggable block
- Yjs 문서와 Lexical binding
- HTTP update transaction, transaction ID, state version, content revision
- client-side batching queue와 재시도
- WebSocket workspace event, subscribe/unsubscribe, heartbeat
- 연결 수·IP·actor·메시지·구독 rate limit과 backpressure
- 원격 상태 검증용 별도 Yjs document mirror
- snapshot projection worker와 timeout
- update, snapshot, node count, transaction count quota
- 활성 편집자 수 조회 후 삭제 허용
- 두 브라우저 context 수렴 테스트
- 20-client 부하 fixture와 p50/p95/p99 임계값

이 대부분은 “운영 문서를 편집한다”는 제품 가치가 아니라 “여러 관리자가 동시에 안전하게 편집한다”는 고급 협업 요구에서 발생한다.

#### 권고

실시간 공동 편집이 실제 운영에서 검증된 필수 요구가 아니라면 Yjs와 WebSocket 계층을 제거한다.

가장 단순한 대체 모델은 다음과 같다.

```text
resource_document
- id
- name
- markdown 또는 lexical_json
- version
- updated_at
- updated_by
```

저장은 `PUT /resources/documents/:id`에 `expectedVersion`을 보내고, 서버는 하나의 SQLite transaction에서 비교 후 갱신한다.

- 일치: 저장 후 `version + 1`
- 불일치: `409 Conflict`, 최신 문서와 로컬 Markdown 복사 기능 제공
- 자동 저장이 필요하면 500~1000ms debounce만 사용
- 다른 사용자의 변경 알림이 필요하면 편집 중 실시간 동기화가 아니라 단순 revision polling 또는 SSE invalidation만 사용

이 모델은 충돌을 숨기지 않지만 내부 관리자 수가 적은 제품에는 충분히 안전하고 설명 가능하다.

#### 예상 효과

Yjs collaboration, WebSocket hub, transaction queue, sync repository, projection worker, snapshot/update 계약, 부하 테스트의 상당 부분을 제거할 수 있다. 트리·검색·휴지통·Markdown 편집을 유지하더라도 약 8,000~12,000줄의 감소 가능성이 있다.

확신도: 높음  
제품 결정 위험: 높음 — 동시 편집이 실제 핵심 요구라면 유지해야 한다.

### 4.2 하나의 API 응답이 너무 많은 형태를 거친다

진행 상태: [`api-response-contract-simplification-implementation-plan-2026-07-16.md`](./api-response-contract-simplification-implementation-plan-2026-07-16.md)의 단계 1을 완료했다. 정적 OpenAPI JSON, generated TypeScript 타입, 중간 contract 추출 파일과 생성 drift 검사를 제거했고, strict 공유 계약·canonical 오류·서버 응답 runtime 검증을 적용했다. feature identity mapper와 legacy 학습 mutation 제거는 후속 단계에 남아 있다.

학습자 웹의 전형적인 데이터 경로는 다음과 같다.

```text
packages/contracts의 Zod DTO
→ Hono route/OpenAPI
→ 생성된 writing-app-api.d.ts
→ writing-app-api-contract.ts의 응답 타입 추출
→ create-http-writing-app-api.ts의 runtime schema
→ course/lesson/profile API mapper
→ 앱 전용 Course/Lesson/Profile 타입
→ WritingAppApi 포트
→ ApiResult
→ RouteApiOutcome
→ 화면
```

문제는 경계가 많다는 사실 자체가 아니라, 상당수 변환이 의미를 바꾸지 않는다는 점이다.

예를 들어 관리자 분석 API는 `AdminAnalyticsDto`를 다시 같은 필드를 가진 `AdminAnalytics`로 선언하고, 배열 원소를 `{ ...item }`으로 복사한다. 학습자 profile, course, progress도 상당 부분이 1:1 복사다. 이 경우 별도 앱 모델은 독립성을 제공하지 않고 동기화 의무만 만든다.

또한 현재 시스템은 두 계약 전략을 동시에 사용한다.

1. 서버와 클라이언트가 `packages/contracts`의 Zod 계약을 직접 공유한다.
2. OpenAPI를 생성하고 다시 TypeScript 타입을 생성해 클라이언트 계약으로 감싼다.

둘 중 하나만 canonical이어야 한다.

#### 권고

현재와 같은 단일 TypeScript 모노레포에서는 다음 전략이 가장 단순하다.

- `packages/contracts`를 HTTP 요청·응답의 유일한 canonical source로 둔다.
- 서버와 클라이언트가 동일한 Zod schema 및 `z.infer` 타입을 직접 사용한다.
- OpenAPI는 외부 문서와 계약 검증 산출물로만 생성한다.
- 생성된 TypeScript 응답 타입을 제품 런타임 타입 경로에서 제거한다.
- DTO와 화면 모델이 실질적으로 같으면 매퍼를 제거한다.
- 날짜 파싱, 명칭 변경, 정규화처럼 의미 있는 변환이 있을 때만 mapper를 둔다.
- `WritingAppApi`에는 DTO 기반 메서드만 남기고 입력/출력 복제 타입을 제거한다.

대안은 OpenAPI 생성 클라이언트를 단일 기준으로 삼고 공유 클라이언트 DTO를 제거하는 것이다. 그러나 현재 서버와 웹이 같은 모노레포에 있고 런타임 검증도 Zod로 수행하므로, 공유 계약 방식이 더 직접적이다.

확신도: 높음  
변경 위험: 중간

### 4.3 Clean Architecture의 이름은 있으나 격리가 없는 파일이 많다

`packages/core`에는 `api`, `domain`, `application/ports`, `application/use-cases`, `infrastructure`, `composition` 계층이 있다. 큰 정책에서는 유효하지만 작은 모듈에도 동일한 물리 구조가 적용된다.

정적 탐지 결과, import/export만 수행하는 forwarding 파일이 최소 43개였고, 그중 28개는 사실상 한 줄 `export * from ...` 파일이다. 대표적으로 다음 파일들은 `contracts`를 다시 노출할 뿐 새로운 의미를 추가하지 않는다.

- `packages/core/src/modules/content/domain/steps/*.dto.ts`
- `packages/core/src/modules/content/domain/content.dto.ts`
- `packages/core/src/modules/content/domain/content.ids.ts`
- `packages/core/src/modules/learning/domain/*.dto.ts`
- `packages/core/src/shared/kernel/status.ts`
- `apps/web/src/features/lessons/lesson-{logic,types,step-policy}.ts`
- `apps/admin/src/features/step-debug/step-{logic,types,policy}.ts`

이 파일들은 의존성 역전을 만들지 않는다. 이름만 바꾼 경유지다.

#### 권고

- 재수출만 하는 `domain/*.dto.ts`를 삭제하고 canonical 계약을 직접 import한다.
- 모듈의 public facade는 소비자가 2곳 이상이고 내부 구조를 실제로 감출 때만 둔다.
- repository port는 두 번째 구현, 외부 I/O 격리, 또는 테스트 대역이 실질적인 이득을 줄 때만 둔다.
- 구현이 하나이고 단순한 SQLite query라면 use case가 구체 repository 함수를 직접 받아도 된다.
- 작은 모듈은 `module.ts`, `repository.ts`, `policy.ts` 정도로 평탄화한다.
- 폴더 구조를 모든 모듈에 균등하게 적용하지 말고 복잡성에 비례해 사용한다.

좋은 기준은 다음과 같다.

> 두 번째 구현이 없고, 경계에서 의미 변환도 없고, 실패 격리도 제공하지 않는 추상화는 만들지 않는다.

확신도: 높음  
변경 위험: 낮음~중간

### 4.4 공유 UI는 사용 자산보다 재고가 더 많다

제공된 제품 코드의 import 그래프를 기준으로 `packages/ui`의 외부 사용 entrypoint를 추적했다. 테스트를 제외한 UI 컴포넌트 중 40개, 약 4,800줄이 현재 제품 코드에서 도달되지 않았다.

대표 예시는 다음과 같다.

- `sidebar`, `chart`, `combobox`, `menubar`, `context-menu`
- `calendar`, `carousel`, `attachment`, `command`, `navigation-menu`
- `input-group`, `sheet`, `pagination`, `message-scroller`, `bubble`
- `breadcrumb`, `avatar`, `toggle-group`, `button-group`, `input-otp`
- `tooltip`, `slider`, `hover-card`, `sonner`, `radio-group`, `switch`

Storybook에서 사용될 수 있으나, shadcn/Base UI 컴포넌트는 필요할 때 다시 생성하는 비용이 낮다. 반면 저장소에 남겨두면 다음 비용이 계속 발생한다.

- React/Base UI/Tailwind 업그레이드 대응
- lint/typecheck/test 대상 증가
- 디자인 토큰 변경의 영향 범위 증가
- 에이전트가 존재만 보고 잘못 재사용하는 확률 증가
- 실제 지원 컴포넌트와 단순 재고의 구분 약화

#### 권고

- 제품 또는 확정된 디자인 시스템에서 사용하지 않는 프리미티브를 삭제한다.
- Storybook은 “보유 가능한 모든 컴포넌트”가 아니라 “현재 지원하는 컴포넌트”만 보여준다.
- 필요 시 shadcn registry에서 재생성한다.
- 컴포넌트 추가는 실제 화면 PR과 같은 변경 단위에서만 허용한다.

확신도: 중간~높음  
변경 위험: 낮음

### 4.5 저장소 자동화가 제품 변경의 기본 경로를 지배한다

루트 `package.json`에는 53개 script가 있으며, 그중 `check:*`가 18개, `test*`가 11개다. `lint` 명령은 일반 코드 lint 전에 다음과 같은 저장소·배포 정책 검사를 연쇄 실행한다.

- toolchain
- workspace inventory와 dependency version
- document drift
- API contract
- component config
- container image lock
- registry retention policy
- design-system guardrail
- import cycle
- package interface
- localhost literal

Lefthook pre-commit도 포맷과 staged lint 외에 workspace inventory, document drift, components config, import cycle, package interface를 실행한다.

PR/main 품질 workflow는 10개 job을 가지며, 별도 image release workflow는 4개 image에 대해 candidate tag, SBOM, provenance, Grype scan, custom vulnerability policy, release tag 승격, attestation, digest record, aggregate manifest를 수행한다.

이 수준은 공급망 통제가 중요한 성숙한 공용 서비스에는 합리적일 수 있다. 그러나 현재 명시된 운영 범위는 단일 Ubuntu 서버와 로컬 SQLite다. 현재 단계에서는 “발생한 위험”보다 “미래에 발생할 수 있는 모든 위험”을 자동화한 흔적이 강하다.

#### 권고

명령의 의미를 다시 분리한다.

```text
lint
- oxlint만 수행

verify
- format check
- lint
- typecheck
- unit/integration test
- build

verify:architecture
- import cycle
- package boundary
- API contract

verify:release
- image build
- vulnerability scan
- deployment config
- backup/restore smoke
```

- pre-commit은 format + staged lint만 둔다.
- repo-wide architecture 검사는 PR CI에서만 수행한다.
- Ansible bootstrap, image smoke, backup/restore는 main, 수동, 정기 workflow로 이동한다.
- bundle budget은 실제 회귀가 빈번한 핵심 route만 유지한다.
- custom checker는 “실제로 반복 발생한 결함”과 “표준 도구로 대체 불가” 두 조건을 모두 만족할 때만 유지한다.
- 하나의 checker가 다른 checker의 inventory/reporting을 검증하는 메타 검증은 줄인다.
- audit ignore 목록은 명령행에 19개 ID를 영구 나열하지 말고 owner, 이유, 만료일이 있는 단일 예외 파일로 관리한다.

확신도: 높음  
변경 위험: 낮음

## 5. 제품 범위 자체에서 재검토할 기능

### 5.1 관리자 AI 채팅

관리자 AI 채팅은 프론트엔드, Next proxy stream route, SSE parser, Hono streaming route, request guard, Mastra agent, 대화·메시지 persistence, 계약, use case까지 약 2,000줄을 사용한다.

이는 단순 “문구 생성” 기능이 아니라 작은 대화 제품이다.

다음 질문에 명확한 근거가 없다면 제거하거나 단순화한다.

- 관리자가 반복적으로 사용하는가?
- 대화 이력 영속화가 필요한가?
- 일반 ChatGPT가 아니라 제품 안에 있어야 하는 이유가 있는가?
- 실제 커리큘럼 편집 흐름과 연결되어 있는가?
- 모델 호출 비용과 결과 품질을 측정하는가?

대체안은 코스/레슨 편집 화면의 특정 필드에서 실행하는 단발성 “초안 생성/개선” action이다. 이 경우 conversation list, 메시지 persistence, SSE framing, 별도 채팅 UI를 제거할 수 있다.

판정: 사용 증거가 없으면 삭제 우선  
확신도: 중간

### 5.2 Step Debug 화면

`step-debug`는 약 1,000줄이며, 자체 syntax highlighter와 Zod 내부 `_def`를 읽는 TypeScript 타입 printer를 포함한다. 이는 Zod 버전 변경에 취약하고 제품 런타임 코드에 유지할 이유가 약하다.

- Storybook 또는 독립 개발 fixture로 이동
- schema는 단순 JSON 또는 공식 JSON Schema 변환으로 표시
- 제품 admin navigation에서 제거
- 실제 editor preview가 완성되면 debug page 삭제

판정: 제품 코드에서 제거  
확신도: 높음

### 5.3 Dashboard와 Analytics

dashboard와 analytics 관련 구현은 약 2,100줄이다. 별도 query repository, route, client model, chart lazy loading, summary panel이 존재한다.

두 화면이 서로 다른 운영 의사결정을 지원하지 않는다면 하나의 운영 현황 화면으로 합친다. 특히 세 개의 작은 Recharts chart에 대해 dynamic import, IntersectionObserver, loading fallback, error boundary를 모두 사용하는 것은 측정 근거가 없는 최적화다.

판정: 화면·query 통합 검토  
확신도: 중간

### 5.4 관리자 코스 편집기

코스 편집기는 약 2,600줄이며 10개 step type별 form, registry, reducer, preview를 가진다. 그러나 상당수 form은 `defaultValue`와 JSON textarea를 보여주는 수준이다.

현재 구현은 “완성된 편집 제품”과 “원시 JSON 편집 도구” 사이에 있다. 두 방향 중 하나를 선택해야 한다.

- 운영자가 실제로 자주 편집한다면 validation, dirty state, save semantics, field-level editing을 완성한다.
- 초기 운영에서 콘텐츠 변경 빈도가 낮다면 검증된 JSON/Markdown 기반 내부 도구로 단순화한다.

`stepFormByType` registry와 같은 타입을 다시 분기하는 exhaustive `switch`가 동시에 있는 구조는 하나만 남긴다.

판정: 반제품 추상화 제거  
확신도: 중간~높음

## 6. 중간 우선순위 기술 단순화

### 6.1 Result 타입을 경계마다 재포장하지 않는다

현재 최소 다음 결과 표현이 공존한다.

- core `Result<T, E>`: `kind: "ok" | "err"`
- HTTP client `HttpApiResult<T, E>`: `status: "ok" | "error"`
- web/admin의 `ApiResult` alias와 constructor
- route 전용 `RouteApiOutcome`
- Hono `AppError`와 HTTP response error

경계마다 의미가 달라야 할 때는 변환이 필요하지만, 같은 성공/실패를 이름만 바꾸는 변환은 제거한다.

권고:

- core 내부는 throw 또는 하나의 `Result` 중 하나로 통일
- HTTP adapter는 `ApiResult` 하나만 사용
- route는 `result.error.code`를 직접 분기하거나 공통 route helper 사용
- constructor alias만 제공하는 `apiOk`, `adminApiOk` 등은 제거

### 6.2 작은 공유 패키지는 workspace가 아니라 파일일 수 있다

현재 소스 기준 크기는 다음과 같다.

| 패키지                        | 소스 줄 수 |
| ----------------------------- | ---------: |
| `packages/http-client`        |         96 |
| `packages/env`                |        209 |
| `packages/logger`             |        217 |
| `packages/hono`               |        530 |
| `packages/repository-tooling` |        935 |

작다는 이유만으로 합칠 필요는 없지만, 별도 version boundary나 독립적인 변화 주기가 없다면 workspace는 과한 단위다.

- `http-client`는 web/admin 공통 API client 모듈 안으로 흡수 가능
- `repository-tooling`은 제품 workspace가 아니라 root `scripts/lib`로 이동 가능
- `env`, `logger`, `hono`는 두 API가 계속 분리되어 있다면 유지할 수 있음
- 향후 API를 합치면 `env/logger/hono`도 app-local로 단순화 가능

### 6.3 아이콘 래퍼를 줄인다

`packages/ui/components/icons.tsx`는 Lucide를 재수출하면서 일부 Lucide SVG를 다시 직접 구현한다. 제품 고유 아이콘이 아니라면 직접 `lucide-react`를 사용하고 수동 SVG wrapper를 제거한다.

### 6.4 정적 asset을 다른 앱의 파일시스템에서 읽지 않는다

관리자 course thumbnail route는 런타임에서 sibling `apps/web/public` 디렉터리를 읽고 Promise cache로 응답한다. 이는 배포 구조와 작업 디렉터리 배치에 대한 숨은 결합이다.

- admin public에 필요한 asset을 복사
- build 시 공유 asset package에서 복사
- 외부 object storage/CDN 사용

중 하나로 바꾸고 런타임 proxy를 제거한다.

### 6.5 테스트는 구현 모양보다 위험을 검증한다

큰 테스트 파일에는 가치 있는 상태 전이 검증이 있으나 다음 패턴은 줄여야 한다.

- Tailwind class 문자열 직접 검증
- 긴 화면 문구의 반복 검증
- 서드파티 drag/drop geometry를 JSDOM에서 상세 모킹
- route가 단순 prop 전달을 하는지 확인하는 테스트
- UI primitive 내부 구현을 다시 검증하는 테스트

남겨야 하는 테스트는 다음이다.

- 학습 진행 state machine과 저장 순서
- 답변 grading 정책
- 인증·권한 경계
- DB transaction과 idempotency
- conflict/rollback/backup 복구
- 핵심 사용자 흐름 1~2개의 E2E

## 7. 제거하면 안 되는 복잡성

다음은 단순화를 이유로 제거하지 않는 것이 좋다.

- 학습자 인증과 관리자 인증의 권한 분리
- owner 전용 파괴적 명령 authorization
- SQLite migration과 transaction
- 답변 저장 및 AI 피드백 idempotency
- 운영 DB 백업과 실제 restore 검증
- request body limit, trusted origin/CORS, CSP
- 비밀값과 공개 runtime config의 분리
- 네트워크 실패를 빈 데이터로 숨기지 않는 오류 처리
- 학습 레슨의 명시적 상태 전이
- 외부 입력에서의 Zod runtime validation

단, 각각은 한 계층에서만 canonical하게 표현해야 한다.

## 8. 권장 목표 구조

### 8.1 보수적 목표

배포 앱 4개는 우선 유지하되 내부 계층을 줄이는 안이다.

```text
apps/
  web
  api
  admin
  admin-api
packages/
  contracts
  core
  db
  ui
  platform       # 필요 시 env/hono/logger/http 공통만
  config
```

- `resource-document`는 Markdown/Lexical 변환 utility로 축소하거나 admin 내부로 이동
- `repository-tooling`은 root scripts로 이동
- OpenAPI 생성 타입은 문서/CI 산출물로만 사용
- 앱 모델과 DTO가 동일하면 DTO를 직접 사용
- small module의 port/adapter 폴더를 평탄화

### 8.2 적극적 목표

단일 서버·단일 SQLite라는 실제 운영 경계에 맞추는 안이다.

```text
배포 단위
1. learner web
2. admin web
3. API 하나 또는 각 Next 앱의 server route
```

관리자와 학습자 인증은 route namespace와 DB table로 계속 분리한다. 현재 네 이미지가 같은 host와 DB에 의존하므로 API 프로세스 분리가 제공하는 가용성 이점은 제한적이다.

이 변경은 P0 단순화 후에만 검토한다. 먼저 중복 계약과 자료실 실시간 계층을 제거해야 병합의 실제 비용을 정확히 볼 수 있다.

## 9. 실행 순서

### 단계 1. 즉시 삭제 가능한 면적

1. 제품 import graph에서 도달되지 않는 UI 프리미티브 삭제
2. 한 줄 재수출·proxy 파일 삭제
3. identity mapper와 중복 DTO 제거
4. `stepFormByType`와 `switch` 이중 dispatch 제거
5. chart lazy loading과 thumbnail runtime proxy 단순화
6. pre-commit을 format + staged lint로 축소
7. `lint`에서 배포·문서·registry 검사를 분리

이 단계는 제품 동작을 바꾸지 않고 구조 비용만 줄인다.

### 단계 2. 제품 가치가 불명확한 기능 정리

각 기능에 최근 사용 빈도, 운영자, 성공 지표를 요구한다.

- 관리자 AI 채팅
- Step Debug
- dashboard/analytics 중복
- Storybook 전용 UI 재고

근거가 없으면 삭제한다. “나중에 쓸 수 있음”은 유지 근거로 인정하지 않는다.

### 단계 3. 자료실 공동 편집 제거 실험

별도 branch에서 다음 vertical slice를 구현한다.

- Markdown/JSON 단일 문서 저장
- expectedVersion conflict
- debounce autosave
- 409 시 최신본 reload와 로컬 복사
- tree/search/trash 유지

기존 Yjs 방식과 사용자 기능 차이를 비교한 뒤 실시간 요구가 실제로 필요한지 판단한다.

### 단계 4. 패키지와 배포 단위 축소

- `http-client`, `repository-tooling` 경계 재검토
- API 두 개 통합 또는 Next server 경계 실험
- Docker image 수와 origin/env 수 감소
- CI job과 release manifest 단순화

이 단계는 앞 단계에서 코드 면적이 줄어든 후 수행해야 한다.

## 10. 앞으로 적용할 복잡성 예산 규칙

1. **두 번째 구현 규칙**  
   두 번째 구현이 없으면 interface/port를 기본적으로 만들지 않는다.

2. **의미 변환 규칙**  
   필드명을 그대로 복사하는 mapper는 만들지 않는다.

3. **한 계약 규칙**  
   shared Zod와 generated OpenAPI type을 동시에 canonical하게 사용하지 않는다.

4. **한 실패 모델 규칙**  
   같은 성공/실패를 세 개 이상의 discriminated union으로 재포장하지 않는다.

5. **사용 시점 생성 규칙**  
   UI primitive와 infrastructure helper는 실제 소비 기능과 같은 PR에서 추가한다.

6. **검증된 결함 규칙**  
   custom checker는 과거 결함 사례와 표준 도구로 해결할 수 없는 이유가 있을 때만 추가한다.

7. **영속 상태 비용 규칙**  
   새 table, revision, event, queue, background worker는 구현 난이도와 무관하게 높은 비용으로 간주한다.

8. **삭제 가능성 규칙**  
   생성 코드와 shadcn component는 보관보다 재생성을 우선한다.

9. **운영 현실 규칙**  
   단일 서버·단일 DB 제품에 다중 시스템 수준의 가용성·배포 복잡성을 선반영하지 않는다.

10. **제품 증거 규칙**  
    전용 UI, persistence, streaming을 가진 기능은 사용자·사용 빈도·성공 지표가 없으면 만들지 않는다.

## 11. 최종 우선순위

| 순위 | 작업                                                       | 예상 효과                   | 위험                |
| ---: | ---------------------------------------------------------- | --------------------------- | ------------------- |
|    1 | 자료실 Yjs/WebSocket 공동 편집을 versioned save로 대체     | 가장 큰 코드·실패 모드 감소 | 제품 요구 확인 필요 |
|    2 | API 계약·앱 모델·매퍼를 하나의 DTO 흐름으로 통합           | 전역 변경 비용 감소         | 중간                |
|    3 | 미사용 UI 프리미티브 삭제                                  | 약 4,800줄 후보 제거        | 낮음                |
|    4 | lint/pre-commit/CI 책임 재분리                             | 개발 피드백과 진단 단순화   | 낮음                |
|    5 | 관리자 AI 채팅과 Step Debug 재평가                         | 약 3,000줄 및 의존성 축소   | 제품 결정 필요      |
|    6 | core 재수출·port/adapter 평탄화                            | 파일·개념 수 감소           | 낮음~중간           |
|    7 | dashboard/analytics 통합과 불필요한 lazy optimization 제거 | UI·query 중복 감소          | 낮음                |
|    8 | 작은 workspace와 4개 deployable 재검토                     | 운영·release 복잡성 감소    | 높음                |

핵심은 “코드를 더 잘 정리하는 것”이 아니라 **유지할 필요가 없는 시스템을 없애는 것**이다. 가장 먼저 자료실 실시간 협업, 중복 계약 경로, 저장소 메타 자동화라는 세 개의 독립 제품을 축소해야 한다.
