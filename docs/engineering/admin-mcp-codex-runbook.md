# 관리자 MCP Codex 연결 runbook

## 전제

- Codex에서 이 저장소를 trusted project로 승인한다.
- Staging 관리자 MCP HTTPS endpoint가 준비되어 있어야 한다.
- 운영자는 현재 owner 관리자와 장치 조합에 전용 read-only credential을 발급해야 한다.
- Raw token은 승인된 개인 secret store에 있어야 한다.
- Project 설정, 명령 인자와 shell history에는 raw token을 넣지 않는다.
- HTTP diagnostic이 Authorization header를 보존하면 token이 노출된다. Redaction을 확인하지 못하면 diagnostic을 실행하지 않는다.
- 발급 CLI는 raw token을 표준 출력에 한 번 표시한다. 노출된 token이 기록에 남으면 다른 사용자가 관리자 MCP를 호출할 수 있으므로 terminal transcript와 화면 기록을 끈 뒤 발급한다.

## 프로젝트 설정

기존 [`.codex/config.toml`](../../.codex/config.toml)의 `writing_admin_local`은 로컬 API 전용이다.

로컬 연결은 `WRITING_ADMIN_MCP_TOKEN`을 사용한다.

로컬 table의 URL이나 token 환경 변수 이름을 staging 값으로 바꾸지 않는다.

Staging 연결에는 다음 table을 별도로 추가한다.

`url`의 placeholder는 승인된 staging MCP origin으로 교체한다.

```toml
[mcp_servers.writing_admin_staging]
url = "https://<staging-mcp-host>/mcp/admin"
bearer_token_env_var = "WRITING_ADMIN_STAGING_MCP_TOKEN"
enabled = true
required = false
enabled_tools = [
  "admin_list_courses",
  "admin_get_course_editor",
  "admin_get_dashboard",
  "admin_get_analytics",
  "admin_list_lesson_analytics",
  "admin_get_ai_feedback_quality",
  "admin_list_audit_events",
]
default_tools_approval_mode = "writes"
```

Tool 이름의 권위 소스는 [관리자 MCP Tool 등록](../../apps/api/src/mcp/admin/admin-mcp-tools.ts)이다.

현재 Codex CLI 연결은 stateless legacy read-only fallback을 사용한다.

Modern `2026-07-28` 수용은 별도 staging synthetic 검증이 pin해서 확인한다.

`writing_admin_staging`과 `WRITING_ADMIN_STAGING_MCP_TOKEN`은 이 runbook의 staging 식별자다.

Codex를 시작하는 process는 이 환경 변수를 승인된 secret store에서 받아야 한다.

## Credential 준비

1. 운영자는 terminal transcript와 화면 기록이 꺼졌는지 확인한다.
2. 운영자는 [staging credential one-shot](./deployment.md#관리자-mcp-credential-one-shot)으로 현재 owner 관리자와 이 장치 전용 read-only credential을 발급한다.
3. 운영자는 CLI가 한 번 출력한 raw token을 승인된 개인 secret store로 즉시 옮긴다.
4. 운영자는 raw token이 clipboard history와 shell history에 남지 않았는지 확인한다.
5. 운영자는 secret store가 Codex launcher process의 `WRITING_ADMIN_STAGING_MCP_TOKEN` 환경 변수에 token을 주입하도록 설정한다.
6. 운영자는 이 credential을 다른 사용자 또는 장치와 공유하지 않는다.

Token 형식, CLI 인자와 scope 값은 [token store](../../apps/api/src/mcp/admin/admin-mcp-access-token-store.ts)와 [발급 명령](../../apps/api/src/scripts/issue-admin-mcp-token.ts)이 소유한다.

## 연결과 확인

1. Project 설정과 launcher 환경 변경 후 Codex host를 다시 시작한다.
2. Codex에서 `/mcp`를 실행한다.
3. `writing_admin_staging`이 enabled 상태인지 확인한다.
4. `/mcp`에 허용한 read-only Tool만 표시되는지 확인한다.
5. Codex에 `admin_list_courses`를 빈 입력으로 호출하도록 요청한다.
6. 호출 결과가 오류가 아닌 코스 목록인지 확인한다.
7. 같은 시각의 `request.completed` 로그에서 `audience=admin-mcp`인 event를 찾는다.
8. Event의 `mcpCredentialId`가 이 장치에 발급한 credential ID와 일치하는지 확인한다.
9. 승인된 staging HTTP diagnostic에서 응답의 `x-request-id`를 확인한다.
10. Event의 `requestId`가 응답의 `x-request-id`와 일치하는지 확인한다.
11. 로그에 raw token, token digest와 Tool 입력·출력이 없는지 확인한다.

오류 응답은 `requestId`를 포함한다.

오류가 발생하면 같은 `requestId`로 `security.audit`와 API 오류 로그를 조회한다.

`401`이면 launcher process의 환경 변수 전달, token 만료와 폐기 상태를 확인한다.

`403`이면 credential scope와 project Tool allowlist를 확인한다.

별도 login 명령과 callback 설정은 사용하지 않는다.

## 로컬 연결 재현

로컬 API는 다음 비밀이 아닌 설정으로 시작한다.

```dotenv
ADMIN_MCP_ENABLED=true
ADMIN_MCP_RESOURCE_URL=http://localhost:4000/mcp/admin
ADMIN_MCP_CHANGES_ENABLED=false
```

로컬 owner fixture가 `admin-1`이면 다음 명령으로 read-only credential을 발급한다.

```sh
bun --filter @workspace/api issue:admin-mcp-token -- --actor-admin-id=admin-1 --owner-admin-id=admin-1 --expires-at=<UTC-ISO-8601> --scope=admin:mcp:read
```

발급 명령은 raw token을 표준 출력에 한 번 표시한다. raw token을 다른 명령의 인자로 전달하면 shell history와 process 정보에 노출될 수 있으므로 승인된 secret tool로 user-scope `WRITING_ADMIN_MCP_TOKEN` 환경 변수에 저장한다.

기존 project 설정의 `writing_admin_local`을 사용한다. API와 Codex를 다시 시작한 뒤 `admin_list_courses`를 호출한다.

2026-08-11에 Codex CLI `0.147.0`과 `gpt-5.5` override로 이 흐름을 확인했다. `initialize → initialized → tools/list → tools/call` HTTP 상태는 `200 → 202 → 200 → 200`이었다. `admin_list_courses` 호출은 성공했다.

## 폐기와 교체

1. 장치 분실, token 노출 또는 담당자 변경이 발생하면 [staging 긴급 폐기 절차](./deployment.md#관리자-mcp-credential-긴급-폐기)로 해당 credential을 즉시 폐기한다.
2. 같은 token의 다음 요청이 `401`로 거부되는지 확인한다.
3. 연결이 계속 필요하면 새 credential을 발급한다.
4. Secret store의 값을 새 token으로 교체한다.
5. Codex host를 다시 시작한다.
6. 이전 token을 재사용하지 않는다.

## 공식 근거

- [OpenAI Codex MCP 공식 문서](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [ADR-0034 관리자 MCP 정적 bearer credential](./adr/ADR-0034-admin-mcp-static-bearer-credentials.md)
