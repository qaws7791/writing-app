import * as React from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { Lesson } from "@/features/lessons/lesson-types"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"
import { getDefaultLesson } from "@test/api/fixtures/lesson-data"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@workspace/ui/components/ui/progress", () => ({
  Progress: ({ value }: { value: number }) => (
    <div aria-label="레슨 진행률" data-value={value} />
  ),
}))

vi.mock("@workspace/ui/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@workspace/ui/components/ui/badge", () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>{children}</span>
  ),
}))

vi.mock("@workspace/ui/components/ui/card", () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}))

vi.mock("@workspace/ui/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}))

vi.mock("@workspace/ui/components/icons", () => ({
  CheckIcon: () => <span aria-hidden="true" />,
  GripVerticalIcon: () => <span aria-hidden="true" />,
  HeartIcon: () => <span aria-hidden="true" />,
  SparklesIcon: () => <span aria-hidden="true" />,
  XIcon: () => <span aria-hidden="true" />,
}))

const api: Pick<
  WritingAppApi,
  | "saveLessonProgress"
  | "saveLessonAnswer"
  | "completeLesson"
  | "createAiFeedback"
> = {
  async saveLessonProgress(lessonId, input) {
    return apiOk({
      answers: [],
      currentStepId: input.currentStepId,
      lessonId,
      status: "in-progress",
      stepOrder: input.stepOrder,
    })
  },
  async saveLessonAnswer() {
    return apiOk({ saved: true })
  },
  async completeLesson(lessonId) {
    return apiOk({
      completedAt: "2026-05-27T00:00:00.000Z",
      completedCount: 1,
      lessonId,
      status: "completed",
      wasAlreadyCompleted: false,
    })
  },
  async createAiFeedback() {
    return apiOk({
      improvements: [],
      nextAction: "다음 문장을 더 구체적으로 다듬어 보세요.",
      score: 90,
      scoreRange: [0, 100],
      strengths: [],
      summary: "좋은 초안입니다.",
    })
  },
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(() => {
  cleanup()
})

describe("LessonExperience", () => {
  it("does not apply transform-based entrance motion to the step frame", () => {
    const { container } = render(
      <LessonExperience lesson={getDefaultLesson()} api={api} />
    )

    const stepFrame = container.querySelector("section")

    expect(stepFrame).toBeTruthy()
    expect(stepFrame?.className).not.toContain("animate-in")
    expect(stepFrame?.className).not.toContain("slide-in-from-bottom")
  })

  it("does not render decorative lives or XP on the lesson screen", () => {
    render(<LessonExperience lesson={getDefaultLesson()} api={api} />)

    expect(screen.queryByLabelText(/개 남음/)).toBeNull()
    expect(screen.queryByText(/XP/)).toBeNull()
  })

  it("passes a saved short-write response into the AI feedback step", async () => {
    const user = userEvent.setup()
    const createAiFeedback = vi.fn(api.createAiFeedback)
    const lesson = createShortWriteFeedbackLesson()

    render(
      <LessonExperience
        lesson={lesson}
        api={{
          ...api,
          createAiFeedback,
        }}
      />
    )

    await user.click(screen.getByRole("button", { name: "시작하기" }))
    await user.type(
      screen.getByRole("textbox"),
      "문장을 구체적으로 고쳤습니다."
    )
    await user.click(screen.getByRole("button", { name: "제출하기" }))
    await user.click(screen.getByRole("button", { name: "다음" }))

    await waitFor(() => {
      expect(createAiFeedback).toHaveBeenCalledWith({
        answer: "문장을 구체적으로 고쳤습니다.",
        feedbackStepId: "feedback-step",
        lessonId: "lesson-1",
      })
    })
  })

  it("shows a save failure without blocking lesson navigation", async () => {
    const user = userEvent.setup()
    const lesson = createShortWriteFeedbackLesson()

    render(
      <LessonExperience
        lesson={lesson}
        api={{
          ...api,
          async saveLessonAnswer() {
            return apiFailure({
              code: "network-error",
              message: "답변 저장에 실패했습니다.",
            })
          },
        }}
      />
    )

    await user.click(screen.getByRole("button", { name: "시작하기" }))
    await user.type(
      screen.getByRole("textbox"),
      "문장을 구체적으로 고쳤습니다."
    )
    await user.click(screen.getByRole("button", { name: "제출하기" }))

    expect((await screen.findByRole("alert")).textContent).toContain(
      "답변 저장에 실패했습니다."
    )

    await user.click(screen.getByRole("button", { name: "다음" }))

    expect(screen.getByText("AI 피드백")).toBeTruthy()
    expect(screen.getByText("문장을 구체적으로 고쳤습니다.")).toBeTruthy()
  })

  it("resets short-write local state when moving to another write step", async () => {
    const user = userEvent.setup()

    render(<LessonExperience lesson={createTwoShortWriteLesson()} api={api} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))
    await user.type(screen.getByRole("textbox"), "첫 문장입니다.")
    await user.click(screen.getByRole("button", { name: "제출하기" }))
    await user.click(screen.getByRole("button", { name: "다음" }))

    expect(screen.getByText("두 번째 문장을 쓰세요.")).toBeTruthy()
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("")
  })
})

function createShortWriteFeedbackLesson(): Lesson {
  return {
    id: "lesson-1" as never,
    title: "문장 다듬기",
    categoryId: "beginner",
    courseId: "course-1",
    unitNumber: 1,
    steps: [
      {
        id: "intro-step" as never,
        type: "INTRO",
        order: 1,
        points: 0,
        required: true,
        content: {
          title: "문장 다듬기",
          category: "문법",
          tagTone: "primary",
          bullets: ["짧은 문장을 씁니다."],
          estimatedMinutes: 1,
          totalSteps: 3,
        },
      },
      {
        id: "write-step" as never,
        type: "SHORT_WRITE",
        order: 2,
        points: 10,
        required: true,
        content: {
          instruction: "문장을 고쳐 쓰세요.",
          prompt: "구체적인 문장으로 바꿔보세요.",
          maxChars: 100,
          minChars: 5,
          referenceAnswer: "대상을 분명히 드러냅니다.",
          aiEvaluationEnabled: true,
          showReferenceAfterSubmit: false,
        },
      },
      {
        id: "feedback-step" as never,
        type: "AI_FEEDBACK",
        order: 3,
        points: 0,
        required: true,
        content: {
          sourceStepId: "write-step" as never,
          feedbackPrompt: "명확성을 평가합니다.",
          focusAreas: ["clarity"],
          showScore: true,
          scoreRange: [0, 100],
          allowRevision: true,
          maxRevisions: 1,
        },
      },
    ],
  }
}

function createTwoShortWriteLesson(): Lesson {
  return {
    id: "lesson-1" as never,
    title: "문장 두 번 쓰기",
    categoryId: "beginner",
    courseId: "course-1",
    unitNumber: 1,
    steps: [
      {
        id: "intro-step" as never,
        type: "INTRO",
        order: 1,
        points: 0,
        required: true,
        content: {
          title: "문장 두 번 쓰기",
          category: "문법",
          tagTone: "primary",
          bullets: ["문장을 두 번 씁니다."],
          estimatedMinutes: 1,
          totalSteps: 4,
        },
      },
      {
        id: "first-write-step" as never,
        type: "SHORT_WRITE",
        order: 2,
        points: 10,
        required: true,
        content: {
          instruction: "첫 번째 문장을 쓰세요.",
          prompt: "첫 번째 문장을 써보세요.",
          maxChars: 100,
          minChars: 5,
          referenceAnswer: "첫 문장 예시입니다.",
          aiEvaluationEnabled: false,
          showReferenceAfterSubmit: false,
        },
      },
      {
        id: "second-write-step" as never,
        type: "SHORT_WRITE",
        order: 3,
        points: 10,
        required: true,
        content: {
          instruction: "두 번째 문장을 쓰세요.",
          prompt: "두 번째 문장을 써보세요.",
          maxChars: 100,
          minChars: 5,
          referenceAnswer: "두 번째 문장 예시입니다.",
          aiEvaluationEnabled: false,
          showReferenceAfterSubmit: false,
        },
      },
      {
        id: "complete-step" as never,
        type: "COMPLETE",
        order: 4,
        points: 0,
        required: true,
        content: {
          nextAction: "next-lesson",
        },
      },
    ],
  }
}
