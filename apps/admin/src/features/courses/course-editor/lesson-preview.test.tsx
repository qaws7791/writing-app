import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { LessonPreview } from "@/features/courses/course-editor/lesson-preview"

afterEach(() => {
  cleanup()
})

describe("LessonPreview", () => {
  it("renders preview from working copy lesson steps", () => {
    render(
      <LessonPreview
        lessonTitle="목적어 붙이기"
        steps={[
          {
            id: "step-1",
            lessonId: "lesson-1",
            type: "INTRO",
            title: "INTRO",
            sortOrder: 1,
            points: 0,
            required: true,
            status: "active",
            content: {},
          },
        ]}
      />
    )

    expect(screen.getByText("목적어 붙이기")).toBeTruthy()
    expect(screen.getAllByText("도입").length).toBeGreaterThan(0)
    expect(screen.getByText("미리보기")).toBeTruthy()
    expect(screen.getByText("0점")).toBeTruthy()
    expect(screen.queryByText("Preview")).toBeNull()
    expect(screen.queryByText("working copy")).toBeNull()
    expect(screen.queryByText("INTRO")).toBeNull()
    expect(screen.queryByText("0 XP")).toBeNull()
  })
})
