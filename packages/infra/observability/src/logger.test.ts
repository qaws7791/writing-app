import { describe, expect, it, vi } from "vitest"

import { createAppLogger, shouldUsePrettyLogging } from "#observability/logger"
import { shutdownLogger } from "#observability/lifecycle"
import { createRequestLogger } from "#observability/request-logger"

type LogRecord = {
  readonly adminId?: string
  readonly audience?: "admin" | "learner"
  readonly durationMs?: number
  readonly level: number
  readonly method?: string
  readonly msg: string
  readonly path?: string
  readonly requestId?: string
  readonly status?: number
  readonly time?: number
  readonly userId?: string
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
  it("LOG_PRETTY=false은 development에서도 JSON logger를 강제한다", () => {
    expect(
      shouldUsePrettyLogging({
        LOG_PRETTY: "false",
        NODE_ENV: "development",
      })
    ).toBe(false)
  })

  it("명시적 pretty 설정이 없을 때만 development 기본값을 사용한다", () => {
    expect(shouldUsePrettyLogging({ NODE_ENV: "development" })).toBe(true)
    expect(shouldUsePrettyLogging({ NODE_ENV: "production" })).toBe(false)
    expect(
      shouldUsePrettyLogging({
        LOG_PRETTY: "true",
        NODE_ENV: "production",
      })
    ).toBe(true)
  })

  it("pino JSON logger를 생성한다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({
      level: "debug",
      stream,
    })

    logger.debug({ requestId: "r1" }, "debug message")

    expect(records[0]).toMatchObject({
      level: 20,
      msg: "debug message",
      requestId: "r1",
      time: expect.any(Number),
    })
  })

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
      path: "/courses",
      requestId: "r1",
      status: 200,
    })

    expect(records[0]).toMatchObject({
      audience: "learner",
      durationMs: 12,
      method: "GET",
      msg: "request.completed",
      path: "/courses",
      requestId: "r1",
      status: 200,
    })
  })

  it("request log helper가 사용자 식별자를 구조화해서 남긴다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({
      stream,
    })
    const logRequest = createRequestLogger(logger)

    logRequest({
      audience: "learner",
      durationMs: 15,
      method: "GET",
      path: "/profile",
      requestId: "r2",
      status: 200,
      userId: "user-1",
    })

    expect(records[0]).toMatchObject({
      audience: "learner",
      durationMs: 15,
      method: "GET",
      msg: "request.completed",
      path: "/profile",
      requestId: "r2",
      status: 200,
      userId: "user-1",
    })
  })

  it("secret, credential, session token, 원문 답안과 불필요한 개인정보를 재귀적으로 가린다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({ stream })

    logger.info({
      credential: "credential-value",
      nested: {
        answerText: "raw answer",
        email: "learner@example.test",
        sessionToken: "session-value",
      },
      secret: "secret-value",
    })

    expect(records[0]).toMatchObject({
      credential: "[REDACTED]",
      nested: {
        answerText: "[REDACTED]",
        email: "[REDACTED]",
        sessionToken: "[REDACTED]",
      },
      secret: "[REDACTED]",
    })
  })

  it("flush 실패를 관측하고 shutdown close를 계속 수행한다", async () => {
    const cause = new Error("flush failed")
    const close = vi.fn()
    const onError = vi.fn()
    const result = await shutdownLogger({
      close,
      flush: async () => Promise.reject(cause),
      onError,
    })

    expect(result.isErr()).toBe(true)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ cause, phase: "flush" })
    )
    expect(close).toHaveBeenCalledOnce()
  })
})
