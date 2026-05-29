import { describe, expect, it } from "vitest"

import { getAuthenticatedAppRedirectPath } from "@/lib/auth/get-authenticated-app-redirect-path"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

describe("getAuthenticatedAppRedirectPath", () => {
  it("returns the safe next path when the user is already authenticated", async () => {
    const api = createApi({
      getCurrentUser: async () =>
        apiOk({
          email: "learner@example.com",
          id: "learner-1",
          image: null,
          name: "학습자",
        }),
    })

    await expect(
      getAuthenticatedAppRedirectPath(api, "/app/courses")
    ).resolves.toBe("/app/courses")
  })

  it("returns the app home when the requested next path is unsafe", async () => {
    const api = createApi({
      getCurrentUser: async () =>
        apiOk({
          email: "learner@example.com",
          id: "learner-1",
          image: null,
          name: "학습자",
        }),
    })

    await expect(
      getAuthenticatedAppRedirectPath(api, "https://example.com/app")
    ).resolves.toBe("/app")
  })

  it("returns null when no authenticated session exists", async () => {
    const api = createApi({
      getCurrentUser: async () =>
        apiFailure({
          code: "unauthorized",
          message: "로그인이 필요합니다.",
        }),
    })

    await expect(
      getAuthenticatedAppRedirectPath(api, "/app/courses")
    ).resolves.toBeNull()
  })
})

function createApi(
  overrides: Partial<WritingAppApi>
): Pick<WritingAppApi, "getCurrentUser"> {
  return overrides as Pick<WritingAppApi, "getCurrentUser">
}
