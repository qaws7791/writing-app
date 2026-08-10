# 관리자 transport 보안 가이드

이 문서는 HTTP 외의 새로운 transport가 관리자 application use case를 호출할 때 지켜야 하는 인증 경계를 정의한다.

## 단일 관리자 인증 경계

관리자는 한 종류만 존재한다. transport는 별도 관리자 인증 경계의 유효한 session 또는 승인된 OAuth 주체를 확인한 뒤 application use case를 호출한다. identity module은 별도 관리자 profile을 조회하거나 권한 등급을 변경하지 않는다.

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

- 관리자 MCP는 OAuth resource server로 동작하며 authorization server를 구현하지 않는다.
- 관리자 MCP는 시작 시 OAuth metadata를 읽고 RFC 7662 introspection endpoint를 확정한다.
- 관리자 MCP는 token의 issuer, resource audience, 만료, subject, OAuth client ID와 조회 scope를 검증한다.
- 서버 설정은 승인된 subject 하나를 기존 owner `AdminId` 하나에 연결한다.
- MCP tool 입력, 이메일과 client 자체 보고 정보는 관리자 actor 또는 OAuth client ID의 근거가 될 수 없다.
- 조회 scope가 없는 유효한 token은 `403`으로 거부한다.
- 누락, 만료와 잘못된 issuer·audience·subject token은 `401`로 거부한다.
- MCP 경계는 resource URL의 Host와 Origin만 허용한다.
- loopback 외 resource와 OAuth endpoint는 HTTPS를 사용한다.
- 인증된 MCP 응답은 `private, no-store`를 사용한다.
- 변경 도구는 별도 설정이 켜지고 해당 기능별 OAuth scope가 있을 때만 등록한다.
- 변경 도구는 2026-07-28 protocol에서만 등록한다. legacy protocol은 조회 도구만 제공한다.
- 2단계 변경 요청은 owner `AdminId`, OAuth client ID, 도구, 멱등 키, 입력 digest와 대상 상태에 묶는다.
- 2단계 콘텐츠 변경과 실행 영수증은 같은 transaction에서 확정한다.
- 3단계 변경 요청은 owner `AdminId`, OAuth client ID, 도구, 입력 digest와 대상 상태에 묶는다.
- URL elicitation의 client 응답은 3단계 승인 근거가 아니다. owner session으로 저장한 승인 상태만 실행을 허용한다.
- `requestState`는 전용 secret으로 서명하고 MCP method, owner 관리자 ID와 OAuth client ID에 묶는다.
- 관리자 MCP는 production 활성화를 시작 시 거부한다.

현재 검증, 경로와 설정 계약은 [관리자 MCP 설정 parser](../../apps/api/src/mcp/admin/admin-mcp-configuration.ts), [OAuth verifier](../../apps/api/src/mcp/admin/admin-mcp-auth.ts)와 [MCP runtime](../../apps/api/src/mcp/admin/admin-mcp-runtime.ts)이 소유한다.

## 검증 체크리스트

- 비인증 요청이 application use case에 도달하기 전에 거부되는가?
- actor ID가 요청 입력이 아니라 검증된 관리자 session에서 오는가?
- 별도 관리자 cookie·origin·session 저장소가 학습자 인증과 분리되는가?
- 관리자 session과 응답에 private no-store가 적용되는가?
- OAuth client ID가 introspection 결과에서 오는가?
- legacy protocol에서 변경 도구가 노출되지 않는가?
- 2단계 재시도가 같은 실행 영수증으로 수렴하는가?
- 변조된 `requestState`와 다른 OAuth client의 재생을 거부하는가?
- 3단계 승인 후 대상 상태나 편집 버전이 바뀌면 변경을 실행하지 않는가?
- token, tool 입력과 tool 출력이 로그에서 제외되는가?
