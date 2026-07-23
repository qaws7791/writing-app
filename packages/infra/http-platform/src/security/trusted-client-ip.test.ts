import { describe, expect, it } from "vitest"

import { readTrustedClientIp } from "#http-platform/security/trusted-client-ip"

describe("trusted client IP", () => {
  it("reverse proxy가 덮어쓴 전용 header의 유효한 IP만 반환한다", () => {
    const request = new Request("https://api.example.test", {
      headers: {
        "X-Writing-App-Client-IP": " 2001:db8::1 ",
      },
    })

    expect(readTrustedClientIp(request)).toBe("2001:db8::1")
  })

  it.each([
    [{ "CF-Connecting-IP": "203.0.113.1" }],
    [{ "X-Forwarded-For": "203.0.113.2, 198.51.100.1" }],
    [{ "X-Real-IP": "203.0.113.3" }],
    [{ "X-Writing-App-Client-IP": "203.0.113.4, 198.51.100.2" }],
    [{ "X-Writing-App-Client-IP": "not-an-ip" }],
  ])("정제되지 않았거나 유효하지 않은 header를 신뢰하지 않는다", (headers) => {
    expect(
      readTrustedClientIp(new Request("https://api.example.test", { headers }))
    ).toBe("unknown")
  })
})
