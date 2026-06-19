import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import type { LessonStep } from "@/features/lessons/lesson-types"

describe("레슨 스텝 렌더러 답변 저장", () => {
  it("스텝 타입별 콘텐츠 렌더링은 switch 대신 레지스트리로 연결한다", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/lessons/lesson-step-renderer.tsx"),
      "utf8"
    )

    expect(source).toContain("stepContentRendererByType")
    expect(source).not.toContain("switch (step.type)")
  })

  it("객관식 선택을 현재 제품 버튼 UI로 타입별 payload로 전달한다", async () => {
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

    expect(
      screen.getByRole("heading", { name: "더 좋은 문장은 무엇인가요?" })
    ).toHaveStyle({ fontSize: "1.625rem", lineHeight: "1.3" })
    expect(
      screen.getByRole("button", { name: "좋은 글을 씁니다." })
    ).toHaveClass("bg-surface", "text-charcoal", "rounded-3xl")

    await user.click(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    )

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: {
        selectedOptionId: "clear",
        type: "MULTIPLE_CHOICE",
      },
      stepId: "mc-1",
    })
    expect(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    ).toHaveClass("bg-primary", "text-ink")
    expect(screen.queryByText("정답입니다.")).not.toBeInTheDocument()
  })

  it("빈칸 선택 단어를 타입별 payload로 전달한다", async () => {
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
      answer: {
        selectedWords: ["군더더기"],
        type: "FILL_BLANK",
      },
      stepId: "blank-1",
    })
  })

  it("단어 선택 인덱스를 타입별 payload로 전달한다", async () => {
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
      answer: {
        selectedIndexes: [1],
        type: "SELECT",
      },
      stepId: "select-1",
    })
  })

  it("순서 배열 값을 타입별 payload로 전달한다", async () => {
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
      answer: {
        orderedItems: ["원인"],
        type: "ORDER",
      },
      stepId: "order-1",
    })
  })

  it("매칭 스텝은 현재 제품 버튼 페어링 UI로 답을 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      explanation: "표현과 효과를 연결합니다.",
      guide: "왼쪽 표현에 맞는 효과를 고르세요.",
      id: "match-1",
      order: 1,
      pairs: [{ left: "그러나", right: "역접" }],
      title: "접속사와 기능 짝짓기",
      type: "MATCH",
    }

    renderAnswerableStep(step, onAnswerChange)

    expect(
      screen.getByRole("heading", { name: "접속사와 기능 짝짓기" })
    ).toHaveStyle({ fontSize: "1.625rem", lineHeight: "1.3" })
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "그러나" }))
    await user.click(screen.getByRole("button", { name: "역접" }))

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: {
        pairs: [{ left: "그러나", right: "역접" }],
        type: "MATCH",
      },
      stepId: "match-1",
    })
    expect(screen.getByRole("button", { name: "그러나" })).toHaveClass(
      "bg-primary",
      "text-ink"
    )
  })

  it("분류 스텝은 현재 제품 태그 패널 UI로 답을 전달한다", async () => {
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

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.getByText("태그 선택")).toHaveClass(
      "font-bold",
      "text-muted",
      "tracking-widest"
    )
    expect(screen.getByText("태그 선택").parentElement).not.toHaveClass(
      "absolute"
    )

    await user.click(screen.getByRole("button", { name: "좋은 문장" }))
    await user.click(screen.getByText("독자가 바로 이해한다."))

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: {
        items: [{ categoryId: "good", itemId: "item-1" }],
        type: "CATEGORIZE",
      },
      stepId: "categorize-1",
    })
  })

  it("글쓰기 스텝은 쓰기 구조 가이드와 글자 카운터를 보여주고 답을 전달한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step = {
      goal: 80,
      guide: "좋은 문장의 기준을 한 문장으로 적어보세요.",
      id: "write-1",
      min: 20,
      order: 1,
      structure:
        "- **독자**: 이 글을 읽을 대상은 누구인가요?\n- **목적**: 이 글의 목적은 무엇인가요?",
      title: "한 문장 쓰기",
      type: "WRITE",
    } as LessonStep

    renderAnswerableStep(step, onAnswerChange)

    expect(screen.getByText("구조 가이드")).toBeInTheDocument()
    expect(
      screen.getByText("0자 · 최소 20 · 목표 80 · 최대 2000").parentElement
    ).toHaveClass("text-muted", "font-bold")
    expect(screen.getByText("✗")).toHaveClass("text-coral-dark")
    expect(screen.getByPlaceholderText("여기에 작성하세요...")).toHaveClass(
      "w-full",
      "bg-surface",
      "rounded-4xl",
      "p-6"
    )

    await user.type(
      screen.getByPlaceholderText("여기에 작성하세요..."),
      "짧고 명확하게 쓰는 문장이 좋다"
    )

    await waitFor(() =>
      expect(onAnswerChange).toHaveBeenLastCalledWith({
        answer: {
          text: "짧고 명확하게 쓰는 문장이 좋다",
          type: "WRITE",
        },
        stepId: "write-1",
      })
    )
  })
})

