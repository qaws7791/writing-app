import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const generatedClient = vi.hoisted(() => ({
  completeLearnerStep: vi.fn(),
  createLearnerStepAiFeedback: vi.fn(),
  getLesson: vi.fn(),
  saveLearnerStepDraft: vi.fn(),
  startLearnerLesson: vi.fn(),
}))

vi.mock("@workspace/http-client/learner", () => generatedClient)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

import { LessonExperience } from "@/features/lesson-session/ui/lesson-experience"
import {
  toLessonViewModel,
  type Lesson,
} from "@/features/lesson-session/model/lesson-view-model"
import type {
  LearnerCompleteStepResultDto,
  LearnerLessonLearningDto,
  LearnerSaveStepDraftBodyDto,
  LearnerStartLessonResultDto,
} from "@/shared/http/learner-api-client"
import type { LearnerLessonDto } from "@/shared/http/learner-api-client"

const version = { curriculumVersionId: "version-1", revision: 1 } as const

const lessonWire = {
  category: "기초",
  courseId: "course-1",
  description: "설명",
  drafts: [],
  estimatedMinutes: 5,
  id: "lesson-1",
  learning: {
    status: "not_started",
    totalSteps: 2,
    version,
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
  version,
} as const satisfies LearnerLessonDto

const lesson: Lesson = toLessonViewModel(lessonWire)

const aiLesson: Lesson = toLessonViewModel({
  ...lessonWire,
  drafts: [],
  learning: {
    completedSteps: 1,
    currentStepId: "step-ai",
    currentStepIndex: 1,
    progressPercent: 50,
    status: "in_progress",
    totalSteps: 2,
    version,
  },
  steps: [
    {
      id: "step-write",
      min: 1,
      sortOrder: 1,
      type: "WRITE",
    },
    {
      focus: "명확성",
      id: "step-ai",
      sortOrder: 2,
      target: "step-write",
      type: "AI_FEEDBACK",
    },
  ],
} satisfies LearnerLessonDto)

const startedLearning: Extract<
  LearnerLessonLearningDto,
  { status: "in_progress" }
> = {
  completedSteps: 0,
  currentStepId: "step-1",
  currentStepIndex: 0,
  progressPercent: 0,
  status: "in_progress",
  totalSteps: 2,
  version,
}

const started: LearnerStartLessonResultDto = {
  ...startedLearning,
  drafts: [],
}

const startedLesson: Lesson = toLessonViewModel({
  ...lessonWire,
  learning: startedLearning,
} satisfies LearnerLessonDto)

describe("LessonExperience", () => {
  beforeEach(() => {
    generatedClient.completeLearnerStep.mockReset()
    generatedClient.createLearnerStepAiFeedback.mockReset()
    generatedClient.getLesson.mockReset()
    generatedClient.saveLearnerStepDraft.mockReset()
    generatedClient.startLearnerLesson.mockReset()
    generatedClient.getLesson.mockResolvedValue(lesson)
    generatedClient.saveLearnerStepDraft.mockImplementation(
      async (
        _lessonId: string,
        stepId: string,
        request: LearnerSaveStepDraftBodyDto
      ) => ({
        answer: request.answer,
        stepId,
        updatedAt: "2026-07-24T00:00:00.000Z",
        version: 1,
      })
    )
    generatedClient.startLearnerLesson.mockResolvedValue(started)
  })

  it("시작 화면 CTA는 hydration 전에도 활성이다", () => {
    const container = document.createElement("div")
    container.innerHTML = renderToString(<LessonExperience lesson={lesson} />)

    expect(
      within(container).getByRole("button", { name: "시작하기" })
    ).toBeEnabled()
  })

  it("시작 화면에 활동 수를 보인다", () => {
    render(<LessonExperience lesson={lesson} />)

    expect(screen.getByText("2개 활동")).toBeInTheDocument()
  })

  it("AI provider 실패 후 명시적 skip transition으로 레슨 완료 CTA를 유지한다", async () => {
    const user = userEvent.setup()
    const completed: LearnerCompleteStepResultDto = {
      courseLearning: {
        completedAt: "2026-07-24T00:00:00.000Z",
        completedLessons: 1,
        lastActivityAt: "2026-07-24T00:00:00.000Z",
        nextLesson: null,
        progressPercent: 100,
        status: "completed",
        totalLessons: 1,
        version,
      },
      evaluation: null,
      lessonCompletion: {
        completedAt: "2026-07-24T00:00:00.000Z",
        totalSteps: 2,
      },
      status: "lesson_completed",
    }
    generatedClient.completeLearnerStep.mockResolvedValue(completed)
    generatedClient.createLearnerStepAiFeedback.mockRejectedValue(
      httpError(
        "PROVIDER_UNAVAILABLE",
        503,
        "AI 코칭을 잠시 사용할 수 없습니다."
      )
    )

    render(<LessonExperience lesson={aiLesson} />)

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))
    await user.click(
      await screen.findByRole("button", { name: "피드백 없이 계속하기" })
    )

    expect(generatedClient.completeLearnerStep).toHaveBeenCalledWith(
      "lesson-1",
      "step-ai",
      { kind: "skip-ai-feedback" },
      { signal: expect.any(AbortSignal) }
    )

    await user.click(await screen.findByRole("button", { name: "다음으로 →" }))

    expect(
      await screen.findByRole("heading", { name: "레슨을 완료했어요!" })
    ).toBeInTheDocument()
  })

  it("미확정 요청만 멱등 키를 재사용하고 provider 실패 뒤에는 새 키로 재시도한다", async () => {
    const user = userEvent.setup()
    generatedClient.createLearnerStepAiFeedback
      .mockRejectedValueOnce(
        new GeneratedApiClientError({
          kind: "network",
          method: "POST",
          url: "/api/learning/lessons/lesson-1/steps/step-ai/ai-feedback",
        })
      )
      .mockRejectedValue(
        httpError(
          "PROVIDER_UNAVAILABLE",
          503,
          "AI 코칭을 잠시 사용할 수 없습니다."
        )
      )

    render(<LessonExperience lesson={aiLesson} />)

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))
    await user.click(
      await screen.findByRole("button", { name: "AI 코칭 다시 시도" })
    )
    await user.click(
      await screen.findByRole("button", { name: "AI 코칭 다시 시도" })
    )

    expect(generatedClient.createLearnerStepAiFeedback).toHaveBeenCalledTimes(3)
    const [firstRequest, secondRequest, thirdRequest] =
      generatedClient.createLearnerStepAiFeedback.mock.calls.map(
        ([, , options]) => new Headers(options?.headers).get("Idempotency-Key")
      )
    expect(secondRequest).toBe(firstRequest)
    expect(thirdRequest).not.toBe(secondRequest)
  })

  it("서버 초안을 활성 step 입력값으로 즉시 복원한다", () => {
    const writeLesson: Lesson = toLessonViewModel({
      category: "기초",
      courseId: "course-1",
      description: "설명",
      drafts: [
        {
          answer: { text: "서버에서 복원한 문장", type: "WRITE" },
          stepId: "step-write",
          updatedAt: "2026-07-24T00:00:00.000Z",
          version: 2,
        },
      ],
      estimatedMinutes: 5,
      id: "lesson-1",
      learning: {
        completedSteps: 0,
        currentStepId: "step-write",
        currentStepIndex: 0,
        progressPercent: 0,
        status: "in_progress",
        totalSteps: 1,
        version,
      },
      steps: [
        {
          id: "step-write",
          min: 1,
          prompt: "문장을 작성하세요",
          sortOrder: 1,
          type: "WRITE",
        },
      ],
      summary: [],
      title: "테스트 레슨",
      unitId: "unit-1",
      version,
    } satisfies LearnerLessonDto)

    render(<LessonExperience lesson={writeLesson} />)

    expect(screen.getByRole("textbox")).toHaveValue("서버에서 복원한 문장")
  })

  it("고정 curriculum version으로 레슨을 시작한다", async () => {
    const user = userEvent.setup()
    render(<LessonExperience lesson={lesson} />)

    await user.click(screen.getByRole("button", { name: /시작/ }))

    await waitFor(() => {
      expect(generatedClient.startLearnerLesson).toHaveBeenCalledWith(
        "lesson-1",
        { expectedCurriculumVersionId: "version-1" },
        { signal: expect.any(AbortSignal) }
      )
    })
    expect(await screen.findByText("정답을 고르세요")).toBeInTheDocument()
  })

  it("서버 retry 평가를 표시하고 현재 step에 머문다", async () => {
    const user = userEvent.setup()
    const retry: LearnerCompleteStepResultDto = {
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
      learning: startedLearning,
      status: "retry",
    }
    generatedClient.completeLearnerStep.mockResolvedValue(retry)
    render(<LessonExperience lesson={startedLesson} />)

    await user.click(screen.getByRole("button", { name: "오답" }))
    await user.click(screen.getByRole("button", { name: "확인하기" }))

    expect(await screen.findByText("다시 확인해보세요")).toBeInTheDocument()
    expect(screen.getByText("정답을 고르세요")).toBeInTheDocument()
    expect(generatedClient.completeLearnerStep).toHaveBeenCalledWith(
      "lesson-1",
      "step-1",
      {
        answer: { selectedOptionId: "option-1", type: "MULTIPLE_CHOICE" },
        kind: "answer",
      },
      { signal: expect.any(AbortSignal) }
    )
  })

  it("서버 advanced 결과를 확인한 뒤 다음 step으로 이동한다", async () => {
    const user = userEvent.setup()
    const advanced: LearnerCompleteStepResultDto = {
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
        ...startedLearning,
        completedSteps: 1,
        currentStepId: "step-2",
        currentStepIndex: 1,
        progressPercent: 50,
      },
      status: "advanced",
    }
    generatedClient.completeLearnerStep.mockResolvedValue(advanced)
    render(<LessonExperience lesson={startedLesson} />)

    await user.click(screen.getByRole("button", { name: "정답" }))
    await user.click(screen.getByRole("button", { name: "확인하기" }))
    expect(await screen.findByText("완벽해요!")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "계속하기" }))
    expect(await screen.findByText("읽기")).toBeInTheDocument()
  })
})

function httpError(
  code: string,
  status: number,
  message: string
): GeneratedApiClientError {
  return new GeneratedApiClientError({
    error: { code, message, requestId: "request-1", violations: [] },
    kind: "http",
    retryAfterSeconds: null,
    status,
  })
}
