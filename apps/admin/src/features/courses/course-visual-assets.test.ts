import { courseVisualKeyValues } from "@workspace/contracts/content"
import { describe, expect, it } from "vitest"

import { createAdminCourseImageUrl } from "@/features/courses/course-visual-assets"

describe("관리자 코스 visual asset", () => {
  it("모든 canonical visual key를 정적 PNG 경로에 매핑한다", () => {
    for (const visualKey of courseVisualKeyValues) {
      expect(createAdminCourseImageUrl(visualKey)).toBe(
        `/course-thumbnails/${visualKey}.png`
      )
    }
  })
})
