import { createLocalRuntimeUrl } from "@workspace/env/local-runtime-defaults"
import { parseEnv, type AppEnvInput } from "@workspace/env/parse-env"

export type ApiEnv = {
  readonly authBaseUrl: string
  readonly betterAuthSecret: string
  readonly cookieDomain: string | undefined
  readonly cursorSigningSecret: string
  readonly databaseUrl: string | undefined
  readonly deploymentVersion: string
  readonly googleClientId: string | undefined
  readonly googleClientSecret: string | undefined
  readonly nodeEnv: "development" | "test" | "production"
  readonly openAiApiKey: string | undefined
  readonly openAiModel: string
  readonly port: number
  readonly testAuthEnabled: boolean
  readonly webOrigin: string
}

export function parseApiEnv(input: AppEnvInput): ApiEnv {
  const env = parseEnv({
    ...input,
    WEB_ORIGIN:
      input["WEB_ORIGIN"] ?? input["CORS_ORIGIN"]?.split(",")[0]?.trim(),
  })
  const cursorSigningSecret = readCursorSigningSecret(env)

  return {
    authBaseUrl: env.BETTER_AUTH_URL ?? createLocalRuntimeUrl(env.API_PORT),
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    cookieDomain: env.BETTER_AUTH_COOKIE_DOMAIN,
    cursorSigningSecret,
    databaseUrl: env.DATABASE_URL,
    deploymentVersion: parseDeploymentVersion(
      env.NODE_ENV,
      input["DEPLOYMENT_VERSION"]
    ),
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    nodeEnv: env.NODE_ENV,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_MODEL,
    port: env.API_PORT,
    testAuthEnabled: env.NODE_ENV !== "production" && env.ENABLE_TEST_AUTH,
    webOrigin: env.WEB_ORIGIN,
  }
}

function readCursorSigningSecret(env: ReturnType<typeof parseEnv>): string {
  if (env.CURSOR_SIGNING_SECRET !== undefined) {
    return env.CURSOR_SIGNING_SECRET
  }
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Invalid environment variables: CURSOR_SIGNING_SECRET: production에서는 cursor 서명 전용 secret이 필요합니다."
    )
  }

  return `${env.BETTER_AUTH_SECRET}:cursor-signing`
}

function parseDeploymentVersion(
  nodeEnv: ApiEnv["nodeEnv"],
  value: string | undefined
): string {
  const normalized = value?.trim()

  if (normalized !== undefined && normalized.length > 0) {
    return normalized
  }

  if (nodeEnv === "production") {
    throw new Error(
      "Invalid environment variables: DEPLOYMENT_VERSION: production에서는 배포 버전이 필요합니다."
    )
  }

  return "local"
}
