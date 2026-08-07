// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { lessonStepIdSchema } from "@workspace/contracts/content/ids"

import { createEditorStep } from "@/features/course-editor/model/editor-step"
import { LearnerStepPreview } from "@/features/course-editor/ui/learner-step-preview"

describe("LearnerStepPreview", () => {
  it("정답 확인 상태나 입력 결과를 미리보기에서 노출하지 않는다", () => {
    render(
      <LearnerStepPreview
        step={createEditorStep({
          id: lessonStepIdSchema.parse("step-multiple-choice"),
          sortOrder: 1,
          type: "MULTIPLE_CHOICE",
        })}
      />
    )

    expect(screen.getByText("선택지 1")).toBeVisible()
    expect(screen.queryByText("정답")).not.toBeInTheDocument()
    expect(screen.queryByText("오답")).not.toBeInTheDocument()
  })
})
