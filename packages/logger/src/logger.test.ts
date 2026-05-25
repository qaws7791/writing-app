import { describe, expect, it } from "vitest"

import { createLogger, createRequestLogFields } from "@/logger"

describe("createLogger", () => {
  it("creates a pino-compatible logger with the configured level", () => {
    const logger = createLogger({
      environment: "test",
      level: "debug",
      service: "api",
    })

    expect(logger.level).toBe("debug")
    expect(logger.bindings()).toMatchObject({
      environment: "test",
      service: "api",
    })
  })
})

describe("createRequestLogFields", () => {
  it("keeps stable request logging fields", () => {
    const fields = createRequestLogFields({
      durationMs: 12,
      method: "GET",
      path: "/courses",
      requestId: "req-1",
      status: 200,
    })

    expect(fields).toEqual({
      durationMs: 12,
      method: "GET",
      path: "/courses",
      requestId: "req-1",
      status: 200,
    })
  })
})
