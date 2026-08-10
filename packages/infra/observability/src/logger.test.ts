import { describe, expect, it } from "vitest"

import { createAppLogger, createChildLogger } from "#observability/logger"
import { createRequestLogger } from "#observability/request-logger"
import { createSecurityAuditLogger } from "#observability/security-audit-logger"

type LogRecord = Readonly<Record<string, unknown>>

describe("structured log privacy", () => {
  it("중첩 위치와 key 표기가 달라도 원문·credential을 가리고 URL query를 제거한다", () => {
    const { records, stream } = aMemoryLogStream()
    const logger = createChildLogger(createAppLogger({ stream }), {
      "Refresh-Token": "child-token",
    })

    logger.info({
      cause: "provider raw cause",
      headers: {
        Authorization: "Bearer credential",
        Cookie: "session=credential",
      },
      nested: [
        {
          client_IP: "203.0.113.1",
          raw_answer: "원문 답안",
          SESSION: "session-value",
        },
      ],
      url: "https://example.test/callback?token=query-secret#result",
    })

    expect(records[0]).toMatchObject({
      cause: "[REDACTED]",
      headers: {
        Authorization: "[REDACTED]",
        Cookie: "[REDACTED]",
      },
      nested: [
        {
          client_IP: "[REDACTED]",
          raw_answer: "[REDACTED]",
          SESSION: "[REDACTED]",
        },
      ],
      url: "https://example.test/callback?[REDACTED]#result",
    })
    expect(JSON.stringify(records[0])).not.toContain("child-token")
  })

  it("보안 감사만 제한된 IP와 User-Agent를 보존한다", () => {
    const { records, stream } = aMemoryLogStream()
    const logger = createAppLogger({ stream })
    const logSecurityAudit = createSecurityAuditLogger(logger)

    logger.info({
      clientIp: "203.0.113.10",
      userAgent: "general-user-agent",
    })
    logSecurityAudit({
      action: "authorization.denied",
      clientIp: "203.0.113.10",
      outcome: "denied",
      requestId: "request-security",
      target: "GET /users/:userId?token=query-secret",
      userAgent: "Browser/1.0\u0000",
    })

    expect(records).toMatchObject([
      { clientIp: "[REDACTED]", userAgent: "[REDACTED]" },
      {
        clientIp: "203.0.113.10",
        event: "security.audit",
        retentionClass: "security-90d",
        target: "GET /users/:userId?[REDACTED]",
        userAgent: "Browser/1.0",
      },
    ])
  })

  it("최상위 MCP credential ID만 보존하고 secret과 유사 key는 가린다", () => {
    const { records, stream } = aMemoryLogStream()
    const logger = createAppLogger({ stream })

    createRequestLogger(logger)({
      audience: "admin-mcp",
      durationMs: 1,
      mcpCredentialId: "wmcp_0123456789abcdef0123456789abcdef",
      method: "POST",
      outcome: "succeeded",
      path: "/mcp/admin",
      requestId: "request-admin-mcp",
      status: 200,
    })

    logger.info({
      clientSecret: "client-secret-value",
      mcpCredentialIdentifier: "similar-credential-value",
      nested: {
        mcpCredentialId: "nested-credential-value",
      },
      rawToken: "raw-token-value",
      tokenCount: 42,
    })

    expect(records[0]).toMatchObject({
      audience: "admin-mcp",
      mcpCredentialId: "wmcp_0123456789abcdef0123456789abcdef",
      requestId: "request-admin-mcp",
    })
    expect(records[1]).toMatchObject({
      clientSecret: "[REDACTED]",
      mcpCredentialIdentifier: "[REDACTED]",
      nested: {
        mcpCredentialId: "[REDACTED]",
      },
      rawToken: "[REDACTED]",
      tokenCount: 42,
    })
    expect(JSON.stringify(records)).not.toContain("client-secret-value")
    expect(JSON.stringify(records)).not.toContain("raw-token-value")
  })
})

function aMemoryLogStream(): {
  readonly records: LogRecord[]
  readonly stream: { readonly write: (message: string) => void }
} {
  const records: LogRecord[] = []

  return {
    records,
    stream: {
      write(message) {
        records.push(JSON.parse(message) as LogRecord)
      },
    },
  }
}
