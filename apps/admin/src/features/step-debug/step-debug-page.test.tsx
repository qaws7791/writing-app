import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { lessonStepDefinitions } from "@workspace/contracts/content/steps"
import { describe, expect, it } from "vitest"

import { StepDebugPage } from "@/features/step-debug/step-debug-page"
import { STEP_DEBUG_ENTRIES } from "@/features/step-debug/step-debug-samples"

describe("StepDebugPage", () => {
  it("스텝 타입을 선택하면 미리보기와 검증 결과를 갱신한다", async () => {
    const user = userEvent.setup()

    render(<StepDebugPage />)

    expect(
      screen.getByRole("heading", { name: "읽기 (READING)" })
    ).toBeVisible()
    expect(screen.getByText(/Zod 스키마 검증 통과/)).toBeVisible()

    await user.click(
      within(
        screen.getByRole("navigation", { name: "스텝 타입 목록" })
      ).getByRole("button", { name: /COMPARE/ })
    )

    expect(
      screen.getByRole("heading", { name: "비교 (COMPARE)" })
    ).toBeVisible()
    expect(screen.getByText(/Zod 스키마 검증 통과/)).toBeVisible()
  })

  it("모든 스텝 샘플은 계약 스키마를 통과한다", () => {
    for (const entry of STEP_DEBUG_ENTRIES) {
      const schema =
        lessonStepDefinitions[entry.type as keyof typeof lessonStepDefinitions]
          .schema

      expect(schema.safeParse(entry.dto).success, entry.type).toBe(true)
    }
  })
})
