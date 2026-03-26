import { isValidElement } from "react"

import WritingDetailPage from "./page"

describe("writing detail page wrapper", () => {
  test("passes numeric writing id to the client component", async () => {
    const element = await WritingDetailPage({
      params: Promise.resolve({ id: "7" }),
      searchParams: Promise.resolve({}),
    })

    expect(isValidElement(element)).toBe(true)
    expect(element.props.writingId).toBe(7)
  })
})
