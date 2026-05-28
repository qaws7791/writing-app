import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type { AdminEditorStepType } from "@workspace/core/admin"

import { StepWorkspace } from "@/features/courses/course-editor/step-workspace"

const stepTypes: AdminEditorStepType[] = [
  "INTRO",
  "CONCEPT",
  "READING_PASSAGE",
  "EXAMPLE_REVEAL",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "WORD_SELECT",
  "REORDER",
  "MATCH",
  "CLASSIFY",
  "SHORT_WRITE",
  "LONG_WRITE",
  "AI_FEEDBACK",
  "REVISION",
  "CHECKLIST",
  "REFLECTION",
  "SUMMARY",
  "TRANSCRIBE",
  "COMPLETE",
]

afterEach(() => {
  cleanup()
})

describe("StepWorkspace", () => {
  it.each(stepTypes)("renders a dedicated form for %s", (type) => {
    render(
      <StepWorkspace
        lessonSteps={[]}
        step={{
          id: `${type}-step`,
          lessonId: "lesson-1",
          type,
          title: `${type} step`,
          sortOrder: 1,
          points: 10,
          required: true,
          status: "active",
          content: {},
        }}
      />
    )

    expect(screen.getByText(`${type} 편집`)).toBeTruthy()
  })
})
