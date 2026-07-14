import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import { writeLessonDraftText } from "@workspace/ui/lib/lesson-draft-storage"
import type { LessonStep } from "@/features/lessons/lesson-types"

describe("레슨 스텝 렌더러 답변 저장", () => {
  it("앱 Adapter는 공통 lesson runtime에 학습자 draft namespace를 전달한다", () => {
    const source = readFileSync(
      join(import.meta.dirname, "lesson-step-renderer.tsx"),
      "utf8"
    )

    expect(source).toContain("@workspace/ui/lesson-runtime/renderer")
    expect(source).toContain("draftNamespace={learnerId}")
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
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "좋은 글을 씁니다." })
    ).toHaveAttribute("data-state", "idle")

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
    ).toHaveAttribute("data-state", "selected")
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

    const selectedBlank = screen.getByRole("button", {
      name: "1번째 빈칸 군더더기, 선택 해제",
    })
    selectedBlank.focus()
    await user.keyboard("{Enter}")

    expect(onAnswerChange).toHaveBeenLastCalledWith({
      answer: {
        selectedWords: [""],
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

    const segment = screen.getByRole("button", { name: "정말 매우" })
    segment.focus()
    await user.keyboard(" ")

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: {
        selectedIndexes: [1],
        type: "SELECT",
      },
      stepId: "select-1",
    })
    expect(segment).toHaveAttribute("aria-pressed", "true")
  })

  it("순서 배열 값을 타입별 payload로 전달한다", async () => {
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

    const buttons = screen.getAllByRole("button", {
      name: "드래그하여 순서 변경",
    })
    const secondHandle = buttons[1]
    if (secondHandle === undefined) {
      throw new Error("순서 변경 핸들을 찾지 못했습니다.")
    }
    fireEvent.keyDown(secondHandle, { key: "ArrowUp" })

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: {
        orderedItems: ["원인", "결과"],
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
    ).toBeInTheDocument()
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
    expect(screen.getByText("태그 선택")).toBeInTheDocument()

    const category = screen.getByRole("button", { name: "좋은 문장" })
    await user.click(category)
    expect(category).toHaveAttribute("aria-pressed", "true")

    const item = screen.getByRole("button", {
      name: "독자가 바로 이해한다.",
    })
    item.focus()
    await user.keyboard("{Enter}")

    expect(onAnswerChange).toHaveBeenCalledWith({
      answer: {
        items: [{ categoryId: "good", itemId: "item-1" }],
        type: "CATEGORIZE",
      },
      stepId: "categorize-1",
    })
    expect(item).toHaveAttribute("aria-pressed", "true")
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
    ).toBeInTheDocument()
    expect(screen.getByText("✗")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("여기에 작성하세요...")).toBeEnabled()

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

  it("초안 영구 저장 실패를 표시하되 답안 전달은 계속한다", async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const step: LessonStep = {
      draft: true,
      guide: "초안을 작성하세요.",
      id: "write-draft-failure",
      min: 1,
      order: 1,
      title: "초안 쓰기",
      type: "WRITE",
    }
    renderAnswerableStep(step, onAnswerChange)
    await user.type(screen.getByRole("textbox"), "제출할 초안")
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("저장 용량 초과", "QuotaExceededError")
    })

    await user.click(screen.getByRole("button", { name: "드래프트 저장" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "브라우저 저장 공간이 부족합니다."
    )
    expect(screen.getByRole("button", { name: "다시 저장" })).toBeEnabled()
    expect(onAnswerChange).toHaveBeenLastCalledWith({
      answer: { text: "제출할 초안", type: "WRITE" },
      stepId: "write-draft-failure",
    })
  })
})

describe("레슨 스텝 렌더러 AI 코칭", () => {
  it("AI 코칭 요청 중 로딩을 보여주고 결과와 다시 받기 버튼을 표시한다", async () => {
    writeLessonDraftText("learner-test", "write-step", "짧고 명확하게 쓴다")
    const user = userEvent.setup()
    const feedback = createPendingFeedback()
    const onAiFeedbackRequest = vi.fn(() => feedback.promise)

    render(
      <LessonStepRenderer
        learnerId="learner-test"
        onAiFeedbackRequest={onAiFeedbackRequest}
        step={aiFeedbackStep}
      />
    )

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(screen.getByText("AI가 코칭 중입니다...")).toBeInTheDocument()
    expect(onAiFeedbackRequest).toHaveBeenCalledWith({
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
    expect(screen.getByText(/핵심 문장이 선명합니다\./)).toBeInTheDocument()
    expect(
      screen.getByText(/근거 문장을 한 문장 더 붙여보세요\./)
    ).toBeInTheDocument()
    expect(
      screen.getByText("예시를 하나 더 넣어 다시 써보세요.")
    ).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("/ 5점")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /다시 받기/ })
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
        learnerId="learner-test"
        onAiFeedbackRequest={onAiFeedbackRequest}
        step={aiFeedbackStep}
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
      learnerId="learner-test"
      onAnswerChange={onAnswerChange}
      step={step}
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
  target: "write-step",
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
