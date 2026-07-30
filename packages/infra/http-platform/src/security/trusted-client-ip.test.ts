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
    ["다른 proxy header", { "CF-Connecting-IP": "203.0.113.1" }],
    [
      "다중 값 X-Forwarded-For",
      { "X-Forwarded-For": "203.0.113.2, 198.51.100.1" },
    ],
    ["X-Real-IP", { "X-Real-IP": "203.0.113.3" }],
    [
      "전용 header의 다중 값",
      { "X-Writing-App-Client-IP": "203.0.113.4, 198.51.100.2" },
    ],
    ["IP가 아닌 값", { "X-Writing-App-Client-IP": "not-an-ip" }],
    ["포트를 포함한 값", { "X-Writing-App-Client-IP": "203.0.113.1:1234" }],
  ])("%s는 신뢰하지 않는다", (_label, headers) => {
    expect(
      readTrustedClientIp(new Request("https://api.example.test", { headers }))
    ).toBe("unknown")
  })

  it("IPv4-mapped IPv6 값을 그대로 유지한다", () => {
    const request = new Request("https://api.example.test", {
      headers: { "X-Writing-App-Client-IP": "::ffff:203.0.113.1" },
    })

    expect(readTrustedClientIp(request)).toBe("::ffff:203.0.113.1")
  })
})
