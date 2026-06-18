import { describe, expect, it } from "vitest"

import {
  contentStatusSchema,
  contentStatusValues,
  learnerAccountStatusSchema,
  learnerAccountStatusValues,
  learnerOperationalStatusSchema,
  learnerOperationalStatusValues,
  lessonProgressStatusSchema,
  lessonProgressStatusValues,
} from "@workspace/core/shared/kernel/status"

describe("domain status values", () => {
  it("exposes shared content status values and schema", () => {
    expect(contentStatusValues).toEqual(["active", "archived"])
    expect(contentStatusSchema.options).toEqual(contentStatusValues)
  })

  it("exposes shared learner account status values and operational subset", () => {
    expect(learnerAccountStatusValues).toEqual([
      "active",
      "suspended",
      "deleted",
    ])
    expect(learnerAccountStatusSchema.options).toEqual(
      learnerAccountStatusValues
    )
    expect(learnerOperationalStatusValues).toEqual(["active", "suspended"])
    expect(learnerOperationalStatusSchema.options).toEqual(
      learnerOperationalStatusValues
    )
  })

  it("exposes shared lesson progress status values and schema", () => {
    expect(lessonProgressStatusValues).toEqual(["in_progress", "completed"])
    expect(lessonProgressStatusSchema.options).toEqual(
      lessonProgressStatusValues
    )
  })
})
