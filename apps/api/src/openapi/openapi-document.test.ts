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
      "/learning/lessons/{lessonId}/complete",
      "/ai-feedback",
    ])
    expect(document.paths["/profile"]?.get?.operationId).toBe("getProfile")
    expect(document.paths["/progress"]?.get?.operationId).toBe("getProgress")
    expect(
      document.paths["/learning/lessons/{lessonId}/complete"]?.post?.operationId
    ).toBe("completeLesson")
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

  it("course 상세 progress schema는 학습자 진행 상태를 노출한다", () => {
    const document = createOpenApiDocument()
    const schema =
      document.paths["/courses/{courseId}"]?.get?.responses["200"]?.content?.[
        "application/json"
      ]?.schema

    expect(schema).toMatchObject({
      properties: {
        progress: {
          properties: {
            completedLessons: {
              type: "integer",
            },
            lessons: {
              items: {
                properties: {
                  currentStepIndex: {
                    anyOf: [{ type: "integer" }, { type: "null" }],
                  },
                  lessonId: {
                    type: "string",
                  },
                  status: {
                    enum: ["available", "completed", "locked"],
                    type: "string",
                  },
                },
                type: "object",
              },
              type: "array",
            },
            nextLesson: {
              anyOf: [
                {
                  properties: {
                    currentStepIndex: {
                      anyOf: [{ type: "integer" }, { type: "null" }],
                    },
                    estimatedMinutes: {
                      type: "integer",
                    },
                    id: {
                      type: "string",
                    },
                    status: {
                      enum: ["available", "completed", "locked"],
                      type: "string",
                    },
                    title: {
                      type: "string",
                    },
                  },
                  type: "object",
                },
                { type: "null" },
              ],
            },
            percentage: {
              maximum: 100,
              minimum: 0,
              type: "integer",
            },
            totalLessons: {
              type: "integer",
            },
          },
          type: "object",
        },
      },
      type: "object",
    })
  })
})
