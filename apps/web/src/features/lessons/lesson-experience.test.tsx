import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { CourseDetail } from "@/features/courses/course-types"
import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { Lesson } from "@/features/lessons/lesson-types"
import { networkApiError, type ApiError } from "@/lib/api/api-error"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { ApiResult } from "@/lib/api/api-result"
import type {
  CompleteLessonResult,
  SaveLessonAnswerResult,
  WritingAppApi,
} from "@/lib/api/writing-app-api-port"
import { createHttpNetworkError } from "@workspace/http-client"

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

const courseDetail: CourseDetail = {
  category: "입문자를 위한 코스",
  description: "문장의 기본부터 한 문단을 완성하기까지.",
  id: "c1",
  lessonCount: 2,
  progress: {
    completedLessons: 0,
    lessons: [
      {
        currentStepIndex: null,
        lessonId: "l1",
        status: "available",
      },
      {
        currentStepIndex: null,
        lessonId: "l2",
        status: "locked",
      },
    ],
    nextLesson: {
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: "l1",
      status: "available",
      title: "좋은 문장이란 무엇인가",
    },
    totalLessons: 2,
  },
  progressPercent: 0,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  visualKey: "basic-sentence-writing",
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "문장의 기본기",
          description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
          estimatedMinutes: 5,
          id: "l1",
          order: 1,
          status: "active",
          title: "좋은 문장이란 무엇인가",
        },
        {
          category: "문장의 기본기",
          description: "주제문과 뒷받침 문장으로 단단한 문단을 만듭니다.",
          estimatedMinutes: 8,
          id: "l2",
          order: 2,
          status: "active",
          title: "한 문단의 구조",
        },
      ],
      order: 1,
      title: "문장의 기본기",
    },
  ],
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
    const startContent = screen.getByRole("main", { name: "레슨 콘텐츠" })
    const startShell = startContent.parentElement

    expect(startShell).toHaveClass("h-dvh", "overflow-hidden")
    expect(screen.getByRole("banner", { name: "레슨 진행" })).toHaveClass(
      "shrink-0"
    )
    expect(startContent).toHaveClass("min-h-0", "flex-1", "overflow-y-auto")
    expect(screen.getByRole("contentinfo", { name: "레슨 행동" })).toHaveClass(
      "shrink-0"
    )
    expect(
      screen.getByRole("progressbar", { name: "레슨 진행률" })
    ).toHaveAttribute("aria-valuenow", "0")

    await user.click(screen.getByRole("button", { name: "시작하기" }))

    expect(api.saveLessonAnswer).toHaveBeenCalledWith({
      answer: { kind: "lesson-started" },
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
    const stepContent = screen.getByRole("main", { name: "레슨 콘텐츠" })

    expect(stepContent).toHaveClass("min-h-0", "flex-1", "overflow-y-auto")
    expect(
      screen.getByRole("progressbar", { name: "레슨 진행률" })
    ).toHaveAttribute("aria-valuenow", "50")
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
        apiFailure(networkError("네트워크 연결을 확인해 주세요."))
      ),
    })

    render(<LessonExperience api={api} lesson={lesson} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))

    expect(
      screen.getByText("레슨 시작을 저장하지 못했습니다. 다시 시도해 주세요.")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "시작하기" })).toBeEnabled()
  })

  it("저장된 진행 단계가 있으면 시작 화면 없이 해당 스텝으로 재개한다", () => {
    const api = createApi({
      saveLessonAnswer: vi.fn(async () => apiOk({ saved: true })),
    })

    render(
      <LessonExperience
        api={api}
        initialProgress={{ currentStepIndex: 1 }}
        lesson={lesson}
      />
    )

    expect(
      screen.queryByRole("button", { name: "시작하기" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "내 문장으로 정리하기" })
    ).toBeInTheDocument()
    expect(screen.getByText("2/2")).toHaveClass(
      "ml-4",
      "font-bold",
      "text-muted"
    )
    expect(
      screen.getByRole("progressbar", { name: "레슨 진행률" })
    ).toHaveAttribute("aria-valuenow", "100")
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
        answer: {
          selectedOptionId: "clear",
          type: "MULTIPLE_CHOICE",
        },
        lessonId: "l-answer",
        stepId: "mc-answer",
      })
    )
  })

  it("늦게 실패한 이전 답변 저장은 최신 성공 상태를 덮어쓰지 않는다", async () => {
    const user = userEvent.setup()
    const firstSave = createDeferred<ApiResult<SaveLessonAnswerResult>>()
    const secondSave = createDeferred<ApiResult<SaveLessonAnswerResult>>()
    const saveLessonAnswer = vi
      .fn()
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise)
    const api = createApi({ saveLessonAnswer })
    const answerableLesson = createSingleChoiceLesson()

    render(
      <LessonExperience
        api={api}
        initialProgress={{ currentStepIndex: 0 }}
        lesson={answerableLesson}
      />
    )

    await user.click(screen.getByRole("button", { name: "좋은 글을 씁니다." }))
    await user.click(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    )

    await waitFor(() => expect(saveLessonAnswer).toHaveBeenCalledTimes(2))
    secondSave.resolve(apiOk({ saved: true }))
    await waitFor(() =>
      expect(screen.queryByText(LESSON_ANSWER_ERROR)).not.toBeInTheDocument()
    )

    firstSave.resolve(apiFailure(networkError("첫 요청 실패")))

    await waitFor(() =>
      expect(screen.queryByText(LESSON_ANSWER_ERROR)).not.toBeInTheDocument()
    )
  })

  it("이전 스텝의 답변 저장 실패를 다음 스텝에 표시하지 않는다", async () => {
    const user = userEvent.setup()
    const answerSave = createDeferred<ApiResult<SaveLessonAnswerResult>>()
    const api = createApi({
      saveLessonAnswer: vi.fn(() => answerSave.promise),
    })
    const answerableLesson: Lesson = {
      ...createSingleChoiceLesson(),
      steps: [
        ...createSingleChoiceLesson().steps,
        {
          body: "다음 스텝입니다.",
          guide: "읽고 넘어가세요.",
          id: "reading-after-choice",
          order: 2,
          title: "다음 읽기",
          type: "READING",
        },
      ],
    }

    render(
      <LessonExperience
        api={api}
        initialProgress={{ currentStepIndex: 0 }}
        lesson={answerableLesson}
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    )
    await user.click(screen.getByRole("button", { name: "확인하기" }))
    await user.click(screen.getByRole("button", { name: "계속하기" }))

    expect(
      screen.getByRole("heading", { name: "다음 읽기" })
    ).toBeInTheDocument()

    answerSave.resolve(apiFailure(networkError("이전 스텝 저장 실패")))

    await waitFor(() =>
      expect(screen.queryByText(LESSON_ANSWER_ERROR)).not.toBeInTheDocument()
    )
  })

  it("마지막 스텝 완료는 최신 답변 저장이 끝난 뒤 저장한다", async () => {
    const user = userEvent.setup()
    const answerSave = createDeferred<ApiResult<SaveLessonAnswerResult>>()
    const completeLesson = vi.fn(async () => apiOk({ saved: true }))
    const api = createApi({
      completeLesson,
      saveLessonAnswer: vi.fn(() => answerSave.promise),
    })

    render(
      <LessonExperience
        api={api}
        initialProgress={{ currentStepIndex: 0 }}
        lesson={createSingleChoiceLesson()}
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    )
    await user.click(screen.getByRole("button", { name: "확인하기" }))
    await user.click(screen.getByRole("button", { name: "계속하기" }))

    expect(completeLesson).not.toHaveBeenCalled()

    answerSave.resolve(apiOk({ saved: true }))

    await waitFor(() =>
      expect(completeLesson).toHaveBeenCalledWith({
        currentStepIndex: 0,
        lessonId: "l-answer",
      })
    )
  })

  it("최신 답변 저장이 실패하면 레슨 완료를 저장하지 않는다", async () => {
    const user = userEvent.setup()
    const answerSave = createDeferred<ApiResult<SaveLessonAnswerResult>>()
    const completeLesson = vi.fn(async () => apiOk({ saved: true }))
    const api = createApi({
      completeLesson,
      saveLessonAnswer: vi.fn(() => answerSave.promise),
    })

    render(
      <LessonExperience
        api={api}
        initialProgress={{ currentStepIndex: 0 }}
        lesson={createSingleChoiceLesson()}
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: "독자가 바로 이해하는 문장을 씁니다.",
      })
    )
    await user.click(screen.getByRole("button", { name: "확인하기" }))
    await user.click(screen.getByRole("button", { name: "계속하기" }))

    answerSave.resolve(apiFailure(networkError("최신 답변 저장 실패")))

    await waitFor(() =>
      expect(screen.getByText(LESSON_ANSWER_ERROR)).toBeInTheDocument()
    )
    expect(completeLesson).not.toHaveBeenCalled()
  })

  it("완료 버튼을 빠르게 여러 번 눌러도 완료 저장은 한 번만 호출한다", async () => {
    const user = userEvent.setup()
    const completeSave = createDeferred<ApiResult<CompleteLessonResult>>()
    const completeLesson = vi.fn(() => completeSave.promise)
    const api = createApi({
      completeLesson,
      saveLessonAnswer: vi.fn(async () => apiOk({ saved: true })),
    })
    const readingOnlyLesson: Lesson = {
      ...lesson,
      id: "l-reading-only",
      steps: [
        {
          body: "좋은 문장은 독자가 바로 이해할 수 있는 문장입니다.",
          guide: "핵심 문장을 천천히 읽어보세요.",
          id: "reading-only-step",
          order: 1,
          title: "좋은 문장이란 무엇인가",
          type: "READING",
        },
      ],
    }

    render(
      <LessonExperience
        api={api}
        initialProgress={{ currentStepIndex: 0 }}
        lesson={readingOnlyLesson}
      />
    )

    await user.dblClick(screen.getByRole("button", { name: "이해했어요" }))

    expect(completeLesson).toHaveBeenCalledTimes(1)
  })

  it("스텝을 이동하고 마지막 스텝에서 레슨 완료를 저장한다", async () => {
    const user = userEvent.setup()
    const completeLesson = vi.fn(async () => apiOk({ saved: true }))
    const saveLessonAnswer = vi.fn(async () => apiOk({ saved: true }))
    const api = createApi({ completeLesson, saveLessonAnswer })

    render(
      <LessonExperience api={api} courseDetail={courseDetail} lesson={lesson} />
    )

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
        answer: {
          text: "좋은 문장은 바로 이해됩니다.",
          type: "WRITE",
        },
        lessonId: "l1",
        stepId: "s2",
      })
    )

    await user.click(screen.getByRole("button", { name: "다음으로 →" }))

    expect(completeLesson).toHaveBeenCalledWith({
      currentStepIndex: 1,
      lessonId: "l1",
    })
    expect(await screen.findByRole("heading", { name: "완료!" })).toHaveClass(
      "font-black",
      "text-ink"
    )
    expect(screen.getByText("오늘의 학습이 저장되었습니다.")).toHaveClass(
      "text-ink",
      "font-bold"
    )
    expect(screen.getByText("이번 레슨 핵심 요약")).toHaveClass(
      "font-black",
      "text-muted"
    )
    expect(screen.getByText("읽기")).toBeInTheDocument()
    expect(screen.getByText("쓰기")).toBeInTheDocument()
    expect(screen.getByText("+1")).toHaveClass("font-black", "text-charcoal")
    expect(screen.getByText("1/2")).toHaveClass("font-black", "text-charcoal")

    await user.click(screen.getByRole("button", { name: "다음 레슨 →" }))
    expect(push).toHaveBeenLastCalledWith("/app/lesson?lesson_id=l2")

    await user.click(screen.getByRole("button", { name: "코스로 돌아가기" }))
    expect(push).toHaveBeenLastCalledWith("/app/courses/c1")
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

  it("읽기 후 객관식을 Kwep 확인 footer로 채점한다", async () => {
    const user = userEvent.setup()
    const api = createApi({
      saveLessonAnswer: vi.fn(async () => apiOk({ saved: true })),
    })
    const multipleChoiceLesson: Lesson = {
      ...lesson,
      description: "주제문과 뒷받침 문장으로 단단한 문단을 만드는 법.",
      estimatedMinutes: 8,
      id: "l2",
      steps: [
        {
          body: "문단은 보통 주제문, 뒷받침 문장, 마무리 문장으로 이루어집니다.",
          guide: "문단의 세 요소를 읽고 각각의 역할이 무엇인지 파악하세요.",
          id: "l2-reading-1",
          order: 1,
          title: "주제문과 뒷받침",
          type: "READING",
        },
        {
          body: "꾸준한 글쓰기 연습은 사고를 정돈하는 가장 효과적인 방법이다.",
          guide: "아래 문단에서 주제문이 어디에 있는지 찾아보세요.",
          id: "l2-reading-2",
          order: 2,
          source: "글쓰기 입문 교재",
          title: "예문 읽기",
          type: "READING",
        },
        {
          body: "**흐린 주제문**\n\n> 꾸준한 글쓰기 연습은 좋은 점이 많다.\n\n**명확한 주제문**\n\n> 꾸준한 글쓰기 연습은 사고를 정돈하는 가장 효과적인 방법이다.",
          guide: "두 예시의 주제문을 비교하며 구체성의 차이를 살펴보세요.",
          id: "l2-reading-3",
          order: 3,
          title: "주제문 위치 비교",
          type: "READING",
        },
        {
          correct: "b",
          explanation: "하나의 문단에는 단 하나의 핵심 주제문이 들어갑니다.",
          id: "l2-mc",
          options: [
            { id: "a", text: "2개 이상" },
            { id: "b", text: "정확히 1개" },
            { id: "c", text: "없어도 된다" },
          ],
          order: 4,
          question: "한 문단에 들어가야 할 주제문의 수는?",
          type: "MULTIPLE_CHOICE",
          wrong: "주제가 두 개라면 문단을 나누는 편이 좋습니다.",
        },
      ],
      summary: ["한 문단에는 한 가지 주제만 담는다"],
      title: "한 문단의 구조",
    }

    render(<LessonExperience api={api} lesson={multipleChoiceLesson} />)

    await user.click(screen.getByRole("button", { name: "시작하기" }))
    await user.click(screen.getByRole("button", { name: "이해했어요" }))
    await user.click(screen.getByRole("button", { name: "이해했어요" }))
    await user.click(screen.getByRole("button", { name: "이해했어요" }))

    expect(screen.getByText("4/4")).toHaveClass(
      "ml-4",
      "font-bold",
      "text-muted"
    )
    expect(screen.getByRole("button", { name: "확인하기" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "정확히 1개" }))

    expect(screen.getByRole("button", { name: "정확히 1개" })).toHaveClass(
      "bg-primary",
      "text-ink"
    )
    expect(screen.getByRole("button", { name: "확인하기" })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "확인하기" }))

    expect(screen.getByText("완벽해요!")).toHaveClass("text-mint-dark")
    expect(
      screen.getAllByText("하나의 문단에는 단 하나의 핵심 주제문이 들어갑니다.")
    ).toHaveLength(1)
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

const LESSON_ANSWER_ERROR =
  "답변을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요."

function createSingleChoiceLesson(): Lesson {
  return {
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
}

function createDeferred<T>(): {
  readonly promise: Promise<T>
  readonly reject: (error: unknown) => void
  readonly resolve: (value: T) => void
} {
  let reject: (error: unknown) => void = () => {}
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}

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

function networkError(message: string): ApiError {
  return {
    ...networkApiError(
      createHttpNetworkError(
        new Request("https://api.example.test/test"),
        new TypeError("test network failure")
      )
    ),
    message,
  }
}
