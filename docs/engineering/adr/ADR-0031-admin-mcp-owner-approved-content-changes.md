# ADR-0031: owner 승인 기반 관리자 MCP 콘텐츠 변경

## 상태

부분 대체됨

2A 범위와 실행 정책은 [ADR-0032](./ADR-0032-admin-mcp-tiered-execution-policy.md)가 대체한다.

OAuth resource server, 영속 owner 승인과 콘텐츠 transaction 원칙은 유지한다.

## 날짜

2026-08-10

## 맥락

조회 전용 관리자 MCP는 반복 조회를 위임하지만 콘텐츠 운영을 완료할 수 없다. OAuth scope나 MCP client의 확인만으로 변경을 허용하면 owner가 실제 대상을 검토했다는 서버 증거가 없다. MCP 호출은 재시도될 수 있으므로 코스 중복 생성과 상태 중복 전이도 막아야 한다.

## 결정

- 2A 변경 범위는 코스 초안 생성, 코스 보관과 코스 보관 해제로 제한한다.
- 변경 기능은 조회 기능과 분리된 flag로 기본 비활성화한다.
- 변경 도구는 MCP 2026-07-28 protocol에서만 등록한다.
- 변경 도구는 조회 scope와 기능별 변경 scope를 모두 요구한다.
- 첫 호출은 operations module에 owner 승인 요청을 저장하고 URL elicitation을 반환한다.
- owner는 기존 관리자 session과 trusted Origin 경계에서 요청을 승인하거나 거절한다.
- URL elicitation 응답과 client 자체 확인은 승인으로 인정하지 않는다.
- 서명된 `requestState`는 MCP method, owner 관리자 ID와 OAuth client ID에 묶는다.
- 승인 요청은 OAuth client ID, 도구, idempotency key, 입력 digest와 대상 상태·편집 버전에 묶는다.
- 승인된 요청은 한 실행자만 `executing`으로 선점한다.
- content module은 콘텐츠 변경과 실행 영수증을 하나의 SQLite transaction에서 확정한다.
- 같은 승인 binding의 재시도는 영수증을 재생한다. 다른 binding은 충돌로 거부한다.
- MCP 변경 감사는 승인 ID, 입력 digest와 OAuth client ID를 저장한다.
- 감사 시작 실패는 콘텐츠 변경을 차단한다.
- production의 관리자 MCP 활성화 금지는 유지한다.

## 고려한 대안

### MCP client 확인만 사용

client 확인은 사용자 경험을 제공하지만 서버가 신뢰할 수 있는 owner 증거가 아니다. 악성 client는 확인 결과를 위조할 수 있으므로 제외한다.

### 관리자 HTTP API를 MCP에서 호출

내부 HTTP 호출은 bearer와 cookie 인증을 변환해야 한다. 이 방식은 actor, 오류와 감사를 중복 변환하므로 제외한다.

### application 호출 뒤 별도 영수증 저장

별도 저장은 process 종료 시 콘텐츠만 변경되고 영수증이 없는 상태를 만든다. 같은 요청이 콘텐츠를 다시 변경할 수 있으므로 제외한다.

### draft 저장과 발행도 함께 공개

draft 저장은 전체 diff와 복구 snapshot 정책이 필요하다. 발행은 학습자 제공 범위를 바꾸므로 별도 rollout 증거가 필요하다. 두 기능은 2A에서 제외한다.

## 결과

- legacy client와 변경 scope가 없는 token은 조회 도구만 사용한다.
- owner가 승인하기 전에는 콘텐츠가 변경되지 않는다.
- 승인 이후 상태나 편집 버전이 바뀌면 변경이 실패한다.
- process 재시도는 같은 콘텐츠 효과와 같은 감사 provenance로 수렴한다.
- 승인 요청과 실행 영수증의 보존·삭제 정책, 외부 처리 조건과 staging smoke가 완료될 때까지 staging 변경 기능을 켤 수 없다.
- production 활성화에는 별도 보안·개인정보·운영 결정이 필요하다.

## 관련 문서

- [어드민 운영](../../product/admin-operations.md)
- [인증·권한 정책](../auth-permissions.md)
- [관리자 transport 보안 가이드](../admin-transport-security.md)
- [개인정보와 AI 데이터 사용](../privacy.md)
- [2단계 구현 계획](../../work/2026-08-10-admin-mcp-approved-content-changes/plan.md)
- [ADR-0030](./ADR-0030-admin-mcp-oauth-resource-server.md)
- [ADR-0032](./ADR-0032-admin-mcp-tiered-execution-policy.md)
