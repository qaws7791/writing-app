import { formatDraftMeta, formatSavedAt } from "./format"

describe("phase one format helpers", () => {
  test("formats saved time in Korean locale", () => {
    const formatted = formatSavedAt("2026-03-20T10:15:00.000Z")

    expect(formatted).toContain("3.")
    expect(formatted).toContain("20.")
  })

  test("formats draft meta in Korean locale", () => {
    const formatted = formatDraftMeta("2026-03-20T10:15:00.000Z")

    expect(formatted).toContain("3.")
    expect(formatted).toContain("20.")
  })
})
