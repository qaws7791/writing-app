import { parseEnv, type AppEnvInput } from "@workspace/env"

export type ApiEnv = {
  readonly databaseUrl: string | undefined
  readonly nodeEnv: "development" | "test" | "production"
  readonly openAiApiKey: string | undefined
  readonly port: number
  readonly webOrigin: string
}

export function parseApiEnv(input: AppEnvInput): ApiEnv {
  const env = parseEnv(input)

  return {
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV,
    openAiApiKey: env.OPENAI_API_KEY,
    port: env.API_PORT,
    webOrigin: env.WEB_ORIGIN,
  }
}
