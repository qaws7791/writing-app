import { isValidElement } from "react"

import PromptDetailPage from "./page"

describe("prompt detail page wrapper", () => {
  test("passes numeric prompt id to the client component", async () => {
    const element = await PromptDetailPage({
      params: Promise.resolve({ id: "6" }),
    })

    expect(isValidElement(element)).toBe(true)
    expect(element.props.promptId).toBe(6)
  })
})
