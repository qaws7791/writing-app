import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  parseEditorStep,
  type WireEditorStep,
} from "@/features/course-editor/model/editor-step"
import { renderStepForm } from "@/features/course-editor/ui/step-forms/step-form-registry"
import { StepWorkspace } from "@/features/course-editor/ui/workspace/step-workspace"

describe("코스 편집기 canonical step transport seam", () => {
  it.each([
    ["잘못된 JSON", "{"],
    ["배열 content", "[]"],
    ["type 없는 content", "{}"],
  ])("%s을 빈 폼으로 강제 변환하지 않는다", (_name, contentJson) => {
    expect(parseEditorStep(wireStep({ contentJson }))).toMatchObject({
      id: "step-1",
      state: "invalid",
    })
  })

  it("필수 필드 타입이 잘못되면 explicit invalid outcome을 반환한다", () => {
    expect(
      parseEditorStep(
        wireStep({
          contentJson: JSON.stringify({
            body: 123,
            guide: "안내",
            title: "읽기",
            type: "reading",
          }),
        })
      )
    ).toMatchObject({
      rawType: "READING",
      state: "invalid",
    })
  })

  it("유효한 variant 폼만 렌더링한다", () => {
    const result = parseEditorStep(
      wireStep({
        contentJson: JSON.stringify({
          body: "본문",
          guide: "안내",
          title: "읽기",
          type: "reading",
        }),
      })
    )
    if (result.state !== "valid") {
      throw new Error(result.message)
    }

    render(renderStepForm(result.step))

    expect(screen.getByLabelText("본문")).toHaveValue("본문")
    expect(screen.getByText("READING")).toBeVisible()
  })

  it("손상 데이터는 읽기 전용 오류로 표시하고 입력 폼을 노출하지 않는다", () => {
    const result = parseEditorStep(wireStep({ contentJson: "[]" }))

    render(<StepWorkspace steps={[result]} />)

    expect(screen.getByRole("alert")).toHaveAttribute("aria-readonly", "true")
    expect(screen.getByText(/편집할 수 없습니다/)).toBeVisible()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })
})

function wireStep(overrides: Partial<WireEditorStep>): WireEditorStep {
  return {
    contentJson: JSON.stringify({
      body: "본문",
      guide: "안내",
      title: "읽기",
      type: "reading",
    }),
    id: "step-1",
    sortOrder: 1,
    status: "active",
    type: "READING",
    ...overrides,
  }
}
