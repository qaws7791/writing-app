# Antigravity 2.0 Sub Agent Frontmatter

출처: Google Antigravity 공식 문서 `antigravity.google/docs/subagents/`, `antigravity.google/docs/skills/`, `antigravity.google/docs/permissions/`, `antigravity.google/blog/introducing-custom-agents` (2026년 8월 기준, Antigravity 2.0 v2.11.0 / CLI v1.1.22 문서 반영).

## 1. YAML Frontmatter 필드 전체 표

| Property | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | *(필수)* | 커스텀 에이전트의 고유 식별자 |
| `description` | `string` | *(필수)* | 플래너/오케스트레이터가 어떤 작업을 이 에이전트에 위임할지 판단하는 데 쓰이는 상세 설명 |
| `tools` | `string[]` | `[]` | 이 서브에이전트에 허용할 도구의 명시적 목록 (예: `view_file`, `replace_file_content`, `grep_search`, `run_command`) |
| `mainAgent` | `boolean` | `true` | `true`이면 채팅 인터페이스에서 이 에이전트를 기본(메인) 에이전트로 직접 선택할 수 있음 |
| `subagent` | `boolean` | `true` | `true`이면 `invoke_subagent` 툴을 통해 다른 에이전트가 이 에이전트를 호출할 수 있음 |
| `model` | `string` | `inherit` | 호출될 때 사용할 모델 티어. `inherit` \| `flash` \| `pro` |
| `commandExecutionPolicy` | `string` | `sandbox` | 셸 명령 자동 실행 정책. `off` \| `auto` \| `eager` \| `sandbox` |
| `mcpServers` | `object[]` | `[]` | 이 서브에이전트 전용으로 구성된 커스텀 MCP 서버 목록 |
| `skills` / `plugins` | `string[]` | `[]` | 스킬 경로(예: `skills/my-helper-skill`) 또는 플러그인 의존성 목록 |

> **알려진 이슈(Tool Validation)**: `tools` 목록에 매핑되지 않거나 철자가 틀린 도구 이름을 넣으면 실행 중 서브에이전트 프로세스가 멈출(hang) 수 있습니다. 정확한 도구 이름은 반드시 `tools-reference.md`에서 확인하세요. (향후 업데이트에서 스키마 검증 강화 및 수정 예정이라고 공식 문서에 명시되어 있습니다.)

### `mainAgent` / `subagent` 조합 의미

| mainAgent | subagent | 의미 |
|---|---|---|
| `true` | `true` | (기본값) 사람이 직접 대화 상대로 선택할 수도, 다른 에이전트가 위임 호출할 수도 있음 |
| `false` | `true` | 오케스트레이터 전용 워커. 사람이 직접 시작하는 대화의 기본 에이전트로는 노출되지 않음 (예: `code-auditor` 예시) |
| `true` | `false` | 사람이 직접 쓰는 독립 에이전트. 다른 에이전트가 서브에이전트로 호출할 수 없음 |
| `false` | `false` | 사실상 비활성화 상태이므로 보통 사용하지 않음 |

### `model` 값

- `inherit` — 호출한 부모 에이전트와 동일한 모델 사용
- `flash` — 빠르고 저비용, 대량/반복 작업이나 단순 위임 작업에 적합
- `pro` — 고성능, 복잡한 추론이 필요한 감사/설계/디버깅류 작업에 적합

### `commandExecutionPolicy` 값

- `off` — 셸 명령을 아예 자동 실행하지 않음 (읽기 전용/분석 전용 에이전트에 권장)
- `sandbox` *(기본값)* — 샌드박스 안에서만 자동 실행, 그 밖은 승인 필요
- `auto` — 표준 테스트/빌드류 명령을 백그라운드에서 자동 실행 (파괴적 명령은 여전히 승인 필요)
- `eager` — 가장 적극적으로 자동 실행 (신뢰도 높은, 반복적인 워크플로 전용으로만 사용 권장)

### `permissionMode` (참고, 비공식적으로만 확인됨)

공식 블로그의 예시 하나(`dependency-modernizer` 심화 버전)에서 `permissionMode: acceptEdits`가 `commandExecutionPolicy: auto`와 나란히 등장하지만, 현재 `subagents` 공식 레퍼런스 페이지의 frontmatter 표에는 정식 필드로 포함되어 있지 않습니다. CLI의 실행 모드(`default`, `accept-edits`, `plan`)와 이름이 겹치는 것으로 보아 에이전트 단위로 CLI 실행 모드를 강제하는 필드로 추정되지만, 확정 문서가 없으므로 사용 시 이 불확실성을 사용자에게 알려주세요.

## 2. 에이전트 파일 위치 및 탐색 규칙

| Location | Path | Scope |
|---|---|---|
| Workspace Customizations | `.agents/agents/<name>.md` 또는 `.agents/agents/<name>/agent.md` | 워크스페이스/저장소 루트 |
| Global Customizations | `~/.gemini/config/agents/<name>.md` 또는 `.../agents/<name>/agent.md` | 머신 전체 / 모든 프로젝트 |
| Plugins | `plugins/<plugin_name>/agents/` | 번들된 플러그인 패키지 |

워크스페이스 경로(`.agents/agents/`)에 커밋하면 그 저장소를 체크아웃하는 모든 팀원에게 자동으로 노출됩니다.

