import { describe, expect, it } from "vitest"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

describe("플랫폼 API openapi route", () => {
  it("OpenAPI 3.1 baseline document를 반환한다", async () => {
    const app = createApp(createTestDependencies())

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
  })
})
