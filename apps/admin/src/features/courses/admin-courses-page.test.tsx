import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AdminCourseListDto } from "@workspace/core/admin"

import "@/test/ui-mocks"
import { AdminCoursesPage } from "@/features/courses/admin-courses-page"

type AnchorProps = React.ComponentProps<"a">

vi.mock("next/link", async () => {
  const ReactModule = await import("react")

  return {
    default: ({ children, href, ...props }: AnchorProps & { href: string }) =>
      ReactModule.createElement("a", { href, ...props }, children),
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/components/admin-header", async () => {
  const ReactModule = await import("react")

  return {
    AdminHeader: ({
      description,
      title,
    }: {
      description?: string
      title: string
    }) =>
      ReactModule.createElement("header", null, [
        ReactModule.createElement("h1", { key: "title" }, title),
        description
          ? ReactModule.createElement("p", { key: "description" }, description)
          : null,
      ]),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("AdminCoursesPage", () => {
  it("renders courses in a server-backed data table", () => {
    const courses: AdminCourseListDto["courses"] = [
      {
        id: "course-1",
        title: "문장 구조",
        description: "문장 학습",
        sortOrder: 1,
      },
    ]

    render(
      <AdminCoursesPage
        courses={courses}
        pagination={{
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
        }}
        query="문장"
      />
    )

    const searchInput = screen.getByRole("searchbox", { name: "코스 검색" })

    expect(screen.getByRole("heading", { name: "콘텐츠" })).toBeTruthy()
    expect(
      screen.getByText("코스 목록을 검색하고 페이지 단위로 확인합니다.")
    ).toBeTruthy()
    expect(searchInput).toHaveProperty("value", "문장")
    expect(screen.getByRole("link", { name: "문장 구조" })).toHaveProperty(
      "href",
      expect.stringContaining("/courses/course-1")
    )
    expect(screen.getByText("문장 학습")).toBeTruthy()
    expect(screen.getByText("Page 1 of 1")).toBeTruthy()
  })

  it("renders an accessible empty state when there are no matching courses", () => {
    render(
      <AdminCoursesPage
        courses={[]}
        pagination={{
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1,
        }}
        query="없는 코스"
      />
    )

    expect(screen.getByRole("status", { name: "코스 없음" })).toBeTruthy()
    expect(screen.getByText("검색 조건에 맞는 코스가 없습니다.")).toBeTruthy()
  })
})
