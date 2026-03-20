import { describe, expect, test } from "vitest"

import {
  resolveBrowserApiBaseUrl,
  resolveServerApiBaseUrl,
} from "./api-base-url"

describe("api base url", () => {
  test("aligns loopback api host with the current browser host", () => {
    window.history.replaceState({}, "", "http://localhost:3000/sign-in")

    expect(resolveBrowserApiBaseUrl("http://127.0.0.1:3010")).toBe(
      "http://localhost:3010"
    )
  })

  test("keeps non-loopback api hosts unchanged", () => {
    window.history.replaceState({}, "", "http://localhost:3000/sign-in")

    expect(resolveBrowserApiBaseUrl("https://api.example.com")).toBe(
      "https://api.example.com"
    )
  })

  test("aligns loopback api host with the incoming request host on the server", () => {
    expect(
      resolveServerApiBaseUrl("http://127.0.0.1:3010", "localhost:3000")
    ).toBe("http://localhost:3010")
  })
})
