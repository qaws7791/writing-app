import { describe, expect, it } from "bun:test"

import { deriveE2eClientIp } from "#scripts/e2e-client-ip"

describe("E2E trusted client IP", () => {
  it("test id를 RFC 문서용 IPv4의 유효 host 주소로 파생한다", () => {
    const address = deriveE2eClientIp("release-chromium:credentials-auth")
    const octets = address.split(".").map(Number)

    expect(
      /^(?:192\.0\.2|198\.51\.100|203\.0\.113)\.(?:[1-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])$/u.test(
        address
      )
    ).toBe(true)
    expect(octets).toHaveLength(4)
    expect(octets.every((octet) => octet >= 0 && octet <= 255)).toBe(true)
  })

  it("같은 test id에는 같은 주소를 반환한다", () => {
    expect(deriveE2eClientIp("release-chromium:writing-app")).toBe(
      deriveE2eClientIp("release-chromium:writing-app")
    )
  })

  it("hash slot 충돌 주소가 예약되면 다음 문서용 주소를 선택한다", () => {
    const testId = "release-chromium:lesson-draft"
    const initialAddress = deriveE2eClientIp(testId)
    const resolvedAddress = deriveE2eClientIp(testId, new Set([initialAddress]))

    expect(resolvedAddress).not.toBe(initialAddress)
    expect(
      /^(?:192\.0\.2|198\.51\.100|203\.0\.113)\.(?:[1-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])$/u.test(
        resolvedAddress
      )
    ).toBe(true)
  })

  it("빈 test id를 거절한다", () => {
    expect(() => deriveE2eClientIp("")).toThrow(
      "E2E client IP 파생에는 test id가 필요합니다."
    )
  })
})
