import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"

type DivProps = React.ComponentProps<"div">

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

describe("AdminCourseDetailPage", () => {
  it("renders an empty course detail placeholder", () => {
    render(<AdminCourseDetailPage courseId="course-1" />)

    expect(screen.getByRole("heading", { name: "코스 상세" })).toBeTruthy()
    expect(
      screen.getByText("챕터와 레슨 데이터는 이후 이 화면에서 확인합니다.")
    ).toBeTruthy()
    expect(screen.getByText("course-1")).toBeTruthy()
  })
})
