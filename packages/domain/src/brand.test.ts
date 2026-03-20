import { toDraftId, toPromptId, toUserId } from "./brand.js"

describe("brand helpers", () => {
  test("preserve primitive runtime values", () => {
    expect(toUserId("user-1")).toBe("user-1")
    expect(toPromptId(7)).toBe(7)
    expect(toDraftId(9)).toBe(9)
  })
})
