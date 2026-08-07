import { describe, expect, it } from "vitest"

import { recordCspViolation } from "@workspace/nextjs-config/csp-report"
import {
  createContentSecurityPolicy,
  createNextSecurityHeaders,
} from "@workspace/nextjs-config/security-headers"

const maxCspReportBytes = 64 * 1024

describe("Next CSP 정책", () => {
  it("production script에서 unsafe-inline을 제거하고 속성 script를 차단한다", () => {
    const csp = createContentSecurityPolicy({
      nonce: "request-nonce",
      upgradeInsecureRequests: true,
    })

    expect(csp).toContain(
      "script-src 'self' 'nonce-request-nonce' 'strict-dynamic'"
    )
    expect(csp).toContain("script-src-attr 'none'")
    expect(csp).toContain("upgrade-insecure-requests")
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")
  })

  it("HTTP localhost production 검증에서는 request 승격만 제외한다", () => {
    const csp = createContentSecurityPolicy({
      nonce: "request-nonce",
      upgradeInsecureRequests: false,
    })

    expect(csp).toContain(
      "script-src 'self' 'nonce-request-nonce' 'strict-dynamic'"
    )
    expect(csp).not.toContain("upgrade-insecure-requests")
    expect(csp).not.toContain("'unsafe-eval'")
  })

  it("rollout flag로 같은 정책을 report-only header로 되돌린다", () => {
    const enforcingHeaders = createNextSecurityHeaders({
      reportOnly: false,
      upgradeInsecureRequests: true,
    })
    const reportOnlyHeaders = createNextSecurityHeaders({
      reportOnly: true,
      upgradeInsecureRequests: true,
    })
    const enforcingPolicy = enforcingHeaders.find(
      (header) => header.key === "Content-Security-Policy"
    )
    const reportOnlyPolicy = reportOnlyHeaders.find(
      (header) => header.key === "Content-Security-Policy-Report-Only"
    )

    expect(enforcingPolicy).toEqual(
      expect.objectContaining({
        key: "Content-Security-Policy",
      })
    )
    expect(reportOnlyPolicy).toEqual({
      key: "Content-Security-Policy-Report-Only",
      value: enforcingPolicy?.value,
    })
    expect(
      reportOnlyHeaders.some(
        (header) => header.key === "Content-Security-Policy"
      )
    ).toBe(false)
  })

  it("CSP report를 제한된 구조로 기록하고 저장을 금지한다", async () => {
    const logs: string[] = []
    const response = await recordCspViolation(
      new Request("https://web.example.test/api/csp-report", {
        body: JSON.stringify({
          "csp-report": {
            "blocked-uri":
              "https://cdn.example.test/script.js?credential-sentinel#fragment",
            "document-uri":
              "https://viewer:secret@web.example.test/path?credential-sentinel#fragment",
            "effective-directive": "script-src-elem",
            "source-file":
              "https://web.example.test/app.js?credential-sentinel",
          },
        }),
        method: "POST",
      }),
      "web",
      (value) => logs.push(value)
    )

    expect(response.status).toBe(204)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(logs).toHaveLength(1)
    expect(JSON.parse(logs[0] ?? "{}")).toEqual({
      application: "web",
      event: "csp_violation",
      report: {
        blockedUri: "https://cdn.example.test/script.js",
        disposition: null,
        documentUri: "https://web.example.test/path",
        effectiveDirective: "script-src-elem",
        lineNumber: null,
        sourceFile: "https://web.example.test/app.js",
      },
    })
    expect(logs[0]).not.toContain("credential-sentinel")
    expect(logs[0]).not.toContain("secret")
    expect(logs[0]).not.toContain("viewer")
  })

  it("정확히 64KiB인 CSP report를 기록하고 204를 반환한다", async () => {
    const logs: string[] = []
    const body = createCspReportBody(maxCspReportBytes)

    const response = await recordCspViolation(
      new Request("https://web.example.test/api/csp-report", {
        body,
        method: "POST",
      }),
      "web",
      (value) => logs.push(value)
    )

    expect(new TextEncoder().encode(body)).toHaveLength(maxCspReportBytes)
    expect(response.status).toBe(204)
    expect(logs).toHaveLength(1)
  })

  it("64KiB를 넘는 CSP report는 기록하지 않고 413을 반환한다", async () => {
    const logs: string[] = []
    const response = await recordCspViolation(
      new Request("https://web.example.test/api/csp-report", {
        body: createCspReportBody(maxCspReportBytes + 1),
        method: "POST",
      }),
      "web",
      (value) => logs.push(value)
    )

    expect(response.status).toBe(413)
    expect(logs).toEqual([])
  })

  it("잘못된 JSON CSP report는 기록하지 않고 400을 반환한다", async () => {
    const logs: string[] = []
    const response = await recordCspViolation(
      new Request("https://web.example.test/api/csp-report", {
        body: "{",
        method: "POST",
      }),
      "web",
      (value) => logs.push(value)
    )

    expect(response.status).toBe(400)
    expect(logs).toEqual([])
  })

  it("Content-Length가 64KiB를 넘으면 body를 읽지 않고 413을 반환한다", async () => {
    const logs: string[] = []
    const response = await recordCspViolation(
      new Request("https://web.example.test/api/csp-report", {
        body: "{}",
        headers: { "Content-Length": String(maxCspReportBytes + 1) },
        method: "POST",
      }),
      "web",
      (value) => logs.push(value)
    )

    expect(response.status).toBe(413)
    expect(logs).toEqual([])
  })
})

function createCspReportBody(byteLength: number): string {
  const prefix = '{"csp-report":{"blocked-uri":"'
  const suffix = '"}}'
  const fixedLength = new TextEncoder().encode(`${prefix}${suffix}`).byteLength

  return `${prefix}${"x".repeat(byteLength - fixedLength)}${suffix}`
}
