import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CourseDetailPage } from "@/features/courses/course-detail-page"
import type { CourseDetail } from "@/features/courses/course-types"

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
  lessonCount: 2,
  progress: {
    completedLessons: 0,
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
    ],
    nextLesson: {
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: "l1",
      status: "available",
      title: "좋은 문장이란 무엇인가",
    },
    totalLessons: 2,
  },
  progressPercent: 0,
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
  ],
}

describe("코스 상세 화면", () => {
  beforeEach(() => {
    push.mockClear()
  })

  it("Kwep 코스 상세처럼 hero, 진행률, 첫 레슨 CTA를 표시하고 이동한다", async () => {
    const user = userEvent.setup()

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

    await user.click(screen.getByRole("button", { name: "학습 시작하기" }))
    expect(push).toHaveBeenCalledWith("/app/lesson?lesson_id=l1")

    await user.click(screen.getByRole("button", { name: "돌아가기" }))
    expect(push).toHaveBeenCalledWith("/app/courses")
  })
})
