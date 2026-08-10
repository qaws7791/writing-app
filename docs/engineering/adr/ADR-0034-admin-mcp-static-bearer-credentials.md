# ADR-0034: 관리자 MCP 정적 bearer credential

## 상태

채택됨

이 결정은 [ADR-0033](./ADR-0033-admin-mcp-oauth-principal-separation.md)의 OAuth 인증과 strict-only protocol 결정을 대체한다.

이 결정은 modern MCP `2026-07-28` 요청 수용을 필수로 유지한다.

이 결정은 [ADR-0031](./ADR-0031-admin-mcp-owner-approved-content-changes.md)과 [ADR-0032](./ADR-0032-admin-mcp-tiered-execution-policy.md)의 OAuth client ID binding을 MCP credential ID binding으로 대체한다.

## 날짜

2026-08-10

## 맥락

관리자 MCP에는 개인과 장치 조합을 독립적으로 식별하고 즉시 폐기할 수 있는 인증 수단이 필요하다.

외부 Authorization Server 방식은 discovery, client 등록, introspection, PKCE와 machine client key 운영을 추가한다.

Codex는 Streamable HTTP 서버에 환경 변수 기반 bearer token을 전송하는 공식 설정을 제공한다.

현재 Codex CLI는 claim-less initialize를 사용하는 호환 경로가 필요하다.

관리자 변경 Tool과 conformance 검증에는 modern `2026-07-28` 경로가 필요하다.

## 결정

- 관리자 MCP 공개 endpoint는 HTTPS를 사용한다.
- 관리자 MCP는 modern MCP wire protocol `2026-07-28` 요청을 허용한다.
- 관리자 MCP는 SDK v2의 `legacy: "stateless"` fallback으로 현재 Codex CLI의 claim-less initialize를 허용한다.
- stateless legacy fallback은 조회 Tool만 등록한다.
- stateless legacy fallback은 GET·DELETE session lifecycle을 제공하지 않는다.
- 변경 Tool은 modern 경로에만 등록한다.
- modern 경로와 stateless legacy fallback은 같은 Host·Origin, bearer와 scope 경계를 사용한다.
- 관리자 MCP는 MCP OAuth authorization profile 준수를 주장하지 않는다.
- 관리자 MCP는 OAuth discovery, client 등록, token 발급과 introspection을 구현하지 않는다.
- 관리자 MCP는 SDK v2 `PrivateKeyJwtProvider`를 사용하지 않는다.
- 운영자는 개인과 장치 조합마다 별도 bearer credential을 발급한다.
- 개인과 장치별 발급은 credential 공유를 금지하는 운영 정책이다.
- 서버는 장치 fingerprint를 수집하지 않는다.
- 발급 CLI는 raw token을 한 번만 반환한다.
- 운영자는 raw token을 승인된 개인 secret store로 즉시 옮긴다.
- Git, 배포 설정, API runtime 환경과 로그에는 raw token을 저장하지 않는다.
- 서버는 raw token 대신 SHA-256 digest를 저장한다.
- 저장 row는 credential ID, owner `AdminId`, scope, 생성 시각, 필수 만료 시각과 폐기 시각을 credential lifecycle에 사용한다.
- 발급과 폐기는 같은 transaction에서 append-only lifecycle event를 기록한다.
- 폐기된 credential은 다음 검증부터 즉시 거부한다.
- 만료되거나 폐기된 credential은 재활성화하지 않는다.
- scope가 부족한 credential은 Tool application 호출 전에 거부한다.
- 모든 MCP route는 Host와 Origin을 bearer 검증보다 먼저 확인한다.
- 잘못된 Host 또는 Origin은 credential 조회나 Tool application 호출을 유발하지 않는다.
- 비인증, 형식 오류, 알 수 없음, digest 불일치, 만료와 폐기는 같은 invalid-token 경계로 거부한다.
- 2단계 실행 영수증, 3단계 승인, `requestState`, request log와 영속 감사는 MCP credential ID에 결합한다.
- raw token과 digest는 lifecycle event, request log, security audit와 영속 변경 감사에 넣지 않는다.
- Codex는 project-scoped 설정의 `bearer_token_env_var`로 credential을 읽는다.
- Codex 설정에는 raw token을 직접 넣지 않는다.
- 관리자 MCP와 변경 기능은 기본으로 비활성화한다.
- production 활성화 금지는 별도 승인과 운영 결정이 생길 때까지 유지한다.

