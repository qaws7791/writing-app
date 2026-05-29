import { describe, expect, it } from "vitest"

import { getAppUser } from "@/lib/auth/get-app-user"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

describe("getAppUser", () => {
  it("returns the current user when the API session is valid", async () => {
    const user = {
      email: "learner@example.com",
      id: "learner-1",
      image: null,
      name: "학습자",
    }
    const api = createApi({
      getCurrentUser: async () => apiOk(user),
    })

    await expect(getAppUser(api)).resolves.toEqual(user)
  })

  it("returns null when the API session is missing", async () => {
    const api = createApi({
      getCurrentUser: async () =>
        apiFailure({
          code: "unauthorized",
          message: "로그인이 필요합니다.",
        }),
    })

    await expect(getAppUser(api)).resolves.toBeNull()
  })
})

function createApi(
  overrides: Partial<WritingAppApi>
): Pick<WritingAppApi, "getCurrentUser"> {
  return overrides as Pick<WritingAppApi, "getCurrentUser">
}
