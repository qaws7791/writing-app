import pino from "pino"
import type { AppLogger } from "@workspace/logging"

export type CapturedLog = Record<string, unknown>

export function createCapturedLogger(): {
  entries: CapturedLog[]
  logger: AppLogger
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
