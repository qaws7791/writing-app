import { describe, expect, test } from "vitest"

import {
  parseJourneyId,
  parsePromptId,
  parseSessionId,
  parseStepId,
  parseUserId,
  parseWritingId,
  toJourneyId,
  toPromptId,
  toSessionId,
  toStepId,
  toUserId,
  toWritingId,
} from "./brand"

describe("brand", () => {
  test("parses valid branded ids", () => {
    expect(parseUserId("user-1")).toBe("user-1")
    expect(parsePromptId(1)).toBe(1)
    expect(parseWritingId(2)).toBe(2)
    expect(parseJourneyId(3)).toBe(3)
    expect(parseSessionId(4)).toBe(4)
    expect(parseStepId(5)).toBe(5)
  })

  test("rejects invalid id inputs", () => {
    expect(() => parseUserId("")).toThrow()
    expect(() => parsePromptId(0)).toThrow()
    expect(() => parseWritingId(-1)).toThrow()
    expect(() => parseJourneyId(1.5)).toThrow()
    expect(() => parseSessionId(Number.NaN)).toThrow()
    expect(() => parseStepId(0)).toThrow()
  })

  test("keeps trusted constructors available for internal fixtures", () => {
    expect(toUserId("trusted-user")).toBe("trusted-user")
    expect(toPromptId(11)).toBe(11)
    expect(toWritingId(12)).toBe(12)
    expect(toJourneyId(13)).toBe(13)
    expect(toSessionId(14)).toBe(14)
    expect(toStepId(15)).toBe(15)
  })
})
