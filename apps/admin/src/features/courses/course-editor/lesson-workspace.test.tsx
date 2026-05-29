import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
    const onAddStep = vi.fn()
    const onArchiveStep = vi.fn()
    const onMoveStep = vi.fn()

    render(
      <LessonWorkspace
        changeKind="additive"
        onAddStep={onAddStep}
        onArchiveStep={onArchiveStep}
        onMoveStep={onMoveStep}
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
            title: "SHORT_WRITE",
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
    expect(screen.getByText("활성 · 콘텐츠 추가")).toBeTruthy()
    expect(screen.getByText("학습 흐름")).toBeTruthy()
    expect(screen.getAllByText("도입").length).toBeGreaterThan(0)
    expect(screen.getAllByText("짧은 글쓰기").length).toBeGreaterThan(1)
    expect(screen.getByText("10점")).toBeTruthy()
    expect(screen.queryByText("LEARNING SEQUENCE")).toBeNull()
    expect(screen.queryByText("INTRO")).toBeNull()
    expect(screen.queryByText("SHORT_WRITE")).toBeNull()
    expect(screen.queryByText("10 XP")).toBeNull()
    expect(screen.getAllByText("도입").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("button", { name: "학습 화면 미리보기" })
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: "레슨 설정" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "스텝 추가" })).toBeTruthy()
  })

  it("calls step add archive and move callbacks", async () => {
    const user = userEvent.setup()
    const onAddStep = vi.fn()
    const onArchiveStep = vi.fn()
    const onMoveStep = vi.fn()

    render(
      <LessonWorkspace
        changeKind="minor-edit"
        lesson={{
          id: "version-lesson-1",
          lessonId: "lesson-1",
          title: "목적어 붙이기",
          description: "문장에 대상을 더합니다.",
          sortOrder: 1,
          status: "active",
        }}
        onAddStep={onAddStep}
        onArchiveStep={onArchiveStep}
        onMoveStep={onMoveStep}
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

    await user.click(screen.getByRole("button", { name: "스텝 추가" }))
    await user.click(screen.getByRole("button", { name: "도입 아래로 이동" }))
    await user.click(screen.getByRole("button", { name: "도입 스텝 보관" }))

    expect(onAddStep).toHaveBeenCalled()
    expect(onMoveStep).toHaveBeenCalledWith("step-1", 1)
    expect(onArchiveStep).toHaveBeenCalledWith("step-1")
  })
})
