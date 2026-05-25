import pino from "pino"

export { createRequestLogFields } from "@/request-logger"
export type { RequestLogFieldsInput } from "@/request-logger"

export type LoggerLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"

export type CreateLoggerInput = {
  environment: string
  level: LoggerLevel
  service: string
}

export const createLogger = ({
  environment,
  level,
  service,
}: CreateLoggerInput): pino.Logger => {
  return pino({
    base: {
      environment,
      service,
    },
    level,
    ...(environment === "production"
      ? {}
      : {
          transport: {
            options: {
              colorize: true,
            },
            target: "pino-pretty",
          },
        }),
  })
}
