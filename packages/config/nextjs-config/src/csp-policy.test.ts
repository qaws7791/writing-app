import { createContext, runInContext } from "node:vm"

import { describe, expect, it } from "vitest"

import { recordCspViolation } from "@workspace/nextjs-config/csp-report"
import {
  createContentSecurityPolicy,
  createNextSecurityHeaders,
} from "@workspace/nextjs-config/security-headers"
import { zodJitlessBootstrapScript } from "@workspace/nextjs-config/zod-jitless"

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

  it("bootstrap script를 실행하면 Zod JIT probe가 꺼진다", () => {
    const context = createContext({})

    runInContext(zodJitlessBootstrapScript, context)

    expect(runInContext("globalThis.__zod_globalConfig.jitless", context)).toBe(
      true
    )
  })

  it("rollout flag로 같은 정책을 report-only header로 되돌린다", () => {
    const headers = createNextSecurityHeaders({
      reportOnly: true,
      upgradeInsecureRequests: true,
    })

    expect(headers).toContainEqual(
      expect.objectContaining({
        key: "Content-Security-Policy-Report-Only",
      })
    )
    expect(
      headers.some((header) => header.key === "Content-Security-Policy")
    ).toBe(false)
  })

  it("CSP report를 제한된 구조로 기록하고 저장을 금지한다", async () => {
    const logs: string[] = []
    const response = await recordCspViolation(
      new Request("https://web.example.test/api/csp-report", {
        body: JSON.stringify({
          "csp-report": {
            "blocked-uri": "inline",
            "document-uri": "https://web.example.test/",
            "effective-directive": "script-src-elem",
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
    expect(JSON.parse(logs[0] ?? "{}")).toMatchObject({
      application: "web",
      event: "csp_violation",
      report: { blockedUri: "inline" },
    })
  })
})
