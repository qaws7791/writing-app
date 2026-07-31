import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CourseDetailPage } from "@/features/course-detail/ui/course-detail-page"
import type { LearnerCourseDetailDto } from "@/shared/http/learner-api-client"
import { createLearnerCourseDetailFixture } from "@/test/learner-api-fixtures"

const course = createLearnerCourseDetailFixture()

describe("코스 상세 화면", () => {
  it("아직 시작하지 않은 코스의 진행률을 0/2와 progressbar 값으로 표시한다", () => {
    render(<CourseDetailPage course={course} />)

    expect(screen.getByText("0/2")).toBeInTheDocument()
    expect(
      screen.getByRole("progressbar", { name: "글쓰기 첫걸음 30일 진행률" })
    ).toHaveAttribute("aria-valuenow", "0")
  })

  it("첫 레슨 안내와 학습 시작 링크로 다음 학습 경로를 제공한다", () => {
    render(<CourseDetailPage course={course} />)

    expect(
      screen.getByText("첫 번째 레슨: 좋은 문장이란 무엇인가")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "학습 시작하기" })).toHaveAttribute(
      "href",
      "/app/lesson?lesson_id=l1"
    )
    expect(screen.getByRole("link", { name: "코스 목록으로" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
  })

  it("모든 레슨 완료 시 CTA를 표시하지 않는다", () => {
    render(<CourseDetailPage course={createCompletedCourseFixture()} />)

    expect(
      screen.queryByRole("link", { name: "처음부터 복습하기" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "학습 시작하기" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "이어서 학습하기" })
    ).not.toBeInTheDocument()
  })
})

function createCompletedCourseFixture(): LearnerCourseDetailDto {
  const firstUnit = course.units[0]

  if (firstUnit === undefined) {
    throw new Error("테스트 fixture에 유닛이 필요합니다.")
  }

  return {
    ...course,
    learning: {
      ...course.learning,
      completedAt: "2026-06-14T00:00:00.000Z",
      completedLessons: 2,
      lastActivityAt: "2026-06-14T00:00:00.000Z",
      nextLesson: null,
      progressPercent: 100,
      status: "completed",
    },
    units: [
      {
        ...firstUnit,
        lessons: firstUnit.lessons.map((lesson) => ({
          ...lesson,
          learning: {
            completion: {
              completedAt: "2026-06-14T00:00:00.000Z",
              totalSteps: 1,
            },
            status: "completed" as const,
            version: course.version,
          },
        })),
      },
    ],
  }
}
