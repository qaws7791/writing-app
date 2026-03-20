import { isValidElement } from "react"

import WriteDetailPage from "./page"

describe("write detail page wrapper", () => {
  test("passes numeric draft id to the client component", async () => {
    const element = await WriteDetailPage({
      params: Promise.resolve({ id: "7" }),
    })

    expect(isValidElement(element)).toBe(true)
    expect(element.props.draftId).toBe(7)
  })
})
