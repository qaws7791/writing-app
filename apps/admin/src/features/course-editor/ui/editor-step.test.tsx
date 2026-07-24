import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { adminCourseEditorStepSchema } from "@workspace/contracts/content/admin-courses"
import {
  lessonStepDefinitions,
  lessonStepTypeValues,
  type LessonStepType,
} from "@workspace/contracts/content/steps"
import { lessonStepIdSchema } from "@workspace/contracts/content/ids"

import {
  createEditorStep,
  type EditorStep,
} from "@/features/course-editor/model/editor-step"
import {
  renderStepForm,
  stepFormByType,
} from "@/features/course-editor/ui/step-forms/step-form-registry"
import { StepWorkspace } from "@/features/course-editor/ui/workspace/step-workspace"

describe("코스 스텝 편집", () => {
  const assetUpload = {
    assets: [],
    disabled: false,
    upload: async () => {
      throw new Error("이 테스트에서는 asset을 업로드하지 않습니다.")
    },
  } as const

  it("canonical 10타입 계약과 form registry key가 일치한다", () => {
    expect(Object.keys(stepFormByType).sort()).toEqual(
      Object.keys(lessonStepDefinitions).sort()
    )
  })

  it.each(lessonStepTypeValues)("%s 타입의 최소 유효 스텝을 만든다", (type) => {
    const step = createStep(type)
    expect(adminCourseEditorStepSchema.safeParse(step).success).toBe(true)
  })

  it("구조화된 타입 폼을 렌더링한다", () => {
    const step = createStep("READING")

    render(renderStepForm(step, vi.fn(), assetUpload))

    expect(screen.getByLabelText("본문")).toHaveValue("")
    expect(screen.getByText("READING")).toBeVisible()
  })

  it("빈 작업대에서 타입을 선택해 스텝을 추가한다", async () => {
    const onAdd = vi.fn()

    render(
      <StepWorkspace
        assetUpload={assetUpload}
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

  it("스텝 삭제를 취소하거나 확인한다", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const step = createStep("READING")

    render(
      <StepWorkspace
        assetUpload={assetUpload}
        onAdd={vi.fn()}
        onChange={vi.fn()}
        onMove={vi.fn()}
        onRemove={onRemove}
        steps={[step]}
      />
    )

    await user.click(screen.getByRole("button", { name: "READING 스텝 삭제" }))
    let dialog = screen.getByRole("alertdialog", {
      name: "스텝을 삭제할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "취소" }))
    expect(onRemove).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "READING 스텝 삭제" }))
    dialog = screen.getByRole("alertdialog", {
      name: "스텝을 삭제할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "스텝 삭제" }))

    expect(onRemove).toHaveBeenCalledWith(step)
    const workspace = screen
      .getByRole("heading", { name: "스텝 편집" })
      .closest('[data-slot="surface"]')
    await waitFor(() => expect(workspace).toHaveFocus())
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
