import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const apiEnv = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    API_BASE_URL: z.string().url(),
    API_AUTH_BASE_URL: z.string().url(),
    API_AUTH_SECRET: z.string().min(32),
    API_DATABASE_PATH: z.string().min(1),
    API_LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("info"),
    API_PORT: z.coerce.number().int().min(1).max(65535),
    API_WEB_BASE_URL: z.string().url(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    RESEND_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().optional(),
    RESEND_FROM_ADDRESS:
      process.env.NODE_ENV === "production"
        ? z.string().email()
        : z.string().email().optional(),
  },
})
