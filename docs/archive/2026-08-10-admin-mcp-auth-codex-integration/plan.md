# 관리자 MCP 인증·Codex 연결 전환 기록

## 문서 상태

- 상태: 완료·보관
- 기준 날짜: 2026-08-10
- 조사 기준 커밋: `d1e3af501c90f1a5d8bd4505bf69ae04d2cf81cf`
- 대상 환경: 승인된 staging
- MCP wire protocol: modern `2026-07-28`과 제한된 stateless legacy fallback

이 작업은 관리자 MCP 인증과 Codex 연결 방식을 확정하고 저장소 경계를 구현했다.

초기 외부 OAuth 설계는 구현 중 정적 bearer credential 설계로 대체했다.

현재 결정은 [ADR-0034](../../engineering/adr/ADR-0034-admin-mcp-static-bearer-credentials.md)가 소유한다.

이 기록의 완료는 저장소 구현과 권위 문서 전환을 뜻한다.

실제 staging credential 발급과 외부 Codex 연결의 실행 증거는 이 기록에 포함하지 않는다.

로컬 Codex 연결 증거는 [Codex 연결 runbook](../../engineering/admin-mcp-codex-runbook.md#로컬-연결-재현)에 기록했다.

## 완료 결과

| 범위                   | 결과                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| MCP protocol           | Modern `2026-07-28`과 read-only stateless legacy fallback을 제공한다.  |
| 공개 HTTP 경계         | HTTPS와 Host·Origin 우선 검증을 적용한다.                              |
| 인증                   | 개인·장치별 server-issued static bearer credential을 사용한다.         |
| 저장                   | Raw token 대신 SHA-256 digest, 만료, scope와 폐기 상태를 저장한다.     |
| lifecycle              | 발급과 폐기를 credential 변경과 같은 transaction에 기록한다.           |
| 변경 provenance        | 승인, 실행 영수증, `requestState`와 감사를 MCP credential ID에 묶는다. |
| Codex                  | Project 설정의 `bearer_token_env_var`로 token을 읽는다.                |
| staging synthetic 검증 | Codex와 다른 read-only credential을 release controller에서 사용한다.   |
| production             | 별도 승인 전까지 관리자 MCP 활성화를 거부한다.                         |

## 보안 경계

1. 운영자는 개인과 장치 조합마다 별도 credential을 발급한다.
2. 발급 CLI는 raw token을 한 번만 반환한다.
3. 운영자는 raw token을 승인된 secret store로 즉시 옮긴다.
4. API는 raw token을 DB, 환경 설정과 로그에 저장하지 않는다.
5. 서버는 credential 검증마다 digest, 만료와 폐기 상태를 확인한다.
6. 폐기는 같은 token의 다음 요청부터 적용한다.
7. credential scope가 부족하면 Tool application 호출 전에 요청을 거부한다.
8. Host 또는 Origin이 잘못되면 credential 조회 전에 요청을 거부한다.
9. request log와 영속 변경 감사에는 MCP credential ID만 남긴다.
10. raw token과 digest는 lifecycle event와 감사 payload에서 제외한다.

## 코드 권위 경계

| 경계                                                                                                   | 소유 사실                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| [`admin-mcp-access-token-schema.ts`](../../../apps/api/src/mcp/admin/admin-mcp-access-token-schema.ts) | Credential과 lifecycle event schema  |
| [`admin-mcp-access-token-store.ts`](../../../apps/api/src/mcp/admin/admin-mcp-access-token-store.ts)   | 발급, 검증과 폐기 transaction        |
| [`admin-mcp-auth.ts`](../../../apps/api/src/mcp/admin/admin-mcp-auth.ts)                               | Bearer token 인증 결과 변환          |
| [`admin-mcp-request-boundary.ts`](../../../apps/api/src/mcp/admin/admin-mcp-request-boundary.ts)       | Host·Origin, request log와 보안 감사 |
| [`admin-mcp-runtime.ts`](../../../apps/api/src/mcp/admin/admin-mcp-runtime.ts)                         | 인증, scope와 protocol 호환 경계     |
| [`issue-admin-mcp-token.ts`](../../../apps/api/src/scripts/issue-admin-mcp-token.ts)                   | 운영자 발급 진입점                   |
| [`revoke-admin-mcp-token.ts`](../../../apps/api/src/scripts/revoke-admin-mcp-token.ts)                 | 운영자 폐기 진입점                   |
| [`schema.ts`](../../../packages/modules/operations/src/infrastructure/persistence/schema.ts)           | MCP 변경 영속 감사 schema            |
| [`verify.yaml`](../../../infra/ansible/playbooks/verify.yaml)                                          | Staging 공개·인증 smoke              |

현재 token 형식, scope 목록, route, 환경 변수 이름과 실행 script는 위 코드와 설정이 소유한다.

## Codex 연결

Codex는 공식 OpenAI 설정의 `bearer_token_env_var`를 사용한다.

Project 설정에는 환경 변수 이름만 저장한다.

Raw token은 Codex를 시작하는 process 환경에 secret store가 주입한다.

연결, 검증, 폐기와 교체 절차는 [관리자 MCP Codex 연결 runbook](../../engineering/admin-mcp-codex-runbook.md)이 소유한다.

## 저장소 완료 기준

- invalid token은 application 호출 전에 `401`로 거부된다.
- scope가 부족한 유효 credential은 `403`으로 거부된다.
- `401` challenge는 `resource_metadata` parameter를 포함하지 않는다.
- Host와 Origin 거부는 credential 조회보다 먼저 실행된다.
- stateless legacy client는 조회 Tool만 호출할 수 있다.
- stateless legacy 경로는 GET·DELETE session lifecycle을 제공하지 않는다.
- `2026-07-28` client는 modern Tool 경로를 호출할 수 있다.
- 발급과 폐기는 append-only lifecycle provenance를 남긴다.
- 승인과 실행 감사는 MCP credential ID에 연결된다.
- raw token과 digest는 log와 audit payload에서 제외된다.
- staging synthetic credential과 개인 Codex credential은 공유되지 않는다.

## 운영 이관

Release operator는 MCP를 비활성화한 staging 배포로 정적 credential migration을 먼저 적용한다.

Release operator는 API image의 one-shot binary로 합성 credential을 발급한다.

Release operator는 raw token을 controller optional secret으로 옮긴 뒤 MCP를 활성화한 배포를 다시 실행한다.

Release 검증은 controller secret으로 인증된 smoke를 실행한다.

개별 Codex 연결은 각 사용자와 장치별 credential을 별도로 발급한 뒤 runbook에 따라 확인한다.

이 단계들은 반복 가능한 운영 절차이므로 새 구현 계획으로 유지하지 않는다.

현재 명령과 폐기 절차는 [배포 가이드](../../engineering/deployment.md#관리자-mcp-credential-one-shot)가 소유한다.

## 공식 근거

- [OpenAI Codex MCP 설정](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [MCP `2026-07-28` 사양](https://modelcontextprotocol.io/specification/2026-07-28)
