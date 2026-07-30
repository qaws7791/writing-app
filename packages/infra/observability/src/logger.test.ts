import { describe, expect, it } from "vitest"

import {
  createAppLogger,
  createChildLogger,
  shouldUsePrettyLogging,
} from "#observability/logger"
import { createRequestLogger } from "#observability/request-logger"
import { createSecurityAuditLogger } from "#observability/security-audit-logger"

type LogRecord = {
  readonly [key: string]: unknown
  readonly level: number
  readonly msg: string
  readonly time?: number
}

function createMemoryLogStream(): {
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

describe("logger", () => {
  it.each([
    ["development", undefined, true],
    ["production", undefined, false],
    ["development", "false", false],
    ["production", "true", true],
  ] as const)(
    "NODE_ENV=%s, LOG_PRETTY=%s일 때 pretty 사용 여부는 %s다",
    (nodeEnv, logPretty, expected) => {
      expect(
        shouldUsePrettyLogging({
          NODE_ENV: nodeEnv,
          ...(logPretty === undefined ? {} : { LOG_PRETTY: logPretty }),
        })
      ).toBe(expected)
    }
  )

  it("request log helper가 요청 완료 로그를 남긴다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({
      stream,
    })
    const logRequest = createRequestLogger(logger)

    logRequest({
      audience: "learner",
      durationMs: 12,
      method: "GET",
      outcome: "succeeded",
      path: "/courses/:courseId",
      requestId: "r1",
      status: 200,
    })

    expect(records[0]).toMatchObject({
      audience: "learner",
      durationMs: 12,
      event: "request.completed",
      method: "GET",
      msg: "request.completed",
      outcome: "succeeded",
      path: "/courses/:courseId",
      requestId: "r1",
      retentionClass: "application-30d",
      status: 200,
    })
  })

  it("request log helper가 actor 식별자를 구조화하고 허용하지 않은 필드를 버린다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({
      stream,
    })
    const logRequest = createRequestLogger(logger)

    logRequest({
      audience: "learner",
      durationMs: 15,
      method: "GET",
      outcome: "succeeded",
      path: "/profile",
      requestId: "r2",
      status: 200,
      actorId: "user-1",
      actorType: "learner",
      answer: "raw answer",
      clientIp: "203.0.113.20",
      email: "learner@example.test",
      name: "learner name",
      prompt: "raw prompt",
      providerResponse: "raw provider response",
      secret: "request secret",
      userAgent: "raw user agent",
    } as Parameters<typeof logRequest>[0])

    expect(records[0]).toMatchObject({
      actorId: "user-1",
      actorType: "learner",
      audience: "learner",
      durationMs: 15,
      method: "GET",
      msg: "request.completed",
      path: "/profile",
      requestId: "r2",
      status: 200,
    })
    const serialized = JSON.stringify(records[0])
    for (const forbiddenValue of [
      "raw answer",
      "203.0.113.20",
      "learner@example.test",
      "learner name",
      "raw prompt",
      "raw provider response",
      "request secret",
      "raw user agent",
    ]) {
      expect(serialized).not.toContain(forbiddenValue)
    }
  })

  it("금지된 개인정보, 원문과 provider cause를 재귀적으로 가리고 URL query를 제거한다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({ stream })

    logger.info({
      cause: "provider raw cause",
      credential: "credential-value",
      nested: {
        answerText: "raw answer",
        email: "learner@example.test",
        name: "학습자 이름",
        prompt: "raw prompt",
        providerResponse: "provider raw response",
        sessionToken: "session-value",
      },
      secret: "secret-value",
      url: "https://example.test/callback?token=query-secret#result",
    })

    expect(records[0]).toMatchObject({
      cause: "[REDACTED]",
      credential: "[REDACTED]",
      nested: {
        answerText: "[REDACTED]",
        email: "[REDACTED]",
        name: "[REDACTED]",
        prompt: "[REDACTED]",
        providerResponse: "[REDACTED]",
        sessionToken: "[REDACTED]",
      },
      secret: "[REDACTED]",
      url: "https://example.test/callback?[REDACTED]#result",
    })
  })

  it("대소문자·구분자·배열 위치와 child binding에 관계없이 민감 key를 가린다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createChildLogger(createAppLogger({ stream }), {
      "Refresh-Token": "child-token",
    })

    logger.info({
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
    })

    const serialized = JSON.stringify(records[0])
    for (const sensitiveValue of [
      "child-token",
      "Bearer credential",
      "session=credential",
      "203.0.113.1",
      "원문 답안",
      "session-value",
    ]) {
      expect(serialized).not.toContain(sensitiveValue)
    }
  })

  it("AI usage의 집계 token 수는 credential token과 구분한다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({ stream })

    logger.info({
      accessToken: "credential-token",
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
    })

    expect(records[0]).toMatchObject({
      accessToken: "[REDACTED]",
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
    })
  })

  it("security event만 제한된 IP와 User-Agent 필드를 보존한다", () => {
    const { records, stream } = createMemoryLogStream()
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
      requestId: "r-security",
      target: "GET /users/:userId?token=query-secret",
      userAgent: "Browser/1.0\u0000",
    })

    expect(records[0]).toMatchObject({
      clientIp: "[REDACTED]",
      userAgent: "[REDACTED]",
    })
    expect(records[1]).toMatchObject({
      action: "authorization.denied",
      clientIp: "203.0.113.10",
      event: "security.audit",
      level: 40,
      msg: "security.audit",
      retentionClass: "security-90d",
      target: "GET /users/:userId?[REDACTED]",
      userAgent: "Browser/1.0",
    })
  })

  it("성공 security event도 security 보존 class와 info level을 사용한다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({ stream })
    const logSecurityAudit = createSecurityAuditLogger(logger)

    logSecurityAudit({
      action: "owner.mutation",
      outcome: "succeeded",
      requestId: "r-owner",
      target: "DELETE /users/:userId",
    })

    expect(records[0]).toMatchObject({
      event: "security.audit",
      level: 30,
      retentionClass: "security-90d",
    })
  })
})
