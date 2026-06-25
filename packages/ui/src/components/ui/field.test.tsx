import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Input } from "./input"
import { Field, FieldDescription, FieldError, FieldLabel } from "./field"

describe("Field", () => {
  it("keeps label, description, and error relation explicit", () => {
    render(
      <Field invalid>
        <FieldLabel htmlFor="title">제목</FieldLabel>
        <Input
          id="title"
          aria-invalid="true"
          aria-describedby="title-help title-error"
        />
        <FieldDescription id="title-help">120자 이내</FieldDescription>
        <FieldError id="title-error">제목을 입력하세요.</FieldError>
      </Field>
    )

    const input = screen.getByLabelText("제목")

    expect(input).toHaveAttribute("aria-describedby", "title-help title-error")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent("제목을 입력하세요.")
    expect(
      screen.getByText("제목").closest("[data-slot='field']")
    ).toHaveAttribute("data-invalid")
  })
})
