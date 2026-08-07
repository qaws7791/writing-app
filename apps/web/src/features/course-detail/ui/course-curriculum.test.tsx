import { render, screen } from "@testing-library/react"
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
