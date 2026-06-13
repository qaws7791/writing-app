import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CoursesPage } from "@/features/courses/courses-page"
import type {
  CourseSummary,
  ProgressCourseList,
} from "@/features/courses/course-types"

const courses: readonly CourseSummary[] = [
  {
    category: "입문자를 위한 코스",
    description: "매일 조금씩 쓰는 습관을 만듭니다.",
    id: "c1",
    lessonCount: 10,
    status: "active",
    title: "글쓰기 첫걸음 30일",
  },
  {
    category: "문법 심화",
    description: "문장의 구조를 정확하게 익힙니다.",
    id: "c2",
    lessonCount: 8,
    status: "active",
    title: "문장의 기본 문법",
  },
]

const progress: ProgressCourseList = {
  courses: [
    {
      id: "c1",
      lessons: [],
      nextLessons: [],
      progressPercent: 25,
      title: "글쓰기 첫걸음 30일",
    },
  ],
  currentStreakDays: 4,
}

describe("코스 목록 화면", () => {
  it("코스를 카테고리별로 묶고 카드에 진행률을 표시한다", () => {
    render(<CoursesPage courses={courses} progress={progress} />)

    const beginnerSection = screen.getByRole("region", {
      name: "입문자를 위한 코스",
    })
    expect(
      within(beginnerSection).getByRole("article", {
        name: "글쓰기 첫걸음 30일",
      })
    ).toBeInTheDocument()
    expect(within(beginnerSection).getByText("10개 레슨")).toBeInTheDocument()
    expect(within(beginnerSection).getByText("25% 진행")).toBeInTheDocument()

    const grammarSection = screen.getByRole("region", { name: "문법 심화" })
    expect(
      within(grammarSection).getByRole("link", {
        name: "문장의 기본 문법 자세히 보기",
      })
    ).toHaveAttribute("href", "/app/courses/c2")
  })
})