describe("레슨 스텝 렌더러 AI 코칭", () => {
  it("AI 코칭 요청 중 로딩을 보여주고 결과와 다시 받기 버튼을 표시한다", async () => {
    const user = userEvent.setup()
    const feedback = createPendingFeedback()
    const onAiFeedbackRequest = vi.fn(() => feedback.promise)

    render(
      <LessonStepRenderer
        onAiFeedbackRequest={onAiFeedbackRequest}
        step={aiFeedbackStep}
        stepIndex={0}
        totalSteps={1}
      />
    )

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(screen.getByText("AI 코칭을 준비하고 있습니다.")).toBeInTheDocument()
    expect(onAiFeedbackRequest).toHaveBeenCalledWith({
      answer: "짧고 명확하게 쓴다",
      stepId: "ai-1",
    })

    feedback.resolve({
      feedback: {
        improvements: ["근거 문장을 한 문장 더 붙여보세요."],
        nextAction: "예시를 하나 더 넣어 다시 써보세요.",
        remainingAttempts: 1,
        score: 4,
        scoreRange: [0, 5],
        showScore: true,
        strengths: ["핵심 문장이 선명합니다."],
        summary: "전체 흐름이 선명합니다.",
      },
      status: "ok",
    })

    expect(
      await screen.findByText("전체 흐름이 선명합니다.")
    ).toBeInTheDocument()
    expect(screen.getByText("핵심 문장이 선명합니다.")).toBeInTheDocument()
    expect(
      screen.getByText("근거 문장을 한 문장 더 붙여보세요.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("예시를 하나 더 넣어 다시 써보세요.")
    ).toBeInTheDocument()
    expect(screen.getByText("4/5점")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "다시 받기" })
    ).toBeInTheDocument()
  })

  it("AI 코칭 시도 한도 초과 오류를 한국어로 표시한다", async () => {
    const user = userEvent.setup()
    const onAiFeedbackRequest = vi.fn(async () => ({
      message: "AI 코칭 시도 횟수를 모두 사용했습니다.",
      status: "error" as const,
    }))

    render(
      <LessonStepRenderer
        onAiFeedbackRequest={onAiFeedbackRequest}
        step={aiFeedbackStep}
        stepIndex={0}
        totalSteps={1}
      />
    )

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(
      await screen.findByText("AI 코칭 시도 횟수를 모두 사용했습니다.")
    ).toBeInTheDocument()
  })
})

function renderAnswerableStep(
  step: LessonStep,
  onAnswerChange: (answer: {
    readonly answer: object
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

const aiFeedbackStep: LessonStep = {
  allowRetry: true,
  feedback: "초기 코칭 안내입니다.",
  focus: "문장이 선명한지 확인합니다.",
  id: "ai-1",
  order: 1,
  score: 0,
  scoreMax: 5,
  showScore: true,
  target: "짧고 명확하게 쓴다",
  type: "AI_FEEDBACK",
}

type PendingFeedbackOutcome = {
  readonly feedback: {
    readonly improvements: readonly string[]
    readonly nextAction: string
    readonly remainingAttempts: number
    readonly score: number
    readonly scoreRange: readonly [number, number]
    readonly showScore: boolean
    readonly strengths: readonly string[]
    readonly summary: string
  }
  readonly status: "ok"
}

function createPendingFeedback() {
  let resolve: (value: PendingFeedbackOutcome) => void = () => undefined
  const promise = new Promise<PendingFeedbackOutcome>((promiseResolve) => {
    resolve = promiseResolve
  })

  return {
    promise,
    resolve,
  }
}
