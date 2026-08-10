# ADR-0030: 조회 전용 관리자 MCP와 OAuth resource server

## 상태

부분 대체됨

OAuth resource server와 조회 경계 결정은 유지한다.

변경 도구 제외와 adapter 의존 범위 결정은 [ADR-0032](./ADR-0032-admin-mcp-tiered-execution-policy.md)가 대체한다.

## 날짜

2026-08-10

## 맥락

owner 관리자는 어드민의 반복 조회를 승인된 AI 에이전트에 위임해야 한다. 기존 관리자 HTTP는 browser cookie와 Origin 검증을 전제로 한다. MCP client는 bearer token과 Streamable HTTP 계약을 사용한다. MCP가 관리자 HTTP를 내부 호출하면 actor, 오류와 감사 경계가 두 transport에 걸쳐 중복된다.

## 결정

- 관리자 MCP adapter를 기존 API runtime에 선택적으로 조립한다.
- MCP adapter는 MCP TypeScript SDK v2의 Web Standard handler를 사용한다.
- MCP server는 요청마다 새 instance를 만든다.
- MCP adapter는 `content`와 `operations`의 공개 application과 presenter만 호출한다.
- MCP adapter는 기존 관리자 HTTP endpoint와 module persistence를 호출하지 않는다.
- tool allowlist는 제품이 승인한 조회 도구 7개로 고정한다.
- 사용자 조회와 모든 변경 도구는 allowlist에서 제외한다.
- 관리자 MCP는 OAuth resource server로 동작한다.
- API는 OAuth authorization server를 구현하지 않는다.
- API는 시작 시 authorization server metadata를 검증한다.
- API는 RFC 7662 introspection으로 access token을 검증한다.
- 검증 항목은 issuer, resource audience, 만료, 고정 owner subject, OAuth client ID와 전용 조회 scope다.
- 서버 설정은 승인된 subject를 기존 owner `AdminId`에 연결한다.
- SDK의 Web Standard Host, Origin, bearer와 metadata helper를 직접 사용한다.
- 별도 MCP Hono adapter dependency는 추가하지 않는다.
- MCP handler 종료는 API container 정리에 연결한다.
- 1단계 설정 parser는 production 활성화를 거부한다.

## 고려한 대안

### 별도 MCP service

별도 service는 장애와 배포 경계를 분리한다. 별도 service는 application port, 설정, 관측과 배포 topology를 복제한다. 1단계의 읽기 도구 7개에는 이 비용이 필요하지 않다.

### 기존 관리자 HTTP 내부 호출

내부 HTTP 호출은 기존 endpoint를 그대로 사용할 수 있다. 이 방식은 bearer token을 cookie 경계로 변환해야 한다. 이 방식은 actor와 오류를 두 번 변환한다. 이 방식은 token 전달과 감사 누락 위험을 만든다.

### JWT 로컬 검증

로컬 검증은 요청마다 authorization server를 호출하지 않는다. 현재 authorization server의 JWT profile과 key rotation 계약은 확정되지 않았다. 1단계는 표준 introspection을 사용한다. JWT 검증은 별도 provider 계약과 dependency 검토 후 결정한다.

## 결과

- 기존 관리자 HTTP 계약과 UI는 바뀌지 않는다.
- OAuth metadata 또는 introspection 장애는 관리자 MCP 시작이나 인증 요청만 실패시킨다.
- 비인증과 scope 부족 요청은 application 호출 전에 거부된다.
- MCP request log는 owner 관리자 ID와 검증된 OAuth client ID를 연결한다.
- access token, tool 입력과 tool 출력은 로그에 남지 않는다.
- 외부 MCP client와 모델의 처리 조건이 승인될 때까지 staging 활성화와 smoke 검증은 완료할 수 없다.
- production 활성화는 후속 보안·개인정보·운영 결정이 필요하다.

## 관련 문서

- [어드민 운영](../../product/admin-operations.md)
- [인증·권한 정책](../auth-permissions.md)
- [관리자 transport 보안 가이드](../admin-transport-security.md)
- [개인정보와 AI 데이터 사용](../privacy.md)
- [관리자 MCP 구현 계획](../../work/2026-08-10-admin-mcp-read-tools/plan.md)
- [ADR-0031](./ADR-0031-admin-mcp-owner-approved-content-changes.md)
- [ADR-0032](./ADR-0032-admin-mcp-tiered-execution-policy.md)
