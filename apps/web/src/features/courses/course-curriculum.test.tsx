import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import type {
  CourseDetail,
  ProgressCourse,
} from "@/features/courses/course-types"

const course: CourseDetail = {
  category: "입문자를 위한 코스",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
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
      estimatedMinutes: 5,
      id: "l1",
      status: "completed",
      title: "좋은 문장이란 무엇인가",
    },
    {
      estimatedMinutes: 7,
      id: "l2",
      status: "available",
      title: "짧게 쓰기",
    },
    {
      estimatedMinutes: 8,
      id: "l3",
      status: "locked",
      title: "문단 만들기",
    },
  ],
  nextLessons: [
    {
      courseId: "c1",
      estimatedMinutes: 7,
      id: "l2",
      status: "available",
      title: "짧게 쓰기",
    },
  ],
  progressPercent: 33,
  title: "글쓰기 첫걸음 30일",
}

describe("코스 커리큘럼", () => {
  it("레슨 상태와 유닛 접기/펼치기를 제공한다", async () => {
    const user = userEvent.setup()

    render(<CourseCurriculum course={course} progressCourse={progressCourse} />)

    const firstUnit = screen.getByRole("group", { name: "문장의 기본기" })
    expect(within(firstUnit).getByText("완료")).toBeInTheDocument()
    expect(within(firstUnit).getByText("진행 가능")).toBeInTheDocument()
    expect(
      within(firstUnit).getByRole("link", { name: "짧게 쓰기 시작" })
    ).toHaveAttribute("href", "/app/lesson?lesson_id=l2")

    const secondUnitToggle = screen.getByRole("button", {
      name: "문단의 흐름",
    })
    await user.click(secondUnitToggle)

    const secondUnit = screen.getByRole("group", { name: "문단의 흐름" })
    expect(within(secondUnit).getByText("잠김")).toBeInTheDocument()
  })
})
