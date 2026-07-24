import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  LessonStepRenderer,
  lessonStepRendererByType,
} from "@/features/lesson-session/ui/lesson-step-renderer"
import type { LearnerLessonStepDto } from "@/shared/http/learner-api-client"
import { lessonStepDefinitions } from "@workspace/contracts/content/steps"
import { stepEvaluationSchema } from "@workspace/contracts/learning/learner-transition"

describe("LessonStepRenderer", () => {
  it("canonical 10타입 계약과 renderer registry key가 일치한다", () => {
    expect(Object.keys(lessonStepRendererByType).sort()).toEqual(
      Object.keys(lessonStepDefinitions).sort()
    )
  })

  it("모바일 콘텐츠 폭에서 10개 활동 타입을 모두 렌더링한다", () => {
    const steps: LearnerLessonStepDto[] = [
      {
        body: "읽기 본문",
        guide: "읽기 안내",
        id: "step-reading",
        sortOrder: 1,
        title: "읽기",
        type: "READING",
      },
      {
        id: "step-compare",
        sortOrder: 2,
        title: "비교",
        type: "COMPARE",
        versions: [
          { label: "A", text: "첫 문장" },
          { label: "B", text: "둘째 문장" },
        ],
      },
      {
        id: "step-choice",
        options: [
          { id: "choice-a", text: "첫 답" },
          { id: "choice-b", text: "둘째 답" },
        ],
        question: "객관식",
        sortOrder: 3,
        type: "MULTIPLE_CHOICE",
      },
      {
        blankCount: 1,
        choices: [{ id: "blank-a", text: "빈칸 답" }],
        id: "step-blank",
        sortOrder: 4,
        template: "문장 ___",
        type: "FILL_BLANK",
      },
      {
        id: "step-select",
        items: [{ id: "select-a", text: "선택 구간" }],
        layout: "block",
        question: "구간 선택",
        sortOrder: 5,
        type: "SELECT",
      },
      {
        id: "step-order",
        items: [
          { id: "order-a", text: "첫째" },
          { id: "order-b", text: "둘째" },
        ],
        sortOrder: 6,
        title: "순서",
        type: "ORDER",
      },
      {
        id: "step-write",
        min: 1,
        prompt: "작성하기",
        sortOrder: 7,
        type: "WRITE",
      },
      {
        focus: "명료성",
        id: "step-feedback",
        sortOrder: 8,
        target: "step-write",
        type: "AI_FEEDBACK",
      },
      {
        guide: "짝을 맞추세요",
        id: "step-match-all",
        leftItems: [{ id: "left-a", text: "왼쪽" }],
        rightItems: [{ id: "right-a", text: "오른쪽" }],
        sortOrder: 9,
        title: "매칭",
        type: "MATCH",
      },
      {
        categories: [{ id: "category-a", text: "범주" }],
        guide: "분류하세요",
        id: "step-categorize",
        items: [{ id: "item-a", text: "항목" }],
        sortOrder: 10,
        title: "분류",
        type: "CATEGORIZE",
      },
    ]

    for (const step of steps) {
      const { container, unmount } = render(
        <div style={{ width: 390 }}>
          <LessonStepRenderer step={step} />
        </div>
      )

      expect(container.querySelector("section")).toBeInTheDocument()
      unmount()
    }
  })

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
    await userEvent.click(screen.getByRole("button", { name: "둘째 답" }))

    expect(onAnswerPayloadChange).toHaveBeenCalledWith({
      payload: { selectedOptionId: "option-b", type: "MULTIPLE_CHOICE" },
      stepId: "step-1",
    })
  })

  it("서버 평가의 정답 ID와 해설만 시각 상태로 사용한다", () => {
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
        strengths: [],
        summary: "코칭 결과",
      },
      status: "ok" as const,
    }))
    const step = createLessonStep({
      focus: "논리",
      id: "step-ai",
      sortOrder: 2,
      target: "step-write",
      type: "AI_FEEDBACK",
    })

    render(
      <LessonStepRenderer
        onAiFeedbackRequest={onAiFeedbackRequest}
        step={step}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(onAiFeedbackRequest).toHaveBeenCalledWith({ stepId: "step-ai" })
    expect(await screen.findByText("코칭 결과")).toBeInTheDocument()
  })

  it("AI feedback 실패 후 서버 skip 요청을 현재 step ID로 위임한다", async () => {
    const onAiFeedbackSkip = vi.fn(async () => ({ status: "ok" as const }))
    const step = createLessonStep({
      focus: "논리",
      id: "step-ai",
      sortOrder: 2,
      target: "step-write",
      type: "AI_FEEDBACK",
    })

    render(
      <LessonStepRenderer
        onAiFeedbackRequest={async () => ({
          kind: "retryable",
          message: "AI 코칭을 잠시 사용할 수 없습니다.",
          status: "error",
        })}
        onAiFeedbackSkip={onAiFeedbackSkip}
        step={step}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "AI 코칭 받기" }))
    await userEvent.click(
      screen.getByRole("button", { name: "피드백 없이 계속하기" })
    )

    expect(onAiFeedbackSkip).toHaveBeenCalledWith({ stepId: "step-ai" })
  })

  it("서버 초안을 첫 render부터 일관되게 복원한다", () => {
    const step = createLessonStep({
      id: "step-hydration-safe",
      min: 1,
      prompt: "초안을 이어 쓰세요",
      sortOrder: 1,
      type: "WRITE",
    })
    const answerPayload = { text: "복원할 초안", type: "WRITE" } as const

    const firstRender = renderToString(
      <LessonStepRenderer answerPayload={answerPayload} step={step} />
    )

    expect(firstRender).toContain("복원할 초안")

    render(<LessonStepRenderer answerPayload={answerPayload} step={step} />)

    expect(screen.getByDisplayValue("복원할 초안")).toBeInTheDocument()
  })

  it("중복 label 매칭도 presentation choice와 콘텐츠 item ID로 제출한다", async () => {
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
        { id: "right-b", text: "강조" },
      ],
      sortOrder: 1,
      title: "중복 label 매칭",
      type: "MATCH",
    })

    render(
      <LessonStepRenderer
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

function createLessonStep(step: LearnerLessonStepDto): LearnerLessonStepDto {
  return step
}
