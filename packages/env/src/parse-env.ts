import { z, type ZodError } from "zod"

import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "@workspace/env/local-runtime-defaults"

const nodeEnvSchema = z
  .enum(["development", "test", "production"])
  .default("development")
const portSchema = z.coerce.number().int().min(1).max(65535)

export const appEnvSchema = z.object({
  ADMIN_API_PORT: portSchema.default(localRuntimePorts.adminApi),
  ADMIN_ORIGIN: z.url().default(localRuntimeDefaults.adminWebOrigin),
  API_PORT: portSchema.default(localRuntimePorts.learnerApi),
  BETTER_AUTH_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  NODE_ENV: nodeEnvSchema,
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.2"),
  WEB_ORIGIN: z.url().default(localRuntimeDefaults.learnerWebOrigin),
})

export type AppEnv = z.infer<typeof appEnvSchema>
export type AppEnvInput = Record<string, string | undefined>

export function parseEnv(input: AppEnvInput): AppEnv {
  const result = appEnvSchema.safeParse(input)

  if (!result.success) {
    throw new Error(formatEnvError(result.error))
  }

  return result.data
}

function formatEnvError(error: ZodError): string {
  const messages = error.issues.map((issue) => {
    const path = issue.path.join(".") || "env"

    return `${path}: ${issue.message}`
  })

  return `Invalid environment variables: ${messages.join("; ")}`
}
