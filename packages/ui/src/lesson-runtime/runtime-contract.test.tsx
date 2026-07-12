import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LessonStepRenderer } from "#ui/lesson-runtime/renderer"
import { getLessonStepCheckedResult } from "#ui/lesson-runtime/policy"
import type { MultipleChoiceStep } from "#ui/lesson-runtime/types"

const fixture: MultipleChoiceStep = {
  correct: "clear",
  explanation: "구체적인 문장이 더 잘 읽힙니다.",
  id: "shared-multiple-choice",
  options: [
    { id: "vague", text: "좋은 글을 씁니다." },
    { id: "clear", text: "독자가 바로 이해하는 문장을 씁니다." },
  ],
  order: 1,
  question: "더 좋은 문장은 무엇인가요?",
  type: "MULTIPLE_CHOICE",
}

describe("공통 lesson runtime contract", () => {
  it.each(["learner-preview", "admin-preview"])(
    "%s Adapter가 같은 fixture에서 같은 답변과 채점 결과를 만든다",
    async (draftNamespace) => {
      const user = userEvent.setup()
      const onAnswerChange = vi.fn()

      render(
        <LessonStepRenderer
          draftNamespace={draftNamespace}
          onAnswerChange={onAnswerChange}
          step={fixture}
        />
      )

      await user.click(
        screen.getByRole("button", {
          name: "독자가 바로 이해하는 문장을 씁니다.",
        })
      )

      const payload = {
        selectedOptionId: "clear",
        type: "MULTIPLE_CHOICE" as const,
      }
      expect(onAnswerChange).toHaveBeenCalledWith({
        answer: payload,
        stepId: fixture.id,
      })
      expect(getLessonStepCheckedResult(fixture, payload)).toBe("correct")
    }
  )
})
