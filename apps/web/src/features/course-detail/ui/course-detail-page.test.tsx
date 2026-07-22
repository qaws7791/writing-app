import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CourseDetailPage } from "@/features/course-detail/ui/course-detail-page"
import { learnerCourseDetailSchema } from "@workspace/contracts/learning/learner-content"

const version = { curriculumVersionId: "c1-v1", revision: 1 }
const course = learnerCourseDetailSchema.parse({
  category: "입문자를 위한 코스",
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
})

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
    expect(
      screen.getByText("첫 번째 레슨: 좋은 문장이란 무엇인가")
    ).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "학습 시작하기" })).toHaveAttribute(
      "href",
      "/app/lesson?lesson_id=l1"
    )
    expect(screen.getByRole("link", { name: "돌아가기" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
  })
})
