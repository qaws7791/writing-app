import { describe, expect, it } from "vitest"

import { contentStatusValues } from "#contracts/content/status"
import {
  learnerAccountStatusValues,
  learnerOperationalStatusValues,
} from "#contracts/identity/status"
import { lessonProgressStatusValues } from "#contracts/learning/status"

describe("domain status values", () => {
  it("exposes shared content status values", () => {
    expect(contentStatusValues).toEqual(["active", "archived"])
  })

  it("exposes shared learner account status values and operational subset", () => {
    expect(learnerAccountStatusValues).toEqual([
      "active",
      "suspended",
      "deleted",
    ])
    expect(learnerOperationalStatusValues).toEqual(["active", "suspended"])
  })

  it("exposes shared lesson progress status values", () => {
    expect(lessonProgressStatusValues).toEqual(["in_progress", "completed"])
  })
})
