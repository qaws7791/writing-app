import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HomePage } from "@/features/home/home-page"
import type { ProgressCourseList } from "@/features/courses/course-types"

const progressWithCourses: ProgressCourseList = {
  courses: [
    {
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
        {
          courseId: "c1",
          estimatedMinutes: 8,
          id: "l3",
          status: "available",
          title: "문장 이어 쓰기",
        },
        {
          courseId: "c1",
          estimatedMinutes: 6,
          id: "l4",
          status: "available",
          title: "세 번째 추천 레슨",
        },
      ],
      progressPercent: 40,
      title: "글쓰기 첫걸음 30일",
    },
  ],
  currentStreakDays: 3,
}

describe("홈 화면", () => {
  it("진행 중인 코스와 다음 레슨 최대 2개를 보여준다", () => {
    render(<HomePage learnerName="민지" progress={progressWithCourses} />)

    expect(
      screen.getByRole("heading", { name: "안녕하세요, 민지님" })
    ).toBeInTheDocument()
    expect(screen.getByText("3일 연속 학습")).toBeInTheDocument()

    const courseCard = screen.getByRole("article", {
      name: "글쓰기 첫걸음 30일",
    })
    expect(within(courseCard).getByText("40% 완료")).toBeInTheDocument()
    expect(
      within(courseCard).getByRole("progressbar", {
        name: "글쓰기 첫걸음 30일 진행률",
      })
    ).toHaveAttribute("aria-valuenow", "40")

    expect(
      within(courseCard).getByRole("link", { name: "짧게 쓰기 이어하기" })
    ).toHaveAttribute("href", "/app/lesson?lesson_id=l2")
    expect(
      within(courseCard).getByRole("link", {
        name: "문장 이어 쓰기 이어하기",
      })
    ).toHaveAttribute("href", "/app/lesson?lesson_id=l3")
    expect(
      within(courseCard).queryByText("세 번째 추천 레슨")
    ).not.toBeInTheDocument()
  })

  it("진행 중인 코스가 없으면 시작 가능한 코스 진입점을 보여준다", () => {
    render(
      <HomePage
        learnerName={null}
        progress={{
          courses: [],
          currentStreakDays: 0,
        }}
      />
    )

    expect(
      screen.getByRole("heading", { name: "안녕하세요, 학습자님" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("아직 진행 중인 코스가 없습니다.")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "코스 둘러보기" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
  })
})
