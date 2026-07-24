import { describe, expect, it } from "vitest"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import { createLearnerApp } from "@/http/learner-app"
import { registerLearnerApiDocumentation } from "@/http/openapi"
import { createTestLearnerApp } from "@/routes/test-dependencies"

describe("플랫폼 API openapi route", () => {
  it("OpenAPI 3.1 baseline document를 반환한다", async () => {
    const app = createTestLearnerApp()

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
    expect(document).toHaveProperty(
      ["paths", "/courses", "get", "operationId"],
      "getCourses"
    )
    expect(document).toHaveProperty(
      [
        "paths",
        "/learning/lessons/{lessonId}/steps/{stepId}/draft",
        "put",
        "operationId",
      ],
      "saveLearnerStepDraft"
    )
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
  })

  it("활성화 시 Scalar UI를 제공하고 비활성화 시 문서 route를 등록하지 않는다", async () => {
    const enabled = createTestLearnerApp()
    const scalarResponse = await enabled.request("/docs")

    expect(scalarResponse.status).toBe(200)
    expect(scalarResponse.headers.get("content-type")).toContain("text/html")
    expect(await scalarResponse.text()).toContain("Writing App Learner API")

    const disabled = createLearnerApp({})
    registerLearnerApiDocumentation(disabled, { enabled: false })
    expect((await disabled.request("/openapi")).status).toBe(404)
    expect((await disabled.request("/docs")).status).toBe(404)
  })
})
