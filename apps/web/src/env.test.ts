import { describe, expect, it } from "vitest"

import { parseWebEnv } from "@/env"

describe("parseWebEnv", () => {
  it("uses local API defaults", () => {
    expect(parseWebEnv({})).toEqual({
      browserApiBaseUrl: "http://localhost:4000",
      serverApiBaseUrl: "http://localhost:4000",
    })
  })

  it("parses browser and server API base URLs separately", () => {
    expect(
      parseWebEnv({
        NEXT_PUBLIC_API_BASE_URL: "https://browser.example.com",
        WEB_API_BASE_URL: "https://server.example.com",
      })
    ).toEqual({
      browserApiBaseUrl: "https://browser.example.com",
      serverApiBaseUrl: "https://server.example.com",
    })
  })
})
