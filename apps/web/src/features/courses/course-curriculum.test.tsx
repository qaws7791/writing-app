import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import type {
  CourseDetail,
  ProgressCourse,
} from "@/features/courses/course-types"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}))

const course: CourseDetail = {
  category: "입문자를 위한 코스",
  description:
    "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 3,
  progress: {
    completedLessons: 1,
    totalLessons: 3,
  },
  progressPercent: 33,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "문장",
          description: "좋은 문장을 배웁니다.",
          estimatedMinutes: 5,
          id: "l1",
          order: 1,
          status: "active",
          title: "좋은 문장이란 무엇인가",
        },
        {
          category: "문장",
          description: "짧게 써봅니다.",
          estimatedMinutes: 7,
          id: "l2",
          order: 2,
          status: "active",
          title: "짧게 쓰기",
        },
      ],
      order: 1,
      title: "문장의 기본기",
    },
    {
      id: "u2",
      lessons: [
        {
          category: "문단",
          description: "문단을 정리합니다.",
          estimatedMinutes: 8,
          id: "l3",
          order: 1,
          status: "active",
          title: "문단 만들기",
        },
      ],
      order: 2,
      title: "문단의 흐름",
    },
  ],
}

const progressCourse: ProgressCourse = {
  id: "c1",
  lessons: [
    {
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: "l1",
      status: "available",
      title: "좋은 문장이란 무엇인가",
    },
    {
      currentStepIndex: null,
      estimatedMinutes: 7,
      id: "l2",
      status: "locked",
      title: "짧게 쓰기",
    },
    {
      currentStepIndex: null,
      estimatedMinutes: 8,
      id: "l3",
      status: "locked",
      title: "문단 만들기",
    },
  ],
  nextLessons: [
    {
      courseId: "c1",
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: "l1",
      status: "available",
      title: "좋은 문장이란 무엇인가",
    },
  ],
  progressPercent: 33,
  title: "글쓰기 첫걸음 30일",
}

describe("코스 커리큘럼", () => {
  beforeEach(() => {
    push.mockClear()
  })

  it("Kwep 커리큘럼처럼 유닛을 접고 펼치며 진행 가능한 레슨만 이동한다", async () => {
    const user = userEvent.setup()

    render(<CourseCurriculum course={course} progressCourse={progressCourse} />)

    expect(
      screen.getByRole("heading", { level: 3, name: "커리큘럼" })
    ).toBeInTheDocument()

    const firstUnitToggle = screen.getByRole("button", {
      name: /문장의 기본기\s*2개 레슨/,
    })
    const firstUnitPanel = firstUnitToggle.nextElementSibling as HTMLElement
    expect(firstUnitPanel).toHaveStyle({ gridTemplateRows: "1fr" })

    await user.click(firstUnitToggle)
    expect(firstUnitPanel).toHaveStyle({ gridTemplateRows: "0fr" })

    await user.click(firstUnitToggle)
    expect(firstUnitPanel).toHaveStyle({ gridTemplateRows: "1fr" })

    const firstLessonRow = screen
      .getByText("좋은 문장이란 무엇인가")
      .closest(".cursor-pointer")
    expect(firstLessonRow).not.toBeNull()
    await user.click(firstLessonRow as HTMLElement)
    expect(push).toHaveBeenCalledWith("/app/lesson?lesson_id=l1")

    const lockedLessonRow = screen.getByText("짧게 쓰기").closest("div")
      ?.parentElement?.parentElement
    expect(lockedLessonRow).toHaveClass("cursor-not-allowed")
    await user.click(lockedLessonRow as HTMLElement)
    expect(push).toHaveBeenCalledTimes(1)

    const secondUnitToggle = screen.getByRole("button", {
      name: /문단의 흐름\s*1개 레슨/,
    })
    const secondUnitPanel = secondUnitToggle.nextElementSibling as HTMLElement
    expect(secondUnitPanel).toHaveStyle({ gridTemplateRows: "0fr" })

    await user.click(secondUnitToggle)
    expect(secondUnitPanel).toHaveStyle({ gridTemplateRows: "1fr" })
    expect(within(secondUnitPanel).getByText("문단 만들기")).toBeInTheDocument()
  })
})
