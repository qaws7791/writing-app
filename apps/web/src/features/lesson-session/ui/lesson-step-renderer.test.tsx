import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LessonStepRenderer } from "@/features/lesson-session/ui/lesson-step-renderer"
import type { LearnerLessonStepDto } from "@/shared/http/learner-api-client"
import { parseLessonStepFixture } from "@/test/learner-api-fixtures"
import type { LessonStep } from "@/features/lesson-session/model/lesson-view-model"
import { stepEvaluationSchema } from "@workspace/contracts/learning/learner-transition"

describe("LessonStepRenderer", () => {
  it("READING 삽화를 canonical 대체 텍스트로 렌더링한다", () => {
    const step = createLessonStep({
      body: "읽기 본문",
      guide: "읽기 안내",
      id: "step-reading-image",
      illustration: {
        altText: "문장 구조를 설명하는 삽화",
        id: "reading-asset-1",
        kind: "reading-illustration",
        url: "https://assets.example.test/reading.webp",
      },
      sortOrder: 1,
      title: "읽기",
      type: "READING",
    })

    render(<LessonStepRenderer step={step} />)

    expect(
      screen.getByRole("img", { name: "문장 구조를 설명하는 삽화" })
    ).toBeVisible()
  })

  it("객관식 선택을 stable option ID 제출로 변환한다", async () => {
    const user = userEvent.setup()
    const onAnswerPayloadChange = vi.fn()
    const step = createLessonStep({
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
        onAnswerPayloadChange={onAnswerPayloadChange}
        step={step}
      />
    )
    await user.click(screen.getByRole("radio", { name: "둘째 답" }))

    expect(onAnswerPayloadChange).toHaveBeenCalledWith({
      payload: { selectedOptionId: "option-b", type: "MULTIPLE_CHOICE" },
      stepId: "step-1",
    })
  })

  it("객관식 오답 평가를 받으면 서버가 지정한 정답 선택지만 계속 활성 상태로 남긴다", () => {
    const step = createLessonStep({
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

    render(<LessonStepRenderer checked={checked} step={step} />)

    expect(screen.getByRole("radio", { name: "둘째 답" })).toBeEnabled()
    expect(screen.getByRole("radio", { name: "첫 답" })).toBeDisabled()
  })

  it("구간 선택 평가를 받으면 서버 해설을 화면에 노출한다", () => {
    const step = createLessonStep({
      id: "step-select",
      items: [
        { id: "select-a", text: "첫 구간" },
        { id: "select-b", text: "둘째 구간" },
      ],
      question: "구간을 고르세요",
      sortOrder: 1,
      type: "SELECT",
    })
    const checked = stepEvaluationSchema.parse({
      correct: false,
      correctItemIds: ["select-b"],
      explanation: "서버 해설",
      items: [
        { id: "select-a", verdict: "incorrect" },
        { id: "select-b", verdict: "missed" },
      ],
      type: "SELECT",
    })

    render(<LessonStepRenderer checked={checked} step={step} />)

    expect(screen.getByText("서버 해설")).toBeVisible()
  })

  it("매칭 양쪽 선택지를 차례로 고르면 콘텐츠 item ID 짝으로 제출한다", async () => {
    const user = userEvent.setup()
    const onAnswerPayloadChange = vi.fn()
    const step = createLessonStep({
      guide: "짝을 고르세요",
      id: "step-match",
      leftItems: [
        { id: "left-a", text: "문장 A" },
        { id: "left-b", text: "문장 B" },
      ],
      rightItems: [
        { id: "right-a", text: "강조" },
        { id: "right-b", text: "대조" },
      ],
      sortOrder: 1,
      title: "매칭",
      type: "MATCH",
    })

    render(
      <LessonStepRenderer
        onAnswerPayloadChange={onAnswerPayloadChange}
        step={step}
      />
    )

    await user.click(getChoice("왼쪽 선택지", "문장 B"))
    await user.click(getChoice("오른쪽 선택지", "대조"))

    expect(onAnswerPayloadChange).toHaveBeenLastCalledWith({
      payload: {
        pairs: [{ leftItemId: "left-b", rightItemId: "right-b" }],
        type: "MATCH",
      },
      stepId: "step-match",
    })
  })
})

function getChoice(groupName: string, choiceName: string): HTMLElement {
  return within(screen.getByRole("group", { name: groupName })).getByRole(
    "button",
    { name: choiceName }
  )
}

function createLessonStep(step: LearnerLessonStepDto): LessonStep {
  return parseLessonStepFixture(step)
}
