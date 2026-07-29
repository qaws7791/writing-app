import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CourseDetailPage } from "@/features/course-detail/ui/course-detail-page"
import type { LearnerCourseDetailDto } from "@/shared/http/learner-api-client"

const version = { curriculumVersionId: "c1-v1", revision: 1 }
const course: LearnerCourseDetailDto = {
  category: "입문자를 위한 코스",
  cover: null,
  description:
    "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 2,
  contentStatus: "active",
  learning: {
    completedLessons: 0,
    nextLesson: {
      currentStepId: "l1-s1",
      currentStepIndex: 0,
      estimatedMinutes: 5,
      id: "l1",
      title: "좋은 문장이란 무엇인가",
    },
    progressPercent: 0,
    status: "not_started",
    totalLessons: 2,
    version,
  },
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
          contentStatus: "active",
          learning: { status: "not_started", totalSteps: 1, version },
          sortOrder: 1,
          title: "좋은 문장이란 무엇인가",
        },
        {
          category: "문장",
          description: "짧게 써봅니다.",
          estimatedMinutes: 7,
          id: "l2",
          contentStatus: "active",
          learning: { status: "locked", version },
          sortOrder: 2,
          title: "짧게 쓰기",
        },
      ],
      sortOrder: 1,
      title: "문장의 기본기",
    },
  ],
  version,
}

describe("코스 상세 화면", () => {
  it("현재 제품 코스 상세처럼 hero, 진행률, 첫 레슨 링크를 표시한다", () => {
    render(<CourseDetailPage course={course} />)

    expect(
      screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다."
      )
    ).toBeInTheDocument()
    expect(screen.getByText("0/2")).toBeInTheDocument()
    expect(screen.queryByText("시작 전")).not.toBeInTheDocument()
    expect(
      screen.getByRole("progressbar", { name: "글쓰기 첫걸음 30일 진행률" })
    ).toHaveAttribute("aria-valuenow", "0")
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
    expect(
      screen.getByRole("img", { name: "글쓰기 첫걸음 30일" })
    ).toHaveAttribute("loading", "eager")
  })

  it("모든 레슨 완료 시 CTA를 표시하지 않는다", () => {
    const firstUnit = course.units[0]
    if (firstUnit === undefined) {
      throw new Error("테스트 fixture에 유닛이 필요합니다.")
    }

    const completedCourse: LearnerCourseDetailDto = {
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
              version,
            },
          })),
        },
      ],
    }

    render(<CourseDetailPage course={completedCourse} />)

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
