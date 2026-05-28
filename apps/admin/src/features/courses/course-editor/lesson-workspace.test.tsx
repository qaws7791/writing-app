import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LessonWorkspace } from "@/features/courses/course-editor/lesson-workspace"

type ButtonProps = React.ComponentProps<"button">

vi.mock("@workspace/ui/components/ui/button", async () => {
  const ReactModule = await import("react")

  return {
    Button: ({ children, ...props }: ButtonProps) =>
      ReactModule.createElement("button", props, children),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("LessonWorkspace", () => {
  it("renders lesson controls and learning sequence rows", () => {
    render(
      <LessonWorkspace
        changeKind="additive"
        lesson={{
          id: "version-lesson-1",
          lessonId: "lesson-1",
          title: "목적어 붙이기",
          description: "문장에 대상을 더합니다.",
          sortOrder: 1,
          status: "active",
        }}
        selectedStepId="step-1"
        steps={[
          {
            id: "step-1",
            lessonId: "lesson-1",
            type: "INTRO",
            title: "도입",
            sortOrder: 1,
            points: 0,
            required: true,
            status: "active",
            content: {},
          },
          {
            id: "step-2",
            lessonId: "lesson-1",
            type: "SHORT_WRITE",
            title: "짧은 연습",
            sortOrder: 2,
            points: 10,
            required: true,
            status: "active",
            content: {},
          },
        ]}
      />
    )

    expect(screen.getByDisplayValue("목적어 붙이기")).toBeTruthy()
    expect(screen.getByText("LEARNING SEQUENCE")).toBeTruthy()
    expect(screen.getByText("도입")).toBeTruthy()
    expect(screen.getByText("짧은 연습")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "학습 화면 미리보기" })
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: "레슨 설정" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "스텝 추가" })).toBeTruthy()
  })
})
