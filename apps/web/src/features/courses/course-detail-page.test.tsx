import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CourseDetailPage } from "@/features/courses/course-detail-page"
import type {
  CourseDetail,
  ProgressCourse,
} from "@/features/courses/course-types"

const course: CourseDetail = {
  category: "입문자를 위한 코스",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 2,
  progress: {
    completedLessons: 1,
    totalLessons: 2,
  },
  progressPercent: 50,
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
  progressPercent: 50,
  title: "글쓰기 첫걸음 30일",
}

describe("코스 상세 화면", () => {
  it("코스 설명, 진행률, 이어하기 버튼을 표시한다", () => {
    render(<CourseDetailPage course={course} progressCourse={progressCourse} />)

    expect(
      screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("매일 조금씩 쓰는 습관을 만듭니다.")
    ).toBeInTheDocument()
    expect(screen.getByText("50% 완료")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "짧게 쓰기 이어하기" })
    ).toHaveAttribute("href", "/app/lesson?lesson_id=l2")
  })
})
