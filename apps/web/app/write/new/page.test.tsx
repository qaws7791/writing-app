import { isValidElement } from "react"

import WritingNewPage from "./page"

describe("write new page wrapper", () => {
  test("passes prompt id from search params", async () => {
    const element = await WritingNewPage({
      searchParams: Promise.resolve({ prompt: "12" }),
    })

    expect(isValidElement(element)).toBe(true)
    expect(element.props.initialPromptId).toBe(12)
  })
})
