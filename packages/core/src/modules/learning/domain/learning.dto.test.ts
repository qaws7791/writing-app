import { describe, expect, it } from "vitest"

import { saveStepAnswerCommandSchema } from "@/modules/learning/domain/learning.dto"

describe("학습 답변 DTO", () => {
  it("스텝 답변 저장 command는 정의된 학습 답변만 허용한다", () => {
    const command = {
      answer: {
        selectedOptionId: "b",
        type: "MULTIPLE_CHOICE",
      },
      lessonId: "l1",
      occurredAt: new Date("2026-06-14T10:00:00.000Z"),
      stepId: "l1-s2",
      userId: "user-1",
    }

    expect(saveStepAnswerCommandSchema.parse(command)).toEqual(command)
    expect(
      saveStepAnswerCommandSchema.safeParse({
        ...command,
        answer: {
          selected: "b",
        },
      }).success
    ).toBe(false)
  })
})
