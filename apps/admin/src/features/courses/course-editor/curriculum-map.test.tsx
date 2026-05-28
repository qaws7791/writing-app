import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"

afterEach(() => {
  cleanup()
})

describe("CurriculumMap", () => {
  it("renders chapters and selected lesson in the curriculum map", () => {
    render(
      <CurriculumMap
        chapters={[
          {
            id: "chapter-1",
            label: "1",
            title: "문장 성분 익히기",
            sortOrder: 1,
            status: "active",
            lessons: [
              {
                id: "version-lesson-1",
                lessonId: "lesson-1",
                title: "목적어 붙이기",
                description: "설명",
                sortOrder: 1,
                status: "active",
              },
            ],
          },
        ]}
        selectedLessonId="lesson-1"
      />
    )

    expect(screen.getByText("문장 성분 익히기")).toBeTruthy()
    expect(screen.getByText("목적어 붙이기")).toBeTruthy()
    expect(
      screen
        .getByRole("button", { name: /목적어 붙이기/ })
        .getAttribute("aria-current")
    ).toBe("true")
  })
})
