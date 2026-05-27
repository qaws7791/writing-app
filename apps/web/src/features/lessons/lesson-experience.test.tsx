import * as React from "react"
import { render } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { getDefaultLesson } from "@/features/lessons/lesson-data"
import { LessonExperience } from "@/features/lessons/lesson-experience"
import { apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@workspace/ui/components/ui/progress-bar", () => ({
  ProgressBar: ({ value }: { value: number }) => (
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
})
