import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { adminCourseEditorStepSchema } from "@workspace/contracts/content/admin-courses"
import {
  lessonStepTypeValues,
  type LessonStepType,
} from "@workspace/contracts/content/steps"
import { lessonStepIdSchema } from "@workspace/contracts/content/ids"

import {
  createEditorStep,
  type EditorStep,
} from "@/features/course-editor/model/editor-step"
import { renderStepForm } from "@/features/course-editor/ui/step-forms/step-form-registry"
import { StepWorkspace } from "@/features/course-editor/ui/workspace/step-workspace"

describe("코스 스텝 편집", () => {
  it.each(lessonStepTypeValues)("%s 타입의 최소 유효 스텝을 만든다", (type) => {
    const step = createStep(type)
    expect(adminCourseEditorStepSchema.safeParse(step).success).toBe(true)
  })

  it("구조화된 타입 폼을 렌더링한다", () => {
    const step = createStep("READING")

    render(renderStepForm(step, vi.fn()))

    expect(screen.getByLabelText("본문")).toHaveValue("")
    expect(screen.getByText("READING")).toBeVisible()
  })

  it("빈 작업대에서 타입을 선택해 스텝을 추가한다", async () => {
    const onAdd = vi.fn()

    render(
      <StepWorkspace
        onAdd={onAdd}
        onChange={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
        steps={[]}
      />
    )

    screen.getByRole("button", { name: "스텝 추가" }).click()

    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd.mock.calls[0]?.[0]).toMatchObject({
      sortOrder: 1,
      type: "READING",
    })
  })
})

function createStep(type: LessonStepType): EditorStep {
  const id = lessonStepIdSchema.parse(`step-${type.toLowerCase()}`)
  return type === "AI_FEEDBACK"
    ? createEditorStep({
        id,
        sortOrder: 1,
        targetStepId: lessonStepIdSchema.parse("write-step"),
        type,
      })
    : createEditorStep({ id, sortOrder: 1, type })
}
