import { describe, expect, it } from "vitest"

import { parseAdminWebEnv } from "@/env"

describe("parseAdminWebEnv", () => {
  it("uses the local admin API default", () => {
    expect(parseAdminWebEnv({})).toEqual({
      adminApiBaseUrl: "http://localhost:4001",
    })
  })

  it("parses the admin API base URL", () => {
    expect(
      parseAdminWebEnv({
        ADMIN_API_BASE_URL: "https://admin-api.example.com",
      })
    ).toEqual({
      adminApiBaseUrl: "https://admin-api.example.com",
    })
  })
})
