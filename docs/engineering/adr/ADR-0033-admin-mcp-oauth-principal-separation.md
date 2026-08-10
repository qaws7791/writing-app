# ADR-0033: 관리자 MCP OAuth 주체 분리와 2026-07-28 고정

## 상태

부분 대체됨

[ADR-0034](./ADR-0034-admin-mcp-static-bearer-credentials.md)가 OAuth, 외부 Authorization Server, `PrivateKeyJwtProvider`와 strict-only protocol 결정을 대체한다.

Modern MCP wire protocol `2026-07-28` 지원 결정은 유지한다.

이 결정은 [ADR-0030](./ADR-0030-admin-mcp-oauth-resource-server.md)을 전체 대체한다.

이 결정은 [ADR-0031](./ADR-0031-admin-mcp-owner-approved-content-changes.md)의 legacy 조회 허용 결과를 대체한다.

이 결정은 [ADR-0032](./ADR-0032-admin-mcp-tiered-execution-policy.md)의 변경 Tool에 한정한 현대 protocol 조건을 대체한다.

## 날짜

2026-08-10

## 맥락

관리자 MCP는 외부 Authorization Server가 발급한 access token을 검증하는 OAuth Resource Server이다.

기존 결정은 고정 subject 하나와 OAuth client ID를 검증했다.

실제 staging 검증에는 비대화형 machine client와 Codex 상호작용 client가 모두 필요하다.

SDK v2의 `PrivateKeyJwtProvider`는 `client_credentials`와 `private_key_jwt`를 사용하는 machine client용이다.

Codex의 공식 MCP 연결은 authorization code와 PKCE를 사용하는 상호작용 흐름이다.

두 client가 자격 증명이나 등록을 공유하면 동의, 회전과 폐기 경계를 분리할 수 없다.

Resource Server의 introspection 자격 증명도 Tool 호출 주체와 다른 책임을 가진다.

## 결정

- 관리자 MCP는 MCP TypeScript SDK v2의 안정 릴리스 라인을 사용한다.
- 관리자 MCP는 MCP wire protocol `2026-07-28`만 허용한다.
- 서버는 legacy protocol 요청을 application 호출 전에 거부한다.
- API는 OAuth Resource Server만 구현한다.
- 외부 Authorization Server가 authorization, token 발급, client 등록과 introspection을 소유한다.
- Authorization Server는 MCP `2026-07-28` authorization 계약에 필요한 discovery, PKCE, Resource Indicators와 token audience binding을 제공해야 한다.
- OAuth metadata URL은 구성 issuer에서 RFC 8414 또는 OIDC Discovery 규칙으로 파생한 후보 하나와 정확히 일치해야 한다.
- Authorization Server metadata는 `token_endpoint_auth_signing_alg_values_supported`를 제공해야 한다.
- 서명 알고리즘 목록은 `none`을 포함할 수 없다.
- 서명 알고리즘 목록은 staging 합성 client가 선택한 비대칭 알고리즘을 포함해야 한다.
- Resource Server introspection client는 API가 access token을 introspection할 때만 사용한다.
- Resource Server introspection client는 Tool actor가 될 수 없다.
- Resource Server introspection client ID는 어떤 Tool principal client ID와도 같을 수 없다.
- staging 합성 client는 SDK v2의 `PrivateKeyJwtProvider`를 사용한다.
- staging 합성 client는 `client_credentials`와 `private_key_jwt`로 read-only access token을 얻는다.
- staging 합성 client는 기대 issuer를 설정하고 discovery 결과와 정확히 비교한다.
- staging 합성 client는 실제 Authorization Server와 MCP endpoint의 자동 검증에만 사용한다.
- staging 합성 client의 주체 binding은 read-only scope 하나만 최대값으로 허용한다.
- Codex client는 authorization code와 PKCE S256을 사용하는 public client로 등록한다.
- Codex client는 owner가 승인한 상호작용 access token으로 MCP endpoint에 연결한다.
- Codex client에는 staging 합성 client의 private key를 전달하지 않는다.
- 세 client는 환경별 client 등록, credential, key와 폐기 수명을 공유하지 않는다.
- 서버는 전역 issuer와 주체 binding 목록을 함께 검증한다.
- 각 주체 binding은 subject, OAuth client ID, owner `AdminId`와 최대 scope 집합을 정확히 연결한다.
- introspection 결과가 binding 하나와 정확히 일치하지 않으면 token을 거부한다.
- token scope가 해당 binding의 최대 scope 집합을 벗어나면 token을 거부한다.
- 서버는 검증된 binding의 owner `AdminId`로만 `AdminActor`를 만든다.
- 서버는 다른 resource용 token을 수락하거나 upstream으로 전달하지 않는다.
- 합성 client의 private key는 Git, API runtime 설정과 로그에 저장하지 않는다.
- Authorization Server에는 합성 client의 공개 JWK만 등록한다.
- Authorization Server는 만료되거나 재생된 client assertion을 거부해야 한다.
- owner 관리자 row가 없으면 API는 관리자 MCP를 등록하지 않고 계속 시작한다.
- OAuth metadata endpoint의 일시적 장애는 관리자 MCP route를 `503` 상태로 등록한다.
- 일시적 장애 상태의 request는 `Retry-After`를 받고 1초에서 30초 사이의 상한이 있는 backoff 뒤 bootstrap을 다시 시도한다.
- 일시적 장애가 끝나면 같은 API process에서 관리자 MCP가 회복된다.
- 유효하지 않은 OAuth metadata는 API 시작을 실패시킨다.
- MCP 활성 배포는 operation lock 획득 전에 controller의 합성 private key를 확인한다.
- MCP 비활성 배포와 rollback은 합성 private key를 요구하지 않는다.
- 관리자 MCP와 변경 기능은 기본으로 비활성화한다.
- production 활성화 금지는 별도 승인과 운영 결정이 생길 때까지 유지한다.

