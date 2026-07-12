import { z, type ZodError } from "zod"

import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "#env/local-runtime-defaults"

const nodeEnvSchema = z
  .enum(["development", "test", "production"])
  .default("development")
const portSchema = z.coerce.number().int().min(1).max(65535)
const booleanFlagSchema = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true")

const appEnvBaseSchema = z.object({
  ADMIN_API_PORT: portSchema.default(localRuntimePorts.adminApi),
  ADMIN_BETTER_AUTH_SECRET: z.string().min(32).optional(),
  ADMIN_BETTER_AUTH_URL: z.url().optional(),
  ADMIN_ORIGIN: z.url().default(localRuntimeDefaults.adminWebOrigin),
  API_PORT: portSchema.default(localRuntimePorts.learnerApi),
  ADMIN_BETTER_AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  BETTER_AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  ENABLE_TEST_AUTH: booleanFlagSchema,
  NODE_ENV: nodeEnvSchema,
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.2"),
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
    ["BETTER_AUTH_URL", env.BETTER_AUTH_URL],
    ["ADMIN_BETTER_AUTH_URL", env.ADMIN_BETTER_AUTH_URL],
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
    "BETTER_AUTH_SECRET",
    env.BETTER_AUTH_SECRET
  )
  if (env.ADMIN_BETTER_AUTH_SECRET === undefined) {
    addProductionIssue(
      context,
      "ADMIN_BETTER_AUTH_SECRET",
      "production에서는 관리자 전용 secret이 필요합니다."
    )
  } else {
    validateProductionSecret(
      context,
      "ADMIN_BETTER_AUTH_SECRET",
      env.ADMIN_BETTER_AUTH_SECRET
    )
    if (env.ADMIN_BETTER_AUTH_SECRET === env.BETTER_AUTH_SECRET) {
      addProductionIssue(
        context,
        "ADMIN_BETTER_AUTH_SECRET",
        "학습자 secret과 다른 값을 사용해야 합니다."
      )
    }
  }

  if (env.ENABLE_TEST_AUTH) {
    addProductionIssue(
      context,
      "ENABLE_TEST_AUTH",
      "production에서는 테스트 인증을 활성화할 수 없습니다."
    )
  }

  validateCookieDomain(
    context,
    "BETTER_AUTH_COOKIE_DOMAIN",
    env.BETTER_AUTH_COOKIE_DOMAIN,
    env.WEB_ORIGIN
  )
  validateCookieDomain(
    context,
    "ADMIN_BETTER_AUTH_COOKIE_DOMAIN",
    env.ADMIN_BETTER_AUTH_COOKIE_DOMAIN,
    env.ADMIN_ORIGIN
  )
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
  name: "ADMIN_BETTER_AUTH_SECRET" | "BETTER_AUTH_SECRET",
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

function validateCookieDomain(
  context: z.RefinementCtx,
  name: "ADMIN_BETTER_AUTH_COOKIE_DOMAIN" | "BETTER_AUTH_COOKIE_DOMAIN",
  value: string | undefined,
  origin: string
): void {
  if (value === undefined) return

  const domain = value.replace(/^\./u, "").toLowerCase()
  const hostname = new URL(origin).hostname.toLowerCase()
  if (
    isLocalHostname(domain) ||
    (hostname !== domain && !hostname.endsWith(`.${domain}`))
  ) {
    addProductionIssue(
      context,
      name,
      "cookie domain은 해당 HTTPS origin의 parent domain이어야 합니다."
    )
  }
}

function addProductionIssue(
  context: z.RefinementCtx,
  path: string,
  message: string
): void {
  context.addIssue({ code: "custom", message, path: [path] })
}
