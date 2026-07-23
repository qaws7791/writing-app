import { describe, expect, test } from "bun:test"

import { validateWorkflowSkillInvocationPolicy } from "#scripts/check-workflow-skill-invocation-policy"

describe("워크플로 스킬 호출 정책", () => {
  test("명시 호출 전용 정책을 허용한다", () => {
    expect(
      validateWorkflowSkillInvocationPolicy([
        {
          agentConfiguration:
            "interface:\n  display_name: fixture\npolicy:\n  allow_implicit_invocation: false\n",
          name: "fixture",
        },
      ])
    ).toEqual([])
  })

  test("누락되거나 자동 호출이 가능한 정책을 거부한다", () => {
    expect(
      validateWorkflowSkillInvocationPolicy([
        {
          agentConfiguration: "policy:\n  allow_implicit_invocation: true\n",
          name: "implicit",
        },
        { name: "missing" },
      ])
    ).toEqual([
      "implicit: agents/openai.yaml의 policy.allow_implicit_invocation은 false여야 합니다.",
      "missing: agents/openai.yaml이 없습니다.",
    ])
  })
})