## 3. 시스템 프롬프트(마크다운 본문)

`---` frontmatter 구분자 이후의 내용이 그대로 이 에이전트의 시스템 프롬프트로 컴파일됩니다. `# System Prompt`, `# Review Guidelines` 같은 표준 Markdown H1 제목으로 섹션을 나눌 수 있습니다. 이 본문에는:

- 에이전트의 역할과 목표
- 절대 하지 말아야 할 것 / 반드시 확인해야 할 것 (가드레일)
- 결과물 형식(리포트, 체크리스트, 커밋 메시지 규칙 등)

을 명확하게 적어주는 것이 좋습니다.

## 4. 스킬(`skills:`) 참조 형식

Antigravity의 스킬은 [agentskills.io](https://agentskills.io/home) 오픈 스탠다드를 따르며 Claude Skills와 동일한 `SKILL.md` + YAML frontmatter 구조입니다.

- 저장 위치: `<workspace-root>/.agents/skills/<skill-folder>/SKILL.md` (워크스페이스) 또는 `~/.gemini/config/skills/<skill-folder>/SKILL.md` (전역). 구버전 경로 `.agent/skills`도 하위 호환으로 계속 지원됩니다.
- 스킬 frontmatter 필드: `name`(선택, 미지정 시 폴더명 사용), `description`(필수 — 에이전트가 이 스킬을 언제 쓸지 판단하는 근거).
- 커스텀 에이전트의 `skills:` 목록에는 이 스킬 폴더의 경로(예: `skills/security-checklist`)를 적습니다. 에이전트는 대화 시작 시 스킬 이름+설명만 먼저 보고, 필요하다고 판단되면 전체 `SKILL.md` 내용을 읽어 따릅니다(progressive disclosure).

## 5. 서브에이전트 생명주기(Lifecycle)

| 상태 | 설명 |
|---|---|
| **Running** | 실행 중. 사용자가 서브에이전트 패널의 "Stop Subagent"(또는 CLI에서 `k`)로 취소 가능. 부모가 메시지를 보내거나 종료시켜 개입 가능 |
| **Idle** | 작업 완료 후 부모에게 결과 메시지를 보내고 대기. 다른 에이전트가 메시지를 보내면 자동으로 다시 Running으로 깨어나며, 이전 실행의 컨텍스트를 그대로 유지 |
| **Killed** | 영구 종료, 다시 깨울 수 없음. 임시로 생성된 Git worktree는 자동 정리됨. 대화 기록은 JSONL 로그로 계속 열람 가능 |

- **중첩 깊이 제한**: 메인 에이전트 아래 서브에이전트 계층은 최대 **10단계**까지만 허용 (폭주 재귀/자원 고갈 방지).
- 에이전트 간 통신은 고유 대화 ID로 서로 메시지를 보낼 수 있고(`send_message`), 서로의 대화 기록(transcript)을 읽어 감사(audit)할 수 있습니다.

## 6. 권한/보안 모델 개요 (에이전트 설계 시 참고)

Antigravity는 `action(target)` 형태의 통합 권한 엔진을 사용하며, 우선순위는 **Deny > Ask > Allow** 입니다.

| Action | Target 형식 | 기본 동작 |
|---|---|---|
| `read_file` | `read_file(/path)` 등 | Ask (워크스페이스 내부는 자동 Allow) |
| `write_file` | `write_file(/path)` 등 | Ask (워크스페이스 내부는 자동 Allow) |
| `read_url` | `read_url(domain)` | Ask |
| `execute_url` | `execute_url(domain)` | Ask |
| `command` | `command(prefix\|regex\|*)` | Ask |
| `unsandboxed` | `unsandboxed(prefix\|regex\|*)` | Ask |
| `mcp` | `mcp(server/tool)` | Ask |

서브에이전트는 부모의 명령어 허용 prefix, 파일 읽기/쓰기 범위, 샌드박스 설정을 그대로 상속받습니다. 승인이 필요한 작업이 발생하면 요청이 메인 UI/서브에이전트 패널로 자동 전달(bubbling)됩니다. 이 권한 목록 자체는 에이전트 `.md` frontmatter가 아니라 별도의 워크스페이스/전역 권한 설정에서 관리되는 것이므로, 에이전트 파일에는 `commandExecutionPolicy`로 "이 에이전트가 얼마나 적극적으로 자동 실행할지"만 지정하면 됩니다.

## 7. 내장(사전 정의) 서브에이전트

새 파일을 만들 필요 없이 바로 쓸 수 있는 것들:

- **`research`** — 코드베이스 리서치, 파일 탐색, 구조 파악 전용
- **`browser`** — 샌드박스 브라우저를 조작해 상호작용 테스트 수행 (`/browser` 슬래시 커맨드로만 호출)
- **`self`** — 호출한 에이전트와 동일한 시스템 지침/툴셋을 가진 클론

## 8. Antigravity CLI(agy)에서의 사용

- 패널 열기: TUI에서 `/agents` 입력 → Enter → 목록에서 ↑/↓ 로 선택 → Enter로 적용, Esc로 닫기
- 메인 에이전트로 직접 실행: `agy --agent <name>`
- 대화 중 다른 커스텀 에이전트로 전환하면 현재 세션이 자동으로 fork됨(기존 대화 유지)
- 서브에이전트 모니터링 단축키: `Alt+J`