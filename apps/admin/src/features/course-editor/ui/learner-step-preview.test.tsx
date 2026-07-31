// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { lessonStepIdSchema } from "@workspace/contracts/content/ids"
import { lessonStepTypeValues } from "@workspace/contracts/content/steps"

import { createEditorStep } from "@/features/course-editor/model/editor-step"
import { LearnerStepPreview } from "@/features/course-editor/ui/learner-step-preview"

const writeStepId = lessonStepIdSchema.parse("step-write")

describe("LearnerStepPreview", () => {
  it.each(lessonStepTypeValues)("%s 스텝을 렌더링한다", (type) => {
    const step =
      type === "AI_FEEDBACK"
        ? createEditorStep({
            id: lessonStepIdSchema.parse("step-ai"),
            sortOrder: 2,
            targetStepId: writeStepId,
            type,
          })
        : createEditorStep({
            id: lessonStepIdSchema.parse(`step-${type.toLowerCase()}`),
            sortOrder: 1,
            type,
          })

    const { container } = render(<LearnerStepPreview step={step} />)

    expect(container).not.toBeEmptyDOMElement()
  })

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
