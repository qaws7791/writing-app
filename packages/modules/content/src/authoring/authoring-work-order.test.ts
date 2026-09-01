import { describe, expect, it } from "vitest"

import { parseAuthoringWorkOrders } from "#content/authoring/authoring-work-order"

describe("parseAuthoringWorkOrders", () => {
  it("manifest 형식을 파싱한다", () => {
    const parsed = parseAuthoringWorkOrders({
      courseId: "course-01-spelling",
      lessonsDirectory: "courses/course-01-spelling",
      orders: [
        {
          layout: ["TF", "Cp"],
          lessonId: "lesson-spelling-roseo",
          stepCount: 2,
        },
      ],
    })

    expect(parsed.defaultCourseId).toBe("course-01-spelling")
    expect(parsed.orders).toHaveLength(1)
  })
})
