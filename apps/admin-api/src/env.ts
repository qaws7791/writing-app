import { createLocalRuntimeUrl } from "@workspace/env/local-runtime-defaults"
import { parseEnv, type AppEnvInput } from "@workspace/env/parse-env"
import { z } from "zod"

const adminAssetStoreEnvSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.url(),
  publicBaseUrl: z.url(),
  region: z.string().min(1),
  secretAccessKey: z.string().min(1),
})

export type AdminAssetStoreEnv = z.infer<typeof adminAssetStoreEnvSchema>

export type AdminApiEnv = {
  readonly assetStore: AdminAssetStoreEnv | undefined
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
  if (env.NODE_ENV === "production" && !hasCompleteAssetConfiguration) {
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
    env.NODE_ENV === "production" &&
    assetStore !== undefined &&
    (new URL(assetStore.endpoint).protocol !== "https:" ||
      new URL(assetStore.publicBaseUrl).protocol !== "https:")
  ) {
    throw new Error("production 자료 이미지 저장소는 HTTPS URL이 필요합니다.")
  }

  return {
    assetStore,
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
