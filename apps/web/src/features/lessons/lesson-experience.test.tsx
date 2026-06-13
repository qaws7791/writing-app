import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { Lesson } from "@/features/lessons/lesson-types"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}))

const lesson: Lesson = {
  category: "문장의 기본기",
  courseId: "c1",
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
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
    expect(screen.getByText("문장의 기본기")).toHaveClass(
      "font-bold",
      "text-muted",
      "tracking-widest",
      "mb-4"
    )
    expect(
      screen.getByText("명료하고 군더더기 없는 문장을 살펴봅니다.")
    ).toBeInTheDocument()
    expect(screen.getByText("⏱ 5분")).toBeInTheDocument()
    expect(screen.getByText("📚 2개 스텝")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "나가기" })).toHaveClass(
      "text-muted",
      "hover:text-charcoal",
      "font-bold",
      "mr-4",
      "transition-colors",
      "w-9",
      "h-9",
      "flex",
      "items-center",
      "justify-center"
    )

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
    expect(screen.getByText("1/2")).toHaveClass(
      "ml-4",
      "font-bold",
      "text-muted"
    )
    expect(screen.getByRole("button", { name: "이해했어요" })).toHaveClass(
      "bg-charcoal",
      "text-cream",
      "rounded-4xl",
      "btn-squish"
    )
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

  it("스텝을 이동하고 마지막 스텝에서 레슨 완료를 저장한다", async () => {
    const user = userEvent.setup()
    const completeLesson = vi.fn(async () => apiOk({ saved: true }))
    const saveLessonAnswer = vi.fn(async () => apiOk({ saved: true }))
    const api = createApi({ completeLesson, saveLessonAnswer })

    render(<LessonExperience api={api} lesson={lesson} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))
    await user.click(screen.getByRole("button", { name: "이해했어요" }))

    expect(screen.getByText("2/2")).toHaveClass(
      "ml-4",
      "font-bold",
      "text-muted"
    )
    expect(
      screen.getByRole("heading", { name: "내 문장으로 정리하기" })
    ).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("여기에 작성하세요..."),
      "좋은 문장은 바로 이해됩니다."
    )
    await waitFor(() =>
      expect(saveLessonAnswer).toHaveBeenLastCalledWith({
        answer: JSON.stringify({
          text: "좋은 문장은 바로 이해됩니다.",
          type: "WRITE",
        }),
        lessonId: "l1",
        stepId: "s2",
      })
    )

    await user.click(screen.getByRole("button", { name: "다음으로 →" }))

    expect(completeLesson).toHaveBeenCalledWith({
      currentStepIndex: 1,
      lessonId: "l1",
    })
    expect(
      await screen.findByRole("heading", { name: "레슨을 완료했습니다." })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "다음 레슨 보기" })
    ).toHaveAttribute("href", "/app/courses/c1")
  })

  it("매칭과 분류가 Kwep 확인 흐름으로 다음 스텝을 연다", async () => {
    const user = userEvent.setup()
    const api = createApi({
      completeLesson: vi.fn(async () => apiOk({ saved: true })),
      saveLessonAnswer: vi.fn(async () => apiOk({ saved: true })),
    })
    const newActivityLesson = {
      ...lesson,
      category: "기능 소개",
      description:
        "매칭·분류·계획·교정·자가 점검 다섯 가지 활동을 차례로 체험해보세요.",
      estimatedMinutes: 10,
      id: "l-new",
      steps: [
        {
          explanation: "접속사는 문장 사이의 논리 관계를 신호로 보여줍니다.",
          guide: "왼쪽 접속사와 오른쪽 기능을 짝지어 보세요.",
          id: "match-step",
          order: 1,
          pairs: [
            { left: "그러나", right: "역접" },
            { left: "따라서", right: "인과" },
          ],
          title: "접속사와 기능 짝짓기",
          type: "MATCH",
        },
        {
          categories: [{ id: "A", label: "주제문" }],
          explanation:
            "단락은 주제문 1개, 뒷받침 1~2개, 구체 예시로 구성하면 단단해집니다.",
          guide: "각 문장이 단락에서 어떤 역할을 하는지 분류하세요.",
          id: "categorize-step",
          items: [
            {
              categoryId: "A",
              id: "i1",
              text: "꾸준한 글쓰기는 사고를 정돈한다.",
            },
          ],
          order: 2,
          title: "문장 분류하기",
          type: "CATEGORIZE",
        },
        {
          goal: 80,
          guide:
            '"최근 새롭게 도전한 일"에 대해 짧은 글을 쓰려 합니다. 본격 쓰기 전에 재료를 모아보세요.',
          id: "write-step",
          min: 20,
          order: 3,
          structure:
            "- **독자**: 이 글을 읽을 대상은 누구인가요?\n- **목적**: 이 글의 목적은 무엇인가요?",
          title: "쓰기 전 5분 계획",
          type: "WRITE",
        },
      ],
      summary: ["매칭", "분류", "쓰기"],
      title: "새 학습 활동 둘러보기",
    } as Lesson

    render(<LessonExperience api={api} lesson={newActivityLesson} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))

    expect(screen.getByRole("button", { name: "확인하기" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "그러나" }))
    await user.click(screen.getByRole("button", { name: "역접" }))
    await user.click(screen.getByRole("button", { name: "따라서" }))
    await user.click(screen.getByRole("button", { name: "인과" }))

    expect(screen.getByRole("button", { name: "확인하기" })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "확인하기" }))

    expect(screen.getByText("완벽해요!")).toHaveClass("text-mint-dark")
    expect(
      screen.getAllByText("접속사는 문장 사이의 논리 관계를 신호로 보여줍니다.")
    ).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: "계속하기" }))

    expect(screen.getByText("태그 선택")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "다음으로 →" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "주제문" }))
    await user.click(screen.getByText("꾸준한 글쓰기는 사고를 정돈한다."))

    expect(screen.getByRole("button", { name: "다음으로 →" })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "다음으로 →" }))

    expect(screen.getByText("구조 가이드")).toBeInTheDocument()
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
    completeLesson: vi.fn(unavailable),
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
