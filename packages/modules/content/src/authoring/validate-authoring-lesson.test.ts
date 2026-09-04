import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { validateAuthoringLessonSteps } from "#content/authoring/validate-authoring-lesson"

const goldenLessonPath = resolve(
  process.cwd(),
  "content-authoring/lead-magnet/courses/course-01-spelling/lesson-spelling-roseo.json"
)

describe("validateAuthoringLessonSteps", () => {
  it("골든 샘플 레슨을 허용한다", () => {
    const steps = JSON.parse(readFileSync(goldenLessonPath, "utf8"))
    const issues = validateAuthoringLessonSteps({
      lessonId: "lesson-spelling-roseo",
      steps,
    })

    expect(issues).toEqual([])
  })

  it("짧은 READING 본문을 거절한다", () => {
    const issues = validateAuthoringLessonSteps({
      lessonId: "lesson-reading-short",
      steps: [
        {
          body: "짧은 본문",
          title: "읽기 안내",
          type: "reading",
        },
      ],
    })

    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.message).toContain("20자 이상")
    expect(issues[0]?.severity).toBe("error")
  })
})
