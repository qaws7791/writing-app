import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CoursesPage } from "@/features/courses/courses-page"
import type { CourseSummary } from "@/features/courses/course-types"

const courses: readonly CourseSummary[] = [
  {
    category: "입문자를 위한 코스",
    description:
      "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
    id: "c1",
    lessonCount: 10,
    status: "active",
    title: "글쓰기 첫걸음 30일",
    visualKey: "basic-sentence-writing",
  },
  {
    category: "문법 심화",
    description:
      "주술 호응, 시제, 조사 사용까지 한국어 문장을 단단하게 만드는 문법.",
    id: "c2",
    lessonCount: 8,
    status: "active",
    title: "문장의 기본 문법",
    visualKey: "grammar-complete",
  },
]

describe("코스 목록 화면", () => {
  it("Kwep 배우기 화면처럼 카테고리와 코스 상세 링크를 보여준다", async () => {
    const user = userEvent.setup()

    render(<CoursesPage courses={courses} />)

    expect(
      screen.getByRole("heading", { name: "무엇을 써볼까요?" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "관심 있는 주제를 골라 매일 한 단락씩 글의 결을 다듬어 보세요."
      )
    ).toBeInTheDocument()

    const beginnerCategory = screen.getByRole("button", {
      name: "입문자를 위한 코스",
    })
    expect(beginnerCategory).toHaveClass("bg-charcoal", "text-cream")
    expect(screen.getByText("글쓰기 첫걸음 30일")).toBeInTheDocument()
    expect(screen.getByText("10개 레슨")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "문법 심화" }))

    const courseTitle = screen.getByText("문장의 기본 문법")
    const courseCard = courseTitle.closest("a")

    expect(courseCard).not.toBeNull()
    expect(courseCard).toHaveAttribute("href", "/app/courses/c2")
    expect(
      within(courseCard as HTMLElement).getByText("8개 레슨")
    ).toBeInTheDocument()
  })
})
