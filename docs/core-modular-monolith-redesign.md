# Core 모듈러 모놀리스 재설계

## 2026-06-18 시작

- 목표는 `packages/core`를 Hono transport와 분리된 비즈니스 로직 패키지로 재정렬하는 것이다.
- Hono 앱은 `@workspace/core/modules/*`의 public facade만 호출하고, core 내부의 domain, application, infrastructure 구현을 알지 못해야 한다.
- core 내부는 `shared`, `modules`, `composition`으로 나눈다.
- `shared`는 브랜드 타입, Result, 에러, 이벤트 버스, 요청 컨텍스트, Unit of Work 같은 cross-cutting interface를 제공한다.
- `modules/*/api/index.ts`는 외부 호출자가 사용할 좁은 interface이며, module 내부 구현은 가능한 한 이 interface 뒤에 둔다.
- 유스케이스는 예외 기반 흐름 대신 `AppResult` 또는 `AppAsyncResult`를 반환하는 방향으로 확장한다.
- 모듈 간 직접 호출은 지양하고, 후속 반응은 `shared/event-bus`와 `composition/event-wiring.ts`에서 연결한다.
- 현재 앱 호출부와 관리자 화면은 이미 배포 가능한 surface를 사용하고 있으므로, 이번 작업은 학습자 core부터 새 구조로 옮기고 기존 export는 호환 계층으로 유지한다.

## 2026-06-18 완료

- `packages/core/src/shared`에 `kernel`, `result`, `errors`, `event-bus`, `context`, `unit-of-work` 기반을 추가했다.
- `shared/result`는 `neverthrow` 기반 `AppResult`, `AppAsyncResult`를 제공하고, 기존 discriminated union `Result`, `ok`, `err`는 호환을 위해 유지한다.
- 학습자 핵심 모듈을 `modules/auth`, `modules/content`, `modules/learning`, `modules/ai-feedback` 아래의 `domain`, `application`, `infrastructure`, `api` 구조로 재배치했다.
- `modules/*/index.ts`는 각 module의 `api` facade만 re-export한다.
- 기존 `@workspace/core/{auth,content,learning,ai-feedback,result,status}` 경로는 앱과 관리자 화면의 점진 전환을 위해 얇은 호환 계층으로 유지했다.
- `composition/bootstrap.ts`는 학습자 API 런타임 조립을 담당하고, `composition/container.ts`, `composition/event-wiring.ts`는 이벤트 기반 wiring이 모일 위치를 제공한다.
- `core architecture` 테스트를 추가해 module root facade 규칙과 domain 계층의 runtime adapter 의존 금지를 검증한다.
- `content` domain과 `shared/kernel/status`에서 DB persisted value import를 제거해 domain/shared 계층이 DB primitive에 기대지 않도록 했다.

## 검증

- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/core test`
- `bun --filter @workspace/core lint`
- `bun run typecheck`
- `bun run lint`
- `bun run format:check`
- `bun run test`
- `bun run build`

## 2026-06-18 strict modules 정리 시작

- 이전 완료 단계에서는 앱 호환성을 위해 `src/auth`, `src/content`, `src/learning`, `src/ai-feedback`, `src/admin` 같은 top-level shim과 legacy 위치를 남겼다.
- 이는 package export 호환성은 좋지만, repository tree에서 core implementation이 `modules` 아래로 모였다는 신호가 약하다.
- strict 정리에서는 `packages/core/src` 직하위를 `shared`, `modules`, `composition`, `index.ts`, architecture test만 남기는 구조로 맞춘다.
- 기존 public import 호환성은 source shim 파일이 아니라 `package.json` export map이 새 파일 위치를 직접 가리키는 방식으로 유지한다.

## 2026-06-18 strict modules 정리 완료

- `src/admin`, `src/auth`, `src/content`, `src/learning`, `src/ai-feedback` legacy 디렉터리와 `src/result.ts`, `src/status.ts`, `src/learner-api-core.ts` shim을 제거했다.
- 관리자 core도 `modules/admin` 아래로 이동하고 `api`, `domain`, `application`, `infrastructure` 구조를 적용했다.
- `packages/core/src` 직하위는 이제 `architecture.test.ts`, `composition`, `index.ts`, `modules`, `shared`만 가진다.
- `package.json` export map은 기존 `@workspace/core/admin`, `@workspace/core/content`, `@workspace/core/status` 같은 public import를 source shim 없이 새 module/shared 위치로 직접 연결한다.
- core 내부 import는 legacy public path가 아니라 `modules/*`와 `shared/*`의 실제 위치를 참조하도록 정리했다.
- `architecture.test.ts`에 `src` 직하위 허용 목록 검사를 추가해 top-level legacy 디렉터리가 다시 생기면 실패하게 했다.
- admin domain의 role 값도 DB persisted value import 대신 core domain 값으로 소유하게 해 domain 계층의 runtime adapter 의존 금지 규칙을 통과시켰다.

## strict modules 검증

- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/core test`
- `bun --filter @workspace/core lint`
- `bun run typecheck`
- `bun run lint`
- `bun run format:check`
- `bun run build`
- `bun run test`
