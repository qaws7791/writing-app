import pino from "pino"

import type { ApiLogger } from "../logger.js"

export type CapturedLog = Record<string, unknown>

export function createCapturedLogger(): {
  entries: CapturedLog[]
  logger: ApiLogger
} {
  const entries: CapturedLog[] = []

  const logger = pino(
    {
      base: undefined,
      level: "trace",
      timestamp: false,
    },
    {
      write(chunk) {
        for (const line of chunk.toString().split("\n")) {
          if (!line) {
            continue
          }

          entries.push(JSON.parse(line) as CapturedLog)
        }
      },
    }
  )

  return {
    entries,
    logger,
  }
}
