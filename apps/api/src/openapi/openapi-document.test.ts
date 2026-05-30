import { describe, expect, it } from "vitest"

import { createOpenApiDocument } from "@/openapi/openapi-document"

describe("createOpenApiDocument", () => {
  it("creates the current API OpenAPI document", async () => {
    const document = await createOpenApiDocument()

    expect(document.openapi).toBe("3.1.0")
    expect(document.info.title).toBe("Writing App API")
    expect(document.paths).toHaveProperty("/health")
    expect(document.paths).toHaveProperty("/courses")
    expect(document.paths).toHaveProperty("/courses/search")
    expect(document.paths).toHaveProperty("/courses/{courseId}")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}")
    expect(document.paths).toHaveProperty("/me")
    expect(document.paths).toHaveProperty("/profile")
    expect(document.paths).toHaveProperty("/progress")
    expect(document.paths).toHaveProperty("/courses/{courseId}/progress")
    expect(document.paths).not.toHaveProperty(
      "/courses/{courseId}/curriculum-upgrade"
    )
    expect(document.paths).not.toHaveProperty(
      "/courses/{courseId}/curriculum-upgrade/dismiss"
    )
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/progress")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/answers")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/complete")
    expect(document.paths).toHaveProperty("/ai-feedback")
  })
})
