import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import {
  learnerLessonStepSchema,
  stepEvaluationSchema,
} from "@workspace/contracts/learning"

describe("LessonStepRenderer", () => {
  it("객관식 선택을 stable option ID 제출로 변환한다", async () => {
    const onAnswerPayloadChange = vi.fn()
    const step = learnerLessonStepSchema.parse({
      id: "step-1",
      options: [
        { id: "option-a", text: "첫 답" },
        { id: "option-b", text: "둘째 답" },
      ],
      question: "고르세요",
      sortOrder: 1,
      type: "MULTIPLE_CHOICE",
    })

    render(
      <LessonStepRenderer
        learnerId="learner-1"
        onAnswerPayloadChange={onAnswerPayloadChange}
        step={step}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "둘째 답" }))

    expect(onAnswerPayloadChange).toHaveBeenCalledWith({
      payload: { selectedOptionId: "option-b", type: "MULTIPLE_CHOICE" },
      stepId: "step-1",
    })
  })

  it("서버 평가의 정답 ID와 해설만 시각 상태로 사용한다", () => {
    const step = learnerLessonStepSchema.parse({
      id: "step-1",
      options: [
        { id: "option-a", text: "첫 답" },
        { id: "option-b", text: "둘째 답" },
      ],
      question: "고르세요",
      sortOrder: 1,
      type: "MULTIPLE_CHOICE",
    })
    const checked = stepEvaluationSchema.parse({
      correct: false,
      correctItemIds: ["option-b"],
      explanation: "서버 해설",
      items: [
        { id: "option-a", verdict: "incorrect" },
        { id: "option-b", verdict: "missed" },
      ],
      type: "MULTIPLE_CHOICE",
    })

    render(
      <LessonStepRenderer checked={checked} learnerId="learner-1" step={step} />
    )

    expect(screen.getByRole("button", { name: "둘째 답" })).toHaveAttribute(
      "data-state",
      "correct"
    )
  })

  it("AI feedback 요청을 현재 step ID로 위임한다", async () => {
    const onAiFeedbackRequest = vi.fn(async () => ({
      feedback: {
        improvements: [],
        nextAction: "다음 행동",
        remainingAttempts: 1,
        score: 0,
        scoreRange: [0, 100] as [number, number],
        showScore: false,
        strengths: [],
        summary: "코칭 결과",
      },
      status: "ok" as const,
    }))
    const step = learnerLessonStepSchema.parse({
      focus: "논리",
      id: "step-ai",
      sortOrder: 2,
      target: "step-write",
      type: "AI_FEEDBACK",
    })

    render(
      <LessonStepRenderer
        learnerId="learner-1"
        onAiFeedbackRequest={onAiFeedbackRequest}
        step={step}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(onAiFeedbackRequest).toHaveBeenCalledWith({ stepId: "step-ai" })
    expect(await screen.findByText("코칭 결과")).toBeInTheDocument()
  })
})
