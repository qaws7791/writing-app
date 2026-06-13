import { parseEnv, type AppEnvInput } from "@workspace/env"

export type AdminApiEnv = {
  readonly adminOrigin: string
  readonly databaseUrl: string | undefined
  readonly nodeEnv: "development" | "test" | "production"
  readonly port: number
}

export function parseAdminApiEnv(input: AppEnvInput): AdminApiEnv {
  const env = parseEnv(input)

  return {
    adminOrigin: env.ADMIN_ORIGIN,
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV,
    port: env.ADMIN_API_PORT,
  }
}
