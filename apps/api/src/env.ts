import {
  createLocalRuntimeUrl,
  parseEnv,
  type AppEnvInput,
} from "@workspace/env"

export type ApiEnv = {
  readonly authBaseUrl: string
  readonly databaseUrl: string | undefined
  readonly googleClientId: string | undefined
  readonly googleClientSecret: string | undefined
  readonly nodeEnv: "development" | "test" | "production"
  readonly openAiApiKey: string | undefined
  readonly openAiModel: string
  readonly port: number
  readonly webOrigin: string
}

export function parseApiEnv(input: AppEnvInput): ApiEnv {
  const env = parseEnv({
    ...input,
    WEB_ORIGIN:
      input["WEB_ORIGIN"] ?? input["CORS_ORIGIN"]?.split(",")[0]?.trim(),
  })

  return {
    authBaseUrl: env.BETTER_AUTH_URL ?? createLocalRuntimeUrl(env.API_PORT),
    databaseUrl: env.DATABASE_URL,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    nodeEnv: env.NODE_ENV,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_MODEL,
    port: env.API_PORT,
    webOrigin: env.WEB_ORIGIN,
  }
}
