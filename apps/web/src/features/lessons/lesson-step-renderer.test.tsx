import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { writeLessonDraftText } from "@/features/lessons/lesson-draft-storage"
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

  it("저장 초안을 첫 render에서 읽지 않고 mount 이후 복원한다", async () => {
    const step = learnerLessonStepSchema.parse({
      id: "step-hydration-safe",
      min: 1,
      prompt: "초안을 이어 쓰세요",
      sortOrder: 1,
      type: "WRITE",
    })
    writeLessonDraftText("learner-hydration", step.id, "복원할 초안")

    const firstRender = renderToString(
      <LessonStepRenderer learnerId="learner-hydration" step={step} />
    )

    expect(firstRender).not.toContain("복원할 초안")

    render(<LessonStepRenderer learnerId="learner-hydration" step={step} />)

    expect(await screen.findByDisplayValue("복원할 초안")).toBeInTheDocument()
  })

  it("중복 label 매칭도 presentation choice와 콘텐츠 item ID로 제출한다", async () => {
    const onAnswerPayloadChange = vi.fn()
    const step = learnerLessonStepSchema.parse({
      guide: "짝을 고르세요",
      id: "step-match",
      leftItems: [
        { id: "left-a", text: "문장 A" },
        { id: "left-b", text: "문장 B" },
      ],
      rightItems: [
        { id: "right-a", text: "강조" },
        { id: "right-b", text: "강조" },
      ],
      sortOrder: 1,
      title: "중복 label 매칭",
      type: "MATCH",
    })

    render(
      <LessonStepRenderer
        learnerId="learner-match"
        onAnswerPayloadChange={onAnswerPayloadChange}
        step={step}
      />
    )

    const leftGroup = screen.getByRole("group", { name: "왼쪽 선택지" })
    const rightGroup = screen.getByRole("group", { name: "오른쪽 선택지" })
    const secondRightChoice = rightGroup.querySelector(
      '[data-choice-id="right-2"]'
    )

    if (!(secondRightChoice instanceof HTMLButtonElement)) {
      throw new Error("두 번째 오른쪽 선택지를 찾지 못했습니다.")
    }

    await userEvent.click(
      within(leftGroup).getByRole("button", { name: "문장 B" })
    )
    await userEvent.click(secondRightChoice)

    expect(onAnswerPayloadChange).toHaveBeenLastCalledWith({
      payload: {
        pairs: [{ leftItemId: "left-b", rightItemId: "right-b" }],
        type: "MATCH",
      },
      stepId: "step-match",
    })

    await userEvent.click(
      within(leftGroup).getByRole("button", { name: "문장 A" })
    )
    await userEvent.click(secondRightChoice)

    expect(onAnswerPayloadChange).toHaveBeenLastCalledWith({
      payload: {
        pairs: [{ leftItemId: "left-a", rightItemId: "right-b" }],
        type: "MATCH",
      },
      stepId: "step-match",
    })
  })
})
