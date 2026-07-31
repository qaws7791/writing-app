import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CourseCurriculum } from "@/features/course-detail/ui/course-curriculum"
import { createLearnerCourseDetailFixture } from "@/test/learner-api-fixtures"

const baseCourse = createLearnerCourseDetailFixture()
const course = createLearnerCourseDetailFixture({
  lessonCount: 3,
  learning: {
    ...baseCourse.learning,
    totalLessons: 3,
  },
  units: [
    ...baseCourse.units,
    {
      id: "u2",
      lessons: [
        {
          category: "문단",
          description: "문단을 정리합니다.",
          estimatedMinutes: 8,
          id: "l3",
          contentStatus: "active",
          learning: { status: "locked", version: baseCourse.version },
          sortOrder: 1,
          title: "문단 만들기",
        },
      ],
      sortOrder: 2,
      title: "문단의 흐름",
    },
  ],
})

describe("코스 커리큘럼", () => {
  it("유닛 헤더를 누르면 레슨 콘텐츠를 접고 다시 펼친다", async () => {
    const user = userEvent.setup()
    render(<CourseCurriculum course={course} currentLessonId="l1" />)

    const firstUnitToggle = screen.getByRole("button", {
      name: /문장의 기본기\s*0\/2개 레슨/,
    })
    const currentLessonName = /좋은 문장이란 무엇인가.*다음/
    expect(screen.getByRole("link", { name: currentLessonName })).toBeVisible()

    await user.click(firstUnitToggle)
    expect(
      screen.queryByRole("link", { name: currentLessonName })
    ).not.toBeInTheDocument()

    await user.click(firstUnitToggle)
    expect(screen.getByRole("link", { name: currentLessonName })).toBeVisible()
  })

  it("닫힌 유닛을 펼치면 그 유닛의 레슨을 보여준다", async () => {
    const user = userEvent.setup()
    render(<CourseCurriculum course={course} currentLessonId="l1" />)

    const secondUnitToggle = screen.getByRole("button", {
      name: /문단의 흐름\s*0\/1개 레슨/,
    })
    expect(secondUnitToggle).toHaveAttribute("aria-expanded", "false")

    await user.click(secondUnitToggle)

    expect(secondUnitToggle).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("문단 만들기")).toBeInTheDocument()
  })

  it("현재 진행 중인 레슨을 다음 학습 링크로 제공한다", () => {
    render(<CourseCurriculum course={course} currentLessonId="l1" />)

    expect(
      screen.getByRole("link", { name: /좋은 문장이란 무엇인가.*다음/ })
    ).toHaveAttribute("href", "/app/lesson?lesson_id=l1")
  })

  it("잠긴 레슨은 링크로 제공하지 않고 잠김 상태로만 안내한다", () => {
    render(<CourseCurriculum course={course} currentLessonId="l1" />)

    expect(
      screen.queryByRole("link", { name: /짧게 쓰기/ })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/짧게 쓰기, 잠김/)).toBeInTheDocument()
  })
})
