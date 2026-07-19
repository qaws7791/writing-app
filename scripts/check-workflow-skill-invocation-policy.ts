import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

export interface WorkflowSkillPolicySource {
  readonly agentConfiguration?: string
  readonly name: string
  readonly skillMarkdown?: string
}

export function validateWorkflowSkillInvocationPolicy(
  sources: readonly WorkflowSkillPolicySource[]
): readonly string[] {
  return sources.flatMap((source) => {
    const errors: string[] = []

    if (source.skillMarkdown === undefined) {
      errors.push(`${source.name}: SKILL.md가 없습니다.`)
    }

    if (source.agentConfiguration === undefined) {
      errors.push(`${source.name}: agents/openai.yaml이 없습니다.`)
    } else if (!hasDisabledImplicitInvocation(source.agentConfiguration)) {
      errors.push(
        `${source.name}: agents/openai.yaml의 policy.allow_implicit_invocation은 false여야 합니다.`
      )
    }

    return errors
  })
}

function hasDisabledImplicitInvocation(content: string): boolean {
  return /^policy:\s*\r?\n(?:^[ \t]+.*\r?\n)*?^[ \t]+allow_implicit_invocation:\s*false\s*$/mu.test(
    content
  )
}

function readWorkflowSkillPolicySources(
  repositoryRoot: string
): readonly WorkflowSkillPolicySource[] {
  const workflowsDirectory = path.join(
    repositoryRoot,
    ".agents",
    "skills",
    "workflows"
  )
  if (!existsSync(workflowsDirectory)) return []

  return readdirSync(workflowsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const skillDirectory = path.join(workflowsDirectory, entry.name)
      const skillPath = path.join(skillDirectory, "SKILL.md")
      const agentConfigurationPath = path.join(
        skillDirectory,
        "agents",
        "openai.yaml"
      )

      return {
        agentConfiguration: existsSync(agentConfigurationPath)
          ? readFileSync(agentConfigurationPath, "utf8")
          : undefined,
        name: entry.name,
        skillMarkdown: existsSync(skillPath)
          ? readFileSync(skillPath, "utf8")
          : undefined,
      }
    })
}

if (import.meta.main) {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const errors = validateWorkflowSkillInvocationPolicy(
    readWorkflowSkillPolicySources(repositoryRoot)
  )

  if (errors.length > 0) {
    throw new Error(
      `워크플로 스킬 호출 정책 검사가 실패했습니다.\n${errors.join("\n")}`
    )
  }

  console.log("워크플로 스킬 호출 정책 검사를 통과했습니다.")
}
