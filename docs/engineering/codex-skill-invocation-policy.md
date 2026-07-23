# Codex 워크플로 스킬 호출 정책

## 목적

워크플로 스킬은 사용자가 명시적으로 요청할 때만 활성화한다. 일반 사용자 프롬프트의 의미 일치만으로 스킬을 자동 활성화하지 않는다.

## 적용 범위

`.agents/skills/workflows` 스킬에 적용한다.

## 설정

각 스킬의 `agents/openai.yaml`에는 다음 Codex 정책을 둔다. Codex 호출 정책은 이 파일이 소유하며 `SKILL.md` frontmatter에 같은 사실을 복제하지 않는다.

```yaml
policy:
  allow_implicit_invocation: false
```

Codex에서는 스킬 이름을 명시해 호출한다.

## 검증

새 Codex 세션에서 일반 프롬프트가 워크플로 스킬을 자동 활성화하지 않고, 명시 호출은 활성화하는지 확인한다. 변경이 반영되지 않으면 Codex를 재시작한 뒤 다시 확인한다.
