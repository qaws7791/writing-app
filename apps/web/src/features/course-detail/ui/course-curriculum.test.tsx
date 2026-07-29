import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CourseCurriculum } from "@/features/course-detail/ui/course-curriculum"
import type { LearnerCourseDetailDto } from "@/shared/http/learner-api-client"

const version = { curriculumVersionId: "c1-v1", revision: 1 }
const course: LearnerCourseDetailDto = {
  category: "입문자를 위한 코스",
  cover: null,
  description:
    "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 3,
  contentStatus: "active",
  learning: {
    completedLessons: 1,
    lastActivityAt: "2026-06-14T00:00:00.000Z",
    nextLesson: {
      currentStepId: "l1-s1",
      currentStepIndex: 0,
      estimatedMinutes: 5,
      id: "l1",
      title: "좋은 문장이란 무엇인가",
    },
    progressPercent: 33,
    status: "in_progress",
    totalLessons: 3,
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
          learning: {
            completedSteps: 0,
            currentStepId: "l1-s1",
            currentStepIndex: 0,
            progressPercent: 0,
            status: "in_progress",
            totalSteps: 1,
            version,
          },
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
    {
      id: "u2",
      lessons: [
        {
          category: "문단",
          description: "문단을 정리합니다.",
          estimatedMinutes: 8,
          id: "l3",
          contentStatus: "active",
          learning: { status: "locked", version },
          sortOrder: 1,
          title: "문단 만들기",
        },
      ],
      sortOrder: 2,
      title: "문단의 흐름",
    },
  ],
  version,
}

describe("코스 커리큘럼", () => {
  it("유닛 진도와 현재 레슨을 구분하고 잠긴 레슨은 링크로 제공하지 않는다", async () => {
    const user = userEvent.setup()

    render(<CourseCurriculum course={course} currentLessonId="l1" />)

    expect(
      screen.getByRole("heading", { level: 2, name: "커리큘럼" })
    ).toBeInTheDocument()

    const firstUnitToggle = screen.getByRole("button", {
      name: /문장의 기본기\s*0\/2개 레슨/,
    })
    expect(firstUnitToggle).toHaveAttribute("aria-expanded", "true")

    await user.click(firstUnitToggle)
    expect(firstUnitToggle).toHaveAttribute("aria-expanded", "false")

    await user.click(firstUnitToggle)
    expect(firstUnitToggle).toHaveAttribute("aria-expanded", "true")

    const firstLessonLink = screen.getByRole("link", {
      name: /좋은 문장이란 무엇인가.*다음/,
    })
    expect(firstLessonLink).toHaveAttribute("href", "/app/lesson?lesson_id=l1")
    expect(screen.getByText("다음")).toBeInTheDocument()

    expect(
      screen.queryByRole("link", { name: /짧게 쓰기/ })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/짧게 쓰기, 잠김/)).toBeInTheDocument()
    expect(
      screen.queryByText(/이전 레슨을 완료하면 열립니다/)
    ).not.toBeInTheDocument()

    const secondUnitToggle = screen.getByRole("button", {
      name: /문단의 흐름\s*0\/1개 레슨/,
    })
    expect(secondUnitToggle).toHaveAttribute("aria-expanded", "false")

    await user.click(secondUnitToggle)
    expect(secondUnitToggle).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("문단 만들기")).toBeInTheDocument()
  })
})
