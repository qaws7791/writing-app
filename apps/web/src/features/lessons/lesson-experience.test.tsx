import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"
import {
  learnerCompleteStepResponseSchema,
  learnerLessonResponseSchema,
  learnerStartLessonResponseSchema,
} from "@workspace/contracts/learning"
import { httpApiOk as apiOk } from "@workspace/http-client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const lesson = learnerLessonResponseSchema.parse({
  category: "기초",
  courseId: "course-1",
  description: "설명",
  estimatedMinutes: 5,
  id: "lesson-1",
  learning: {
    status: "not_started",
    totalSteps: 2,
    version: { curriculumVersionId: "version-1", revision: 1 },
  },
  steps: [
    {
      id: "step-1",
      options: [
        { id: "option-1", text: "오답" },
        { id: "option-2", text: "정답" },
      ],
      question: "정답을 고르세요",
      sortOrder: 1,
      type: "MULTIPLE_CHOICE",
    },
    {
      body: "본문",
      guide: "가이드",
      id: "step-2",
      sortOrder: 2,
      title: "읽기",
      type: "READING",
    },
  ],
  summary: [],
  title: "테스트 레슨",
  unitId: "unit-1",
  version: { curriculumVersionId: "version-1", revision: 1 },
})

const started = learnerStartLessonResponseSchema.parse({
  completedSteps: 0,
  currentStepId: "step-1",
  currentStepIndex: 0,
  progressPercent: 0,
  status: "in_progress",
  totalSteps: 2,
  version: { curriculumVersionId: "version-1", revision: 1 },
})

describe("LessonExperience", () => {
  it("고정 curriculum version으로 레슨을 시작한다", async () => {
    const api = createApi()
    render(<LessonExperience api={api} learnerId="learner-1" lesson={lesson} />)

    await userEvent.click(screen.getByRole("button", { name: /시작/ }))

    await waitFor(() => {
      expect(api.startLesson).toHaveBeenCalledWith({
        expectedCurriculumVersionId: "version-1",
        lessonId: "lesson-1",
      })
    })
    expect(await screen.findByText("정답을 고르세요")).toBeInTheDocument()
  })

  it("서버 retry 평가를 표시하고 현재 step에 머문다", async () => {
    const retry = learnerCompleteStepResponseSchema.parse({
      evaluation: {
        correct: false,
        correctItemIds: ["option-2"],
        explanation: "다시 생각해 보세요.",
        items: [
          { id: "option-1", verdict: "incorrect" },
          { id: "option-2", verdict: "missed" },
        ],
        type: "MULTIPLE_CHOICE",
      },
      learning: started,
      status: "retry",
    })
    const api = createApi({
      completeStep: vi.fn(async () => apiOk(retry)),
    })
    render(
      <LessonExperience
        api={api}
        learnerId="learner-1"
        lesson={{ ...lesson, learning: started }}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "오답" }))
    await userEvent.click(screen.getByRole("button", { name: "확인하기" }))

    expect(await screen.findByText("다시 확인해보세요")).toBeInTheDocument()
    expect(screen.getByText("정답을 고르세요")).toBeInTheDocument()
    expect(api.completeStep).toHaveBeenCalledWith({
      lessonId: "lesson-1",
      request: {
        answer: { selectedOptionId: "option-1", type: "MULTIPLE_CHOICE" },
        kind: "answer",
      },
      stepId: "step-1",
    })
  })

  it("서버 advanced 결과를 확인한 뒤 다음 step으로 이동한다", async () => {
    const advanced = learnerCompleteStepResponseSchema.parse({
      evaluation: {
        correct: true,
        correctItemIds: ["option-2"],
        explanation: "정확합니다.",
        items: [
          { id: "option-1", verdict: "correct" },
          { id: "option-2", verdict: "correct" },
        ],
        type: "MULTIPLE_CHOICE",
      },
      learning: {
        ...started,
        completedSteps: 1,
        currentStepId: "step-2",
        currentStepIndex: 1,
        progressPercent: 50,
      },
      status: "advanced",
    })
    const api = createApi({
      completeStep: vi.fn(async () => apiOk(advanced)),
    })
    render(
      <LessonExperience
        api={api}
        learnerId="learner-1"
        lesson={{ ...lesson, learning: started }}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "정답" }))
    await userEvent.click(screen.getByRole("button", { name: "확인하기" }))
    expect(await screen.findByText("완벽해요!")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "계속하기" }))
    expect(await screen.findByText("읽기")).toBeInTheDocument()
  })
})

function createApi(overrides: Partial<WritingAppApi> = {}): WritingAppApi {
  const unavailable = async () => {
    throw new Error("이 테스트에서 호출하지 않는 API입니다.")
  }

  return {
    completeStep: vi.fn(unavailable),
    getCourseCategories: vi.fn(unavailable),
    getCourseDetail: vi.fn(unavailable),
    getLesson: vi.fn(unavailable),
    getProfile: vi.fn(unavailable),
    getProgress: vi.fn(unavailable),
    listCourses: vi.fn(unavailable),
    requestAiFeedback: vi.fn(unavailable),
    startLesson: vi.fn(async () => apiOk(started)),
    ...overrides,
  }
}
