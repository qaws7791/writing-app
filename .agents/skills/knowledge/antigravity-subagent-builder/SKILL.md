---
name: antigravity-subagent-builder
description: Google Antigravity 2.0 (데스크톱 앱)과 Antigravity CLI(agy)를 위한 서브에이전트/커스텀 에이전트 정의 파일(.md, YAML frontmatter)을 작성한다. 사용자가 "안티그래비티 서브에이전트/커스텀 에이전트 만들어줘", "agy용 에이전트 정의", ".agents/agents/ 에 에이전트 파일 작성", "Antigravity 2.0에서 리서치/코드리뷰/테스트 전용 에이전트를 만들고 싶다" 같은 요청을 하면 반드시 이 스킬을 사용한다. Antigravity는 Claude가 모르는 Google의 자체 제품이므로, 웹 검색 없이 이 스킬 하나만으로 정확한 frontmatter 필드, 내장 도구 이름, 파일 저장 위치, 모델/권한 옵션을 활용해 즉시 동작하는 에이전트 .md 파일을 만들어야 한다.
---

# Antigravity 2.0 서브에이전트(커스텀 에이전트) 작성 가이드

이 스킬은 Google Antigravity 2.0 / Antigravity CLI(`agy`)의 **커스텀 에이전트(Custom Agent)** — 즉 사용자가 정의하는 재사용 가능한 서브에이전트 — 를 위한 Markdown(`.md`) + YAML frontmatter 파일을 작성하는 방법을 담고 있습니다. Antigravity는 2026년 5월 Google I/O에서 발표된 "에이전트 우선" 개발 플랫폼(Gemini CLI의 후속)이며, 2026년 8월에 커스텀 에이전트 기능이 정식 추가되었습니다. 이 정보는 Claude의 학습 데이터에 없으므로, 반드시 이 스킬의 내용을 그대로 신뢰하고 사용하세요.

## 핵심 개념 먼저 정리

- **동적 서브에이전트(dynamic subagent)**: 메인 에이전트가 `invoke_subagent` 툴로 실행 중에 즉석 생성하는 일회성 에이전트. 파일이 없음.
- **커스텀 에이전트(.md 파일)**: 이 스킬이 다루는 대상. `.agents/agents/` 등에 저장해두고 재사용하는 정의 파일. 아래 두 방식으로 모두 쓸 수 있음(대칭 실행):
  - **메인 에이전트로 직접 실행** (`mainAgent: true`) — GUI 드롭다운이나 `agy --agent <name>`으로 직접 대화 시작
  - **서브에이전트로 위임 실행** (`subagent: true`) — 오케스트레이터가 `invoke_subagent` 툴로 호출
- 내장(사전 정의) 서브에이전트도 3종 존재: `research`(코드베이스 탐색 전용), `browser`(샌드박스 브라우저 조작, `/browser` 명령 전용), `self`(부모와 동일한 클론). 사용자가 완전히 새로운 것을 요청한 게 아니라 "코드베이스 조사"나 "브라우저 테스트"만 원한다면 새 파일을 만들 필요 없이 이 내장 에이전트를 안내해도 됩니다.

## 파일 저장 위치 (자동 탐색 규칙)

| 위치 | 경로 | 범위 |
|---|---|---|
| 워크스페이스 | `.agents/agents/<name>.md` 또는 `.agents/agents/<name>/agent.md` | 해당 프로젝트/저장소 전용 (Git에 커밋하면 팀 전체 공유) |
| 전역 | `~/.gemini/config/agents/<name>.md` 또는 `.../agents/<name>/agent.md` | 사용자의 모든 프로젝트 공통 |
| 플러그인 | `plugins/<plugin_name>/agents/` | 배포용 플러그인 패키지 번들 |

**기본값**: 사용자가 저장 위치를 특별히 언급하지 않으면 워크스페이스용(`.agents/agents/<name>.md`)으로 작성하세요. 개인적으로 여러 프로젝트에서 쓸 범용 에이전트라고 하면 전역 경로를 제안하세요.

## 작성 절차

1. **역할 파악**: 이 에이전트가 무엇을 전담할지(예: 보안 감사, 테스트 실행, 문서 작성, 의존성 업그레이드, 리서치 전용) 파악합니다. 사용자가 이미 충분히 설명했다면 추가 질문 없이 진행하고, 정말 모호할 때만 한 가지만 짧게 확인하세요.
2. **파일명(`name`) 결정**: 소문자 + 하이픈(kebab-case). 역할을 그대로 드러내는 이름 (`code-auditor`, `test-runner`, `docs-writer` 등).
3. **frontmatter 필드 채우기**: 아래 "핵심 frontmatter 필드"와 `references/frontmatter-spec.md`를 참고해 `tools`, `model`, `commandExecutionPolicy`, `mainAgent`/`subagent`, `skills` 값을 정합니다.
   - **도구는 필요한 것만 최소로** 부여하세요 (컨텍스트 낭비 방지, 실수로 인한 파괴적 작업 방지). 정확한 도구 이름은 `references/tools-reference.md`에서 확인하고, 절대 추측한 이름을 쓰지 마세요 — 잘못된 도구 이름은 (공식 문서에 명시된 알려진 버그로) 서브에이전트 프로세스가 멈추는(hang) 원인이 됩니다.
   - 읽기/분석 전용 에이전트는 쓰기 도구(`write_to_file`, `replace_file_content`, `multi_replace_file_content`)를 아예 빼고 `commandExecutionPolicy: off` 또는 `sandbox`로 두세요.
   - 코드를 직접 수정/실행하는 에이전트는 `commandExecutionPolicy: auto`(테스트/빌드류 자동 실행)를 검토하되, 파괴적 명령은 여전히 승인이 필요하다는 점을 사용자에게 안내하세요.
