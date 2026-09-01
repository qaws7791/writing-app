import { describe, expect, it } from "vitest"

import { learnerLessonStepSchema } from "#contracts/learning/learner-content"
import { learnerStepSubmissionSchema } from "#contracts/learning/learner-transition"
import { evaluateStepSubmission } from "#contracts/learning/step-grading"

describe("evaluateStepSubmission", () => {
  it("MULTIPLE_CHOICE 정답 및 오답을 정확히 채점한다", () => {
    const step = learnerLessonStepSchema.parse({
      correct: "opt-2",
      explanation: "2번이 정답입니다.",
      id: "step-mc",
      options: [
        { id: "opt-1", text: "보기 1" },
        { id: "opt-2", text: "보기 2" },
      ],
      question: "질문",
      sortOrder: 1,
      type: "MULTIPLE_CHOICE",
    })

    const correctResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        selectedOptionId: "opt-2",
        type: "MULTIPLE_CHOICE",
      })
    )
    expect(correctResult?.correct).toBe(true)
    expect(correctResult?.explanation).toBe("2번이 정답입니다.")

    const incorrectResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        selectedOptionId: "opt-1",
        type: "MULTIPLE_CHOICE",
      })
    )
    expect(incorrectResult?.correct).toBe(false)
  })

  it("TRUE_FALSE 정답 및 오답을 정확히 채점한다", () => {
    const step = learnerLessonStepSchema.parse({
      correct: true,
      explanation: "참입니다.",
      id: "step-tf",
      question: "질문",
      sortOrder: 2,
      statement: "진술",
      type: "TRUE_FALSE",
    })

    const correctResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        selectedAnswer: true,
        type: "TRUE_FALSE",
      })
    )
    expect(correctResult?.correct).toBe(true)

    const incorrectResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        selectedAnswer: false,
        type: "TRUE_FALSE",
      })
    )
    expect(incorrectResult?.correct).toBe(false)
  })

  it("FILL_BLANK 정답 및 오답을 정확히 채점한다", () => {
    const step = learnerLessonStepSchema.parse({
      answer: ["w-1", "w-2"],
      blankCount: 2,
      choices: [
        { id: "w-1", text: "단어1" },
        { id: "w-2", text: "단어2" },
        { id: "w-3", text: "단어3" },
      ],
      explanation: "빈칸 정답입니다.",
      id: "step-fb",
      sortOrder: 3,
      template: "{0} {1}",
      type: "FILL_BLANK",
    })

    const correctResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        selectedChoiceIds: ["w-1", "w-2"],
        type: "FILL_BLANK",
      })
    )
    expect(correctResult?.correct).toBe(true)

    const incorrectResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        selectedChoiceIds: ["w-2", "w-1"],
        type: "FILL_BLANK",
      })
    )
    expect(incorrectResult?.correct).toBe(false)
  })

  it("ORDER 정답 및 오답을 정확히 채점한다", () => {
    const step = learnerLessonStepSchema.parse({
      correct: ["item-1", "item-2", "item-3"],
      explanation: "순서 정답입니다.",
      id: "step-or",
      items: [
        { id: "item-1", text: "첫째" },
        { id: "item-2", text: "둘째" },
        { id: "item-3", text: "셋째" },
      ],
      sortOrder: 4,
      title: "순서 맞추기",
      type: "ORDER",
    })

    const correctResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        orderedItemIds: ["item-1", "item-2", "item-3"],
        type: "ORDER",
      })
    )
    expect(correctResult?.correct).toBe(true)

    const incorrectResult = evaluateStepSubmission(
      step,
      learnerStepSubmissionSchema.parse({
        orderedItemIds: ["item-2", "item-1", "item-3"],
        type: "ORDER",
      })
    )
    expect(incorrectResult?.correct).toBe(false)
  })
})
