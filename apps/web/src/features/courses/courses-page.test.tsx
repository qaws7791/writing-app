import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CoursesPage } from "@/features/courses/courses-page"
import type { CourseSummary } from "@/features/courses/course-types"

vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      replace: vi.fn(),
    }
  },
}))

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
  it("현재 제품 코스 목록처럼 카테고리와 코스 상세 링크를 보여준다", async () => {
    render(
      <CoursesPage
        courses={courses}
        filters={{ category: "", query: "", sort: "latest" }}
      />
    )

    expect(
      screen.getByRole("heading", { name: "무엇을 써볼까요?" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "관심 있는 주제를 골라 매일 한 단락씩 글의 결을 다듬어 보세요."
      )
    ).toBeInTheDocument()

    const allCategory = screen.getByRole("link", { name: "전체" })
    const beginnerCategory = screen.getByRole("link", {
      name: "입문자를 위한 코스",
    })

    expect(screen.getByLabelText("코스 카테고리")).toBeInTheDocument()
    expect(allCategory).toHaveAttribute("href", "/app/courses")
    expect(beginnerCategory).toHaveAttribute(
      "href",
      "/app/courses?category=%EC%9E%85%EB%AC%B8%EC%9E%90%EB%A5%BC+%EC%9C%84%ED%95%9C+%EC%BD%94%EC%8A%A4"
    )
    expect(screen.getByText("글쓰기 첫걸음 30일")).toBeInTheDocument()
    expect(screen.getByText("10개 레슨")).toBeInTheDocument()

    const grammarCourseCard = screen.getByText("문장의 기본 문법").closest("a")

    expect(grammarCourseCard).not.toBeNull()
    expect(grammarCourseCard).toHaveAttribute("href", "/app/courses/c2")
    expect(
      within(grammarCourseCard as HTMLElement).getByText("8개 레슨")
    ).toBeInTheDocument()
  })

  it("URL 필터 기준으로 검색, 카테고리, 정렬 결과를 보여준다", () => {
    render(
      <CoursesPage
        courses={courses}
        filters={{ category: "", query: "문장", sort: "studyTime" }}
      />
    )

    expect(screen.getByLabelText("검색")).toHaveValue("문장")
    expect(screen.getByLabelText("정렬")).toHaveDisplayValue("학습시간순")
    expect(screen.getAllByRole("link", { name: /문장/ })[0]).toHaveAttribute(
      "href",
      "/app/courses/c2"
    )
    expect(screen.getByText("글쓰기 첫걸음 30일")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
  })

  it("검색 결과가 없으면 필터 초기화 링크를 보여준다", () => {
    render(
      <CoursesPage
        courses={courses}
        filters={{ category: "문법 심화", query: "없는 코스", sort: "latest" }}
      />
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "조건에 맞는 코스가 없습니다."
    )
    expect(screen.getByRole("link", { name: "필터 초기화" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
  })

  it("빈 코스 목록은 fallback 코스 대신 empty state로 보여준다", () => {
    render(
      <CoursesPage
        courses={[]}
        filters={{ category: "", query: "", sort: "latest" }}
      />
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "아직 열려 있는 코스가 없습니다."
    )
    expect(
      screen.queryByRole("link", { name: /글쓰기 첫걸음 30일/ })
    ).not.toBeInTheDocument()
  })
})
