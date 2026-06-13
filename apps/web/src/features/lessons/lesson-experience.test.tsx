import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { Lesson } from "@/features/lessons/lesson-types"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

const lesson: Lesson = {
  category: "문장",
  courseId: "c1",
  description: "좋은 문장의 기준을 읽고 직접 확인합니다.",
  estimatedMinutes: 5,
  id: "l1",
  steps: [
    {
      body: "좋은 문장은 독자가 바로 이해할 수 있는 문장입니다.",
      guide: "핵심 문장을 천천히 읽어보세요.",
      id: "s1",
      order: 1,
      title: "좋은 문장이란 무엇인가",
      type: "READING",
    },
    {
      guide: "한 문장으로 정리해 보세요.",
      id: "s2",
      min: 10,
      order: 2,
      title: "내 문장으로 정리하기",
      type: "WRITE",
    },
  ],
  summary: ["읽기", "쓰기"],
  title: "좋은 문장이란 무엇인가",
  unitId: "u1",
}

describe("레슨 경험", () => {
  it("처음 들어온 레슨의 시작 정보를 보여주고 시작 저장 후 첫 스텝으로 진입한다", async () => {
    const user = userEvent.setup()
    const api = createApi({
      saveLessonAnswer: vi.fn(async () => apiOk({ saved: true })),
    })

    render(<LessonExperience api={api} lesson={lesson} />)

    expect(
      screen.getByRole("heading", { name: "좋은 문장이란 무엇인가" })
    ).toBeInTheDocument()
    expect(screen.getByText("문장")).toBeInTheDocument()
    expect(
      screen.getByText("좋은 문장의 기준을 읽고 직접 확인합니다.")
    ).toBeInTheDocument()
    expect(screen.getByText("예상 5분")).toBeInTheDocument()
    expect(screen.getByText("2개 스텝")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "시작하기" }))

    expect(api.saveLessonAnswer).toHaveBeenCalledWith({
      answer: JSON.stringify({ kind: "lesson-started" }),
      lessonId: "l1",
      stepId: "s1",
    })
    expect(
      screen.getByRole("heading", { name: "좋은 문장이란 무엇인가" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("핵심 문장을 천천히 읽어보세요.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("좋은 문장은 독자가 바로 이해할 수 있는 문장입니다.")
    ).toBeInTheDocument()
  })

  it("시작 저장이 실패하면 한국어 오류를 보여주고 시작 화면에 머문다", async () => {
    const user = userEvent.setup()
    const api = createApi({
      saveLessonAnswer: vi.fn(async () =>
        apiFailure({
          code: "network-error",
          message: "네트워크 연결을 확인해 주세요.",
        })
      ),
    })

    render(<LessonExperience api={api} lesson={lesson} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))

    expect(
      screen.getByText("레슨 시작을 저장하지 못했습니다. 다시 시도해 주세요.")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "시작하기" })).toBeEnabled()
  })

  it("첫 스텝 답변 변경을 saveLessonAnswer로 자동 저장한다", async () => {
    const user = userEvent.setup()
    const saveLessonAnswer = vi.fn(async () => apiOk({ saved: true }))
    const api = createApi({ saveLessonAnswer })
    const answerableLesson: Lesson = {
      ...lesson,
      id: "l-answer",
      steps: [
        {
          correct: "clear",
          explanation: "구체적인 문장이 더 잘 읽힙니다.",
          id: "mc-answer",
          options: [
            { id: "vague", text: "좋은 글을 씁니다." },
            { id: "clear", text: "독자가 바로 이해하는 문장을 씁니다." },
          ],
          order: 1,
          question: "더 좋은 문장은 무엇인가요?",
          type: "MULTIPLE_CHOICE",
        },
      ],
    }

    render(<LessonExperience api={api} lesson={answerableLesson} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))
    await waitFor(() => expect(saveLessonAnswer).toHaveBeenCalledTimes(1))
    saveLessonAnswer.mockClear()
    await user.click(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    )

    await waitFor(() =>
      expect(saveLessonAnswer).toHaveBeenCalledWith({
        answer: JSON.stringify({
          selectedOptionId: "clear",
          type: "MULTIPLE_CHOICE",
        }),
        lessonId: "l-answer",
        stepId: "mc-answer",
      })
    )
  })

  it("AI 코칭 요청을 createAiFeedback으로 위임한다", async () => {
    const user = userEvent.setup()
    const createAiFeedback = vi.fn(async () =>
      apiOk({
        improvements: ["근거를 더해보세요."],
        nextAction: "예시를 추가해 다시 시도하세요.",
        remainingAttempts: 0,
        score: 3,
        scoreRange: [0, 5] as const,
        showScore: true,
        strengths: ["핵심이 보입니다."],
        summary: "좋은 출발입니다.",
      })
    )
    const api = createApi({
      createAiFeedback,
      saveLessonAnswer: vi.fn(async () => apiOk({ saved: true })),
    })
    const coachingLesson: Lesson = {
      ...lesson,
      id: "l-coaching",
      steps: [
        {
          allowRetry: true,
          feedback: "작성한 답변을 바탕으로 코칭합니다.",
          focus: "문장이 선명한지 확인합니다.",
          id: "ai-step",
          order: 1,
          score: 0,
          scoreMax: 5,
          showScore: true,
          target: "짧고 명확하게 쓴다",
          type: "AI_FEEDBACK",
        },
      ],
    }

    render(<LessonExperience api={api} lesson={coachingLesson} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))
    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    await waitFor(() =>
      expect(createAiFeedback).toHaveBeenCalledWith({
        answer: "짧고 명확하게 쓴다",
        lessonId: "l-coaching",
        stepId: "ai-step",
      })
    )
    expect(await screen.findByText("좋은 출발입니다.")).toBeInTheDocument()
  })
})

function createApi(overrides: Partial<WritingAppApi>): WritingAppApi {
  const unavailable = async () =>
    apiFailure({
      code: "contract-error",
      message: "테스트에서 사용하지 않는 API입니다.",
    })

  return {
    createAiFeedback: vi.fn(unavailable),
    getCourseDetail: vi.fn(unavailable),
    getLesson: vi.fn(unavailable),
    getProfile: vi.fn(unavailable),
    getProgress: vi.fn(unavailable),
    listCourses: vi.fn(unavailable),
    saveLessonAnswer: vi.fn(unavailable),
    ...overrides,
  }
}
