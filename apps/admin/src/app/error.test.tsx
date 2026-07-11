import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import AdminRouteError from "@/app/error"

describe("어드민 route 오류 경계", () => {
  it("다시 시도 버튼이 reset을 호출한다", async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(<AdminRouteError error={new Error("test")} reset={reset} />)

    await user.click(screen.getByRole("button", { name: "다시 시도" }))

    expect(reset).toHaveBeenCalledOnce()
  })
})
