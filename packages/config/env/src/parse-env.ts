import { z, type ZodError } from "zod"

import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "#env/local-runtime-defaults"

const nodeEnvSchema = z
  .enum(["development", "test", "production"])
  .default("development")
const portSchema = z.coerce.number().int().min(1).max(65535)

const appEnvBaseSchema = z.object({
  ADMIN_AUTH_SECRET: z.string().min(32),
  ADMIN_ORIGIN: z.url().default(localRuntimeDefaults.adminWebOrigin),
  API_PORT: portSchema.default(localRuntimePorts.api),
  CURSOR_SIGNING_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  LEARNER_AUTH_SECRET: z.string().min(32),
  NODE_ENV: nodeEnvSchema,
  WEB_ORIGIN: z.url().default(localRuntimeDefaults.learnerWebOrigin),
})

export const appEnvSchema = appEnvBaseSchema.superRefine(
  validateProductionEnvironment
)

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

function validateProductionEnvironment(
  env: z.infer<typeof appEnvBaseSchema>,
  context: z.RefinementCtx
): void {
  if (env.NODE_ENV !== "production") return

  const requiredUrls = [
    ["WEB_ORIGIN", env.WEB_ORIGIN],
    ["ADMIN_ORIGIN", env.ADMIN_ORIGIN],
  ] as const

  for (const [name, value] of requiredUrls) {
    if (value === undefined || !isSecurePublicUrl(value)) {
      addProductionIssue(
        context,
        name,
        "production에서는 localhost가 아닌 HTTPS URL이 필요합니다."
      )
    }
  }

  if (env.DATABASE_URL === undefined || env.DATABASE_URL === ":memory:") {
    addProductionIssue(
      context,
      "DATABASE_URL",
      "production에서는 영구 DATABASE_URL을 명시해야 합니다."
    )
  }

  validateProductionSecret(
    context,
    "LEARNER_AUTH_SECRET",
    env.LEARNER_AUTH_SECRET
  )
  if (env.CURSOR_SIGNING_SECRET !== undefined) {
    validateProductionSecret(
      context,
      "CURSOR_SIGNING_SECRET",
      env.CURSOR_SIGNING_SECRET
    )
    if (
      env.CURSOR_SIGNING_SECRET === env.LEARNER_AUTH_SECRET ||
      env.CURSOR_SIGNING_SECRET === env.ADMIN_AUTH_SECRET
    ) {
      addProductionIssue(
        context,
        "CURSOR_SIGNING_SECRET",
        "학습자·관리자 Better Auth secret과 다른 값을 사용해야 합니다."
      )
    }
  }
  validateProductionSecret(context, "ADMIN_AUTH_SECRET", env.ADMIN_AUTH_SECRET)
  if (env.ADMIN_AUTH_SECRET === env.LEARNER_AUTH_SECRET) {
    addProductionIssue(
      context,
      "ADMIN_AUTH_SECRET",
      "학습자 secret과 다른 값을 사용해야 합니다."
    )
  }
}

function isSecurePublicUrl(value: string): boolean {
  const url = new URL(value)
  return url.protocol === "https:" && !isLocalHostname(url.hostname)
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  )
}

function validateProductionSecret(
  context: z.RefinementCtx,
  name: "ADMIN_AUTH_SECRET" | "CURSOR_SIGNING_SECRET" | "LEARNER_AUTH_SECRET",
  value: string
): void {
  const entropyBits = calculateShannonEntropyBits(value)
  const isPlaceholder = /change|example|local|placeholder|replace|secret/i.test(
    value
  )

  if (isPlaceholder || new Set(value).size < 12 || entropyBits < 128) {
    addProductionIssue(
      context,
      name,
      "placeholder가 아닌 128bit 이상의 고 entropy 값을 사용해야 합니다."
    )
  }
}

function calculateShannonEntropyBits(value: string): number {
  const frequencies = new Map<string, number>()
  for (const character of value) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1)
  }

  let bitsPerCharacter = 0
  for (const count of frequencies.values()) {
    const probability = count / value.length
    bitsPerCharacter -= probability * Math.log2(probability)
  }

  return bitsPerCharacter * value.length
}

function addProductionIssue(
  context: z.RefinementCtx,
  path: string,
  message: string
): void {
  context.addIssue({ code: "custom", message, path: [path] })
}
