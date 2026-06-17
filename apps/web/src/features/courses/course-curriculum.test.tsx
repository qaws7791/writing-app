import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import type { CourseDetail } from "@/features/courses/course-types"

const course: CourseDetail = {
  category: "입문자를 위한 코스",
  description:
    "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 3,
  progress: {
    completedLessons: 1,
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
      {
        currentStepIndex: null,
        lessonId: "l3",
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
    totalLessons: 3,
  },
  progressPercent: 33,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  visualKey: "basic-sentence-writing",
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

describe("코스 커리큘럼", () => {
  it("Kwep 커리큘럼처럼 유닛을 접고 펼치며 진행 가능한 레슨만 링크로 제공한다", async () => {
    const user = userEvent.setup()

    render(<CourseCurriculum course={course} />)

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

    const firstLessonLink = screen.getByRole("link", {
      name: /좋은 문장이란 무엇인가/,
    })
    expect(firstLessonLink).toHaveAttribute("href", "/app/lesson?lesson_id=l1")

    const lockedLessonRow = screen.getByText("짧게 쓰기").closest("div")
      ?.parentElement?.parentElement
    expect(lockedLessonRow).toHaveClass("cursor-not-allowed")
    expect(
      screen.queryByRole("link", { name: /짧게 쓰기/ })
    ).not.toBeInTheDocument()

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