4. **시스템 프롬프트(마크다운 본문) 작성**: frontmatter 아래 `---` 이후 내용이 그대로 이 에이전트의 시스템 프롬프트가 됩니다. `# 역할`, `# 지침`, `# 체크리스트` 같은 H1/H2 섹션으로 명확하게 구조화하세요.
5. **파일 생성**: `create_file` 툴로 위에서 정한 경로에 저장합니다 (예: 프로젝트 루트가 있다면 `<workspace>/.agents/agents/<name>.md`, 없으면 사용자에게 저장 위치를 확인하거나 `/mnt/user-data/outputs/`에 만들어 다운로드하게 하세요).
6. **완성 후 안내**: 이 파일을 커밋하면 팀 전체가 자동으로 쓸 수 있다는 점, GUI에서는 `/agents` 패널(또는 드롭다운)로 선택 가능하고 CLI에서는 `agy --agent <name>`으로 직접 실행하거나 메인 에이전트가 `invoke_subagent`로 위임 호출한다는 점을 간단히 알려주세요.

## 핵심 frontmatter 필드 (요약 — 전체 표는 `references/frontmatter-spec.md`)

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `name` | string | *(필수)* | 에이전트 고유 식별자 |
| `description` | string | *(필수)* | 오케스트레이터가 언제 이 에이전트에 위임할지 판단하는 근거. 구체적으로 작성 |
| `tools` | string[] | `[]` | 허용할 도구 이름 목록 (정확한 이름은 `references/tools-reference.md`) |
| `mainAgent` | boolean | `true` | 메인 에이전트로 직접 선택 가능 여부 |
| `subagent` | boolean | `true` | `invoke_subagent`로 위임 호출 가능 여부 |
| `model` | string | `inherit` | `inherit` \| `flash` \| `pro` |
| `commandExecutionPolicy` | string | `sandbox` | `off` \| `auto` \| `eager` \| `sandbox` |
| `mcpServers` | object[] | `[]` | 이 에이전트 전용 MCP 서버 |
| `skills` / `plugins` | string[] | `[]` | 참조할 스킬 경로(예: `skills/my-helper-skill`) 또는 플러그인 |

## 최소 예시

```
---
name: dependency-modernizer
description: Helps upgrade local packages and verify that project tests pass.
model: flash
tools:
  - view_file
  - replace_file_content
  - run_command
---

# Core Instructions
You are a dependency modernizer. Your job is to check configuration files,
update target dependencies, run test suites, and verify the build passes.
```

더 다양한 역할별 완성 예시(코드 감사, 테스트 실행, 문서 작성, 리서치 전용 등)는 `references/examples.md`를 참고해 그대로 변형해서 쓰세요.

## 알려진 주의사항

- **잘못된 도구 이름 → 행(hang) 버그**: `tools` 목록에 오탈자나 존재하지 않는 이름을 넣으면 서브에이전트가 멈출 수 있습니다(공식 문서에 명시된 기존 이슈). 반드시 `references/tools-reference.md`의 정확한 이름만 사용하세요.
- **중첩 깊이 제한**: 서브에이전트가 또 다른 서브에이전트를 부르는 중첩은 최대 10단계까지만 허용됩니다.
- **권한 상속**: 서브에이전트는 부모 에이전트의 명령어 허용 prefix, 파일 읽기/쓰기 범위, 샌드박스 설정을 그대로 상속받습니다. `commandExecutionPolicy`는 그 안에서 이 에이전트가 얼마나 자동으로 명령을 실행할지만 조정합니다.
- **스킬 경로 형식**: `skills:` 필드는 실제 `SKILL.md`가 있는 폴더 경로를 가리켜야 합니다 (`.agents/skills/<skill-folder>/` 또는 전역 `~/.gemini/config/skills/<skill-folder>/`). Antigravity의 스킬 포맷 자체는 Claude Skills(SKILL.md + YAML frontmatter, `name`/`description`)와 동일한 오픈 스탠다드를 따릅니다.
- **`permissionMode` 필드**: 공식 블로그 예시 중 하나에서 `permissionMode: acceptEdits`가 `commandExecutionPolicy`와 함께 언급된 적이 있지만, 현재 공식 frontmatter 레퍼런스 표에는 정식 필드로 등재되어 있지 않습니다. 이 값을 요청받으면 넣어주되, 실제 동작이 문서화된 `commandExecutionPolicy`만큼 확정적이지 않을 수 있다고 사용자에게 알려주세요.

## 더 깊은 내용이 필요할 때

- 전체 frontmatter 필드 규격, 서브에이전트 생명주기(Running/Idle/Killed), 권한 모델 개요 → `references/frontmatter-spec.md`
- 정확한 내장 도구 이름 전체 목록(파일/검색/실행/에이전트협업/상호작용 카테고리별) → `references/tools-reference.md`
- 역할별 바로 쓸 수 있는 완성 예시 5종 → `references/examples.md`
