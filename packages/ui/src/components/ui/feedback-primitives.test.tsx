import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { Spinner } from "./spinner"

describe("feedback primitives", () => {
  it("exposes alert tone without coupling callers to class names", () => {
    render(
      <Alert tone="danger">
        <AlertTitle>저장 실패</AlertTitle>
        <AlertDescription>다시 시도하세요.</AlertDescription>
      </Alert>
    )

    const alert = screen.getByRole("status")

    expect(alert).toHaveAttribute("data-tone", "danger")
    expect(alert).toHaveTextContent("저장 실패")
    expect(alert).toHaveTextContent("다시 시도하세요.")
  })

  it("exposes badge tone as data attribute", () => {
    render(<Badge tone="success">공개</Badge>)

    expect(screen.getByText("공개")).toHaveAttribute("data-tone", "success")
  })

  it("uses an accessible spinner only when the caller provides a label", () => {
    const { rerender } = render(<Spinner data-testid="spinner" />)

    expect(screen.getByTestId("spinner")).toHaveAttribute("aria-hidden", "true")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    rerender(<Spinner label="저장 중" />)

    expect(screen.getByRole("status", { name: "저장 중" })).toBeInTheDocument()
  })

  it("can be decorative or semantic separator", () => {
    const { rerender } = render(<Separator data-testid="separator" />)

    expect(screen.getByTestId("separator")).toHaveAttribute("role", "none")

    rerender(<Separator decorative={false} orientation="vertical" />)

    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical"
    )
  })
})