정확한 token 형식, schema, scope 값, route와 CLI 이름은 코드와 배포 설정이 소유한다.

## 고려한 대안

### modern `2026-07-28` 전용

Modern 전용 경로는 protocol surface를 줄인다.

현재 Codex CLI의 claim-less initialize를 거부해 실제 연결을 막으므로 제외한다.

Stateless legacy fallback은 조회 Tool에만 한정한다.

### 외부 OAuth Authorization Server

외부 Authorization Server는 사용자 동의, refresh token과 표준 federation을 제공할 수 있다.

현재 범위에는 개인과 장치별 credential의 발급, 만료와 즉시 폐기만 필요하다.

추가 protocol과 외부 운영 의존성이 현재 필요를 넘으므로 제외한다.

### 하나의 공유 bearer token

공유 token은 사용자와 장치별 폐기 또는 감사 provenance를 제공하지 못한다.

한 장치의 노출이 모든 MCP 사용자의 회전을 요구하므로 제외한다.

### raw token 저장

DB 유출이 즉시 인증 credential 유출로 이어지므로 제외한다.

### password hashing 적용

MCP token은 server가 생성하는 고엔트로피 secret이다.

검증 경계는 SHA-256 digest와 timing-safe 비교를 사용한다.

Password hashing은 이 token 모델의 보안 이점보다 운영 비용을 더하므로 제외한다.

## 결과

- 외부 Authorization Server 장애가 관리자 MCP availability에 영향을 주지 않는다.
- credential 하나의 폐기나 만료가 다른 개인 또는 장치의 연결을 중단하지 않는다.
- credential을 복사한 공격자는 만료 또는 폐기 전까지 해당 scope를 사용할 수 있다.
- 운영자는 장치 분실이나 token 노출 시 해당 credential을 즉시 폐기해야 한다.
- 운영자는 Codex를 시작하는 process에 token 환경 변수를 안전하게 전달해야 한다.
- 현재 Codex CLI는 stateless legacy read-only fallback으로 연결할 수 있다.
- modern `2026-07-28` 지원은 별도 pinned synthetic 검증으로 유지한다.
- stateless legacy fallback은 읽기 전용 호환 surface를 추가한다.
- OAuth login, consent, refresh와 step-up authorization은 제공하지 않는다.
- scope 변경은 기존 credential 폐기와 새 credential 발급으로 수행한다.

## 검증

- 발급 테스트는 raw token을 한 번만 반환하고 DB에 raw token을 남기지 않아야 한다.
- 검증 테스트는 digest 비교, 필수 만료, 폐기와 scope를 fail-closed로 확인해야 한다.
- lifecycle 테스트는 발급과 폐기 event가 해당 transaction과 함께 저장되는지 확인해야 한다.
- HTTP 테스트는 Host와 Origin 거부가 credential 조회보다 먼저 실행되는지 확인해야 한다.
- HTTP 테스트는 invalid token의 `401`과 scope 부족의 `403`을 구분해야 한다.
- HTTP 테스트는 인증 challenge에 resource metadata를 넣지 않는지 확인해야 한다.
- HTTP 테스트는 modern `2026-07-28` 요청을 수용해야 한다.
- HTTP 테스트는 stateless legacy initialize와 조회 Tool 호출을 수용해야 한다.
- HTTP 테스트는 stateless legacy 경로에서 변경 Tool과 GET·DELETE session lifecycle을 제공하지 않아야 한다.
- 감사 테스트는 MCP credential ID를 기록하고 raw token과 digest를 제외해야 한다.
- Codex 검증은 환경 변수 bearer token으로 stateless legacy read-only Tool을 호출해야 한다.
- synthetic 검증은 modern `2026-07-28`을 pin하고 read-only Tool을 호출해야 한다.
- 폐기 검증은 같은 token의 다음 요청이 즉시 거부되는지 확인해야 한다.

## 공식 근거

- [OpenAI Codex MCP 설정](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [MCP `2026-07-28` 사양](https://modelcontextprotocol.io/specification/2026-07-28)

## 관련 문서

- [인증·권한 정책](../auth-permissions.md)
- [관리자 transport 보안 가이드](../admin-transport-security.md)
- [런타임 설정 원칙](../runtime-configuration.md)
- [관찰·운영 기준](../observability.md)
- [개인정보 기준](../privacy.md)
- [테스트 전략](../testing.md)
- [Codex 연결 runbook](../admin-mcp-codex-runbook.md)
