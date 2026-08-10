# ADR-0032: 관리자 MCP 단계별 실행 정책

## 상태

부분 대체됨

실행 단계와 변경 정책은 유지한다.

protocol 호환성은 [ADR-0033](./ADR-0033-admin-mcp-oauth-principal-separation.md)의 결정을 [ADR-0034](./ADR-0034-admin-mcp-static-bearer-credentials.md)가 다시 대체한다.

인증 주체 binding은 [ADR-0034](./ADR-0034-admin-mcp-static-bearer-credentials.md)가 대체한다.

## 날짜

2026-08-10

## 맥락

조회 전용 경계와 모든 변경에 owner 승인을 요구하는 경계는 위험도가 다른 작업을 같은 방식으로 처리했다.

코스 초안 작업은 멱등성과 낙관적 동시성으로 제한할 수 있다.

코스 발행·보관과 사용자 변경은 학습자 노출 또는 계정 수명에 직접 영향을 준다.

## 결정

- 1단계는 관리자 조회만 제공한다.
- 2단계는 코스 초안 생성·저장과 코스 보관 해제를 제한적으로 자동 실행한다.
- 2단계는 조회 scope와 기능별 변경 scope를 요구한다.
- 2단계는 owner 관리자 ID, MCP credential ID, Tool, 멱등 키와 입력 digest를 실행 식별자에 묶는다.
- 2단계 콘텐츠 변경과 실행 영수증은 같은 transaction에서 확정한다.
- 2단계는 대상 편집 버전 또는 상태가 다르면 실행하지 않는다.
- 3단계는 코스 발행·보관과 사용자 상태 변경·삭제를 제공한다.
- 3단계는 조회 scope, 기능별 변경 scope와 서버에 저장된 owner 승인을 요구한다.
- 3단계 승인은 MCP credential ID, Tool, 입력 digest와 대상 버전·상태에 묶는다.
- 3단계는 승인 뒤 대상 버전·상태를 다시 검증한다.
- 사용자 승인 대상과 결과에는 opaque 사용자 ID와 상태만 포함한다.
- 이미지 업로드와 이미지 연결은 제공하지 않는다.
- 코스 초안 저장은 기존 이미지 참조의 추가, 교체, 이동과 제거를 거부한다.
- 변경 Tool은 현대 MCP protocol에서만 등록한다.
- 관리자 MCP와 변경 기능은 기본으로 비활성화한다.
- production 활성화 금지는 유지한다.

## 고려한 대안

### 모든 변경에 owner 승인 적용

이 방식은 2단계 초안 작업의 반복 자동화를 중단시킨다.

멱등 영수증과 낙관적 동시성으로 제한 가능한 변경에는 과도한 제약이므로 제외한다.

### 모든 변경 자동 실행

코스 발행·보관과 사용자 변경은 학습자 노출 또는 계정 수명에 영향을 준다.

Credential scope만으로는 owner가 특정 요청을 검토했다는 증거가 없으므로 제외한다.

### 이미지 변경 포함

이미지 전송 크기와 object storage 경계는 JSON 문서 저장과 다른 실패 조건을 가진다.

별도 설계와 검증이 필요하므로 제외한다.

## 결과

- AI 에이전트는 저위험 코스 초안 작업을 승인 화면 없이 반복할 수 있다.
- 고위험 변경은 요청마다 owner 검토를 거친다.
- 재시도는 실행 식별자와 영수증 또는 승인 상태로 같은 결과에 수렴한다.
- 자동 실행과 승인 실행은 감사 원장에서 구분된다.
- 사용자 목록·상세와 이미지 변경은 관리자 MCP 범위 밖에 남는다.

## 관련 문서

- [어드민 운영](../../product/admin-operations.md)
- [인증·권한 정책](../auth-permissions.md)
- [관리자 transport 보안 가이드](../admin-transport-security.md)
- [개인정보와 AI 데이터 사용](../privacy.md)
- [전체 Tool 구현 계획](../../work/2026-08-10-admin-mcp-full-admin-tools/plan.md)
- [ADR-0030](./ADR-0030-admin-mcp-oauth-resource-server.md)
- [ADR-0031](./ADR-0031-admin-mcp-owner-approved-content-changes.md)
