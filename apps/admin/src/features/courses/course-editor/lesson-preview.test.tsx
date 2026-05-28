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
            title: "도입",
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
    expect(screen.getByText("도입")).toBeTruthy()
  })
})