정확한 package 버전, route, 설정 이름과 scope 값은 코드와 배포 설정이 소유한다.

## 고려한 대안

### Codex에서 `PrivateKeyJwtProvider` 사용

Codex의 공식 MCP 설정은 SDK `OAuthClientProvider` 구현을 주입하는 계약을 제공하지 않는다.

Codex에 합성 client의 private key를 전달하면 public client와 machine client의 보안 경계도 합쳐진다.

따라서 이 대안은 제외한다.

### Codex에 정적 bearer token 전달

정적 token은 상호작용 승인과 자동 갱신 흐름을 제공하지 않는다.

장기 token은 노출, 회전과 폐기 비용을 높인다.

따라서 이 대안은 제외한다.

### 로컬 인증 proxy 추가

로컬 proxy는 token 발급, 저장, relay와 callback을 담당하는 새 신뢰 경계를 만든다.

직접 Codex OAuth 연결로 요구사항을 충족할 수 있으므로 이 대안은 제외한다.

### API에 Authorization Server 구현

Authorization Server 구현은 client 등록, 동의, key 관리와 token 수명주기를 API 책임에 추가한다.

SDK v2의 서버 authorization helper는 Resource Server 경계만 제공한다.

따라서 외부 Authorization Server를 유지한다.

### 한 OAuth client 등록 공유

공유 등록은 introspection 장애, 합성 key 노출과 Codex 동의 폐기를 같은 blast radius에 둔다.

독립 폐기와 최소 권한을 보장할 수 없으므로 이 대안은 제외한다.

## 결과

- legacy MCP client는 관리자 MCP를 사용할 수 없다.
- 합성 client 성공은 `PrivateKeyJwtProvider`와 실제 Authorization Server의 machine 인증을 증명한다.
- 합성 client 성공은 Codex 상호작용 인증 성공을 대신하지 않는다.
- Codex 연결 성공은 별도 authorization code와 PKCE 검증으로 확인한다.
- 주체 하나가 유출되거나 폐기되어도 다른 주체의 credential을 함께 교체할 필요가 없다.
- 새 client를 허용하려면 명시적 주체 binding과 최대 scope 검토가 필요하다.
- Authorization Server의 일시적 장애는 다른 API를 중단하지 않는다.
- 유효하지 않은 metadata는 안전하지 않은 인증 경계로 API가 시작되는 것을 막는다.
- production 활성화에는 외부 데이터 처리, key 회전, 폐기, 경보와 복구 증거가 필요하다.

## 검증

- parser와 verifier 테스트는 binding 불일치와 최대 scope 초과를 거부해야 한다.
- parser 테스트는 issuer에서 파생하지 않은 metadata URL과 introspection client ID 재사용을 거부해야 한다.
- metadata 테스트는 서명 알고리즘 목록의 누락, `none`과 선택 알고리즘 불일치를 거부해야 한다.
- 실제 HTTP 테스트는 legacy protocol 거부와 `2026-07-28` 협상을 검증해야 한다.
- bootstrap 테스트는 일시적 장애의 `503`, `Retry-After`, 1초에서 30초 사이의 backoff와 같은 process 회복을 검증해야 한다.
- bootstrap 테스트는 유효하지 않은 metadata가 API 시작을 실패시키는지 검증해야 한다.
- staging 합성 검증은 실제 Authorization Server에서 token을 얻은 뒤 read-only Tool을 호출해야 한다.
- MCP conformance 검증은 `2026-07-28` 요구사항을 대상으로 실행해야 한다.
- Codex 검증은 별도 로그인을 완료한 뒤 같은 staging endpoint의 read-only Tool을 호출해야 한다.
- client 폐기 검증은 선언한 access token 또는 introspection cache 수명의 상한 안에 다음 요청이 거부되는지 확인해야 한다.

## 공식 근거

- [MCP `2026-07-28` Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)
- [SDK v2 machine authentication](https://ts.sdk.modelcontextprotocol.io/v2/clients/machine-auth.html)
- [Codex MCP 연결](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)

## 관련 문서

- [어드민 운영](../../product/admin-operations.md)
- [인증·권한 정책](../auth-permissions.md)
- [관리자 transport 보안 가이드](../admin-transport-security.md)
- [런타임 설정 원칙](../runtime-configuration.md)
- [보안 원칙](../security.md)
- [테스트 전략](../testing.md)
