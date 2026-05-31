import { describe, expect, it } from "vitest"

import {
  curriculumNodeStatusSchema,
  curriculumNodeStatuses,
} from "./curriculum-node-status"

describe("curriculum-node-status", () => {
  it("uses one status list for runtime values and Zod validation", () => {
    expect(curriculumNodeStatuses).toEqual(["active", "deprecated", "archived"])
    expect(
      curriculumNodeStatuses.map((status) =>
        curriculumNodeStatusSchema.parse(status)
      )
    ).toEqual(curriculumNodeStatuses)
  })
})
