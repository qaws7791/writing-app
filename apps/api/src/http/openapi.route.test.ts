import { describe, expect, it } from "vitest"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import { createLearnerApp as createApp } from "@/http/learner-app"
import { createTestDependencies } from "@/routes/test-dependencies"
import {
  expectedOpenApiRouteKeys,
  expectedProtectedOpenApiRouteKeys,
  readOpenApiRouteKeys,
  readProtectedOpenApiRouteKeys,
} from "@/test-support/p10-route-parity"

describe("플랫폼 API openapi route", () => {
  it("OpenAPI 3.1 baseline document를 반환한다", async () => {
    const dependencies = createTestDependencies()
    const app = createApp(dependencies)

    const response = await app.request("/openapi")

    expect(response.status).toBe(200)
    const document = (await response.json()) as {
      readonly components: {
        readonly securitySchemes: {
          readonly learnerSessionCookie: {
            readonly in: string
            readonly name: string
            readonly type: string
          }
        }
      }
      readonly info: {
        readonly title: string
      }
      readonly openapi: string
      readonly paths: Readonly<Record<string, unknown>>
    }

    expect(document).toMatchObject({
      components: {
        securitySchemes: {
          learnerSessionCookie: {
            in: "cookie",
            name: learnerSessionCookieName,
            type: "apiKey",
          },
        },
      },
      info: {
        title: "Writing App API",
      },
      openapi: "3.1.0",
    })
    expect(document.paths).toHaveProperty("/courses/{courseId}")
    expect(document).not.toHaveProperty([
      "components",
      "securitySchemes",
      "bearerAuth",
    ])
    expect(document).toHaveProperty(
      ["paths", "/profile", "get", "security"],
      [{ learnerSessionCookie: [] }]
    )
    expect(document).toHaveProperty(
      [
        "paths",
        "/learning/lessons/{lessonId}/steps/{stepId}/complete",
        "post",
        "requestBody",
        "content",
        "application/json",
        "schema",
        "oneOf",
        0,
        "additionalProperties",
      ],
      false
    )
    expect(document.paths).toHaveProperty("/learning/lessons/{lessonId}/start")
    expect(document.paths).toHaveProperty(
      "/learning/lessons/{lessonId}/steps/{stepId}/ai-feedback"
    )
    for (const { route } of dependencies.learningRoutes) {
      expect(document).toHaveProperty(
        ["paths", route.path, route.method, "operationId"],
        route.operationId
      )
    }
    for (const path of [
      "/learning/answers",
      "/learning/lessons/{lessonId}/progress",
      "/learning/lessons/{lessonId}/complete",
      "/ai-feedback",
    ]) {
      expect(document.paths).not.toHaveProperty(path)
    }
    expect(document).toHaveProperty(
      [
        "paths",
        "/profile",
        "get",
        "responses",
        "200",
        "content",
        "application/json",
        "schema",
        "additionalProperties",
      ],
      false
    )
    expect(readOpenApiRouteKeys(document)).toEqual(
      expectedOpenApiRouteKeys("learner")
    )
    expect(
      readProtectedOpenApiRouteKeys(document, "learnerSessionCookie")
    ).toEqual(expectedProtectedOpenApiRouteKeys("learner"))
  })
})
