import { createLocalRuntimeUrl } from "@workspace/env/local-runtime-defaults"
import { parseEnv, type AppEnvInput } from "@workspace/env/parse-env"

export type AdminApiEnv = {
  readonly adminOrigin: string
  readonly authBaseUrl: string
  readonly betterAuthSecret: string
  readonly cookieDomain: string | undefined
  readonly databaseUrl: string | undefined
  readonly nodeEnv: "development" | "test" | "production"
  readonly openAiApiKey: string | undefined
  readonly openAiModel: string
  readonly port: number
}

export function parseAdminApiEnv(input: AppEnvInput): AdminApiEnv {
  const env = parseEnv({
    ...input,
    ADMIN_ORIGIN: input["ADMIN_ORIGIN"] ?? input["ADMIN_CORS_ORIGIN"],
    ADMIN_BETTER_AUTH_COOKIE_DOMAIN:
      input["ADMIN_BETTER_AUTH_COOKIE_DOMAIN"] ??
      input["BETTER_AUTH_COOKIE_DOMAIN"],
    ADMIN_BETTER_AUTH_URL: input["ADMIN_BETTER_AUTH_URL"],
    BETTER_AUTH_SECRET:
      input["BETTER_AUTH_SECRET"] ?? input["ADMIN_BETTER_AUTH_SECRET"],
  })

  return {
    adminOrigin: env.ADMIN_ORIGIN,
    authBaseUrl:
      env.ADMIN_BETTER_AUTH_URL ?? createLocalRuntimeUrl(env.ADMIN_API_PORT),
    betterAuthSecret: env.ADMIN_BETTER_AUTH_SECRET ?? env.BETTER_AUTH_SECRET,
    cookieDomain: env.ADMIN_BETTER_AUTH_COOKIE_DOMAIN,
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_MODEL,
    port: env.ADMIN_API_PORT,
  }
}
