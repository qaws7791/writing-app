import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"

type ButtonProps = React.ComponentProps<"button">

vi.mock("@workspace/ui/components/ui/button", async () => {
  const ReactModule = await import("react")

  return {
    Button: ({ children, ...props }: ButtonProps) =>
      ReactModule.createElement("button", props, children),
  }
})

vi.mock("@/components/admin-header", async () => {
  const ReactModule = await import("react")

  return {
    AdminHeader: ({
      actions,
      description,
      title,
    }: {
      actions?: React.ReactNode
      description?: string
      title: string
    }) =>
      ReactModule.createElement("header", null, [
        ReactModule.createElement("h1", { key: "title" }, title),
        description
          ? ReactModule.createElement("p", { key: "description" }, description)
          : null,
        actions
          ? ReactModule.createElement("div", { key: "actions" }, actions)
          : null,
      ]),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("AdminCourseDetailPage", () => {
  it("renders course studio shell", () => {
    render(
      <AdminCourseDetailPage
        course={{
          id: "sentence-structure",
          title: "기초 문장 만들기",
          description: "문장의 뼈대를 세웁니다.",
          thumbnailPath: "/course-thumbnails/sentence.png",
          sortOrder: 1,
        }}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        version={{
          id: "sentence-structure-v2",
          courseId: "sentence-structure",
          versionNumber: 2,
          status: "draft",
          title: "v2",
          changelog: "draft",
          publishedAt: null,
          createdAt: "2026-05-28T00:00:00.000Z",
          revision: 1,
          chapters: [],
          steps: [],
        }}
      />
    )

    expect(screen.getByText("Course Studio")).toBeTruthy()
    expect(screen.getByText("기초 문장 만들기")).toBeTruthy()
    expect(screen.getByRole("button", { name: "저장" })).toBeTruthy()
  })
})
