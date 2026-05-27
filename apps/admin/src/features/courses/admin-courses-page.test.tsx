import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AdminCourseTreeDto } from "@workspace/core/admin"

import { AdminCoursesPage } from "@/features/courses/admin-courses-page"

type DivProps = React.ComponentProps<"div">
type ButtonProps = React.ComponentProps<"button">
type SpanProps = React.ComponentProps<"span">

vi.mock("@workspace/ui/components/ui/badge", async () => {
  const ReactModule = await import("react")

  return {
    Badge: ({ children, ...props }: SpanProps) =>
      ReactModule.createElement("span", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/card", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({ children, ...props }: DivProps) =>
    ReactModule.createElement("div", props, children)

  return {
    Card: DivComponent,
    CardAction: DivComponent,
    CardContent: DivComponent,
    CardDescription: DivComponent,
    CardHeader: DivComponent,
    CardTitle: DivComponent,
  }
})

vi.mock("@workspace/ui/components/ui/collapsible", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({ children, ...props }: DivProps) =>
    ReactModule.createElement("div", props, children)

  return {
    Collapsible: DivComponent,
    CollapsibleContent: DivComponent,
    CollapsibleTrigger: ({ children, ...props }: ButtonProps) =>
      ReactModule.createElement("button", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/empty", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({ children, ...props }: DivProps) =>
    ReactModule.createElement("div", props, children)

  return {
    Empty: DivComponent,
    EmptyDescription: DivComponent,
    EmptyHeader: DivComponent,
    EmptyTitle: DivComponent,
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("AdminCoursesPage", () => {
  it("renders course, chapter, and lesson hierarchy text", () => {
    const courses: AdminCourseTreeDto["courses"] = [
      {
        id: "course-1",
        title: "기초 한글",
        description: "한글을 처음 배우는 학습자를 위한 코스",
        sortOrder: 1,
        chapters: [
          {
            id: "chapter-1",
            label: "1장",
            title: "모음 만나기",
            sortOrder: 1,
            lessons: [
              {
                id: "lesson-summary-1",
                lessonId: "lesson-1",
                title: "아 소리",
                description: "입 모양과 글자를 연결합니다.",
                sortOrder: 1,
              },
            ],
          },
        ],
      },
    ]

    render(<AdminCoursesPage courses={courses} />)

    expect(screen.getByText("기초 한글")).toBeTruthy()
    expect(
      screen.getByText("한글을 처음 배우는 학습자를 위한 코스")
    ).toBeTruthy()
    expect(screen.getByText("1장")).toBeTruthy()
    expect(screen.getByText("모음 만나기")).toBeTruthy()
    expect(screen.getByText("아 소리")).toBeTruthy()
    expect(screen.getByText("입 모양과 글자를 연결합니다.")).toBeTruthy()
  })

  it("renders an accessible empty state when there are no courses", () => {
    render(<AdminCoursesPage courses={[]} />)

    expect(screen.getByRole("status", { name: "코스 없음" })).toBeTruthy()
    expect(screen.getByText("등록된 코스가 없습니다.")).toBeTruthy()
  })
})
