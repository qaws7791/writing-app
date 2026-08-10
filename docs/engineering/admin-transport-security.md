# 관리자 transport 보안 가이드

이 문서는 HTTP 외의 새로운 transport가 관리자 application use case를 호출할 때 지켜야 하는 인증 경계를 정의한다.

## 단일 관리자 인증 경계

관리자는 한 종류만 존재한다. transport는 별도 관리자 인증 경계의 유효한 session 또는 승인된 MCP bearer credential을 확인한 뒤 application use case를 호출한다. identity module은 별도 관리자 profile을 조회하거나 권한 등급을 변경하지 않는다.

## actor 구성

- `AdminActor.id`는 검증이 끝난 session 또는 같은 수준으로 신뢰할 수 있는 서버 인증 주체에서만 만든다.
- 요청 body, query, 임의 header에 담긴 관리자 ID로 actor를 만들지 않는다.
- actor는 감사와 변경 주체 식별용이며 관리자 종류나 권한 단계를 표현하지 않는다.

## transport 구현 절차

1. transport 고유 방식으로 자격 증명의 유효성과 만료를 검증한다.
2. 인증된 관리자 ID로 `AdminActor`를 만든다.
3. 조회와 변경 모두 같은 관리자 session 정책을 적용한다.
4. 변경 command에 actor를 넣어 호출한다.
5. 비인증은 `401/UNAUTHORIZED`, 도메인 상태상 허용할 수 없는 요청은 해당 안정 오류로 변환한다.

## 관리자 MCP 경계

- 관리자 MCP는 server-issued static bearer credential을 검증한다.
- 운영자는 개인과 장치 조합마다 별도 credential을 발급한다.
- 서버는 credential ID, owner `AdminId`, scope, 필수 만료 시각과 폐기 상태를 검증한다.
- 서버는 raw token을 저장하지 않고 SHA-256 digest를 timing-safe 방식으로 비교한다.
- 발급 CLI는 raw token을 한 번만 반환한다.
- 발급과 폐기는 append-only lifecycle event를 같은 transaction에 저장한다.
- 폐기는 다음 credential 검증부터 즉시 적용한다.
- MCP tool 입력, 이메일과 client 자체 보고 정보는 관리자 actor 또는 MCP credential ID의 근거가 될 수 없다.
- 조회 scope가 없는 유효한 token은 `403`으로 거부한다.
- 누락, 형식 오류, 알 수 없음, digest 불일치, 만료와 폐기 token은 `401`로 거부한다.
- `401` challenge는 resource metadata를 광고하지 않는다.
- 모든 MCP route는 bearer 검증보다 먼저 Host와 Origin을 검증한다.
- 잘못된 Host 또는 Origin은 credential 조회나 Tool 호출을 유발하지 않고 `403`으로 거부한다.
- loopback 외 관리자 MCP endpoint는 HTTPS를 사용한다.
- 모든 MCP 응답은 `private, no-store`를 사용한다.
- 변경 도구는 별도 설정이 켜지고 해당 기능별 credential scope가 있을 때만 등록한다.
- 관리자 MCP는 modern `2026-07-28` 협상을 허용한다.
- 현재 Codex CLI 호환 경로는 SDK v2의 stateless legacy fallback만 허용한다.
- stateless legacy 경로는 조회 Tool만 등록하고 GET·DELETE session lifecycle을 제공하지 않는다.
- modern 경로와 stateless legacy 경로는 같은 Host·Origin, bearer와 scope 경계를 사용한다.
- 2단계 변경 요청은 owner `AdminId`, MCP credential ID, 도구, 멱등 키, 입력 digest와 대상 상태에 묶는다.
- 2단계 콘텐츠 변경과 실행 영수증은 같은 transaction에서 확정한다.
- 3단계 변경 요청은 owner `AdminId`, MCP credential ID, 도구, 입력 digest와 대상 상태에 묶는다.
- URL elicitation의 client 응답은 3단계 승인 근거가 아니다. owner session으로 저장한 승인 상태만 실행을 허용한다.
- `requestState`는 전용 secret으로 서명하고 MCP method, owner 관리자 ID와 MCP credential ID에 묶는다.
- request log와 영속 변경 감사는 검증된 MCP credential ID를 provenance로 사용한다.
- raw token과 digest는 request log, security audit와 영속 감사에 포함하지 않는다.
- 관리자 MCP는 production 활성화를 시작 시 거부한다.

관리자 MCP는 외부 인증 provider를 bootstrap하지 않는다. 환경 parser 오류나 로컬 MCP runtime 조립 오류는 API 시작을 실패시킨다.

현재 token schema와 lifecycle은 [관리자 MCP token schema](../../apps/api/src/mcp/admin/admin-mcp-access-token-schema.ts)와 [token store](../../apps/api/src/mcp/admin/admin-mcp-access-token-store.ts)가 소유한다. 현재 인증, 공개 요청 검증, 설정과 protocol 계약은 [bearer verifier](../../apps/api/src/mcp/admin/admin-mcp-auth.ts), [request 경계](../../apps/api/src/mcp/admin/admin-mcp-request-boundary.ts), [설정 parser](../../apps/api/src/mcp/admin/admin-mcp-configuration.ts)와 [MCP runtime](../../apps/api/src/mcp/admin/admin-mcp-runtime.ts)이 소유한다.

## 검증 체크리스트

- 비인증 요청이 application use case에 도달하기 전에 거부되는가?
- actor ID가 요청 입력이 아니라 검증된 관리자 session에서 오는가?
- 별도 관리자 cookie·origin·session 저장소가 학습자 인증과 분리되는가?
- 관리자 session과 응답에 private no-store가 적용되는가?
- 개인과 장치 조합마다 별도 MCP credential을 발급하는가?
- raw token이 발급 응답 외의 DB, log와 설정에 남지 않는가?
- SHA-256 digest 비교, 만료와 폐기가 fail-closed로 적용되는가?
- 폐기가 다음 검증부터 즉시 반영되는가?
- Host와 Origin 거부가 credential 조회와 bearer 검증보다 먼저 실행되는가?
- invalid token `401` challenge가 resource metadata를 포함하지 않는가?
- 유효한 credential의 scope가 부족하면 `403`으로 거부되는가?
- modern `2026-07-28` 협상과 stateless legacy 조회 호출이 각각 성공하는가?
- stateless legacy 경로가 변경 Tool과 GET·DELETE session lifecycle을 제공하지 않는가?
- 2단계 재시도가 같은 실행 영수증으로 수렴하는가?
- 변조된 `requestState`와 다른 MCP credential의 재생을 거부하는가?
- 3단계 승인 후 대상 상태나 편집 버전이 바뀌면 변경을 실행하지 않는가?
- token, digest, Tool 입력과 Tool 출력이 로그에서 제외되는가?
