import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { HomePage } from "@/features/home/home-page"
import type { ProgressCourseList } from "@/features/courses/course-types"
import type { LearnerProfile } from "@/features/profile/profile-types"
import { apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"

const profileStats: LearnerProfile["stats"] = {
  completedLessons: 0,
  currentStreakDays: 0,
  lastActiveDate: null,
  progressPercent: 0,
  totalLessons: 0,
}

const emptyInProgress: ProgressCourseList = {
  courses: [],
  currentStreakDays: 0,
}

const progressWithActiveCourse: ProgressCourseList = {
  courses: [
    {
      id: "c1",
      lessons: [
        {
          currentStepIndex: null,
          estimatedMinutes: 5,
          id: "l1",
          status: "completed",
          title: "좋은 문장이란 무엇인가",
        },
        {
          currentStepIndex: null,
          estimatedMinutes: 7,
          id: "l2",
          status: "available",
          title: "짧게 쓰기",
        },
        {
          currentStepIndex: null,
          estimatedMinutes: 8,
          id: "l3",
          status: "locked",
          title: "문단 다듬기",
        },
      ],
      nextLessons: [
        {
          courseId: "c1",
          currentStepIndex: null,
          estimatedMinutes: 7,
          id: "l2",
          status: "available",
          title: "짧게 쓰기",
        },
      ],
      progressPercent: 33,
      title: "글쓰기 첫걸음 30일",
      visualKey: "basic-sentence-writing",
    },
  ],
  currentStreakDays: 2,
}

const completedProgress: ProgressCourseList = {
  courses: [
    {
      id: "c2",
      lessons: [
        {
          currentStepIndex: null,
          estimatedMinutes: 5,
          id: "l4",
          status: "completed",
          title: "완료한 레슨",
        },
      ],
      nextLessons: [],
      progressPercent: 100,
      title: "완료한 코스",
      visualKey: "expression",
    },
  ],
  currentStreakDays: 5,
}

describe("홈 화면", () => {
  it("fresh 상태의 인사, 통계, 진행중 탭 CTA를 보여준다", () => {
    render(
      <HomePage
        inProgress={emptyInProgress}
        learnerName="글쓰기 탐험가"
        profileStats={profileStats}
      />
    )

    expect(screen.getByText("안녕하세요 👋")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: /글쓰기님,\s*오늘도 함께 써봐요\./,
      })
    ).toBeInTheDocument()
    expect(screen.getByText("0일")).toBeInTheDocument()
    expect(screen.getByText("연속 학습")).toBeInTheDocument()
    expect(screen.getByText("0개")).toBeInTheDocument()
    expect(screen.getByText("완료한 레슨")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "진행중" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "완료" })).toBeInTheDocument()

    const startCard = screen.getByRole("link", { name: /코스 둘러보기/ })
    expect(startCard).toHaveAttribute("href", "/app/courses")
    expect(
      within(startCard).getByText("지금 시작해볼까요?")
    ).toBeInTheDocument()
    expect(
      within(startCard).getByRole("heading", {
        name: /새로운 코스를\s*선택해 보세요/,
      })
    ).toBeInTheDocument()
  })

  it("진행 중 코스와 다음 레슨 링크를 보여준다", () => {
    render(
      <HomePage
        inProgress={progressWithActiveCourse}
        learnerName="몽쉘"
        profileStats={{
          ...profileStats,
          completedLessons: 1,
          currentStreakDays: 2,
        }}
      />
    )

    expect(screen.getByRole("tab", { name: "진행중" })).toBeInTheDocument()
    expect(screen.getAllByText("글쓰기 첫걸음 30일")).toHaveLength(2)
    expect(screen.getAllByText("1/3")).toHaveLength(2)
    expect(screen.getAllByText("짧게 쓰기")).toHaveLength(2)

    expect(
      firstElement(screen.getAllByRole("link", { name: /글쓰기 첫걸음 30일/ }))
    ).toHaveAttribute("href", "/app/courses/c1")
    expect(
      firstElement(screen.getAllByRole("link", { name: /짧게 쓰기/ }))
    ).toHaveAttribute("href", "/app/lesson?lesson_id=l2")
  })

  it("완료 탭에서 완료 코스 목록을 불러온다", async () => {
    const user = userEvent.setup()
    const getProgress = vi.fn(async () => apiOk(completedProgress))
    const api = createApi({ getProgress })

    render(
      <HomePage
        api={api}
        inProgress={emptyInProgress}
        learnerName="몽쉘"
        profileStats={{
          ...profileStats,
          completedLessons: 1,
          currentStreakDays: 5,
        }}
      />
    )

    await user.click(screen.getByRole("tab", { name: "완료" }))

    expect(getProgress).toHaveBeenCalledWith({ status: "completed" })
    expect(await screen.findAllByText("완료한 코스")).toHaveLength(2)
    expect(
      screen.queryByRole("heading", {
        name: /새로운 코스를\s*선택해 보세요/,
      })
    ).not.toBeInTheDocument()
  })
})

function createApi({
  getProgress,
}: {
  readonly getProgress: WritingAppApi["getProgress"]
}): WritingAppApi {
  return {
    completeLesson: vi.fn(),
    createAiFeedback: vi.fn(),
    getCourseDetail: vi.fn(),
    getLesson: vi.fn(),
    getProfile: vi.fn(),
    getProgress,
    listCourses: vi.fn(),
    saveLessonAnswer: vi.fn(),
    saveLessonProgress: vi.fn(),
  }
}

function firstElement<TElement>(elements: readonly TElement[]): TElement {
  const element = elements[0]

  if (element === undefined) {
    throw new Error("첫 번째 요소를 찾지 못했습니다.")
  }

  return element
}
