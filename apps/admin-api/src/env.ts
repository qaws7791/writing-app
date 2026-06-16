import {
  createLocalRuntimeUrl,
  parseEnv,
  type AppEnvInput,
} from "@workspace/env"

export type AdminApiEnv = {
  readonly adminOrigin: string
  readonly authBaseUrl: string
  readonly betterAuthSecret: string
  readonly cookieDomain: string | undefined
  readonly databaseUrl: string | undefined
  readonly nodeEnv: "development" | "test" | "production"
  readonly port: number
}

export function parseAdminApiEnv(input: AppEnvInput): AdminApiEnv {
  const env = parseEnv({
    ...input,
    ADMIN_ORIGIN: input["ADMIN_ORIGIN"] ?? input["ADMIN_CORS_ORIGIN"],
    ADMIN_BETTER_AUTH_COOKIE_DOMAIN:
      input["ADMIN_BETTER_AUTH_COOKIE_DOMAIN"] ??
      input["BETTER_AUTH_COOKIE_DOMAIN"],
    BETTER_AUTH_URL: input["ADMIN_BETTER_AUTH_URL"] ?? input["BETTER_AUTH_URL"],
    BETTER_AUTH_SECRET:
      input["ADMIN_BETTER_AUTH_SECRET"] ?? input["BETTER_AUTH_SECRET"],
  })

  return {
    adminOrigin: env.ADMIN_ORIGIN,
    authBaseUrl:
      env.BETTER_AUTH_URL ?? createLocalRuntimeUrl(env.ADMIN_API_PORT),
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    cookieDomain: env.ADMIN_BETTER_AUTH_COOKIE_DOMAIN,
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV,
    port: env.ADMIN_API_PORT,
  }
}
