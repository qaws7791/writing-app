import { describe, expect, it } from "vitest"

import { createAppLogger, createRequestLogger } from "@/index"

type LogRecord = {
  readonly durationMs?: number
  readonly level: number
  readonly method?: string
  readonly msg: string
  readonly path?: string
  readonly requestId?: string
  readonly status?: number
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
    })
  })

  it("request log helper가 요청 완료 로그를 남긴다", () => {
    const { records, stream } = createMemoryLogStream()
    const logger = createAppLogger({
      stream,
    })
    const logRequest = createRequestLogger(logger)

    logRequest({
      durationMs: 12,
      method: "GET",
      path: "/courses",
      requestId: "r1",
      status: 200,
    })

    expect(records[0]).toMatchObject({
      durationMs: 12,
      method: "GET",
      msg: "request.completed",
      path: "/courses",
      requestId: "r1",
      status: 200,
    })
  })
})
