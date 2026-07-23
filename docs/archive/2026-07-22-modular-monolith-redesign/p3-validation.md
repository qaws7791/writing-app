# P3 구현 증거

## 검증된 구현

- `db`, `auth`, `http-client`를 `packages/infra`로 옮겼다. DB connection·transaction은 schema를 주입받는 primitive이고, auth는 learner/admin runtime과 Better Auth schema·migration을 소유한다. 기존 module schema와 제품 정책의 임시 잔존 항목은 제거 단계가 있는 전환 inventory로 고정했다.
- `ai`, `event-bus`, `storage`, `observability`, `http-platform` workspace를 만들었다. 외부 SDK 직접 import, `process.env`, app·module 의존과 제품별 prompt·object key·권한 정책의 유입은 architecture·package interface gate가 거부한다.
- HTTP client는 success, HTTP, contract, network 결과를 구분하고 consumer가 전달한 schema를 실행한다. network cause는 진단 값으로만 보존하며 query를 제거한 URL과 기존 호환 `code`를 함께 제공한다.
- AI factory는 key·timeout·AbortSignal을 검증하고 provider 실패를 typed error로 정규화한다. lifecycle은 idempotent close와 부분 초기화 실패 cleanup을 보장한다.
- event bus는 Emittery 기반의 `best-effort-process-local` 전달만 제공한다. `publish`는 모든 listener 완료를 기다리는 `ResultAsync`이며 다중 실패 cause를 보존하고, durable projection 사용은 정적 검사로 금지한다.
- storage는 validated S3-compatible config와 typed error를 제공한다. SDK retry만 사용하고 object key·MIME·ownership·document 관계와 application retry는 소비 module에 남긴다.
- observability는 Pino root·child logger, 공통 event와 shutdown을 소유한다. secret·credential·session token·원문 답안·불필요한 개인정보 redaction과 flush 실패 관측을 test한다.
- HTTP platform은 Hono context, 공통 OpenAPI helper, request ID·logging과 security middleware를 소유한다. 제품별 audit·endpoint contract는 API에 남겼고, 예상하지 못한 500 응답은 내부 원인을 숨기면서 request ID를 반환한다.

## 자동 검증

권위 package manager인 Bun 1.3.10으로 다음 결과를 확인했다.

- infra 8개 package의 25개 test file·113개 test와 typecheck 통과
- API 52개 file·253개, admin 43개 file·113개, web 33개 file·91개 회귀 test 통과
- 23-workspace root typecheck·test와 web·admin·Storybook build 통과
- workspace inventory·dependency version, architecture, dead-code, package interface, document drift, Oxfmt·Oxlint 통과
- frozen lockfile install은 변경 없이 통과

pre-commit hook은 종료 코드 0이었지만 staged file이 없어 hook 작업은 skip됐다. 같은 검사는 root 전체 범위의 lint·typecheck·test·format 명령으로 별도 통과시켰다.

로컬 기본 Bun 1.3.14에서는 P0에 기록된 Lexical ESM cycle과 `port: 0` 문제가 동일하게 재현됐다. 같은 격리 계약과 lifecycle test는 저장소가 고정한 Bun 1.3.10에서 통과했으므로 P3 source 회귀와 실행기 차이를 분리해 판정했다.

## 선택과 trade-off

- provider별 infra package는 SDK 교체와 장애 격리, secret 경계를 명확하게 하지만 workspace·manifest·composition 코드가 늘어난다. explicit subpath와 자동 inventory로 이 유지보수 비용을 제한했다.
- DB가 통합 migration을 조립하기 위해 auth schema를 소비하고 기존 module schema를 임시 공개하는 상태는 단기 전환 비용이다. 이를 영구 구조로 오인하지 않도록 P4~P9·P11 제거 ID와 정적 inventory를 연결했다.
- process-local event bus는 단순하고 빠르지만 재시작·재전달·순서를 보장하지 않는다. 따라서 durable projection에는 사용할 수 없으며 장기적으로 필요해지면 outbox 같은 별도 전달 계약이 필요하다.
- provider SDK retry와 application retry를 중복하지 않아 요청 폭증 위험을 줄였지만, 제품별 재시도 판단은 후속 module application 계층이 명시적으로 소유해야 한다.

## 추론과 제한

source 이동과 동일한 회귀 계약으로 사용자 동작과 성능이 유지됐다는 판단은 추론이다. 외부 OpenAI·object storage 실서비스 호출, production traffic, 부하·지연 benchmark와 실제 운영 복구는 수행하지 않았으므로 검증된 사실로 간주하지 않는다. P3는 infra 기반만 완성했으며 auth의 제품 profile·role policy와 DB의 module schema 제거는 연결된 후속 단계가 완료되어야 한다.
