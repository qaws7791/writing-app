// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
import { StepWorkspace } from "@/features/course-editor/ui/workspace/step-workspace"

const assetUpload = {
  assets: [],
  disabled: false,
  upload: async () => {
    throw new Error("이 테스트에서는 asset을 업로드하지 않습니다.")
  },
} as const

describe("코스 스텝 편집", () => {
  it.each(lessonStepTypeValues)(
    "%s 타입의 최소 유효 스텝은 스텝 write 계약을 통과한다",
    (type) => {
      expect(adminCourseEditorStepSchema.parse(createStep(type))).toMatchObject(
        {
          type,
        }
      )
    }
  )

  it("빈 작업대에서 스텝을 추가하면 기본 READING 타입의 첫 스텝을 만든다", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    renderWorkspace({ onAdd, steps: [] })
    await user.click(screen.getByRole("button", { name: "스텝 추가" }))

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ sortOrder: 1, type: "READING" })
    )
  })

  it("스텝 삭제 확인 대화상자를 취소하면 스텝을 삭제하지 않는다", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    renderWorkspace({ onRemove, steps: [createStep("READING")] })
    await openStepRemoveDialog(user)
    await user.click(
      within(readStepRemoveDialog()).getByRole("button", { name: "취소" })
    )

    expect(onRemove).not.toHaveBeenCalled()
  })

  it("스텝 삭제를 확인하면 해당 스텝만 삭제 대상으로 넘긴다", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const step = createStep("READING")

    renderWorkspace({ onRemove, steps: [step] })
    await openStepRemoveDialog(user)
    await user.click(
      within(readStepRemoveDialog()).getByRole("button", { name: "스텝 삭제" })
    )

    expect(onRemove).toHaveBeenCalledWith(step)
  })

  it("스텝 삭제를 확인하면 사라진 스텝 대신 작업대로 focus를 되돌린다", async () => {
    const user = userEvent.setup()

    renderWorkspace({ steps: [createStep("READING")] })
    await openStepRemoveDialog(user)
    await user.click(
      within(readStepRemoveDialog()).getByRole("button", { name: "스텝 삭제" })
    )

    await waitFor(() =>
      expect(
        screen.getByRole("group", { name: "스텝 편집 작업대" })
      ).toHaveFocus()
    )
  })
})

function renderWorkspace({
  onAdd = vi.fn(),
  onRemove = vi.fn(),
  steps,
}: {
  readonly onAdd?: (step: EditorStep) => void
  readonly onRemove?: (step: EditorStep) => void
  readonly steps: readonly EditorStep[]
}) {
  return render(
    <StepWorkspace
      assetUpload={assetUpload}
      onAdd={onAdd}
      onChange={vi.fn()}
      onDuplicate={vi.fn()}
      onMove={vi.fn()}
      onRemove={onRemove}
      steps={steps}
    />
  )
}

async function openStepRemoveDialog(
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  await user.click(screen.getByRole("button", { name: "READING 스텝 삭제" }))
}

function readStepRemoveDialog(): HTMLElement {
  return screen.getByRole("alertdialog", { name: "스텝을 삭제할까요?" })
}

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
