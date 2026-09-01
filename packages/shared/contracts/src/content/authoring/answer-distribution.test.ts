import { describe, expect, it } from "vitest"

import { collectAnswerDistributionIssues } from "#contracts/content/authoring/answer-distribution"
import type { LessonStepDto } from "#contracts/content/course"
import { lessonStepIdSchema } from "#contracts/content/ids"

describe("collectAnswerDistributionIssues", () => {
  it("MULTIPLE_CHOICE 정답 위치 편중을 거절한다", () => {
    const steps = [
      createMultipleChoice("opt-a"),
      createMultipleChoice("opt-a"),
      createMultipleChoice("opt-a"),
      createMultipleChoice("opt-a"),
      createMultipleChoice("opt-b"),
    ]

    const issues = collectAnswerDistributionIssues({
      lessonId: "lesson-1",
      steps,
    })

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain("MULTIPLE_CHOICE")
  })

  it("TRUE_FALSE 정답 편중을 거절한다", () => {
    const steps = [
      createTrueFalse(false),
      createTrueFalse(false),
      createTrueFalse(false),
      createTrueFalse(false),
      createTrueFalse(true),
    ]

    const issues = collectAnswerDistributionIssues({
      lessonId: "lesson-1",
      steps,
    })

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain("TRUE_FALSE")
  })
})

function createMultipleChoice(correctId: string): LessonStepDto {
  return {
    correct: correctId,
    explanation: "해설 문장입니다.",
    id: lessonStepIdSchema.parse("step-mc"),
    options: [
      { id: "opt-a", text: "첫째 선택" },
      { id: "opt-b", text: "둘째 선택" },
    ],
    question: "정답은 무엇인가요?",
    sortOrder: 1,
    type: "MULTIPLE_CHOICE",
  }
}

function createTrueFalse(correct: boolean): LessonStepDto {
  return {
    correct,
    explanation: "해설 문장입니다.",
    id: lessonStepIdSchema.parse("step-tf"),
    question: "맞는 문장은?",
    sortOrder: 1,
    statement: "판정 문장 예시입니다.",
    type: "TRUE_FALSE",
  }
}
