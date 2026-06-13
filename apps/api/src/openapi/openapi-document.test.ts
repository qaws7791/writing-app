import { describe, expect, it } from "vitest"

import { createOpenApiDocument } from "@/openapi/openapi-document"

describe("플랫폼 API OpenAPI 문서", () => {
  it("profile, progress, ai-feedback 계약을 포함한다", () => {
    const document = createOpenApiDocument()

    expect(document.openapi).toBe("3.1.0")
    expect(document.info.title).toBe("Writing App API")
    expect(Object.keys(document.paths)).toEqual([
      "/health",
      "/auth/session",
      "/profile",
      "/progress",
      "/courses",
      "/courses/{courseId}",
      "/lessons/{lessonId}",
      "/learning/answers",
      "/ai-feedback",
    ])
    expect(document.paths["/profile"]?.get?.operationId).toBe("getProfile")
    expect(document.paths["/progress"]?.get?.operationId).toBe("getProgress")
    expect(document.paths["/ai-feedback"]?.post?.operationId).toBe(
      "createAiFeedback"
    )
  })

  it("AI feedback 응답 schema는 Kwep 코칭 UI 필드를 노출한다", () => {
    const document = createOpenApiDocument()
    const schema =
      document.paths["/ai-feedback"]?.post?.responses["200"]?.content?.[
        "application/json"
      ]?.schema

    expect(schema).toMatchObject({
      properties: {
        improvements: {
          items: {
            type: "string",
          },
          type: "array",
        },
        nextAction: {
          type: "string",
        },
        remainingAttempts: {
          type: "integer",
        },
        score: {
          type: "integer",
        },
        scoreRange: {
          type: "array",
        },
        showScore: {
          type: "boolean",
        },
        strengths: {
          items: {
            type: "string",
          },
          type: "array",
        },
        summary: {
          type: "string",
        },
      },
      type: "object",
    })
  })
})
