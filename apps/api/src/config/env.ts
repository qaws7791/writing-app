import {
  createLocalRuntimeUrl,
  localRuntimeHosts,
} from "@workspace/env/local-runtime-defaults"
import { parseEnv, type AppEnvInput } from "@workspace/env/parse-env"
import { z } from "@/http/platform/zod"

import {
  normalizeApiHostAuthority,
  parseApiHostConfiguration,
  type ApiHostConfiguration,
} from "@/config/api-hosts"

export type ApiEnv = {
  readonly adminAssetStore: AdminAssetStoreEnv | undefined
  readonly adminAuthBaseUrl: string
  readonly adminBetterAuthSecret: string
  readonly adminCookieDomain: string | undefined
  readonly adminOrigin: string
  readonly apiHosts: ApiHostConfiguration
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

const adminAssetStoreEnvSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.url(),
  publicBaseUrl: z.url(),
  region: z.string().min(1),
  secretAccessKey: z.string().min(1),
})

export type AdminAssetStoreEnv = z.infer<typeof adminAssetStoreEnvSchema>

export function parseApiEnv(input: AppEnvInput): ApiEnv {
  const adminBetterAuthSecret = readRequiredAdminValue(
    input,
    "ADMIN_BETTER_AUTH_SECRET"
  )
  const adminAuthBaseUrl = readRequiredAdminValue(
    input,
    "ADMIN_BETTER_AUTH_URL"
  )
  const adminOrigin = readRequiredAdminValue(input, "ADMIN_ORIGIN")
  const env = parseEnv({
    ...input,
    ADMIN_BETTER_AUTH_SECRET: adminBetterAuthSecret,
    ADMIN_BETTER_AUTH_URL: adminAuthBaseUrl,
    ADMIN_ORIGIN: adminOrigin,
    WEB_ORIGIN:
      input["WEB_ORIGIN"] ?? input["CORS_ORIGIN"]?.split(",")[0]?.trim(),
  })
  const cursorSigningSecret = readCursorSigningSecret(env)
  const authBaseUrl =
    env.BETTER_AUTH_URL ??
    createLocalRuntimeUrl(localRuntimeHosts.learner, env.API_PORT)
  const apiHosts = parseApiHostConfiguration({
    adminAllowedHosts: input["ADMIN_API_ALLOWED_HOSTS"],
    learnerAllowedHosts: input["LEARNER_API_ALLOWED_HOSTS"],
  })
  const adminAssetStore = parseAdminAssetStore(input, env.NODE_ENV)

  validateSeparatedAuthConfiguration({
    adminBetterAuthSecret,
    adminOrigin,
    learnerBetterAuthSecret: env.BETTER_AUTH_SECRET,
    learnerOrigin: env.WEB_ORIGIN,
  })
  validateAuthUrlHost("BETTER_AUTH_URL", authBaseUrl, apiHosts.learner)
  validateAuthUrlHost("ADMIN_BETTER_AUTH_URL", adminAuthBaseUrl, apiHosts.admin)

  return {
    adminAssetStore,
    adminAuthBaseUrl,
    adminBetterAuthSecret,
    adminCookieDomain: env.ADMIN_BETTER_AUTH_COOKIE_DOMAIN,
    adminOrigin,
    apiHosts,
    authBaseUrl,
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

function parseAdminAssetStore(
  input: AppEnvInput,
  nodeEnv: ApiEnv["nodeEnv"]
): AdminAssetStoreEnv | undefined {
  const assetValues = [
    input["ADMIN_ASSET_S3_ACCESS_KEY"],
    input["ADMIN_ASSET_S3_BUCKET"],
    input["ADMIN_ASSET_S3_ENDPOINT"],
    input["ADMIN_ASSET_PUBLIC_BASE_URL"],
    input["ADMIN_ASSET_S3_SECRET_KEY"],
  ]
  const hasAssetValue = assetValues.some((value) => value !== undefined)
  const hasCompleteAssetConfiguration = assetValues.every(
    (value) => value !== undefined
  )

  if (hasAssetValue && !hasCompleteAssetConfiguration) {
    throw new Error("자료 이미지 저장소 환경 변수는 모두 함께 설정해야 합니다.")
  }
  if (nodeEnv === "production" && !hasCompleteAssetConfiguration) {
    throw new Error("production에서는 자료 이미지 저장소 설정이 필요합니다.")
  }

  const assetStore = adminAssetStoreEnvSchema.optional().parse(
    hasCompleteAssetConfiguration
      ? {
          accessKeyId: input["ADMIN_ASSET_S3_ACCESS_KEY"],
          bucket: input["ADMIN_ASSET_S3_BUCKET"],
          endpoint: input["ADMIN_ASSET_S3_ENDPOINT"],
          publicBaseUrl: input["ADMIN_ASSET_PUBLIC_BASE_URL"],
          region: input["ADMIN_ASSET_S3_REGION"] ?? "auto",
          secretAccessKey: input["ADMIN_ASSET_S3_SECRET_KEY"],
        }
      : undefined
  )

  if (
    nodeEnv === "production" &&
    assetStore !== undefined &&
    (new URL(assetStore.endpoint).protocol !== "https:" ||
      new URL(assetStore.publicBaseUrl).protocol !== "https:")
  ) {
    throw new Error("production 자료 이미지 저장소는 HTTPS URL이 필요합니다.")
  }

  return assetStore
}

function readRequiredAdminValue(
  input: AppEnvInput,
  name: "ADMIN_BETTER_AUTH_SECRET" | "ADMIN_BETTER_AUTH_URL" | "ADMIN_ORIGIN"
): string {
  const value = input[name]

  if (value === undefined || value.trim().length === 0) {
    throw new Error(
      `Invalid environment variables: ${name}: 통합 API에서는 관리자 전용 값을 명시해야 합니다.`
    )
  }

  return value
}

function validateSeparatedAuthConfiguration(input: {
  readonly adminBetterAuthSecret: string
  readonly adminOrigin: string
  readonly learnerBetterAuthSecret: string
  readonly learnerOrigin: string
}): void {
  if (input.adminBetterAuthSecret === input.learnerBetterAuthSecret) {
    throw new Error(
      "Invalid environment variables: ADMIN_BETTER_AUTH_SECRET: 학습자 secret과 다른 값을 사용해야 합니다."
    )
  }

  if (
    new URL(input.adminOrigin).origin === new URL(input.learnerOrigin).origin
  ) {
    throw new Error(
      "Invalid environment variables: ADMIN_ORIGIN: 학습자 origin과 다른 값을 사용해야 합니다."
    )
  }
}

function validateAuthUrlHost(
  name: "ADMIN_BETTER_AUTH_URL" | "BETTER_AUTH_URL",
  value: string,
  allowedHosts: ReadonlySet<string>
): void {
  const authority = normalizeApiHostAuthority(new URL(value).host)

  if (!allowedHosts.has(authority)) {
    throw new Error(
      `Invalid environment variables: ${name}: URL host가 해당 API Host allowlist에 포함되어야 합니다.`
    )
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
