import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import type { LessonStep } from "@/features/lessons/lesson-types"

describe("레슨 스텝 렌더러 답변 저장", () => {
  it("객관식 선택을 타입별 JSON 문자열로 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      correct: "clear",
      explanation: "구체적인 문장이 더 잘 읽힙니다.",
      id: "mc-1",
      options: [
        { id: "vague", text: "좋은 글을 씁니다." },
        { id: "clear", text: "독자가 바로 이해하는 문장을 씁니다." },
      ],
      order: 1,
      question: "더 좋은 문장은 무엇인가요?",
      type: "MULTIPLE_CHOICE",
    }

    renderAnswerableStep(step, onAnswerChange)

    await user.click(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    )

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: JSON.stringify({
        selectedOptionId: "clear",
        type: "MULTIPLE_CHOICE",
      }),
      stepId: "mc-1",
    })
  })

  it("빈칸 선택 단어를 타입별 JSON 문자열로 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      answer: ["군더더기"],
      explanation: "불필요한 표현을 덜어냅니다.",
      id: "blank-1",
      order: 1,
      template: "문장은 ___ 없이 써야 합니다.",
      type: "FILL_BLANK",
      words: ["군더더기", "장식"],
    }

    renderAnswerableStep(step, onAnswerChange)

    await user.click(screen.getByRole("button", { name: "군더더기" }))

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: JSON.stringify({
        selectedWords: ["군더더기"],
        type: "FILL_BLANK",
      }),
      stepId: "blank-1",
    })
  })

  it("단어 선택 인덱스를 타입별 JSON 문자열로 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      correct: [1],
      explanation: "두 번째 표현이 중복입니다.",
      id: "select-1",
      order: 1,
      question: "불필요한 표현을 고르세요.",
      segments: ["나는", "정말 매우", "기쁘다"],
      type: "SELECT",
    }

    renderAnswerableStep(step, onAnswerChange)

    await user.click(screen.getByRole("button", { name: "정말 매우" }))

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: JSON.stringify({
        selectedIndexes: [1],
        type: "SELECT",
      }),
      stepId: "select-1",
    })
  })

  it("순서 배열 값을 타입별 JSON 문자열로 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      correct: ["원인", "결과"],
      explanation: "원인 다음 결과가 자연스럽습니다.",
      id: "order-1",
      items: ["결과", "원인"],
      order: 1,
      title: "문장 순서 정리",
      type: "ORDER",
    }

    renderAnswerableStep(step, onAnswerChange)

    await user.click(screen.getByRole("button", { name: "원인 순서에 추가" }))

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: JSON.stringify({
        orderedItems: ["원인"],
        type: "ORDER",
      }),
      stepId: "order-1",
    })
  })

  it("매칭 선택을 타입별 JSON 문자열로 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      explanation: "표현과 효과를 연결합니다.",
      guide: "왼쪽 표현에 맞는 효과를 고르세요.",
      id: "match-1",
      order: 1,
      pairs: [{ left: "짧은 문장", right: "속도가 빨라진다" }],
      title: "표현과 효과 연결",
      type: "MATCH",
    }

    renderAnswerableStep(step, onAnswerChange)

    await user.selectOptions(
      screen.getByRole("combobox", { name: "짧은 문장 연결" }),
      "속도가 빨라진다"
    )

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: JSON.stringify({
        pairs: [{ left: "짧은 문장", right: "속도가 빨라진다" }],
        type: "MATCH",
      }),
      stepId: "match-1",
    })
  })

  it("분류 선택을 타입별 JSON 문자열로 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      categories: [
        { id: "good", label: "좋은 문장" },
        { id: "rough", label: "다듬을 문장" },
      ],
      explanation: "문장 상태를 구분합니다.",
      guide: "각 문장을 알맞게 분류하세요.",
      id: "categorize-1",
      items: [
        {
          categoryId: "good",
          id: "item-1",
          text: "독자가 바로 이해한다.",
        },
      ],
      order: 1,
      title: "문장 분류",
      type: "CATEGORIZE",
    }

    renderAnswerableStep(step, onAnswerChange)

    await user.selectOptions(
      screen.getByRole("combobox", { name: "독자가 바로 이해한다. 분류" }),
      "good"
    )

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: JSON.stringify({
        items: [{ categoryId: "good", itemId: "item-1" }],
        type: "CATEGORIZE",
      }),
      stepId: "categorize-1",
    })
  })

  it("글쓰기 입력을 타입별 JSON 문자열로 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      guide: "좋은 문장의 기준을 한 문장으로 적어보세요.",
      id: "write-1",
      min: 5,
      order: 1,
      title: "한 문장 쓰기",
      type: "WRITE",
    }

    renderAnswerableStep(step, onAnswerChange)

    await user.type(
      screen.getByRole("textbox", { name: "답변 입력" }),
      "짧고 명확하게 쓴다"
    )

    await waitFor(() =>
      expect(onAnswerChange).toHaveBeenLastCalledWith({
        answer: JSON.stringify({
          text: "짧고 명확하게 쓴다",
          type: "WRITE",
        }),
        stepId: "write-1",
      })
    )
  })
})

function renderAnswerableStep(
  step: LessonStep,
  onAnswerChange: (answer: {
    readonly answer: string
    readonly stepId: string
  }) => void
) {
  render(
    <LessonStepRenderer
      onAnswerChange={onAnswerChange}
      step={step}
      stepIndex={0}
      totalSteps={1}
    />
  )
}
