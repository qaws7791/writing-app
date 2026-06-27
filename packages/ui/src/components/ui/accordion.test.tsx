import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from "./accordion"

describe("accordion", () => {
  it("connects trigger state with the panel through Base UI semantics", async () => {
    const user = userEvent.setup()

    render(
      <Accordion defaultValue={["intro"]}>
        <AccordionItem value="intro">
          <AccordionTrigger>소개</AccordionTrigger>
          <AccordionContent>첫 번째 유닛 설명</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    const trigger = screen.getByRole("button", { name: "소개" })

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("첫 번째 유닛 설명")).toBeVisible()

    await user.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("supports multiple expanded items", () => {
    render(
      <Accordion defaultValue={["intro", "practice"]} multiple>
        <AccordionItem value="intro">
          <AccordionTrigger>소개</AccordionTrigger>
          <AccordionContent>첫 번째 유닛 설명</AccordionContent>
        </AccordionItem>
        <AccordionItem value="practice">
          <AccordionTrigger>연습</AccordionTrigger>
          <AccordionContent>두 번째 유닛 설명</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    expect(screen.getByRole("button", { name: "소개" })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(screen.getByRole("button", { name: "연습" })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
  })
})
