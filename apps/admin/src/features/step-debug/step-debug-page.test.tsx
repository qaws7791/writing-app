import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { StepDebugPage } from "@/features/step-debug/step-debug-page"

describe("StepDebugPage", () => {
  it("스텝 타입을 선택하면 미리보기와 검증 결과를 갱신한다", async () => {
    const user = userEvent.setup()

    render(<StepDebugPage />)

    expect(screen.getByText(/스텝 투어/)).toBeVisible()
    expect(screen.getByText(/Zod 스키마 검증 통과/)).toBeVisible()

    await user.click(
      within(
        screen.getByRole("navigation", { name: "스텝 타입 목록" })
      ).getByRole("button", { name: /COMPARE/ })
    )

    expect(screen.getByText(/STEP TYPE/)).toBeVisible()
    expect(screen.getByText(/⚖️ 비교 \(COMPARE\)/)).toBeVisible()
    expect(screen.getByText(/Zod 스키마 검증 통과/)).toBeVisible()
  })

  it("MATCH 스텝은 모든 짝을 맞추고 확인하기를 누르면 피드백을 표시한다", async () => {
    const user = userEvent.setup()

    render(<StepDebugPage />)

    await user.click(
      within(
        screen.getByRole("navigation", { name: "스텝 타입 목록" })
      ).getByRole("button", { name: /MATCH/ })
    )

    const preview = screen.getByRole("main", {
      name: /매칭 \(MATCH\) 스텝 디버그/,
    })

    await user.click(within(preview).getByRole("button", { name: "그러나" }))
    await user.click(within(preview).getByRole("button", { name: "역접" }))
    await user.click(within(preview).getByRole("button", { name: "따라서" }))
    await user.click(within(preview).getByRole("button", { name: "인과" }))
    await user.click(within(preview).getByRole("button", { name: "예를 들어" }))
    await user.click(within(preview).getByRole("button", { name: "예시" }))
    await user.click(within(preview).getByRole("button", { name: "또한" }))
    await user.click(within(preview).getByRole("button", { name: "추가" }))

    await user.click(within(preview).getByRole("button", { name: "확인하기" }))

    expect(within(preview).getByText("완벽해요!")).toBeVisible()
  })

  it("CATEGORIZE 스텝은 모든 항목을 분류하고 확인하기를 누르면 피드백을 표시한다", async () => {
    const user = userEvent.setup()

    render(<StepDebugPage />)

    await user.click(
      within(
        screen.getByRole("navigation", { name: "스텝 타입 목록" })
      ).getByRole("button", { name: /CATEGORIZE/ })
    )

    const preview = screen.getByRole("main", {
      name: /분류 \(CATEGORIZE\) 스텝 디버그/,
    })

    await user.click(within(preview).getByRole("button", { name: "주제문" }))
    await user.click(
      within(preview).getByText("꾸준한 글쓰기는 사고를 정돈한다.")
    )
    await user.click(within(preview).getByRole("button", { name: "뒷받침" }))
    await user.click(
      within(preview).getByText(
        "매일 쓰는 사람은 자기 생각을 더 명확히 표현한다."
      )
    )
    await user.click(within(preview).getByRole("button", { name: "예시" }))
    await user.click(
      within(preview).getByText(
        "예컨대 일기를 3년 쓴 이는 회의에서도 핵심을 빠르게 짚는다."
      )
    )
    await user.click(within(preview).getByRole("button", { name: "뒷받침" }))
    await user.click(
      within(preview).getByText("글쓰기 습관은 단순한 기술 이상의 효과를 낸다.")
    )

    await user.click(within(preview).getByRole("button", { name: "확인하기" }))

    expect(within(preview).getByText("완벽해요!")).toBeVisible()
    expect(within(preview).queryByText("태그 선택")).not.toBeInTheDocument()
  })
})
